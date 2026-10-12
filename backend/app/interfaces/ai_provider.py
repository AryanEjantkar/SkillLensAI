# backend/app/interfaces/ai_provider.py
from abc import ABC, abstractmethod


class TextGenerationProvider(ABC):
    """Interface Segregation: Focused contract for pure text generation."""
    @abstractmethod
    async def generate_text(self, prompt: str) -> str:
        """Sends a text prompt to the AI model and returns the raw string response."""
        pass


class MultimodalGenerationProvider(ABC):
    """Interface Segregation: Focused contract for multimodal image-and-text generation."""
    @abstractmethod
    async def generate_multimodal(self, prompt: str, image_bytes: bytes, mime_type: str) -> str:
        """Sends a text prompt and an image to the AI model and returns the raw string response."""
        pass

    @abstractmethod
    def is_multimodal_supported(self) -> bool:
        """Indicates whether this provider actively verifies and supports multimodal inputs."""
        pass


class AIProvider(TextGenerationProvider, MultimodalGenerationProvider, ABC):
    """
    Combined AI Provider contract honoring the Dependency Inversion Principle.
    Application services depend upon this contract, never directly upon the Google Gen AI SDK.
    """
    @abstractmethod
    def get_model_id(self) -> str:
        """Returns the configured model identifier."""
        pass
