# backend/app/dependencies.py
"""
FastAPI Dependency Injection definitions.
Adheres to Dependency Inversion and allows easy override in tests.
"""
from fastapi import Depends

from app.core.config import Settings, get_settings
from app.interfaces.ai_provider import AIProvider
from app.providers.gemma_provider import GemmaProvider
from app.services.learning_service import LearningService


def get_app_settings() -> Settings:
    """Dependency: returns centralized application settings."""
    return get_settings()


def get_ai_provider(settings: Settings = Depends(get_app_settings)) -> AIProvider:
    """Dependency: instantiates and returns the configured AI provider."""
    return GemmaProvider(settings=settings)


def get_learning_service(
    ai_provider: AIProvider = Depends(get_ai_provider),
    settings: Settings = Depends(get_app_settings)
) -> LearningService:
    """Dependency: injects the AIProvider into the LearningService."""
    return LearningService(ai_provider=ai_provider, settings=settings)
