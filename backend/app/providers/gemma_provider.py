"""Gemma provider implementation using Google GenAI SDK."""

import logging
from typing import Any, Dict, Optional
from google import genai
from google.genai import types

from backend.app.core.config import GEMINI_API_KEY, GEMMA_MODEL
from backend.app.core.json_utils import extract_json_from_text
from backend.app.providers.base import BaseAIProvider, ProviderError, ProviderUnavailableError

logger = logging.getLogger(__name__)


class GemmaProvider(BaseAIProvider):
    """Primary educational lesson planner powered by Gemma."""

    def __init__(self, client: Optional[genai.Client] = None, model_name: Optional[str] = None) -> None:
        self._client = client
        self._model_name = model_name or GEMMA_MODEL

    @property
    def provider_name(self) -> str:
        return "gemma"

    @property
    def model_name(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        return bool(GEMINI_API_KEY)

    def _get_client(self) -> genai.Client:
        if self._client is not None:
            return self._client
        if not GEMINI_API_KEY:
            raise ProviderUnavailableError("Gemma provider unavailable: GEMINI_API_KEY is not configured")
        self._client = genai.Client(api_key=GEMINI_API_KEY)
        return self._client

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        image_data: Optional[bytes] = None,
        image_mime_type: Optional[str] = None,
    ) -> str:
        client = self._get_client()
        logger.info("Executing generation using provider=gemma model=%s", self._model_name)

        config = None
        if system_instruction:
            config = types.GenerateContentConfig(system_instruction=system_instruction)

        if image_data is not None:
            if image_mime_type != "image/png":
                raise ProviderError("Gemma accepts PNG images only.")
            contents = [
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(data=image_data, mime_type=image_mime_type),
            ]
        else:
            contents = prompt

        models_to_try = [self._model_name]
        for fallback in ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.0-flash", "gemma-4-31b-it"]:
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
                logger.warning("Model %s failed: %s. Trying next candidate model...", model, error)
                last_error = error
                continue

        logger.error("All candidate models failed for provider=gemma")
        raise ProviderError(f"Gemma models failed: {last_error}") from last_error

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
