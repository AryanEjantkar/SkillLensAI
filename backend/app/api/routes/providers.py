"""Endpoints for inspecting AI providers status."""

from fastapi import APIRouter
from backend.app.schemas.lesson import ProvidersStatusResponse
from backend.app.services.provider_router import router

providers_router = APIRouter(prefix="/providers", tags=["Providers"])


@providers_router.get("/status", response_model=ProvidersStatusResponse)
def get_providers_status() -> ProvidersStatusResponse:
    """Return status and configured models for Gemma, Gemini, and Ollama."""
    return router.get_status()
