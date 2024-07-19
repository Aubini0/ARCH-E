from lib_database.db_connect import users_collection
from lib_users.models import User


class UsersRepo:
    
    @staticmethod
    def get_user(email):
        user = users_collection.find_one({
            "email": { "$eq":email }
        })
        return user

    @staticmethod
    def insert_user(data):
        model = User(**data.dict())
        try :
            users_collection.insert_one(
                model.dict()
            )
            return model
        except Exception:
            return None
