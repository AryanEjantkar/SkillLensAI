# backend/tests/conftest.py
import io
import json
from typing import Optional
from PIL import Image
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.dependencies import get_ai_provider, get_app_settings
from app.interfaces.ai_provider import AIProvider
from app.main import app
from app.services.learning_service import LearningService


class MockAIProvider(AIProvider):
    """
    Mock AI Provider implementation for isolated, reliable unit and integration testing.
    Requires no real API key and makes zero outbound network requests.
    """

    def __init__(
        self,
        text_response: Optional[str] = None,
        multimodal_response: Optional[str] = None,
        multimodal_supported: bool = False,
        should_raise: Optional[Exception] = None
    ):
        self._model_id = "gemma-4-26b-a4b-it-mock"
        self._multimodal_supported = multimodal_supported
        self._should_raise = should_raise

        # Default standard valid analysis JSON response
        self.default_analysis_json = json.dumps({
            "title": "Introduction to Neural Networks",
            "summary": "A concise summary of the submitted material.",
            "explanation": "A beginner-friendly explanation of the main concepts.",
            "flashcards": [
                {
                    "question": "What is a neuron?",
                    "answer": "A computational unit in a neural network."
                }
            ],
            "quiz": [
                {
                    "question": "What does an activation function do?",
                    "options": [
                        "Introduces non-linearity",
                        "Stores images",
                        "Deletes weights",
                        "Connects to the internet"
                    ],
                    "correct_answer": 0,
                    "explanation": "It enables the network to learn nonlinear relationships."
                }
            ]
        })

        self._text_response = text_response or self.default_analysis_json
        self._multimodal_response = multimodal_response or self.default_analysis_json

    def set_text_response(self, text: str) -> None:
        self._text_response = text

    def set_should_raise(self, exc: Optional[Exception]) -> None:
        self._should_raise = exc

    def set_multimodal_supported(self, supported: bool) -> None:
        self._multimodal_supported = supported

    def get_model_id(self) -> str:
        return self._model_id

    def is_multimodal_supported(self) -> bool:
        return self._multimodal_supported

    async def generate_text(self, prompt: str) -> str:
        if self._should_raise:
            raise self._should_raise
        return self._text_response

    async def generate_multimodal(self, prompt: str, image_bytes: bytes, mime_type: str) -> str:
        if self._should_raise:
            raise self._should_raise
        return self._multimodal_response


@pytest.fixture
def test_settings() -> Settings:
    """Fixture providing isolated test settings."""
    return Settings(
        GEMINI_API_KEY="test-mock-key-12345",
        GEMMA_MODEL="gemma-4-26b-a4b-it",
        MAX_UPLOAD_SIZE_MB=1,
        MAX_TEXT_LENGTH=5000,
        REQUEST_TIMEOUT_SECONDS=5.0
    )


@pytest.fixture
def mock_ai_provider() -> MockAIProvider:
    """Fixture providing a fresh mock AI provider."""
    return MockAIProvider()


@pytest.fixture
def learning_service(mock_ai_provider: MockAIProvider, test_settings: Settings) -> LearningService:
    """Fixture providing LearningService wired with the mock AI provider."""
    return LearningService(ai_provider=mock_ai_provider, settings=test_settings)


@pytest.fixture
def client(mock_ai_provider: MockAIProvider, test_settings: Settings) -> TestClient:
    """FastAPI TestClient with injected mock dependencies."""
    app.dependency_overrides[get_app_settings] = lambda: test_settings
    app.dependency_overrides[get_ai_provider] = lambda: mock_ai_provider

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def sample_valid_jpeg() -> bytes:
    """Creates a minimal valid JPEG image in memory."""
    img = Image.new("RGB", (30, 30), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def sample_valid_png() -> bytes:
    """Creates a minimal valid PNG image in memory."""
    img = Image.new("RGBA", (30, 30), color="green")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
