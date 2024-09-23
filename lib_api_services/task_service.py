from bson.objectid import ObjectId
from fastapi import status, HTTPException
from api_request_schemas import task_scehma , update_task_schema
from lib_db_repos.task_repo import TasksRepo 

def create_task_service(user_id, task_payload: task_scehma):
    try:
        data = {
            "user_id": ObjectId(user_id),
            "text": task_payload.text,
            "is_done": task_payload.is_done,
            "order": task_payload.order,
            "deadline_time": task_payload.deadline_time
        }
        task_id = TasksRepo.create_task(data)
        task_text = task_payload.text
        if task_id:
            response = {
                "status": True,
                "message": "Task Created.",
                "data": {
                    "task_id": str(task_id),
                    "task_text": task_text,
                    "is_done": task_payload.is_done,
                    "order": task_payload.order,
                    "deadline_time":   {
                        "start" : task_payload.deadline_time.start,
                        "end" : task_payload.deadline_time.end
                    } if task_payload.deadline_time else {}
                }
            }
            return response, status.HTTP_200_OK

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task not created"
            )

    except Exception as e:
        if isinstance(e, HTTPException):
            status_code = e.status_code
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status": False,
            "message": "Failed to create task.",
            "data": {},
            "error": str(e),
        }

        return response, status_code



def update_task_service(user_id: str, task_id: str, task_payload: update_task_schema):
    try:
        update_data = {
            "text": task_payload.text,
            "is_done": task_payload.is_done,
            "order": task_payload.order,

        }

        if task_payload.deadline_time : 
            update_data["deadline_time"] = {
                "start" : task_payload.deadline_time.start,
                "end" : task_payload.deadline_time.end
            }

        # Call the repository with the correct parameters
        result = TasksRepo.update_task(task_id, update_data)  # Remove user_id
        
        if result["status"]:
            response = {
                "status": True,
                "message": "Task updated successfully.",
                "data": {
                    "task_id": str(task_id),
                }
            }
            return response, status.HTTP_200_OK
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["message"]
            )

    except Exception as e:
        if isinstance(e, HTTPException):
            status_code = e.status_code
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status": False,
            "message": "Failed to update task.",
            "data": {},
            "error": str(e), 
        }
        
        return response, status_code






def rearrange_task_service(user_id: str, task_order_payload):
    try:    
        task_order = task_order_payload.task_order
        rearranged = TasksRepo.rearrange_tasks(user_id, task_order)

        if rearranged:
            response = { 
                "status": True,
                "message": "Tasks rearranged successfully.",
                "data": task_order  
            }
            return response, status.HTTP_200_OK
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tasks to Rearrange Not provided."
            )

    except Exception as e:
        if isinstance(e, HTTPException):
            status_code = e.status_code
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        
        response = {
            "status": False,
            "message": "Failed to rearrange tasks.",
            "data": {},
            "error": str(e)
        }
        
        return response, status_code


def delete_task_service(user_id: str, task_id: str):
    try:
        deleted = TasksRepo.remove_task(task_id) 

        if deleted.get("status"):
            response = {
                "status": True,
                "message": "Task deleted successfully.",
                "data": {"task_id": task_id}
            }
            return response, status.HTTP_200_OK
        else:
            raise HTTPException( 
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

    except Exception as e:
        if isinstance(e, HTTPException):
            status_code = e.status_code
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        
        response = {
            "status": False,
            "message": "Failed to delete task.", 
            "data": {},
            "error": str(e)
        }
        
        return response, status_code
    
def list_all_tasks_service(user_id: str):  
    try:
        tasks = TasksRepo.get_tasks_by_user_id(user_id) 

        if tasks : 
            response = {
                "status" : True,
                "message": "File Retrieved.",
                "data" : { "tasks" : tasks }
            }
            return response , status.HTTP_200_OK

        else : 
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tasks not found"
            )
        
    except Exception as e : 
        print(e)
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to Retrieve Tasks.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code

