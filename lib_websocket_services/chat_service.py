from fastapi import ( WebSocket )
from lib_llm.helpers.llm import LLM
from lib_youtube.youtube_search import YoutubeSearch


async def process_llm_service( 
        data : str , modelInstance : LLM , stop_flag : any , 
        youtube_instance : YoutubeSearch , websocket : WebSocket):
    
    clear_messsge = { "clear" : True }
    user_msg=LLM.LLMMessage(role=LLM.Role.USER, content=data['user_msg'])
    user_inital_message = data['user_msg']

    print(f"STOP_FLAG :> {stop_flag.is_set()}")

    async for llm_resp in modelInstance.interaction(user_msg):
        if stop_flag.is_set():
            # remove message from user array if only user part is added without proper pre-processing
            if modelInstance.user_message_appened : 
                modelInstance.messages.pop()    
            break

        llm_resp = { 
            "response" : llm_resp , "web_links" : "" , "recommendations" : "" ,
            "youtube_results" : "", "clear" : False 
            }
        # send llm generated answer word by word
        await websocket.send_json(llm_resp)

    # moveout of function if clear command is being sent
    if stop_flag.is_set() : 
        # send clear message 
        await websocket.send_json(clear_messsge)
        return 
    
    

    links_message = { 
        "response" : "" , "web_links" : modelInstance.web_links  , 
        "recommendations" : "" ,  "youtube_results" : "" , "clear" : False 
        }

    # send web links                 
    if not stop_flag.is_set() : 
        await websocket.send_json(links_message)
        print("\n\n web_links_resp :> " , links_message)

    # send clear message to start new message
    await websocket.send_json(clear_messsge)


    resp = modelInstance.recomendations(user_msg)

    llm_recomendations_resp = { 
        "response" : "" , "web_links" : "" , "recommendations" : resp , 
        "youtube_results" : "", "clear" : False 
        }

    # send llm recomendations               
    if not stop_flag.is_set() : 
        await websocket.send_json(llm_recomendations_resp)
        print("\n\n llm_recomendations_resp :> " , llm_recomendations_resp)

    if modelInstance.check_web : 
        resp = youtube_instance.search(user_inital_message)
        
        youtube_results_resp = { 
            "response" : "" , "web_links" : "" , "recommendations" : "" , 
            "youtube_results" : resp, "clear" : False 
            }
        
        # send youtube results    
        if not stop_flag.is_set() : 
            await websocket.send_json(youtube_results_resp)
            print("\n\n youtube_results_resp :> " , youtube_results_resp)
