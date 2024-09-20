from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException, status  
from lib_database.db_connect import (notes_collection)   
from models import Notes     

class NotesRepo: 

    @staticmethod 
    def serialize_note(doc):    
       
        if '_id' in doc and isinstance(doc['_id'], ObjectId):
            doc['_id'] = str(doc['_id'])       
        
        if 'user_id' in doc and isinstance(doc['user_id'], ObjectId):
            doc['user_id'] = str(doc['user_id'])

        if 'createdAt' in doc and isinstance(doc['createdAt'], datetime):
            doc['createdAt'] = doc['createdAt'].isoformat()

        if 'updatedAt' in doc and isinstance(doc['updatedAt'], datetime):
            doc['updatedAt'] = doc['updatedAt'].isoformat()

        return doc

    @staticmethod
    def get_notes(user_id: str): 
        try:
            
            user_id = ObjectId(user_id)
            notes = notes_collection.find({"user_id": user_id})
            converted_notes_list = [NotesRepo.serialize_note(doc) for doc in notes]

           
            if not converted_notes_list:
                return {"status": False, "message": "No notes found", "data": []}

            return {"status": True, "data": converted_notes_list}

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving notes: {str(e)}"
            ) 

    @staticmethod
    def create_note(data):
      
        if isinstance(data, dict):
            model = Notes(**data)
        else:
            model = Notes(**data.dict())

        try:
          
            result = notes_collection.insert_one(model.dict())
            inserted_id = str(result.inserted_id)
            return inserted_id

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating note: {str(e)}"
            )

    @staticmethod
    def update_note(note_id: str, data):
        try:
            note_id = ObjectId(note_id)

            update_data = {key: value for key, value in data.items() if value is not None}

            result = notes_collection.update_one(
                {"_id": note_id},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Note not found"
                )

            return {"status": True, "message": "Note updated successfully."}

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating note: {str(e)}"
            )


    @staticmethod
    def delete_note(note_id: str):
        try:
           
            note_object_id = ObjectId(note_id)
            
            result = notes_collection.delete_one({"_id": note_object_id})
            
            if result.deleted_count == 1:
                return {"status": True, "message": "Note deleted successfully"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Note not found"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting note: {str(e)}"
            )

