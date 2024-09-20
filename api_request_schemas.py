from bson import ObjectId
from pydantic import ( BaseModel, EmailStr , validator )  

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


class folder_schema(BaseModel) : 
    folder_name : str

class NoteSchema(BaseModel): 
    text: str 
    x_position: float
    y_position: float
    z_position: float

class object_id_schema(BaseModel) : 
    id : ObjectId

    def custom_object_validator(cls , value) : 
        if not isinstance(value, ObjectId): 
            raise ValueError('Invalid ObjectId')
        return value


    @validator('id')
    def validate_user_id(cls, value):
        return object_id_schema.custom_object_validator( cls , value ) 


    class Config:
        arbitrary_types_allowed = True  # Allow ObjectId type
<<<<<<< HEAD

=======
>>>>>>> 1314bf4b7bfe9ead5c0b3d5d4a4e90cddadb1d89
