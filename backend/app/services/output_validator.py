# backend/app/services/output_validator.py
"""
Output Validator Service.
Single Responsibility: Extracts and validates untrusted raw AI model output against Pydantic schemas.
"""
import json
import re
from typing import Any, Dict

from pydantic import ValidationError

from app.core.exceptions import InvalidModelOutputError
from app.core.logging import get_logger
from app.schemas.learning import AnalysisResponse, FlashcardsResponse, QuizResponse

logger = get_logger(__name__)


class OutputValidator:
    """Parses and validates untrusted model responses against target domain schemas."""

    @staticmethod
    def extract_json(raw_text: str) -> Dict[str, Any]:
        """
        Extracts JSON from raw model text.
        Handles markdown code blocks (```json ... ```) and leading/trailing chatter.
        """
        if not raw_text or not raw_text.strip():
            raise InvalidModelOutputError("Model returned an empty response string.")

        text = raw_text.strip()

        # 1. Check for fenced code block: ```json ... ``` or ``` ... ```
        code_block_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
        if code_block_match:
            candidate = code_block_match.group(1).strip()
            try:
                return json.loads(candidate)
            except json.JSONDecodeError as exc:
                logger.debug("Failed parsing fenced block JSON: %s", exc)

        # 2. Try parsing entire string directly
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 3. Find outermost matching braces { ... }
        brace_start = text.find("{")
        brace_end = text.rfind("}")
        if brace_start != -1 and brace_end > brace_start:
            candidate = text[brace_start:brace_end + 1].strip()
            try:
                return json.loads(candidate)
            except json.JSONDecodeError as exc:
                logger.error("JSON decode error on isolated substring: %s", exc)

        raise InvalidModelOutputError(
            "Model response did not contain valid JSON format.",
            details={"raw_sample": text[:300]}
        )

    @classmethod
    def validate_analysis(cls, raw_text: str) -> AnalysisResponse:
        """Parses and validates a full AnalysisResponse."""
        data = cls.extract_json(raw_text)
        try:
            return AnalysisResponse.model_validate(data)
        except ValidationError as exc:
            logger.error("Schema validation failed for AnalysisResponse: %s", exc)
            raise InvalidModelOutputError(
                f"Model response did not match expected learning analysis schema: {exc.errors()}",
                details={"errors": exc.errors()}
            )

    @classmethod
    def validate_flashcards(cls, raw_text: str) -> FlashcardsResponse:
        """Parses and validates a FlashcardsResponse."""
        data = cls.extract_json(raw_text)
        # Support both {"flashcards": [...]} and top-level array [...]
        if isinstance(data, list):
            data = {"flashcards": data}
        try:
            return FlashcardsResponse.model_validate(data)
        except ValidationError as exc:
            raise InvalidModelOutputError(
                f"Model response did not match flashcards schema: {exc.errors()}",
                details={"errors": exc.errors()}
            )

    @classmethod
    def validate_quiz(cls, raw_text: str) -> QuizResponse:
        """Parses and validates a QuizResponse."""
        data = cls.extract_json(raw_text)
        # Support both {"quiz": [...]} and top-level array [...]
        if isinstance(data, list):
            data = {"quiz": data}
        try:
            return QuizResponse.model_validate(data)
        except ValidationError as exc:
            raise InvalidModelOutputError(
                f"Model response did not match quiz schema: {exc.errors()}",
                details={"errors": exc.errors()}
            )
