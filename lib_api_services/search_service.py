from fastapi import status , HTTPException
from lib_api_services.helper import segregate_qa_pairs
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import MongoDBAtlasVectorSearch
from lib_database.db_connect import embeddings_collection ,chats_collection



def vector_search_query_service(query , user_id  , api_key , no_of_results  = 5 ) : 
    as_output , all_resp = None , []
    embeddings = OpenAIEmbeddings(openai_api_key=api_key)
    vectorStore = MongoDBAtlasVectorSearch( embeddings_collection, embeddings )
    
    docs = vectorStore.similarity_search(
        query, K=no_of_results,
        pre_filter={ "user_id": { "$eq": user_id } }
        )


    if len(docs) > 0 :
        for doc in docs : 
            as_output = doc.page_content
            session_id = doc.metadata["session_id"]
            resp = segregate_qa_pairs(as_output , session_id)
            all_resp = all_resp + resp
    return all_resp


def search_query_service( user_id , user_query ) : 

    query = {"user_id": user_id, "user": {"$regex": user_query , "$options": "i"}}
    all_resp = [  
        {
            'user': chat['user'],
            'assistant': chat['assistant'],
            'user_id': chat['user_id'],
            'session_id': chat['session_id'],
            'created_at': chat['created_at'].isoformat()  # Convert datetime to string
        }
        for chat in chats_collection.find( query ,  { "_id": 0} ).sort("created_at")
        ]
    
    return all_resp



def chat_session_service( session_id , limit = 10 ) :
    all_chats = []
    all_chats = list(chats_collection.find({"session_id" : session_id} , { "created_at" : 0 ,  "_id": 0}).sort("created_at"))
    return all_chats



def delete_chat_session_service(session_id):
    try:
        # Delete chats
        chat_delete_result = chats_collection.delete_many({'session_id': session_id})
        # Delete embeddings
        embedding_delete_result = embeddings_collection.delete_many({'session_id': session_id})
        
        if chat_delete_result.deleted_count == 0 and embedding_delete_result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No records found for session_id: {session_id}"
            )

        response = {
            "status" : True,
            "message": "Chat session deleted successfully.",
            "data" : {
                "deleted_chats_count": chat_delete_result.deleted_count,
                "deleted_embeddings_count": embedding_delete_result.deleted_count,
            },
        }
        return response , status.HTTP_200_OK

    except Exception as e:
        response = {
            "status" : False,
            "message": "Failed to delete chat session.",
            "data" : {},
            "error": str(e),
        }

        return response , status.HTTP_400_BAD_REQUEST
