from lib_database.db_connect import users_collection
from lib_users.models import User
from lib_users.password_utils import hash_password


class UsersRepo:
    
    @staticmethod
    def get_user(email):
        try:
            user = users_collection.find_one({
                "email": { "$eq":email }
            })
            user['_id'] = str(user['_id'])
            user_model = User(**user)
            return user_model
        except Exception:
            return None

    @staticmethod
    def insert_user(data):
        data['password'] = hash_password(data['password'])
        model = User(**data.dict())
        try :
            users_collection.insert_one(
                model.dict()
            )
            return model
        except Exception:
            return None
