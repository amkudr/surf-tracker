from sqladmin import Admin

from app.admin.auth import AdminAuth
from app.admin.views import (
    ForecastAdmin,
    SpotAdmin,
    SurfForecastAdmin,
    SurfSessionAdmin,
    SurfSessionReviewAdmin,
    SurfboardAdmin,
    TideAdmin,
    UserAdmin,
)
from app.core.config import settings
from app.database import async_engine


def init_admin(app):
    """Initialize SQLAdmin and register all model views."""
    admin = Admin(
        app,
        engine=async_engine,
        authentication_backend=AdminAuth(secret_key=settings.SECRET_KEY),
    )

    admin.add_view(UserAdmin)
    admin.add_view(SpotAdmin)
    admin.add_view(SurfboardAdmin)
    admin.add_view(SurfSessionAdmin)
    admin.add_view(SurfSessionReviewAdmin)
    admin.add_view(ForecastAdmin)
    admin.add_view(SurfForecastAdmin)
    admin.add_view(TideAdmin)
    return admin
