# backend/app/api/routes/learning.py
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.dependencies import get_learning_service
from app.schemas.learning import (
    AnalysisResponse,
    FlashcardsResponse,
    QuizResponse,
    TextGenerationRequest,
)
from app.services.learning_service import LearningService

router = APIRouter(tags=["Learning"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_content(
    text: Optional[str] = Form(default=None, description="Educational text, questions, or notes"),
    image: Optional[UploadFile] = File(default=None, description="Optional diagram, screenshot, or handwritten notes"),
    service: LearningService = Depends(get_learning_service)
) -> AnalysisResponse:
    """
    Analyzes notes, questions, or educational diagrams to generate a complete learning package:
    summary, explanation, flashcards, and multiple-choice quizzes.
    """
    image_bytes: Optional[bytes] = None
    filename: str = "upload"

    if image is not None:
        image_bytes = await image.read()
        filename = image.filename or "upload"

    return await service.analyze_content(
        text=text,
        image_bytes=image_bytes,
        image_filename=filename
    )


@router.post("/generate/flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(
    payload: TextGenerationRequest,
    service: LearningService = Depends(get_learning_service)
) -> FlashcardsResponse:
    """
    Extracts high-yield flashcards from the provided educational text.
    """
    return await service.generate_flashcards(text=payload.text)


@router.post("/generate/quiz", response_model=QuizResponse)
async def generate_quiz(
    payload: TextGenerationRequest,
    service: LearningService = Depends(get_learning_service)
) -> QuizResponse:
    """
    Generates conceptual multiple-choice quiz questions with verified answer indices.
    """
    return await service.generate_quiz(text=payload.text)
