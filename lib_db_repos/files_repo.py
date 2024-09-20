from models import Files
from datetime import datetime
from bson.objectid import ObjectId
from lib_database.db_connect import ( files_collection )

class FilesRepo:

    @staticmethod
    def serialize_file(doc):
        # Convert user_id (ObjectId) to string
        if '_id' in doc and isinstance(doc['_id'], ObjectId):
            doc['_id'] = str(doc['_id'])

        if 'user_id' in doc and isinstance(doc['user_id'], ObjectId):
            doc['user_id'] = str(doc['user_id'])


        if 'folder_id' in doc and isinstance(doc['folder_id'], ObjectId):
            doc['folder_id'] = str(doc['folder_id'])


        # Convert createdAt and updatedAt (datetime) to string (ISO format)
        if 'createdAt' in doc and isinstance(doc['createdAt'], datetime):
            doc['createdAt'] = doc['createdAt'].isoformat()
        
        if 'updatedAt' in doc and isinstance(doc['updatedAt'], datetime):
            doc['updatedAt'] = doc['updatedAt'].isoformat()
        
        return doc

    @staticmethod
    def get_files(id):
        try:
            id = ObjectId(id)
            query = {
                "user_id": id,
                "$or": [
                    {"folder_id": None}, {"folder_id": {"$exists": False}} 
                ]
            }
            
            files = files_collection.find(query)
            converted_files_list = [FilesRepo.serialize_file(doc) for doc in files]
            return converted_files_list

        except Exception:
            return None


    @staticmethod
    def get_files_by_folder(id):
        try:
            id = ObjectId(id)
            query = { "folder_id": id }
            files = files_collection.find(query)
            converted_files_list = [FilesRepo.serialize_file(doc) for doc in files]
            return converted_files_list

        except Exception:
            return None


    @staticmethod
    def insert_file(data):
        if isinstance(data , dict) : 
            model = Files(**data)
        else : 
            model = Files(**data.dict())
        try :
            result = files_collection.insert_one(
                model.dict()
            )
            inserted_id = str(result.inserted_id)
            return inserted_id
        except Exception as e :
            print(e)
            return None

