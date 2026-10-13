"""Endpoints for Universal Lesson Generation."""

import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.app.core.config import MAX_PROMPT_CHARS, MAX_UPLOAD_BYTES
from backend.app.schemas.lesson import DifficultyLevel, LessonGenerateRequest, LessonPlan
from backend.app.services.document_extractor import (
    PNG_SIGNATURE,
    extract_document_text,
    fetch_link_text,
)
from backend.app.services.lesson_generator import lesson_generator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/lesson", tags=["Lessons"])


class LessonLinkRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)
    topic: str = Field(default="", max_length=MAX_PROMPT_CHARS)
    difficulty: DifficultyLevel = Field(default="intermediate")
    provider: Optional[str] = Field(default="gemma")


async def _read_upload_bytes(file: UploadFile) -> bytes:
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Uploads are limited to 10 MB.")
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    return data


@router.post("/generate", response_model=LessonPlan)
def generate_lesson(request: LessonGenerateRequest) -> LessonPlan:
    """Generate universal interactive lesson plan from text input."""
    return lesson_generator.generate_lesson(
        topic=request.topic,
        difficulty=request.difficulty,
        provider_name=request.provider,
        context_text=request.context_text,
        source_type=request.source_type,
    )


@router.post("/generate/upload", response_model=LessonPlan)
async def generate_lesson_from_upload(
    file: UploadFile = File(...),
    topic: str = Form(default="", max_length=MAX_PROMPT_CHARS),
    difficulty: DifficultyLevel = Form(default="intermediate"),
    provider: str = Form(default="gemma"),
) -> LessonPlan:
    """Generate universal interactive lesson plan from uploaded note/document/image."""
    filename = Path(file.filename or "upload").name
    ext = Path(filename).suffix.lower()

    data = await _read_upload_bytes(file)

    if ext == ".png":
        if not data.startswith(PNG_SIGNATURE):
            raise HTTPException(status_code=400, detail="The uploaded file is not a valid PNG image.")
        derived_topic = topic.strip() or f"Visual Analysis of {filename}"
        return lesson_generator.generate_lesson(
            topic=derived_topic,
            difficulty=difficulty,
            provider_name=provider,
            context_text=f"Image upload: {filename}",
            source_type="image",
        )
    elif ext in {".pdf", ".docx", ".txt"}:
        extracted_text = extract_document_text(filename, data)
        derived_topic = topic.strip() or Path(filename).stem.replace("_", " ").title()
        return lesson_generator.generate_lesson(
            topic=derived_topic,
            difficulty=difficulty,
            provider_name=provider,
            context_text=extracted_text,
            source_type="document",
        )
    else:
        raise HTTPException(
            status_code=415,
            detail="Unsupported format. Upload a PNG image, PDF, DOCX, or TXT file.",
        )


@router.post("/generate/link", response_model=LessonPlan)
def generate_lesson_from_link(request: LessonLinkRequest) -> LessonPlan:
    """Generate universal interactive lesson plan from web article/reference."""
    page_text = fetch_link_text(request.url)
    derived_topic = request.topic.strip() or "Web Resource Study"
    return lesson_generator.generate_lesson(
        topic=derived_topic,
        difficulty=request.difficulty,
        provider_name=request.provider,
        context_text=page_text,
        source_type="link",
    )
