"""Endpoints for Adaptive AI Tutor and dynamic practice generation."""

from fastapi import APIRouter
from backend.app.schemas.lesson import (
    PracticeRequest,
    PracticeResponse,
    TutorChatRequest,
    TutorChatResponse,
    MoreFlashcardsRequest,
    MoreFlashcardsResponse,
)
from backend.app.services.adaptive_tutor import adaptive_tutor

router = APIRouter(prefix="/tutor", tags=["Tutor"])


@router.post("/chat", response_model=TutorChatResponse)
def tutor_chat(request: TutorChatRequest) -> TutorChatResponse:
    """Conversational adaptive tutor with Socratic hints and misconception diagnosis."""
    return adaptive_tutor.chat(
        topic=request.topic,
        user_message=request.user_message,
        difficulty=request.difficulty,
        lesson_summary=request.lesson_summary,
        history=request.history,
        provider_name=request.provider,
    )


@router.post("/practice", response_model=PracticeResponse)
def tutor_practice(request: PracticeRequest) -> PracticeResponse:
    """Generate dynamic diagnostic practice questions."""
    return adaptive_tutor.generate_practice(
        topic=request.topic,
        difficulty=request.difficulty,
        current_focus=request.current_focus,
        provider_name=request.provider,
    )


@router.post("/flashcards", response_model=MoreFlashcardsResponse)
def tutor_flashcards(request: MoreFlashcardsRequest) -> MoreFlashcardsResponse:
    """Generate additional focused study flashcards on demand."""
    return adaptive_tutor.generate_more_flashcards(
        topic=request.topic,
        difficulty=request.difficulty,
        count=request.count,
        provider_name=request.provider,
    )

