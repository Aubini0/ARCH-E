from pydantic import ( BaseModel, Field, EmailStr )
from datetime import datetime
from typing import Optional, List


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
    
