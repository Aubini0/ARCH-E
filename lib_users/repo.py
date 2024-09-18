from lib_database.db_connect import users_collection
from lib_users.models import User
from lib_users.password_utils import hash_password
from bson.objectid import ObjectId
from typing import Optional

class UsersRepo:
    
    @staticmethod
    def get_user(email):
        try:
            user = users_collection.find_one(
                { "email": { "$eq":email } },
                # { "password": 0, "datetime": 0 }
                )
            user['id'] = str(user['_id'])
            user_model = User(**user)
            return user_model

        except Exception as e:
            print(e)
            return None


    @staticmethod
    def get_user_by_id(id):
        try:
            id = ObjectId(id)
            print(id)

            user = users_collection.find_one({"_id" : id})

            print(user)
        except Exception:
            return None


    

    @staticmethod
    def insert_user(data):
        data.password = hash_password(data.password)
        model = User(**data.dict())
        try :
            result = users_collection.insert_one(
                model.dict()
            )
            model.id = str(result.inserted_id)
            return model
        except Exception:
            return None



    @staticmethod
    def update_user(user_id: str, update_data: dict) -> Optional[User]:
        try:
            # Convert the string ID to ObjectId
            object_id = ObjectId(user_id)
            # Perform the update using $set for partial updates
            result = users_collection.update_one( {"_id": object_id},  {"$set": update_data} )

            # Check if the update was successful
            if result.modified_count > 0:
                # Fetch the updated user
                updated_user = users_collection.find_one({"_id": object_id})
                if updated_user:
                    updated_user['id'] = str(updated_user['_id'])
                    return User(**updated_user)
            else:
                print(f"No user found with ID {user_id} or no fields updated.")
        except Exception as e:
            print(f"Error updating user: {e}")        
        return None