from models import Folders
from datetime import datetime
from bson.objectid import ObjectId
from fastapi import status , HTTPException
from lib_database.db_connect import ( folders_collection )


class FoldersRepo:

    @staticmethod
    def serialize_folder(doc):
        # Convert user_id (ObjectId) to string
        if '_id' in doc and isinstance(doc['_id'], ObjectId):
            doc['_id'] = str(doc['_id'])

        if 'user_id' in doc and isinstance(doc['user_id'], ObjectId):
            doc['user_id'] = str(doc['user_id'])
        
        # Convert createdAt and updatedAt (datetime) to string (ISO format)
        if 'createdAt' in doc and isinstance(doc['createdAt'], datetime):
            doc['createdAt'] = doc['createdAt'].isoformat()
        
        if 'updatedAt' in doc and isinstance(doc['updatedAt'], datetime):
            doc['updatedAt'] = doc['updatedAt'].isoformat()
        
        return doc


    @staticmethod
    def get_folder_by_id(id):
        try:
            id = ObjectId(id)            
            folder = folders_collection.find_one({"_id" : id})
            return folder
        except Exception:
            return None



    @staticmethod
    def get_folders(id):
        try:
            id = ObjectId(id)            
            folders = folders_collection.find({"user_id" : id})
            converted_folders_list = [FoldersRepo.serialize_folder(doc) for doc in folders]
            return converted_folders_list

        except Exception:
            return None


    @staticmethod
    def create_folder(data):
        if isinstance(data , dict) : 
            model = Folders(**data)
        else : 
            model = Folders(**data.dict())
        try :
            result = folders_collection.insert_one(
                model.dict()
            )
            inserted_id = str(result.inserted_id)
            return inserted_id
        except Exception as e :
            if e.code == 11000 : 
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Folder with name '{data['folder_name']}' already exists"
                )            

            return None
        
