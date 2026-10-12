# backend/app/schemas/common.py
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="healthy", description="Service status indicator")
    app: str = Field(default="SkillLens AI Backend", description="Application name")
    version: str = Field(default="1.0.0", description="Application version")
    model_configured: str = Field(description="Configured Gemma model ID")
