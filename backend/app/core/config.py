# backend/app/core/config.py
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized application configuration loaded from environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "SkillLens AI Backend"
    APP_ENV: str = Field(default="development", description="Application environment (development/production)")
    DEBUG: bool = Field(default=False, description="Enable debug mode")

    # API Configuration
    API_PREFIX: str = "/api"
    PORT: int = Field(default=3000, description="Server port")

    # CORS configuration
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )

    # Google Gemini & Gemma configuration
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API Key for accessing Gemma models"
    )
    GEMMA_MODEL: str = Field(
        default="gemma-4-26b-a4b-it",
        description="Target Gemma model identifier (defaults to gemma-4-26b-a4b-it)"
    )

    # Request & Payload limits
    MAX_UPLOAD_SIZE_MB: int = Field(default=5, description="Maximum image upload size in megabytes")
    MAX_TEXT_LENGTH: int = Field(default=20000, description="Maximum character length for input text")
    REQUEST_TIMEOUT_SECONDS: float = Field(default=90.0, description="Upstream AI request timeout in seconds")
    MAX_RETRIES: int = Field(default=2, description="Maximum retry count for transient AI provider errors")


# Global settings singleton
_settings: Settings | None = None


def get_settings() -> Settings:
    """Returns the cached application settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
