from fastapi import Form 
from datetime import time
from bson import ObjectId
from typing import Optional
from pydantic import ( BaseModel, EmailStr , validator )  
from typing import Optional


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
    position_x: Optional[float]
    position_y: Optional[float]
    position_z: Optional[float]


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



class time_range_schema(BaseModel):
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

class task_scehma(BaseModel):
    text: str
    is_done: Optional[bool] = False 
    order: int 
    deadline_time: time_range_schema


class update_task_schema(BaseModel):
    text: Optional[str]
    is_done: Optional[bool] = False 
    order: Optional[int] 
    deadline_time: Optional[time_range_schema]  


class task_rearrange_schema(BaseModel) : 
    task_order : dict