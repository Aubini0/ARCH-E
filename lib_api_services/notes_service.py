from fastapi import HTTPException, status
from bson.objectid import ObjectId
from api_request_schemas import NoteSchema 
from lib_db_repos.notes_repo import ( NotesRepo) 

def create_note_service(user_id: str, note_payload: NoteSchema):
    try:
       
        data = {
            "user_id": ObjectId(user_id), 
            "text": note_payload.text,
            "x_position": note_payload.x_position,
            "y_position": note_payload.y_position,
            "z_position": note_payload.z_position
        }
        
        
        note_id = NotesRepo.create_note(data) 
        print("Created Note ID:", note_id)
        
        if note_id:
            response = {
                "status": True,
                "message": "Note Created.",
                "data": {
                    "note_id": str(note_id),
                    "text": note_payload.text,
                    "x_position": note_payload.x_position,
                    "y_position": note_payload.y_position,
                    "z_position": note_payload.z_position
                }
            }
            return response, status.HTTP_200_OK
        
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note not created"
        )
    
    except Exception as e:
        status_code = e.status_code if isinstance(e, HTTPException) else status.HTTP_400_BAD_REQUEST
        response = {
            "status": False,
            "message": "Failed to create note.",
            "data": {},
            "error": str(e),
        }
        return response, status_code
    

def delete_note_service(note_id: str):
    try:
       
        result = NotesRepo.delete_note(note_id)

        if result['status']:
            return {
                "status": True,
                "message": result["message"] 
            }, status.HTTP_200_OK
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )

    except Exception as e:
        status_code = e.status_code if isinstance(e, HTTPException) else status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "status": False,
            "message": "Failed to delete note.",
            "error": str(e),
        }, status_code
