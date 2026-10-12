# backend/tests/test_health.py
from fastapi.testclient import TestClient


def test_health_check_returns_ok(client: TestClient):
    """Verifies that GET /api/health succeeds without external AI dependencies."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app" in data
    assert data["model_configured"] == "gemma-4-26b-a4b-it"
