from sqlalchemy import select
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from app.core.security import verify_password
from app.database import async_session
from app.models import User


class AdminAuth(AuthenticationBackend):
    """Cookie-based authentication for SQLAdmin."""

    def __init__(self, secret_key: str):
        super().__init__(secret_key=secret_key)

    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")

        if not email or not password:
            return False

        async with async_session() as session:
            result = await session.execute(
                select(User).where(User.email == email, User.is_admin.is_(True))
            )
            user = result.scalar_one_or_none()

        if user is None:
            return False

        if not verify_password(password, user.hashed_password):
            return False

        request.session.update({"admin_user_id": str(user.id)})
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        # Allow access to the login page itself
        path = request.url.path
        if path.endswith("/login") or path.endswith("/logout") or path.startswith("/admin/static"):
            return True

        admin_user_id = request.session.get("admin_user_id")
        return admin_user_id is not None
