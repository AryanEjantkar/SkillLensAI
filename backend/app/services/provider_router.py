"""Provider router and lifecycle management."""

import logging
from typing import Dict, Optional

from backend.app.core.config import DEFAULT_PROVIDER, GEMMA_MODEL, GEMINI_MODEL, OLLAMA_MODEL
from backend.app.providers.base import BaseAIProvider, ProviderError, ProviderUnavailableError
from backend.app.providers.gemma_provider import GemmaProvider
from backend.app.providers.gemini_provider import GeminiProvider
from backend.app.providers.ollama_provider import OllamaProvider
from backend.app.schemas.lesson import ProviderStatusItem, ProvidersStatusResponse

logger = logging.getLogger(__name__)


class ProviderRouter:
    """Routes generation requests to configured educational AI providers."""

    def __init__(self) -> None:
        self._providers: Dict[str, BaseAIProvider] = {
            "gemma": GemmaProvider(),
            "gemini": GeminiProvider(),
            "ollama": OllamaProvider(),
        }

    def get_provider(self, name: Optional[str] = None) -> BaseAIProvider:
        """Resolve requested provider without silent substitution."""
        provider_key = (name or DEFAULT_PROVIDER or "gemma").lower().strip()
        if provider_key not in self._providers:
            raise ProviderError(
                f"Unknown AI provider '{provider_key}'. Supported providers are: {', '.join(self._providers.keys())}"
            )
        return self._providers[provider_key]

    def get_status(self) -> ProvidersStatusResponse:
        """Inspect and return the availability of all providers."""
        status_map: Dict[str, ProviderStatusItem] = {}

        for key, prov in self._providers.items():
            avail = prov.is_available()
            if key == "gemma":
                details = "Official Google GenAI Gemma model for lesson planning and curriculum"
                local_only = False
            elif key == "gemini":
                details = "Google Gemini model for complex multimodal and visual analysis"
                local_only = False
            else:
                details = f"Local offline Ollama instance at {getattr(prov, '_base_url', 'localhost')}"
                local_only = True

            status_map[key] = ProviderStatusItem(
                available=avail,
                model=prov.model_name,
                details=details,
                local_only=local_only,
            )

        return ProvidersStatusResponse(
            default_provider=DEFAULT_PROVIDER,
            providers=status_map,
        )


router = ProviderRouter()
