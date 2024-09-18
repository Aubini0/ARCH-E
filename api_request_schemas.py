from pydantic import BaseModel, EmailStr 


class invoke_llm_schema(BaseModel):
    guid : str
    user_msg : str

class login_schema(BaseModel):
    email: EmailStr
    password: str


class signup_schema(BaseModel):
    full_name: str
    email: EmailStr
    password: str


