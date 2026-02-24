from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Required secrets / connection strings
    database_url: str
    SECRET_KEY: str

    @field_validator("database_url", mode="before")
    @classmethod
    def ensure_async_driver(cls, v: str) -> str:
        """Railway gives postgresql://… but SQLAlchemy async needs asyncpg."""
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Non-sensitive defaults
    echo_sql: bool = False
    pool_size: int = 10
    max_overflow: int = 20
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER_ME: int = 30
    ALGORITHM: str = "HS256"
    CORS_ALLOWED_ORIGINS: list[str]
    SESSION_COOKIE_SECURE: bool = False
    SECURITY_ENABLE_HSTS: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


settings = Settings()
