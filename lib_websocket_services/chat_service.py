from fastapi import ( WebSocket )
from lib_llm.helpers.llm import LLM
from lib_youtube.youtube_search import YoutubeSearch


async def process_llm_service( 
        data : str , modelInstance : LLM , stop_flag : any , 
        youtube_instance : YoutubeSearch , message_id_prefix : str , 
        websocket : WebSocket ):
    

    if data.get("isfeedback" , False) : 
        message_no = data.get("message_id" , "")
        message_rating = data.get("msg_rating" , None)
        message_feedback = data.get("feedback_value" , "")
        message_id = f"{message_id_prefix}{message_no}"
        msg_obj = modelInstance.all_messages.get(message_id , None )
        if msg_obj :  
            modelInstance.all_messages[message_id]["rating"] = message_rating
            modelInstance.all_messages[message_id]["feedback"] = message_feedback
            print("FeedbackMessage :> " , msg_obj)
        print("Feedback & Rating updated")

    elif data.get("regenerate_resp" , False) : 
        message_id = f"{message_id_prefix}{modelInstance.current_message_index}"
        del modelInstance.messages[-2:]
        del modelInstance.all_messages[ message_id ]
        modelInstance.current_message_index -= 1

        print("Regenerate Responce")


    else : 
        clear_messsge = { "clear" : True }

        user_msg=LLM.LLMMessage(role=LLM.Role.USER, content=data['user_msg'])
        user_inital_message = data['user_msg']



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
        

        # message_id and initating all_message object with it 
        modelInstance.current_message_index += 1
        message_index = modelInstance.current_message_index
        message_id = f"{message_id_prefix}{message_index}"
        modelInstance.all_messages[message_id.strip()] = { "user_msg" : user_inital_message } 


        links_message = { 
            "response" : "" , "web_links" : modelInstance.web_links  , 
            "recommendations" : "" ,  "youtube_results" : "" , "clear" : False 
            }
        
        # send web links                 
        if not stop_flag.is_set() : 
            await websocket.send_json(links_message)
            modelInstance.all_messages[message_id.strip()]["web_links"] = modelInstance.web_links 
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
            modelInstance.all_messages[message_id.strip()]["recomendations"] = resp 
            print("\n\n llm_recomendations_resp :> " , llm_recomendations_resp)

        # send youtube results    
        if modelInstance.check_web and not stop_flag.is_set(): 
            resp = youtube_instance.search(user_inital_message)
            youtube_results_resp = { 
                "response" : "" , "web_links" : "" , "recommendations" : "" , 
                "youtube_results" : resp, "clear" : False 
                }
            
            await websocket.send_json(youtube_results_resp)            
            modelInstance.all_messages[message_id.strip()]["youtube_results"] = resp 
            print("\n\n youtube_results_resp :> " , youtube_results_resp)


