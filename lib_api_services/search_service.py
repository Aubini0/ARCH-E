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
    all_resp = list(chats_collection.find( query ,  { "created_at" : 0 ,  "_id": 0} ).sort("created_at"))
    return all_resp



def chat_session_service( session_id , limit = 10 ) :
    all_chats = []
    all_chats = list(chats_collection.find({"session_id" : session_id} , { "created_at" : 0 ,  "_id": 0}).sort("created_at"))
    # for chat in chats : 
    #     resp = segregate_qa_pairs( chat['text'] , session_id )
    #     all_chats  = all_chats + resp
    return all_chats
