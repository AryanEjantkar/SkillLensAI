# backend/tests/test_learning_service.py
import json
import pytest

from app.core.exceptions import (
    ContentValidationError,
    MultimodalUnsupportedError,
)
from app.services.learning_service import LearningService
from tests.conftest import MockAIProvider


@pytest.mark.asyncio
async def test_analyze_content_text_only(learning_service: LearningService):
    result = await learning_service.analyze_content(text="Explain binary search trees.")
    assert result.title == "Introduction to Neural Networks"
    assert len(result.flashcards) > 0
    assert len(result.quiz) > 0


@pytest.mark.asyncio
async def test_analyze_content_missing_both_text_and_image(learning_service: LearningService):
    with pytest.raises(ContentValidationError) as exc_info:
        await learning_service.analyze_content(text="", image_bytes=None)
    assert "At least one content source" in str(exc_info.value)


@pytest.mark.asyncio
async def test_analyze_content_text_exceeds_max_length(learning_service: LearningService):
    long_text = "A" * 6000  # test_settings max is 5000
    with pytest.raises(ContentValidationError) as exc_info:
        await learning_service.analyze_content(text=long_text)
    assert "exceeds maximum length" in str(exc_info.value)


@pytest.mark.asyncio
async def test_analyze_content_image_unsupported_model(
    learning_service: LearningService,
    sample_valid_jpeg: bytes
):
    # Default mock provider has multimodal_supported=False
    with pytest.raises(MultimodalUnsupportedError) as exc_info:
        await learning_service.analyze_content(text="Notes", image_bytes=sample_valid_jpeg)
    assert "does not currently support image inputs" in str(exc_info.value)


@pytest.mark.asyncio
async def test_analyze_content_malformed_image(learning_service: LearningService):
    corrupt_bytes = b"NOT_A_VALID_IMAGE_HEADER_DATA"
    with pytest.raises(ContentValidationError) as exc_info:
        await learning_service.analyze_content(text="Notes", image_bytes=corrupt_bytes)
    assert "not a valid or readable image" in str(exc_info.value)


@pytest.mark.asyncio
async def test_analyze_content_oversized_image(learning_service: LearningService):
    # test_settings max upload size is 1 MB
    huge_bytes = b"0" * (2 * 1024 * 1024)
    with pytest.raises(ContentValidationError) as exc_info:
        learning_service.validate_image_data(huge_bytes)
    assert "exceeds maximum allowed size" in str(exc_info.value)


@pytest.mark.asyncio
async def test_generate_flashcards_success(
    learning_service: LearningService,
    mock_ai_provider: MockAIProvider
):
    mock_ai_provider.set_text_response(json.dumps({
        "flashcards": [
            {"question": "What is Python?", "answer": "A high-level programming language."}
        ]
    }))
    result = await learning_service.generate_flashcards("Python programming overview")
    assert len(result.flashcards) == 1
    assert result.flashcards[0].question == "What is Python?"


@pytest.mark.asyncio
async def test_generate_quiz_success(
    learning_service: LearningService,
    mock_ai_provider: MockAIProvider
):
    mock_ai_provider.set_text_response(json.dumps({
        "quiz": [
            {
                "question": "What is 2 + 2?",
                "options": ["3", "4", "5", "6"],
                "correct_answer": 1,
                "explanation": "Basic arithmetic."
            }
        ]
    }))
    result = await learning_service.generate_quiz("Arithmetic basics")
    assert len(result.quiz) == 1
    assert result.quiz[0].correct_answer == 1
