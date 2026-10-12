# backend/app/services/learning_service.py
"""
Learning Service Layer.
Single Responsibility: Coordinates input validation, prompt preparation, AI provider invocation,
and output validation for all educational material workflows.
"""
import io
from typing import Optional
from PIL import Image, UnidentifiedImageError

from app.core.config import Settings, get_settings
from app.core.exceptions import (
    ContentValidationError,
    MultimodalUnsupportedError,
)
from app.core.logging import get_logger
from app.interfaces.ai_provider import AIProvider
from app.schemas.learning import (
    AnalysisResponse,
    FlashcardsResponse,
    QuizResponse,
)
from app.services.output_validator import OutputValidator
from app.services.prompt_builder import PromptBuilder

logger = get_logger(__name__)

SUPPORTED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


class LearningService:
    """
    Business service layer orchestrating educational workflows.
    Depends on abstractions (AIProvider), not concrete SDK implementations (DIP).
    """

    def __init__(self, ai_provider: AIProvider, settings: Optional[Settings] = None):
        self._provider = ai_provider
        self._settings = settings or get_settings()
        self._prompt_builder = PromptBuilder()
        self._validator = OutputValidator()

    def validate_image_data(self, image_bytes: bytes, filename: str = "upload") -> str:
        """
        Validates image content using Pillow.
        Enforces size and actual format validation without trusting headers alone.
        Returns the verified MIME type.
        """
        max_bytes = self._settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(image_bytes) > max_bytes:
            raise ContentValidationError(
                f"Image size ({len(image_bytes) / (1024 * 1024):.2f} MB) exceeds maximum allowed size "
                f"of {self._settings.MAX_UPLOAD_SIZE_MB} MB."
            )

        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                img_format = img.format
                if not img_format or img_format.upper() not in SUPPORTED_IMAGE_FORMATS:
                    raise ContentValidationError(
                        f"Unsupported image format: '{img_format}'. Supported formats: {', '.join(sorted(SUPPORTED_IMAGE_FORMATS))}."
                    )
                # Verify that image is readable and not truncated/corrupt
                img.verify()

                mime_map = {
                    "JPEG": "image/jpeg",
                    "PNG": "image/png",
                    "WEBP": "image/webp",
                    "GIF": "image/gif"
                }
                return mime_map.get(img_format.upper(), "image/jpeg")

        except UnidentifiedImageError:
            raise ContentValidationError("Uploaded file is not a valid or readable image.")
        except ContentValidationError:
            raise
        except Exception as exc:
            raise ContentValidationError(f"Invalid image content: {exc}")

    async def analyze_content(
        self,
        text: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        image_filename: str = "upload"
    ) -> AnalysisResponse:
        """
        Main learning pipeline: analyzes text and/or educational image to produce full learning material.
        """
        clean_text = text.strip() if text else ""

        # Validate that at least one content source is provided
        if not clean_text and not image_bytes:
            raise ContentValidationError("At least one content source (text notes or educational image) must be provided.")

        # Check text length limits
        if clean_text and len(clean_text) > self._settings.MAX_TEXT_LENGTH:
            raise ContentValidationError(
                f"Input text exceeds maximum length of {self._settings.MAX_TEXT_LENGTH} characters."
            )

        # Handle image upload workflow
        if image_bytes:
            mime_type = self.validate_image_data(image_bytes, image_filename)

            # Gemma 4 multimodal check
            if not self._provider.is_multimodal_supported():
                raise MultimodalUnsupportedError(
                    f"Model '{self._provider.get_model_id()}' does not currently support image inputs via the API. "
                    "Please provide text notes or study questions instead."
                )

            prompt = self._prompt_builder.build_analysis_prompt(clean_text or "Educational Diagram Analysis")
            raw_output = await self._provider.generate_multimodal(prompt, image_bytes, mime_type)
        else:
            prompt = self._prompt_builder.build_analysis_prompt(clean_text)
            raw_output = await self._provider.generate_text(prompt)

        return self._validator.validate_analysis(raw_output)

    async def generate_flashcards(self, text: str) -> FlashcardsResponse:
        """Generates a collection of flashcards from the provided educational text."""
        clean_text = text.strip() if text else ""
        if not clean_text:
            raise ContentValidationError("Input text is required for flashcard generation.")
        if len(clean_text) > self._settings.MAX_TEXT_LENGTH:
            raise ContentValidationError(f"Input text exceeds maximum length of {self._settings.MAX_TEXT_LENGTH} characters.")

        prompt = self._prompt_builder.build_flashcards_prompt(clean_text)
        raw_output = await self._provider.generate_text(prompt)
        return self._validator.validate_flashcards(raw_output)

    async def generate_quiz(self, text: str) -> QuizResponse:
        """Generates multiple-choice quiz questions from the provided educational text."""
        clean_text = text.strip() if text else ""
        if not clean_text:
            raise ContentValidationError("Input text is required for quiz generation.")
        if len(clean_text) > self._settings.MAX_TEXT_LENGTH:
            raise ContentValidationError(f"Input text exceeds maximum length of {self._settings.MAX_TEXT_LENGTH} characters.")

        prompt = self._prompt_builder.build_quiz_prompt(clean_text)
        raw_output = await self._provider.generate_text(prompt)
        return self._validator.validate_quiz(raw_output)
