# external imports
import os , uuid , asyncio
from dotenv import load_dotenv
from api_request_schemas import (invoke_llm_schema)
from fastapi import FastAPI, WebSocket , Request
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

# loading .env configs
load_dotenv()
PORT = int(os.getenv("PORT"))
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
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




# API to get user_id for websocket
@app.post("/youtube/search")
async def youtube_search( request : Request ):
    try : 
        body = await request.json()
        user_query = body['user_query']
        resp = youtube_instance.search(user_query)
        return { "status" : True , "data" : {  "results" : resp  } , "message" : "youtube results returned" }
    except Exception as error : 
        return { "status" : False , "data" : {  } , "error" : str(error) }





@app.websocket("/invoke_llm/{user_id}")
async def chat_invoke(websocket: WebSocket , user_id : str):
    guid = user_id
    prompt_generator = PromptGenerator()
    modelInstance = LLM(guid , prompt_generator, OPENAI_API_KEY)
    clear_messsge = { "clear" : True }


    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            if data : 
                user_msg=LLM.LLMMessage(role=LLM.Role.USER, content=data['user_msg'])
                async for llm_resp in modelInstance.interaction(user_msg):
                    llm_resp = { "response" : llm_resp , "recommendations" : "" , "clear" : False }
                    # print( "LLM_RESPONCE :> " , llm_resp)
                    await websocket.send_json(llm_resp)

                await websocket.send_json(clear_messsge)

                llm_recomendations_resp = modelInstance.recomendations(user_msg)
                llm_recomendations_resp = { "response" : "" , "recommendations" : llm_recomendations_resp , "clear" : False }
                print( "LLM_RECOMENDATIONS :> " , llm_recomendations_resp)
                await websocket.send_json(llm_recomendations_resp)

    except Exception as e:
        print(f"Client disconnected >>> {e}")
        modelInstance.add_embeddings()
        



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    guid = str(uuid.uuid4())

    prompt_generator = PromptGenerator()
    modelInstance = LLM(guid , prompt_generator, OPENAI_API_KEY)

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
