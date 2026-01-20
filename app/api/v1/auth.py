from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Path
from app.database import AsyncSession, db_dependency
from app.schemas.user import UserCreate, UserResponse, TokenResponse
from app.services.user_service import create_user, get_user_by_email, get_user
from app.core.security import create_access_token
from app.core.security import verify_password
from app.models import User
from app.core.security import verify_token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm


router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def register_user_endpoint(db: db_dependency, user_create: UserCreate) -> UserResponse:
    user = await create_user(db, user_create)
    return user

@router.post("/login", status_code=status.HTTP_200_OK, response_model=TokenResponse)
async def login_user_endpoint(db: db_dependency, form_data: Annotated[OAuth2PasswordRequestForm, Depends()] ) -> TokenResponse:
    user = await get_user_by_email(db,form_data.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, token_type="Bearer")

async def get_current_user(
    db: db_dependency,
    token: str = Depends(oauth2_scheme)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_token(token)  
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Ensure user_id is an integer (JWT might return it as string)
    user_id = int(user_id) if isinstance(user_id, str) else user_id
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

@router.get("/me", status_code=status.HTTP_200_OK, response_model=UserResponse)
async def get_current_user_endpoint(current_user: CurrentUser) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at
    )