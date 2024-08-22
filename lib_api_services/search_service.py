import os
from collections import Counter
from bson.objectid import ObjectId
from fastapi import status , HTTPException
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import MongoDBAtlasVectorSearch
from lib_database.db_connect import embeddings_collection ,chats_collection
from lib_api_services.helper import segregate_qa_pairs , find_matching_query , make_chunks , extract_keywords


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
vectorStore = MongoDBAtlasVectorSearch( embeddings_collection, embeddings )


def delete_all_chats_service( user_id ):
    try:
        # Delete chats
        chat_delete_result = chats_collection.delete_many({ "user_id" : user_id })
        # Delete embeddings
        embedding_delete_result = embeddings_collection.delete_many({ "user_id" : user_id})
        
        if chat_delete_result.deleted_count == 0 and embedding_delete_result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No chats found against userId : {user_id}"
            )

        response = {
            "status" : True,
            "message": "Chats deleted successfully.",
            "data" : {
                "deleted_chats_count": chat_delete_result.deleted_count,
                "deleted_embeddings_count": embedding_delete_result.deleted_count,
            },
        }
        return response , status.HTTP_200_OK

    except Exception as e:
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST

        response = {
            "status" : False,
            "message": "Failed to delete chats.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code

def vector_search_query_service(query , user_id  , no_of_results  = 5 ) : 
    as_output , all_resp = None , {}
    
    docs = vectorStore.similarity_search(
        query, K=no_of_results,
        pre_filter={ "user_id": { "$eq": user_id } }
        )


    if len(docs) > 0 :
        for doc in docs : 
            as_output = doc.page_content
            session_id = doc.metadata["session_id"]
            resp = segregate_qa_pairs(as_output , session_id)
            print(as_output)
            all_resp[ str(doc.metadata["_id"]) ] = resp

    return all_resp

def search_query_service( user_id , user_query ) : 

    query = {"user_id": user_id, "user": {"$regex": user_query , "$options": "i"}}
    all_resp = [  
        {
            "id"  : str(chat["_id"]),
            'user': chat['user'],
            'assistant': chat['assistant'],
            'user_id': chat['user_id'],
            'session_id': chat['session_id'],
            'created_at': chat['created_at'].isoformat()  # Convert datetime to string
        }
        for chat in chats_collection.find( query , { "metadata" : 0} ).sort("created_at")
        ]
    
    return all_resp



def search_sessions_service( user_id  ) : 

    pipeline = [
        { "$match": { "user_id": user_id  } },
        { "$sort": { "created_at": 1  } },
        {   
            # group by sessionIDs 
            "$group": {
                "_id": "$session_id", 
                "first_message": { 
                    "$first": "$$ROOT"  # Get the first document in each group
                },
                "all_messages": {
                    "$push": "$user"  # Collect all user messages in the session
                }
            }
        },
        # 
        {
            "$project": {
                "first_message": 1,
                "all_messages": 1,
                "created_at": 1  
            }
        }
    ]

    result = list(chats_collection.aggregate(pipeline))


    all_resp = []
    for session in result:
        # all_messages = ' '.join(session['all_messages'])
        # keywords = extract_keywords( [all_messages] )
        # # most_common_keyword = keywords[0] if keywords else "No Relevant Keyword"

        session_summary = {
            # "id"  : str(session["_id"]),
            "session_id": session['_id'],
            "session_name":  session['first_message']['user'],
            "created_at" : session['first_message']['created_at'].isoformat()
        }
        all_resp.append(session_summary)

    return all_resp



def chat_session_service( session_id , limit = 10 ) :
    all_chats = []

    all_chats = [  
        {
            "id"  : str(chat["_id"]),
            'user': chat['user'],
            'assistant': chat['assistant'],
            'user_id': chat['user_id'],
            'session_id': chat['session_id'],
            "metadata" : chat["metadata"],
            'created_at': chat['created_at'].isoformat()  # Convert datetime to string
        }
        for chat in chats_collection.find({"session_id" : session_id} ).sort("created_at")
    ]

    return all_chats




def get_query( query_id , limit = 10 ) :
    try : 
        chat = chats_collection.find_one({"_id" : ObjectId(query_id)} )
        if not chat : 
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No records found for query_id: {query_id}"
            )

        query = {
            "id"  : str(chat["_id"]),
            'user': chat['user'],
            'assistant': chat['assistant'],
            'user_id': chat['user_id'],
            'session_id': chat['session_id'],
            "metadata" : chat["metadata"],
            'created_at': chat['created_at'].isoformat()  # Convert datetime to string
        }
        response = {
            "status" : True,
            "message": "Query Fetched.",
            "data" : { "results" : query },
        }

        return response , status.HTTP_200_OK


    except Exception as e : 
        print(e)
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to delete query.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code




def delete_query_service(query_id):
    try : 

        query_delete_result, embedding_delete_result = None , None
        record = chats_collection.find_one({"_id" : ObjectId(query_id)} )

        if not record  : 
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No records found for query_id: {query_id}"
            )
        

        user_id = record['user_id']
        user_query = record['user']
        session_id = record['session_id']
        assistant_reply = record['assistant']

        vector_search_resp = vector_search_query_service( user_query , user_id )
        print(vector_search_resp)
        filtered_item  , item_id = find_matching_query(user_query, assistant_reply,  vector_search_resp)

        if len(filtered_item) > 0  :
            chunks = make_chunks(filtered_item)
            metadatas = [{"user_id": user_id , "session_id" : session_id}]

            # add new embeddings for new updated text chunk
            vectorStore.from_texts( 
                [chunks] , embeddings , 
                metadatas=metadatas ,  collection=embeddings_collection 
            )

        # delete old chunk embeddings
        embedding_delete_result = embeddings_collection.delete_one({'_id': ObjectId(item_id)})
        embedding_delete_result = embedding_delete_result.deleted_count
        # delete query
        query_delete_result = chats_collection.delete_one({ "_id" : ObjectId(query_id)})
        query_delete_result = query_delete_result.deleted_count


        response = {
            "status" : True,
            "message": "Query deleted.",
            "data" : {
                "deleted_chats_count": query_delete_result,
                "deleted_embeddings_count": embedding_delete_result,
            },
        }

        return response , status.HTTP_200_OK
    except Exception as e : 
        print(e)
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to delete query.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code

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
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST

        response = {
            "status" : False,
            "message": "Failed to delete chat session.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code





# Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YmQwZDRkMmJhY2Q0N2EzYjcxNjI4NyIsImVtYWlsIjoidGVzdDFAeW9wbWFpbC5jb20iLCJleHAiOjE3MjU2NTQxOTJ9.qonta-MlGnQmfZ8_M0l6rnQbi1g90Zh9HYg3FnLQ0Ck
# Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Yzc1ZWI1MWRlYTNjMzVhYTAzMDRmMiIsImVtYWlsIjoidGVzdF8xQHlvcG1haWwuY29tIiwiZXhwIjoxNzI1NjU1OTc2fQ.E3yKpNcc71pt2l-56k3Qdy7pDL_0WDsdugMUSHvq7xM