from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from pydantic import ( BaseModel, Field, EmailStr , validator )

class User(BaseModel):
    def __init__(self,  **data) -> None:
        super().__init__(**data)
        self.username = self.email

        
    id: Optional[str] 
    full_name: str = Field(...)
    username: Optional[str]
    email: EmailStr = Field(...)
    password: str
    profilePic: Optional[str]
    google_access_token: Optional[str]
    google_refresh_token: Optional[str]
    createdAt: datetime = Field(default=datetime.now())
    updatedAt: datetime = Field(default=datetime.now())
    


class Files(BaseModel):
    def __init__(self,  **data) -> None:
        super().__init__(**data)
        
    file_name : str    
    user_id: ObjectId
    file_url: str = Field(...)    
    file_server_path : str = Field(...)
    folder_id : Optional[ObjectId]
    createdAt: datetime = Field(default=datetime.now())
    updatedAt: datetime = Field(default=datetime.now())
    


    def custom_object_validator(cls , value) : 
        if not isinstance(value, ObjectId):
            raise ValueError('Invalid ObjectId')
        return value


    @validator('user_id') 
    def validate_user_id(cls, value):
        return Files.custom_object_validator( cls , value )


    @validator('folder_id')
    def validate_folder_id(cls, value):
        return Files.custom_object_validator( cls ,  value )

    class Config:
        arbitrary_types_allowed = True  # Allow ObjectId type



class Folders(BaseModel):
    def __init__(self,  **data) -> None:
        super().__init__(**data)
        
    folder_name : str    
    user_id: ObjectId
    createdAt: datetime = Field(default=datetime.now())
    updatedAt: datetime = Field(default=datetime.now())
    
    @validator('user_id')
    def validate_object_id(cls, value):
        if not isinstance(value, ObjectId):
            raise ValueError('Invalid ObjectId')
        return value

    class Config:
        arbitrary_types_allowed = True  # Allow ObjectId type

class Tasks(BaseModel):
    text: str
    user_id: ObjectId
    is_done: Optional[bool] = False 
    order: int     
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)

    @validator('user_id')  
    def validate_object_id(cls, value):
        if not isinstance(value, ObjectId):
            raise ValueError('Invalid ObjectId')
        return value
    

    class Config: 
        arbitrary_types_allowed = True

class Notes(BaseModel):
    text: str
    user_id: ObjectId
    x_position: float
    y_position: float
    z_position: float
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)

    @validator('user_id')  
    def validate_object_id(cls, value):
        if not isinstance(value, ObjectId):
            raise ValueError('Invalid ObjectId')
        return value  

    class Config:
        arbitrary_types_allowed = True 


