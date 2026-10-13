"""Vercel Serverless Function entry point for FastAPI backend."""

import os
import sys
from pathlib import Path

# Add project root to sys.path so 'backend' modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Import the FastAPI application
from backend.src.main import app

# Expose app for Vercel's ASGI runner
__all__ = ["app"]
