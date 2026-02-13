from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/surf_tracker"
    echo_sql: bool = True
    pool_size: int = 10
    max_overflow: int = 20
    SECRET_KEY: str = "9fa910239345e23c53d4cf3afcd9500095b68d49ced8a930236b3ad21a83e204"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER_ME: int = 30
    ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )


settings = Settings()
