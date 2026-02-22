from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Required secrets / connection strings
    database_url: str
    SECRET_KEY: str

    # Non-sensitive defaults
    echo_sql: bool = False
    pool_size: int = 10
    max_overflow: int = 20
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER_ME: int = 30
    ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


settings = Settings()
