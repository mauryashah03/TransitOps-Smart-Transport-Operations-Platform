from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central application configuration.
    In production, override these via environment variables / .env file.
    """
    PROJECT_NAME: str = "TransitOps Pro"
    API_V1_PREFIX: str = "/api/v1"

    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_super_secret_key_transitops"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hour shift-length token

    DATABASE_URL: str = "sqlite:///./transitops.db"

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
