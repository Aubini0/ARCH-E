# external imports
import os , uuid , asyncio
from dotenv import load_dotenv
from api_request_schemas import (
    invoke_llm_schema,
    login_schema,
    signup_schema
)
from fastapi import (
    FastAPI,
    WebSocket,
    Request,
    status
)
from lib_users.password_utils import (
    hash_password,
    validate_password
)
import json
from lib_users.repo import UsersRepo
from fastapi.websockets import WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
# internal imports
from lib_socket_handler.web_socket_manager import WebsocketManager
from lib_stt.speech_to_text_deepgram import SpeechToTextDeepgram
from lib_llm.helpers.llm import LLM
from lib_llm.helpers.prompt_generator import PromptGenerator
from lib_llm.large_language_model import LargeLanguageModel
from lib_tts.text_to_speech_deepgram import TextToSpeechDeepgram
from lib_infrastructure.dispatcher import ( Dispatcher , Message , MessageHeader , MessageType )
from lib_infrastructure.helpers.global_event_logger import GlobalLoggerAsync
from lib_youtube.youtube_search import YoutubeSearch
from lib_websearch.search_runner import SearchRunner
from lib_websearch.cohere_connector_search import CohereWebSearch
from lib_database.db_connect import users_collection
from fastapi.responses import JSONResponse
from lib_users.token_utils import generate_token_and_set_cookie
from lib_websearch_cohere.cohere_search import Cohere_Websearch


# loading .env configs
load_dotenv()
PORT = int(os.getenv("PORT"))
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID")
JINA_API_KEY = os.getenv("JINA_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
OUTPUT_MP3_FILES = "output.mp3"


# app initalization & setup
app = FastAPI()
youtube_instance = YoutubeSearch()

# Cors confugurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/public", StaticFiles(directory="public"), name="static")
templates = Jinja2Templates(directory="templates")
dispatcher = Dispatcher()


# managing dispatcher connect event on app startup
@app.on_event("startup")
async def startup():
    print("Conneting to memory://")
    await dispatcher.connect()
    print("Connected to memory://")

# managing dispatcher connect event on app shutdown
@app.on_event("shutdown")
async def shutdown():
    print("Disconnecting from memory://")
    await dispatcher.disconnect()
    print("Disconnected from memory://")


# UI to onboard new customers and view logs + customers info
@app.get("/")
async def get(request: Request):
    return templates.TemplateResponse("index.html" ,  {"request": request})


# API to get user_id for websocket
@app.get("/user/id")
async def get_userid( ):
    # replace this logic with user_id from db in case there is signedup user or generate a sessions id using
    # uuid in case its a guest user
    guid = str(uuid.uuid4())
    return { "status" : True , "data" : { "user_id" : guid } , "message" : "user_id returned" }


@app.post("/auth/login", status_code=200)
async def login(login_payload: login_schema):
    email = login_payload.email
    user = UsersRepo.get_user(email)
    password = login_payload.password
    if user is None:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message": "Email not found"})
    if user.google_access_token is None:
        if validate_password(user, password):
            token = generate_token_and_set_cookie(user.dict())
            return JSONResponse(status_code=status.HTTP_200_OK, content={
                "success": True,
                "data": user.json(),
                "access_token": token,
                "message": "successfully signed in"
            })
    return { "status" : False , "message" : "Wrong email or password" }


@app.post("/auth/signup", status_code=200)
async def signup(signup_payload: signup_schema):
    email = signup_payload.email
    user = UsersRepo.get_user(email)
    if user:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": "Email already registered"})
    new_user = UsersRepo.insert_user(signup_payload)
    print(new_user.dict())
    token = generate_token_and_set_cookie(new_user.dict())
    if new_user:
        return JSONResponse(status_code=status.HTTP_200_OK, content={
            "success": True,
            "data": new_user.json(),
            "access_token": token,
            "message": "successfully signed up"
        
        })
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": "An error occurred"})






@app.websocket("/invoke_llm/{user_id}")
async def chat_invoke(websocket: WebSocket , user_id : str):
    guid = user_id
    # web_search = SearchRunner(GOOGLE_API_KEY, SEARCH_ENGINE_ID, JINA_API_KEY)
    # web_search = CohereWebSearch( COHERE_API_KEY )
    web_search = Cohere_Websearch( GOOGLE_API_KEY, SEARCH_ENGINE_ID ,  COHERE_API_KEY )
    prompt_generator = PromptGenerator()
    modelInstance = LLM(guid , prompt_generator, web_search , OPENAI_API_KEY)
    clear_messsge = { "clear" : True }


    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            if data : 
                user_msg=LLM.LLMMessage(role=LLM.Role.USER, content=data['user_msg'])
                async for llm_resp in modelInstance.interaction(user_msg):
                    llm_resp = { 
                        "response" : llm_resp , 
                        "web_links" : "" , "recommendations" : "" , 
                        "clear" : False 
                        }
                    # send llm generated answer word by word
                    await websocket.send_json(llm_resp)
                
                links_message = { 
                    "web_links" : modelInstance.web_links  , 
                    "response" : "" , "recommendations" : "" , 
                    "clear" : False 
                    }
                
                
                # send web links                 
                await websocket.send_json(links_message)
                print("Web_links_message :> " , links_message)
                # send clear message 
                await websocket.send_json(clear_messsge)

                llm_recomendations_resp = modelInstance.recomendations(user_msg)
                llm_recomendations_resp = { 
                    "response" : "" , 
                    "web_links" : "" , "recommendations" : llm_recomendations_resp , 
                    "clear" : False 
                    }

                print("llm_recomendations_resp :> " , llm_recomendations_resp)
                    # send llm recomendations               
                await websocket.send_json(llm_recomendations_resp)

    except Exception as e:
        print(f"Client disconnected >>> {e}")
        modelInstance.add_embeddings()
        



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    guid = str(uuid.uuid4())

    prompt_generator = PromptGenerator()


    web_search = SearchRunner(GOOGLE_API_KEY, SEARCH_ENGINE_ID, JINA_API_KEY)
    modelInstance = LLM(guid , prompt_generator, web_search , OPENAI_API_KEY)

    # modelInstance = LLM(guid , prompt_generator, OPENAI_API_KEY)

    global_logger = GlobalLoggerAsync(
        guid,
        dispatcher,
        pubsub_events={
            MessageType.CALL_WEBSOCKET_PUT: True,
            MessageType.LLM_GENERATED_TEXT: True,
            MessageType.TRANSCRIPTION_CREATED: True,
            MessageType.FINAL_TRANSCRIPTION_CREATED : True,
            MessageType.LLM_GENERATED_FULL_TEXT : True,
        },
        # events whose output needs to be ignored, we just need to capture the time they are fired
        ignore_msg_events = {  
            MessageType.CALL_WEBSOCKET_PUT: True,
        }

    )


    websocket_manager = WebsocketManager( guid, OUTPUT_MP3_FILES , dispatcher, websocket )
    speech_to_text = SpeechToTextDeepgram( guid , dispatcher ,  websocket , DEEPGRAM_API_KEY )
    large_language_model = LargeLanguageModel( guid , modelInstance , dispatcher )
    text_to_speeech = TextToSpeechDeepgram( guid , OUTPUT_MP3_FILES , dispatcher , DEEPGRAM_API_KEY )

    try:

        tasks = [
            asyncio.create_task(global_logger.run_async()),
            asyncio.create_task(speech_to_text.run_async()),
            asyncio.create_task(large_language_model.run_async()),
            asyncio.create_task(text_to_speeech.run_async()),            
            asyncio.create_task(websocket_manager.run_async()),
        ]

        await asyncio.gather(*tasks)
    except asyncio.CancelledError:
        await websocket_manager.dispose()
    except Exception as e:
        await websocket_manager.dispose()
        raise e
    finally:
        await dispatcher.broadcast(
            guid , Message(MessageHeader(MessageType.CALL_ENDED), "Call ended") 
            )



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
    print(f"Server Up At : http://localhost:{PORT}/")
