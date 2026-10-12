# backend/app/providers/gemma_provider.py
import asyncio
from typing import Optional
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.core.config import Settings, get_settings
from app.core.exceptions import (
    AIModelNotFoundError,
    AIProviderError,
    AIUpstreamTimeoutError,
    ConfigurationError,
    MultimodalUnsupportedError,
)
from app.core.logging import get_logger
from app.interfaces.ai_provider import AIProvider

logger = get_logger(__name__)


class GemmaProvider(AIProvider):
    """
    Adapter Pattern: Encapsulates the Google Gen AI SDK behind the AIProvider contract.
    Explicitly targets the configured Gemma model (defaults to gemma-4-26b-a4b-it).
    """

    def __init__(self, settings: Optional[Settings] = None):
        self._settings = settings or get_settings()
        self._model_id = self._settings.GEMMA_MODEL
        self._client: Optional[genai.Client] = None
        # Multimodal capability for Gemma 4 via Gemini API is marked unverified/unsupported
        self._multimodal_supported = False

    def _get_client(self) -> genai.Client:
        """Lazily instantiates the Google Gen AI client with the configured API key."""
        if self._client is None:
            api_key = self._settings.GEMINI_API_KEY
            if not api_key or api_key.strip() in ("", "your_api_key_here", "your_gemini_api_key_here"):
                raise ConfigurationError(
                    "GEMINI_API_KEY is not configured or contains a placeholder. "
                    "Please set a valid key in your environment or backend/.env file."
                )
            self._client = genai.Client(api_key=api_key.strip())
        return self._client

    def get_model_id(self) -> str:
        return self._model_id

    def is_multimodal_supported(self) -> bool:
        """
        Gemma 4 model image ingestion through the Gemini API is unverified or returns
        upstream service errors; multimodal analysis is explicitly disabled to avoid false claims.
        """
        return self._multimodal_supported

    async def generate_text(self, prompt: str) -> str:
        """
        Sends text prompt to the configured Gemma model with bounded retries and timeouts.
        """
        client = self._get_client()
        timeout = self._settings.REQUEST_TIMEOUT_SECONDS
        max_retries = self._settings.MAX_RETRIES

        attempt = 0
        while attempt <= max_retries:
            try:
                logger.info("Calling Gemma model '%s' (attempt %d/%d)", self._model_id, attempt + 1, max_retries + 1)

                # Run synchronous SDK call in an executor with timeout
                loop = asyncio.get_running_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: client.models.generate_content(
                            model=self._model_id,
                            contents=prompt
                        )
                    ),
                    timeout=timeout
                )

                if not response or not response.text:
                    raise AIProviderError(f"Model '{self._model_id}' returned an empty response.")

                return response.text

            except asyncio.TimeoutError:
                logger.warning("Timeout while waiting for model '%s' after %s seconds", self._model_id, timeout)
                if attempt == max_retries:
                    raise AIUpstreamTimeoutError(f"Request to model '{self._model_id}' timed out after {timeout} seconds.")
                await asyncio.sleep(2 ** attempt)

            except genai_errors.ClientError as exc:
                # Client errors (400, 401, 403, 404) should NOT be retried
                err_str = str(exc)
                logger.error("Client error from model '%s': %s", self._model_id, err_str)

                if "404" in err_str or "NOT_FOUND" in err_str:
                    raise AIModelNotFoundError(f"Model '{self._model_id}' was not found or is inaccessible.")
                if "401" in err_str or "API_KEY_INVALID" in err_str or "API key not valid" in err_str:
                    raise ConfigurationError("Invalid GEMINI_API_KEY. Please verify your credentials.")
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    # Rate limit could be retried once if attempts remain
                    if attempt < max_retries:
                        await asyncio.sleep(2 ** attempt)
                        attempt += 1
                        continue
                    raise AIProviderError("Gemini API rate limit or quota exceeded. Please try again shortly.", status_code=429)

                raise AIProviderError(f"Gemma model request failed: {err_str}", status_code=400)

            except genai_errors.ServerError as exc:
                # Server errors (500, 503) can be retried if attempts remain
                logger.warning("Server error from model '%s' on attempt %d: %s", self._model_id, attempt + 1, exc)
                if attempt == max_retries:
                    raise AIProviderError(
                        f"Upstream server error encountered while calling model '{self._model_id}'. "
                        "The model service is temporarily unavailable.",
                        status_code=502
                    )
                await asyncio.sleep(2 ** attempt)

            except Exception as exc:
                if isinstance(exc, (AIProviderError, ConfigurationError)):
                    raise
                logger.error("Unexpected error calling model '%s': %s", self._model_id, exc)
                raise AIProviderError(f"Unexpected error communicating with Gemma model: {exc}")

            attempt += 1

        raise AIProviderError(f"Max retries exceeded while calling model '{self._model_id}'.")

    async def generate_multimodal(self, prompt: str, image_bytes: bytes, mime_type: str) -> str:
        """
        Multimodal generation handler.
        Verifies model compatibility before attempting execution.
        """
        if not self.is_multimodal_supported():
            raise MultimodalUnsupportedError(
                f"Model '{self._model_id}' does not currently support image inputs via the API. "
                "Please provide text notes or questions instead."
            )

        client = self._get_client()
        timeout = self._settings.REQUEST_TIMEOUT_SECONDS

        try:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            loop = asyncio.get_running_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=self._model_id,
                        contents=[image_part, prompt]
                    )
                ),
                timeout=timeout
            )
            if not response or not response.text:
                raise AIProviderError(f"Model '{self._model_id}' returned an empty multimodal response.")
            return response.text
        except Exception as exc:
            raise AIProviderError(f"Multimodal generation failed: {exc}")
