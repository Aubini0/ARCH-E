# external modules
import os , uuid , asyncio
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
from lib_db_repos import UsersRepo
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi import ( FastAPI, UploadFile, File, Form ,  WebSocket, Request, 
                     status , Depends , WebSocketDisconnect )


# internal modules
from lib_llm.helpers.llm import LLM
from lib_utils.helper import verify_token
from lib_utils.file_utils import ( upload_file )
from lib_infrastructure.dispatcher import Dispatcher 
from lib_youtube.youtube_search import YoutubeSearch
from jwt import ExpiredSignatureError, InvalidTokenError
from lib_utils.password_utils import ( validate_password )
from lib_llm.helpers.prompt_generator import PromptGenerator
from lib_websearch_cohere.cohere_search import Cohere_Websearch
from lib_websocket_services.chat_service import ( process_llm_service )

from api_request_schemas import ( login_schema, signup_schema , folder_schema ,NoteSchema  )

from lib_utils.token_utils import ( generate_token_and_set_cookie , decode_token )
from lib_api_services.search_service import ( chat_session_service, search_query_service , 
                                             delete_chat_session_service , delete_query_service ,
                                             delete_all_chats_service , search_sessions_service, get_query
                                             )

from lib_api_services.file_management_service import ( upload_file_service , retrieve_files_service , 
                                                      create_folder_service , retrieve_folders_service,
                                                      retrieve_files_of_folder_service, delete_file_service,
                                                      update_file_service
                                                      )

from lib_api_services.notes_service import ( create_note_service , delete_note_service,update_note_service,list_all_notes_service)



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
MESSAGE_ID_PREFIX = os.getenv("MESSAGE_ID_PREFIX")
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

# API to get session_id for websocket caht sessions
@app.get("/session/id")
async def get_sessionId( ):
    # generate seesion_id for new chat
    session_id = f"{SESSION_PREFIX}{str(uuid.uuid4())}" 
    return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "session_id" : session_id } , "message" : "session_id returned" })

# API to login
@app.post("/auth/login", status_code=200)
async def login(login_payload: login_schema):
    email = login_payload.email
    user = UsersRepo.get_user(email)
    password = login_payload.password
    if user is None:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"success": False, "message": "Email not found"})
    if user.google_access_token is None:
        if validate_password(user, password):
            token = generate_token_and_set_cookie(user.dict())
            return JSONResponse(status_code=status.HTTP_200_OK, content={
                "success": True,
                "data": user.json(),
                "access_token": token,
                "message": "successfully signed in"
            })
        
    return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"success": False, "message": "Wrong email or password"})

# API to signup
@app.post("/auth/signup", status_code=200)
async def signup(signup_payload: signup_schema):
    email = signup_payload.email
    user = UsersRepo.get_user(email)
    if user:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"success": False, "message": "Email already registered"})
    new_user = UsersRepo.insert_user(signup_payload)
    token = generate_token_and_set_cookie(new_user.dict())
    if new_user:
        return JSONResponse(status_code=status.HTTP_200_OK, content={
            "success": True,
            "data": new_user.json(),
            "access_token": token,
            "message": "successfully signed up"
        
        })
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"success": False,"message": "An error occurred"})

# API to get user info
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
    user_ = UsersRepo.get_user(email)
    if user_ : 
        return JSONResponse(status_code=status.HTTP_200_OK, content={
            "success": True,
            "data": user_.json(),
            "message": "working"})
    
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "success" : False, "message" : "Not authorized"})

# API to edit profile
@app.put("/auth/user/profile")
async def edit_profile(
    full_name: Optional[str] = Form(None),  # Use Form for form fields
    file: Optional[UploadFile] = File(None),  # Use File for file uploads
    user_data = Depends(verify_token)
):
    user_id = user_data.get("id")
    
    if not user_id:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={
            "status": False,
            "data": {},
            "message": "User not found"
        })
    
    update_data = {}
    # Handle form data and file
    if full_name:
        print(f"Full name: {full_name}")
        update_data["full_name"] = full_name
    if file:
        file_server_location = "public/uploads/profile_pictures"
        file_base_url_path = "https://api.arche.social/uploads/profile_pictures"
        response = upload_file( user_id , file , file_server_location , file_base_url_path )
        if response["status"] : 
            server_location = response["location"]
            update_data["profilePic"] = server_location

    update_data["updatedAt"] = datetime.now()

    updated_user = UsersRepo.update_user( user_id , update_data )

    return JSONResponse(status_code=status.HTTP_200_OK, content={
        "status": True,
        "data": { "updated_user" : updated_user.json() },
        "message": "Profile updated"
    })



# API to upload file
@app.post("/file-management/upload/file")
async def upload_files(
    file: UploadFile = File(None),
    position_x: Optional[float] = Form(None),
    position_y: Optional[float] = Form(None),
    position_z: Optional[float] = Form(None),
    user_data = Depends(verify_token)
):
    user_id = user_data.get("id")
    if user_id and file:
        position_payload = [position_x,position_y,position_z]
        responce , status_code = upload_file_service( user_id , file , position_payload )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided" if not user_id else "file not provided" })


# API to retrieve files
@app.get("/file-management/retrieve/files")
async def retrieve_files(
    user_data = Depends(verify_token)  
):
    user_id = user_data.get("id")
    if user_id:
        responce , status_code = retrieve_files_service( user_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided"  })

# API to retrieve files
@app.delete("/file-management/delete/file")
async def delete_file(
    file_id : str,
    user_data = Depends(verify_token)
):
    user_id = user_data.get("id")
    if user_id and file_id:
        responce , status_code = delete_file_service( user_id , file_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided" if not user_id else "file_id not provided" })

# API to retrieve files
@app.put("/file-management/update/file")
async def update_file(
    file_id : str,
    file_name : str,
    user_data = Depends(verify_token)
):
    user_id = user_data.get("id")
    if user_id and file_id and file_name:
        responce , status_code = update_file_service( user_id , file_id , file_name )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        missing_field = "user_id" if not user_id else "file_id" if not file_id else "file_name"
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : f"{missing_field} not provided" })

# API to create folder
@app.post("/file-management/create/folder")
async def create_folder(  
    folder_payload : folder_schema,
    user_data = Depends(verify_token)  
):
    user_id = user_data.get("id")
    if user_id:
        responce , status_code = create_folder_service( user_id , folder_payload )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided"  })

# API to retrieve folders
@app.get("/file-management/retrieve/folders")
async def retrieve_folders(
    user_data = Depends(verify_token)      
):
    user_id = user_data.get("id")
    if user_id:
        responce , status_code = retrieve_folders_service( user_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided"  })

# API to upload file to folder
@app.post("/file-management/upload/file-to-folder")
async def upload_files_to_folder(
    file: UploadFile = File(None), 
    folder_id : Optional[str] = Form(None),
    position_x: Optional[float] = Form(None),
    position_y: Optional[float] = Form(None),
    position_z: Optional[float] = Form(None),

    user_data = Depends(verify_token)
):
    user_id = user_data.get("id")
    if user_id and folder_id and file:
        position_payload = [position_x,position_y,position_z]
        responce , status_code = upload_file_service( user_id  , file , position_payload,  folder_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        missing_field = "user_id" if not user_id else "folder_id" if not folder_id else "file"
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : f"{missing_field} not provided" })

# API to retrieve files of a folder
@app.get("/file-management/retrieve/files-of-folder")
async def retrieve_files_of_folder(
    folder_id : str,
    user_data = Depends(verify_token)
):
    user_id = user_data.get("id")
    if user_id and folder_id:
        responce , status_code = retrieve_files_of_folder_service( folder_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided" if not user_id else "folder_id not provided" })



#API TO CREATE NOTES SERVICE
@app.post("/notes/create/note") 
async def create_note( 
    notes_payload : NoteSchema,
    user_data = Depends(verify_token)  
):
    user_id = user_data.get("id")     
    if user_id:  
        responce , status_code = create_note_service( user_id , notes_payload )
        return JSONResponse(status_code=status_code , content = responce)
    else :  
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided"  })


#API TO DELETE NOTES

@app.delete("/notes/delete/note") 
async def delete_note( 
    note_id : str, 
    user_data = Depends(verify_token) 
):
    user_id = user_data.get("id")     
    if user_id and note_id:      
        responce , status_code = delete_note_service( note_id )
        return JSONResponse(status_code=status_code , content = responce)
    else :  
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided"  })




# API TO UPDATE NOTES SERVICE
@app.put("/notes/update/note/{note_id}")
async def update_note(
    note_id: str,
    notes_payload: NoteSchema,
    user_data = Depends(verify_token) 
):
    user_id = user_data.get("id")
    if user_id:
        response, status_code = update_note_service(user_id, note_id, notes_payload)
        return JSONResponse(status_code=status_code, content=response)
    else:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={
            "status": False,
            "message": "Unauthorized",  
            "data": {}
        })

# API TO LIST ALL  NOTES    
@app.get("/notes")
async def get_all_notes(user_data = Depends(verify_token)):
    user_id = user_data.get("id")
    if user_id:
        response = list_all_notes_service(user_id)
        return JSONResponse(status_code=status.HTTP_200_OK, content=response)
    else:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={
            "status": False,
            "message": "Unauthorized", 
            "data": {}
        })


# API to retrieve queries by search
@app.get("/search/query") 
async def search_query( query: str , user_data = Depends(verify_token)):
    user_id = user_data.get("id") 
    if user_id :  
        responce = search_query_service( user_id ,  query)
        return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "results" : responce } , "message" : "search results returned"  })
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "userid not provided" })

# API to retrieve sessions by search
@app.get("/search/session") 
async def search_session(user_data = Depends(verify_token)):
    user_id = user_data.get("id")
    if user_id : 
        responce = search_sessions_service( user_id )
        return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "results" : responce } , "message" : "search results returned"  })
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "userid not provided" })

# API to retrieve all Q/A in a session
@app.get("/chat_history/{session_id}/")
async def chat_history(session_id : str , user_data = Depends(verify_token) ):
    user_id = user_data.get("id")
    if session_id and user_id: 
        responce = chat_session_service( session_id )
        return JSONResponse(status_code=status.HTTP_200_OK , content = { "status" : True , "data" : { "results" : responce } , "message" : "search results returned"  })
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "session_id not provided" if not session_id else "user_id not provided" })

# API to retrieve a message
@app.get("/query/{query_id}/")
async def retrieve_query(query_id : str , user_data = Depends(verify_token) ):
    user_id = user_data.get("id")
    if query_id and user_id: 
        responce , status_code = get_query( query_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "query_id not provided" if not query_id else "user_id not provided" })

# API to delete all Q/A in a session
@app.delete("/chat_history/{session_id}/")
async def delete_chat_history(session_id : str , user_data = Depends(verify_token) ):
    user_id = user_data.get("id")
    if session_id and user_id: 
        responce , status_code = delete_chat_session_service( session_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "session_id not provided" if not session_id else "user_id not provided" })

# API to delete a single query
@app.delete("/query/{query_id}/")
async def delete_query(query_id : str  , user_data = Depends(verify_token)):
    user_id = user_data.get("id")
    if query_id and user_id:
        responce , status_code = delete_query_service( query_id )
        return JSONResponse(status_code=status_code , content = responce)
    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "query_id not provided" if not query_id else "user_id not provided"  })

# API to delete all Q/A in a database against a userID
@app.delete("/all/chats")
async def delete_all_chat( user_data = Depends(verify_token) ):
    user_id = user_data.get("id")
    if user_id : 
        responce , status_code = delete_all_chats_service( user_id )
        return JSONResponse(status_code=status_code , content = responce)

    else : 
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST , content = { "status" : False , "data" : { } , "message" : "user_id not provided" })

# WebSocket endpoint for Q/A between LLM
@app.websocket("/invoke_llm/{user_id}/{session_id}")
async def chat_invoke(websocket: WebSocket , user_id : str ,session_id : str):
    guid = user_id
    message_index = 0
    stop_flag = asyncio.Event() 
    qa_pairs = int(EMBEDDINGS_QA_PAIRS)
    prompt_generator = PromptGenerator()
    web_search = Cohere_Websearch( GOOGLE_API_KEY, SEARCH_ENGINE_ID ,  COHERE_API_KEY )
    modelInstance = LLM( 
        guid, session_id , qa_pairs , prompt_generator, web_search , 
        OPENAI_API_KEY , MESSAGE_ID_PREFIX )

    responce = chat_session_service( session_id )
    if len(responce) > 0 :  
        for message in responce : 
            message_id = f"{MESSAGE_ID_PREFIX}{message_index}"
            modelInstance.all_messages[ message_id.strip() ] = { 
                "msg_id" : message.get("id" , None),
                "user_msg" : message.get("user" , "") , 
                "existing_msg" : True }
            
            modelInstance.all_messages[ message_id.strip() ]["web_links"] = message.get("web_links" , "")
            modelInstance.all_messages[ message_id.strip() ]["recomendations"] = message.get("recomendations" , [])
            if message.get("youtube_results" , None ) : 
                modelInstance.all_messages[ message_id.strip() ]["youtube_results"] = message.get("youtube_results")
            message_index +=1



    # current Index will be one less then incase its > 0 because it will be auto incromented in process_llm
    # function. As that function works once a message is sent, so it incriments it
    if message_index > 0 :
        modelInstance.starting_message_index = message_index
        modelInstance.current_message_index = message_index - 1
    # in case of 0 message_index, put starting_message_index to 1 to avoid error in llm.py while
    # getting messages from all_messages because in that messages will be stored from 1
    else :         
        modelInstance.current_message_index = message_index
        modelInstance.starting_message_index = message_index + 1



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
                    youtube_instance , MESSAGE_ID_PREFIX , 
                    websocket
                    ))



    except WebSocketDisconnect:
            print(f"Client disconnected: user_id={user_id}, session_id={session_id}")
            modelInstance.save_conversation()
    except Exception as e:
        print(f"Unexpected error: {e}")
        modelInstance.save_conversation()

    finally:
        # Check if the WebSocket is still open before attempting to close it
        if not websocket.client_state.name == "DISCONNECTED":
            await websocket.close()
        print(f"WebSocket connection closed for user {user_id}, session {session_id}")

        


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
    print(f"Server Up At : http://localhost:{PORT}/")
