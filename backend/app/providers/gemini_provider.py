"""Gemini provider implementation for advanced multimodal tasks."""

import logging
import os
from typing import Any, Dict, Optional
from google import genai
from google.genai import types

from backend.app.core.config import GEMINI_API_KEY, GEMINI_MODEL
from backend.app.core.json_utils import extract_json_from_text
from backend.app.providers.base import BaseAIProvider, ProviderError, ProviderUnavailableError

logger = logging.getLogger(__name__)


class GeminiProvider(BaseAIProvider):
    """Optional cloud provider for multimodal and complex queries."""

    def __init__(self, client: Optional[genai.Client] = None, model_name: Optional[str] = None) -> None:
        self._client = client
        self._model_name = model_name or GEMINI_MODEL

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        return bool(os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY)

    def _get_client(self) -> genai.Client:
        if self._client is not None:
            return self._client
        api_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
        if not api_key:
            raise ProviderUnavailableError("Gemini provider unavailable: GEMINI_API_KEY is not configured")
        self._client = genai.Client(api_key=api_key)
        return self._client

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        image_data: Optional[bytes] = None,
        image_mime_type: Optional[str] = None,
    ) -> str:
        client = self._get_client()
        logger.info("Executing generation using provider=gemini model=%s", self._model_name)

        config = None
        if system_instruction:
            config = types.GenerateContentConfig(system_instruction=system_instruction)

        if image_data is not None:
            mime = image_mime_type or "image/png"
            contents = [
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(data=image_data, mime_type=mime),
            ]
        else:
            contents = prompt

        models_to_try = [self._model_name]
        for fallback in ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"]:
            if fallback not in models_to_try:
                models_to_try.append(fallback)

        last_error = None
        for model in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
                text = getattr(response, "text", "") or ""
                if text.strip():
                    return text.strip()
            except ProviderError:
                raise
            except Exception as error:
                logger.warning("Gemini model %s failed: %s. Trying next candidate model...", model, error)
                last_error = error
                continue

        logger.error("All candidate models failed for provider=gemini")
        raise ProviderError(f"Gemini models failed: {last_error}") from last_error

    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        full_system = (
            (system_instruction or "")
            + "\n\nCRITICAL: Respond ONLY with a valid JSON object matching the requested schema. "
            "Do not output markdown explanations or preamble outside the JSON."
        ).strip()

        raw_output = self.generate(prompt=prompt, system_instruction=full_system)
        return extract_json_from_text(raw_output)
