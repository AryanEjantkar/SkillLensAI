"""Local offline Ollama inference provider."""

import logging
from typing import Any, Dict, Optional
import httpx

from backend.app.core.config import OLLAMA_BASE_URL, OLLAMA_MODEL, TIMEOUT_SECONDS
from backend.app.core.json_utils import extract_json_from_text
from backend.app.providers.base import BaseAIProvider, ProviderError, ProviderUnavailableError

logger = logging.getLogger(__name__)


class OllamaProvider(BaseAIProvider):
    """Local offline inference provider for complete privacy and offline usage."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: float = TIMEOUT_SECONDS,
    ) -> None:
        self._base_url = (base_url or OLLAMA_BASE_URL).rstrip("/")
        self._model_name = model_name or OLLAMA_MODEL
        self._timeout = timeout

    @property
    def provider_name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        """Check if local Ollama daemon is reachable and responding."""
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(f"{self._base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        image_data: Optional[bytes] = None,
        image_mime_type: Optional[str] = None,
    ) -> str:
        logger.info("Executing local generation using provider=ollama model=%s url=%s", self._model_name, self._base_url)

        payload: Dict[str, Any] = {
            "model": self._model_name,
            "prompt": prompt,
            "stream": False,
        }
        if system_instruction:
            payload["system"] = system_instruction

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(f"{self._base_url}/api/generate", json=payload)
                if response.status_code != 200:
                    raise ProviderError(f"Ollama returned status {response.status_code}: {response.text}")
                data = response.json()
                text = data.get("response", "")
                if not text.strip():
                    raise ProviderError("Ollama returned an empty response.")
                return text.strip()
        except (httpx.ConnectError, httpx.ConnectTimeout) as error:
            logger.error("Local Ollama server is offline or unreachable at %s", self._base_url)
            raise ProviderUnavailableError(
                f"Local Ollama server is unreachable at {self._base_url}. Start Ollama locally with 'ollama serve' or select a cloud provider."
            ) from error
        except httpx.TimeoutException as error:
            logger.error("Local Ollama inference timed out after %s seconds", self._timeout)
            raise ProviderError(f"Local Ollama inference timed out after {self._timeout}s.") from error
        except ProviderError:
            raise
        except Exception as error:
            logger.error("Local Ollama request error: %s", error)
            raise ProviderError(f"Ollama local error: {error}") from error

    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        logger.info("Executing local JSON generation using provider=ollama model=%s", self._model_name)

        payload: Dict[str, Any] = {
            "model": self._model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }
        if system_instruction:
            payload["system"] = system_instruction

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(f"{self._base_url}/api/generate", json=payload)
                if response.status_code != 200:
                    raise ProviderError(f"Ollama returned status {response.status_code}: {response.text}")
                data = response.json()
                text = data.get("response", "")
                return extract_json_from_text(text)
        except (httpx.ConnectError, httpx.ConnectTimeout) as error:
            raise ProviderUnavailableError(
                f"Local Ollama server is unreachable at {self._base_url}. Start Ollama with 'ollama serve' or select cloud provider."
            ) from error
        except Exception as error:
            raise ProviderError(f"Ollama JSON generation failed: {error}") from error

