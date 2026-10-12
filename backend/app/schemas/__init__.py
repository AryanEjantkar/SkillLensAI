# backend/app/schemas/__init__.py
from app.schemas.common import HealthResponse
from app.schemas.errors import ErrorDetail, ErrorResponse
from app.schemas.learning import (
    AnalysisResponse,
    Flashcard,
    FlashcardsResponse,
    QuizQuestion,
    QuizResponse,
    TextGenerationRequest,
)

__all__ = [
    "HealthResponse",
    "ErrorDetail",
    "ErrorResponse",
    "AnalysisResponse",
    "Flashcard",
    "FlashcardsResponse",
    "QuizQuestion",
    "QuizResponse",
    "TextGenerationRequest",
]
