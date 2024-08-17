# external modules
import os , uuid , asyncio
from dotenv import load_dotenv
from lib_users.repo import UsersRepo
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi import ( FastAPI, WebSocket, Request, status )


# internal modules
from lib_llm.helpers.llm import LLM
from lib_infrastructure.dispatcher import Dispatcher 
from lib_youtube.youtube_search import YoutubeSearch
from jwt import ExpiredSignatureError, InvalidTokenError
from lib_users.password_utils import ( validate_password )
from lib_llm.helpers.prompt_generator import PromptGenerator
from api_request_schemas import ( login_schema, signup_schema )
from lib_websearch_cohere.cohere_search import Cohere_Websearch
from lib_websocket_services.chat_service import ( process_llm_service )
from lib_users.token_utils import ( generate_token_and_set_cookie , decode_token )
from lib_api_services.search_service import ( chat_session_service, search_query_service , 
                                             delete_chat_session_service , delete_query_service ,
                                             delete_all_chats_service , search_sessions_service
                                             )


# loading .env configs
load_dotenv()
PORT = int(os.getenv("PORT"))
JINA_API_KEY = os.getenv("JINA_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
SESSION_PREFIX = os.getenv("SESSION_PREFIX")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID")
EMBEDDINGS_QA_PAIRS = os.getenv("EMBEDDINGS_QA_PAIRS")



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




# Managing dispatcher connect event on app startup
@app.on_event("startup")
async def startup():
    print("Conneting to memory://")
    await dispatcher.connect()
    print("Connected to memory://")

# Managing dispatcher connect event on app shutdown
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
async def get_guest_userId( ):
    # generate user_id for guest user
    guid = str(uuid.uuid4())
    return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "user_id" : guid } , "message" : "user_id returned" })

# API to get user_id for websocket
@app.get("/session/id")
async def get_sessionId( ):
    # generate seesion_id for new chat
    session_id = f"{SESSION_PREFIX}{str(uuid.uuid4())}" 
    return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "session_id" : session_id } , "message" : "session_id returned" })

@app.post("/auth/login", status_code=200)
async def login(login_payload: login_schema):
    email = login_payload.email
    user = UsersRepo.get_user(email)
    # print("USER :> " , user)
    password = login_payload.password
    if user is None:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"success": False, "message": "Email not found"})
    if user.google_access_token is None:
        # print("here")
        if validate_password(user, password):
            # print("here (2)")
            token = generate_token_and_set_cookie(user.dict())
            return JSONResponse(status_code=status.HTTP_200_OK, content={
                "success": True,
                "data": user.json(),
                "access_token": token,
                "message": "successfully signed in"
            })
        
    return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"success": False, "message": "Wrong email or password"})

@app.post("/auth/signup", status_code=200)
async def signup(signup_payload: signup_schema):
    email = signup_payload.email
    user = UsersRepo.get_user(email)
    if user:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"success": False, "message": "Email already registered"})
    print(signup_payload)
    new_user = UsersRepo.insert_user(signup_payload)
    # print(new_user.dict())
    token = generate_token_and_set_cookie(new_user.dict())
    if new_user:
        return JSONResponse(status_code=status.HTTP_200_OK, content={
            "success": True,
            "data": new_user.json(),
            "access_token": token,
            "message": "successfully signed up"
        
        })
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"success": False,"message": "An error occurred"})

@app.get("/auth/verify_access", status_code=200)
async def verify_access( request : Request ):
    headers = request.headers
    token = headers.get('authorization' , None)
    if token : 
        token = token.split("Bearer ")[1]

    try : 
        user_data = decode_token(token)
    except ExpiredSignatureError:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED , content = { "success" : False, "message" : "Token Expired"})

    except InvalidTokenError:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED , content = { "success" : False, "message" : "Invalid token"})


    email = user_data["email"]
    user_ = UsersRepo.get_user(email , without_model=True)
    if user_ : 
        return JSONResponse(status_code=status.HTTP_200_OK, content={
            "success": True,
            "data": user_,
            "message": "working"})
    
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "success" : False, "message" : "Not authorized"})





# API to retrieve queries by search
@app.get("/search/query/{user_id}/")
async def search_query(user_id : str , query: str):
    if user_id : 
        responce = search_query_service( user_id ,  query)
        return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "results" : responce } , "message" : "search results returned"  })
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "userid not provided" })

# API to retrieve sessions by search
@app.get("/search/session/{user_id}/")
async def search_session(user_id : str):
    if user_id : 
        responce = search_sessions_service( user_id )
        return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "results" : responce } , "message" : "search results returned"  })
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "userid not provided" })

# API to retrieve all Q/A in a session
@app.get("/chat_history/{session_id}/")
async def chat_history(session_id : str ):
    if session_id : 
        responce = chat_session_service( session_id )
        return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "results" : responce } , "message" : "search results returned"  })
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "session_id not provided" })

# API to delete all Q/A in a session
@app.delete("/chat_history/{session_id}/")
async def delete_chat_history(session_id : str ):
    if session_id : 
        responce , status_code = delete_chat_session_service( session_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "session_id not provided" })

# API to delete a single query
@app.delete("/query/{query_id}/")
async def delete_query(query_id : str ):
    if query_id : 
        responce , status_code = delete_query_service( query_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "query_id not provided" })

# API to delete all Q/A in a database against a userID
@app.delete("/all/chats/{user_id}")
async def delete_all_chat( user_id : str ):

    if user_id : 
        responce , status_code = delete_all_chats_service( user_id )
        return JSONResponse(status_code=status_code , content = responce)

    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided" })





# WebSocket endpoint for Q/A between LLM
@app.websocket("/invoke_llm/{user_id}/{session_id}")
async def chat_invoke(websocket: WebSocket , user_id : str ,session_id : str):
    guid = user_id
    stop_flag = asyncio.Event() 
    qa_pairs = int(EMBEDDINGS_QA_PAIRS)
    
    prompt_generator = PromptGenerator()
    web_search = Cohere_Websearch( GOOGLE_API_KEY, SEARCH_ENGINE_ID ,  COHERE_API_KEY )
    modelInstance = LLM(guid, session_id , qa_pairs , prompt_generator, web_search , OPENAI_API_KEY)


    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            if data : 

                if data.get("action") == True:  # Check for stop action
                    stop_flag.set()  # Signal to stop processing
                    continue  # Skip the rest of the loop

                stop_flag.clear()
                # Start processing responses in a separate task
                asyncio.create_task(process_llm_service( 
                    data , modelInstance , stop_flag , 
                    youtube_instance , websocket
                    ))


    except Exception as e:
        print(f"<<< Client Disconnected >>> {e}")
        modelInstance.save_conversation()
        


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
    print(f"Server Up At : http://localhost:{PORT}/")
