from models import Tasks
from datetime import datetime
from bson.objectid import ObjectId
from fastapi import status, HTTPException
from lib_database.db_connect import tasks_collection

class TasksRepo:

    @staticmethod
    def serialize_task(doc):
        # Convert ObjectId and datetime fields to string
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
    def get_task_by_id(task_id):
        try:
            task_id = ObjectId(task_id)
            task = tasks_collection.find_one({"_id": task_id})
            return TasksRepo.serialize_task(task) if task else None
        except Exception:
            return None

    @staticmethod
    def get_tasks_by_user_id(user_id):
        try:
            user_id = ObjectId(user_id)
            tasks = tasks_collection.find({"user_id": user_id}).sort("order")
            return [TasksRepo.serialize_task(doc) for doc in tasks]
        except Exception:
            return None

    @staticmethod
    def create_task(data):
        if isinstance(data, dict):
            model = Tasks(**data)
        else:
            model = Tasks(**data.dict())

        try:
            result = tasks_collection.insert_one(model.dict())
            inserted_id = str(result.inserted_id)
            return inserted_id
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating task: {str(e)}"
            )

    @staticmethod
    # def update_task(user_id: str, task_id: str, update_data: dict):
    #     task_id = ObjectId(task_id)
    #     result = tasks_collection.update_one(
    #         {"_id": task_id, "user_id": user_id},  # Matching both task_id and user_id
    #         {"$set": update_data}
    #     )

    #     if result.matched_count == 0:
    #         return False
    #     return True

    def update_task(task_id, data):
        try:
            task_id = ObjectId(task_id)
            update_data = {key: value for key, value in data.items() if value is not None}
            
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No valid fields provided for update"
                )

            result = tasks_collection.update_one({"_id": task_id}, {"$set": update_data})

            if result.matched_count == 0:
                return {
                    "status": False,
                    "message": "Task not found"
                }

            return {"status": True, "message": "Task updated successfully"}
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating task: {str(e)}"
        )


    @staticmethod
    def remove_task(task_id):
        try:
            task_id = ObjectId(task_id)
            result = tasks_collection.delete_one({"_id": task_id})

            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )
            return {"status": True, "message": "Task deleted successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting task: {str(e)}"
            )

    @staticmethod
    def rearrange_tasks(user_id, task_order):
        try:
            user_id = ObjectId(user_id)
            for task_id, new_order in task_order.items():
                task_id = ObjectId(task_id)
                tasks_collection.update_one(
                    {"_id": task_id, "user_id": user_id},
                    {"$set": {"order": new_order}}
                )
            return {"status": True, "message": "Tasks rearranged successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error rearranging tasks: {str(e)}" 
            )
