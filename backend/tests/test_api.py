from fastapi.testclient import TestClient
import pytest
from fastapi import HTTPException

from backend.src import main
from backend.src.services.gemma_service import GemmaRequestError


class SuccessfulService:
    def __init__(self) -> None:
        self.calls = []

    def generate(self, prompt: str, image_data=None, image_mime_type=None) -> str:
        self.calls.append({"prompt": prompt, "image_data": image_data, "image_mime_type": image_mime_type})
        suffix = " and image" if image_data else ""
        return f"Received: {prompt}{suffix}"


class FailingService:
    def generate(self, prompt: str) -> str:
        raise GemmaRequestError


def test_generate_returns_model_and_response(monkeypatch) -> None:
    monkeypatch.setattr(main, "gemma_service", SuccessfulService())
    client = TestClient(main.app)

    response = client.post("/api/generate", json={"prompt": "Hello"})

    assert response.status_code == 200
    assert response.json() == {
        "model": "gemma-4-26b-a4b-it",
        "response": "Received: Hello",
    }


def test_generate_rejects_blank_prompt() -> None:
    client = TestClient(main.app)

    response = client.post("/api/generate", json={"prompt": "   "})

    assert response.status_code == 422


def test_generate_reports_model_request_failure(monkeypatch) -> None:
    monkeypatch.setattr(main, "gemma_service", FailingService())
    client = TestClient(main.app)

    response = client.post("/api/generate", json={"prompt": "Hello"})

    assert response.status_code == 502
    assert "gemma-4-26b-a4b-it" in response.json()["detail"]


def test_image_upload_sends_png_and_question_to_gemma(monkeypatch) -> None:
    service = SuccessfulService()
    monkeypatch.setattr(main, "gemma_service", service)
    client = TestClient(main.app)
    png = b"\x89PNG\r\n\x1a\nvalid-test-image"

    response = client.post(
        "/api/generate/image",
        data={"prompt": "What is shown?", "study_mode": "Explain"},
        files={"file": ("sample.png", png, "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["model"] == "gemma-4-26b-a4b-it"
    assert response.json()["response"].endswith("and image")
    assert service.calls[0]["image_data"] == png
    assert service.calls[0]["image_mime_type"] == "image/png"
    assert "What is shown?" in service.calls[0]["prompt"]


def test_image_upload_rejects_unverified_jpeg(monkeypatch) -> None:
    service = SuccessfulService()
    monkeypatch.setattr(main, "gemma_service", service)
    client = TestClient(main.app)

    response = client.post(
        "/api/generate/image",
        files={"file": ("sample.jpg", b"jpeg-data", "image/jpeg")},
    )

    assert response.status_code == 415
    assert service.calls == []


def test_document_upload_extracts_text_before_gemma(monkeypatch) -> None:
    service = SuccessfulService()
    monkeypatch.setattr(main, "gemma_service", service)
    client = TestClient(main.app)

    response = client.post(
        "/api/generate/document",
        data={"prompt": "Explain the main idea", "study_mode": "Explain"},
        files={"file": ("notes.txt", b"Entropy describes the number of possible states.", "text/plain")},
    )

    assert response.status_code == 200
    assert "Entropy describes the number of possible states." in service.calls[0]["prompt"]


def test_link_page_text_is_sent_to_gemma(monkeypatch) -> None:
    service = SuccessfulService()
    monkeypatch.setattr(main, "gemma_service", service)
    monkeypatch.setattr(main, "_fetch_link_text", lambda url: "Linked article about entropy.")
    client = TestClient(main.app)

    response = client.post(
        "/api/generate/link",
        json={"url": "https://example.com/entropy", "prompt": "Summarize this", "study_mode": "Explain"},
    )

    assert response.status_code == 200
    assert "Linked article about entropy." in service.calls[0]["prompt"]


def test_link_route_blocks_loopback_addresses() -> None:
    with pytest.raises(HTTPException) as error:
        main._validate_public_url("http://127.0.0.1/private")

    assert error.value.status_code == 400