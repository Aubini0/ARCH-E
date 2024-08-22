import jwt
import os
from datetime import datetime, timedelta

def generate_token_and_set_cookie(user_info):
    token = jwt.encode(
        {
            "id" : user_info["id"],
            "email": user_info["email"],
            "exp": datetime.now() + timedelta(days=15)
        },
        os.getenv("JWT_TOKEN_SECRET"),
        algorithm="HS256"
    )
    return token



def decode_token(token):
    decoded_token = jwt.decode(
        token,
        os.getenv("JWT_TOKEN_SECRET"),
        algorithms=["HS256"]
    )
    return decoded_token
    


