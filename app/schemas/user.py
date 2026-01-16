from datetime import datetime
from pydantic import BaseModel


class User(BaseModel):
    id: int
    email: str
    password: str
    created_at: datetime

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str