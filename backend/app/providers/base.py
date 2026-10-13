"""Base interface for educational AI providers."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class ProviderError(Exception):
    """Base exception for AI provider errors."""
    pass


class ProviderUnavailableError(ProviderError):
    """Raised when an AI provider is not configured or offline."""
    pass


class BaseAIProvider(ABC):
    """Abstract interface for AI model providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (gemma, gemini, ollama)."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Configured model identifier."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check whether the provider is currently configured and accessible."""
        pass

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        image_data: Optional[bytes] = None,
        image_mime_type: Optional[str] = None,
    ) -> str:
        """Generate text from prompt."""
        pass

    @abstractmethod
    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON response from prompt."""
        pass
