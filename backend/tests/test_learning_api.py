# backend/tests/test_learning_api.py
import json
from fastapi.testclient import TestClient

from app.core.exceptions import AIProviderError, AIUpstreamTimeoutError
from tests.conftest import MockAIProvider


def test_analyze_endpoint_text_only_success(client: TestClient):
    """Tests POST /api/analyze with valid text notes."""
    response = client.post(
        "/api/analyze",
        data={"text": "Photosynthesis is the process by which green plants make food."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "summary" in data
    assert "explanation" in data
    assert isinstance(data["flashcards"], list)
    assert isinstance(data["quiz"], list)
    assert data["quiz"][0]["correct_answer"] == 0


def test_analyze_endpoint_missing_both_text_and_image(client: TestClient):
    """Tests POST /api/analyze when neither text nor image is provided."""
    response = client.post("/api/analyze", data={})
    assert response.status_code == 400
    err = response.json()
    assert "error" in err
    assert err["error"]["code"] == "VALIDATION_ERROR"


def test_analyze_endpoint_malformed_image_rejected(client: TestClient):
    """Tests POST /api/analyze with corrupted image file."""
    files = {"image": ("test.png", b"NOT_A_REAL_PNG", "image/png")}
    response = client.post("/api/analyze", data={"text": "Test"}, files=files)
    assert response.status_code == 400
    err = response.json()
    assert err["error"]["code"] == "VALIDATION_ERROR"


def test_analyze_endpoint_image_unsupported_model(client: TestClient, sample_valid_jpeg: bytes):
    """Tests POST /api/analyze with image when provider does not support multimodal."""
    files = {"image": ("diagram.jpg", sample_valid_jpeg, "image/jpeg")}
    response = client.post("/api/analyze", data={"text": "Diagram Notes"}, files=files)
    assert response.status_code == 422
    err = response.json()
    assert err["error"]["code"] == "MULTIMODAL_UNSUPPORTED"


def test_analyze_endpoint_upstream_timeout_returns_504(client: TestClient, mock_ai_provider: MockAIProvider):
    """Tests POST /api/analyze handling of upstream timeouts."""
    mock_ai_provider.set_should_raise(AIUpstreamTimeoutError("Upstream model timeout."))
    response = client.post("/api/analyze", data={"text": "Notes"})
    assert response.status_code == 504
    err = response.json()
    assert err["error"]["code"] == "AI_TIMEOUT"


def test_analyze_endpoint_upstream_error_returns_502(client: TestClient, mock_ai_provider: MockAIProvider):
    """Tests POST /api/analyze handling of general upstream failures."""
    mock_ai_provider.set_should_raise(AIProviderError("Upstream service error.", status_code=502))
    response = client.post("/api/analyze", data={"text": "Notes"})
    assert response.status_code == 502
    err = response.json()
    assert err["error"]["code"] == "AI_PROVIDER_ERROR"


def test_generate_flashcards_endpoint_success(client: TestClient, mock_ai_provider: MockAIProvider):
    """Tests POST /api/generate/flashcards."""
    mock_ai_provider.set_text_response(json.dumps({
        "flashcards": [
            {"question": "What is an algorithm?", "answer": "A step-by-step procedure."}
        ]
    }))
    response = client.post(
        "/api/generate/flashcards",
        json={"text": "Introduction to Algorithms and Complexity"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "flashcards" in data
    assert len(data["flashcards"]) == 1


def test_generate_quiz_endpoint_success(client: TestClient, mock_ai_provider: MockAIProvider):
    """Tests POST /api/generate/quiz."""
    mock_ai_provider.set_text_response(json.dumps({
        "quiz": [
            {
                "question": "Which sorting algorithm has average O(n log n)?",
                "options": ["Merge Sort", "Bubble Sort", "Insertion Sort"],
                "correct_answer": 0,
                "explanation": "Merge sort divides and conquers in O(n log n)."
            }
        ]
    }))
    response = client.post(
        "/api/generate/quiz",
        json={"text": "Sorting Algorithms Overview"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "quiz" in data
    assert len(data["quiz"]) == 1


def test_generate_flashcards_validation_error_on_short_text(client: TestClient):
    """Tests request validation error on text below minimum length."""
    response = client.post(
        "/api/generate/flashcards",
        json={"text": "Hi"}  # Less than min_length=5
    )
    assert response.status_code == 422
    err = response.json()
    assert err["error"]["code"] == "REQUEST_VALIDATION_ERROR"
