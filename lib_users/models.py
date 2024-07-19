from pydantic import (
    ConfigDict,
    BaseModel,
    Field,
    EmailStr,
    validator
)
from datetime import datetime
from typing import Optional, List
import re
from lib_users.hash_utils import hash_password
from bson import ObjectId


class User(BaseModel):
    def __init__(self, **data) -> None:
        super().__init__(**data)
        self.password = hash_password(self.password)
        # index and unique property of username
        self.username = self.email
        self.id = str(ObjectId())
    id: str = Field(default_factory=ObjectId, alias="_id")
    name: Optional[str]
    full_name: str = Field(...)
    username: Optional[str]
    ip: Optional[str]
    email: EmailStr = Field(...)
    password: str
    phone: Optional[str]
    profilePic: Optional[str]
    followers: Optional[List[str]]
    following: Optional[List[str]]
    bio: Optional[str]
    isFrozen: bool = Field(default=False)
    lat: Optional[str]
    long: Optional[str]
    google_access_token: Optional[str]
    google_refresh_token: Optional[str]
    access_roles: Optional[List[str]] = Field(default=["user"])
    isSuperAdmin: bool = Field(default=False)
    createdAt: datetime = Field(default=datetime.now())
    updatedAt: datetime = Field(default=datetime.now())
    
    @validator("phone")
    def phone_validation(cls, v):
        # phone = v.phone.get("phone") #  <-- This line needs to be removed.
        regex = r"^(\+)[1-9][0-9\-\(\)\.]{9,15}$"
        if v and not re.search(regex, v, re.I):
            raise ValueError("Phone Number Invalid.")
        return v
