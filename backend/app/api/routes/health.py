# backend/app/api/routes/health.py
from fastapi import APIRouter, Depends

from app.core.config import Settings
from app.dependencies import get_app_settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def check_health(settings: Settings = Depends(get_app_settings)) -> HealthResponse:
    """
    Returns API operational status without making external model calls.
    """
    return HealthResponse(
        status="healthy",
        app=settings.APP_NAME,
        version="1.0.0",
        model_configured=settings.GEMMA_MODEL
    )
