# backend/app/interfaces/__init__.py
"""Interfaces and Provider Contracts."""
from app.interfaces.ai_provider import (
    AIProvider,
    MultimodalGenerationProvider,
    TextGenerationProvider,
)

__all__ = ["AIProvider", "MultimodalGenerationProvider", "TextGenerationProvider"]
