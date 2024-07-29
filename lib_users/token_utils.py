import jwt
import os
from datetime import datetime, timedelta


def generate_token_and_set_cookie(user_info):
    token = jwt.encode(
        {
            "id": user_info["id"],
            "password": user_info["password"],
            "access_roles": user_info["access_roles"],
            "exp": datetime.now() + timedelta(days=15)
        },
        os.getenv("JWT_TOKEN_SECRET"),
        algorithm="HS256"
    )
    return token
