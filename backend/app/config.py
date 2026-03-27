from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # MongoDB
    mongodb_url: str = "mongodb://root:12345@localhost:27017/"
    mongodb_db_name: str = "scribedesk"

    # JWT
    jwt_secret: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 2880  # 2 days
    jwt_refresh_token_expire_days: int = 30

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-5.4"           # smart — final analysis, prescriptions, chat
    openai_model_fast: str = "gpt-5.4-mini" # fast — partial/inline analysis during recording
    openai_base_url: str = "https://api.openai.com/v1"

    # Deepgram
    deepgram_api_key: str = ""

    # MinIO / S3
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "scribedesk-files"
    minio_secure: bool = False

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
