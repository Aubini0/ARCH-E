from bson import ObjectId
from datetime import datetime , time
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
    folder_id : Optional[ObjectId]
    file_server_path : str = Field(...)
    rotation : Optional[float]
    position_x : Optional[float]
    position_y : Optional[float]
    position_z : Optional[float]
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
    position_x : Optional[float]
    position_y : Optional[float]
    position_z : Optional[float]
    createdAt: datetime = Field(default=datetime.now())
    updatedAt: datetime = Field(default=datetime.now())
    
    @validator('user_id')
    def validate_object_id(cls, value):
        if not isinstance(value, ObjectId):
            raise ValueError('Invalid ObjectId')
        return value

    class Config:
        arbitrary_types_allowed = True  # Allow ObjectId type



class TimeRange(BaseModel):
    start: str
    end: str 

    @validator('start', 'end')
    def validate_time_format(cls, value):
        try:
            # Validate if the string can be parsed as a valid time
            time.fromisoformat(value)
        except ValueError:
            raise ValueError(f"Invalid time format: {value}. Expected format is 'HH:MM:SS'.")
        return value

    @validator('end')
    def validate_time_range(cls, end, values):
        start = values.get('start')
        if start and time.fromisoformat(end) <= time.fromisoformat(start):
            raise ValueError('End time must be after start time')
        return end


class Tasks(BaseModel):
    text: str
    user_id: ObjectId
    is_done: Optional[bool] = False 
    order: int     
    deadline_time: Optional[TimeRange]
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


