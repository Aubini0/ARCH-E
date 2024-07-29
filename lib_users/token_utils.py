import jwt
import os
from datetime import datetime, timedelta
from jwt import ExpiredSignatureError, InvalidTokenError

def generate_token_and_set_cookie(user_info):
    print(user_info)
    token = jwt.encode(
        {
            "email": user_info["email"],
            "exp": datetime.now() + timedelta(days=15)
        },
        os.getenv("JWT_TOKEN_SECRET"),
        algorithm="HS256"
    )
    return token



def decode_token(token):
    try:
        decoded_token = jwt.decode(
            token,
            os.getenv("JWT_TOKEN_SECRET"),
            algorithms=["HS256"]
        )
        return decoded_token
    except ExpiredSignatureError:
        raise ValueError("Token has expired")
    except InvalidTokenError:
        raise ValueError("Invalid token")
    


