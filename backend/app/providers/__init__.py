# backend/app/providers/__init__.py
"""Concrete AI Provider Implementations."""
from app.providers.gemma_provider import GemmaProvider

__all__ = ["GemmaProvider"]
