import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Automatically load environment variables from .env file if present
load_dotenv()


class Settings(BaseModel):
    app_env: str = Field(
        default_factory=lambda: os.getenv("APP_ENV", "development")
    )
    groq_api_key: str = Field(
        default_factory=lambda: os.getenv("GROQ_API_KEY", "")
    )
    whisper_model: str = Field(
        default_factory=lambda: os.getenv("WHISPER_MODEL", "whisper-large-v3")
    )
    llm_model: str = Field(
        default_factory=lambda: os.getenv(
            "LLM_MODEL", "llama-3.3-70b-versatile"
        )
    )


settings = Settings()
