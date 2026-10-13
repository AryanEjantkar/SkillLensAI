"""Core configuration and settings for SkillLens AI."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Locate project root and load .env
PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "gemini-3.5-flash-lite")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
DEFAULT_PROVIDER = os.getenv("DEFAULT_PROVIDER", "gemini").lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2:9b")

MAX_PROMPT_CHARS = 10_000
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_EXTRACTED_TEXT_CHARS = 40_000
TIMEOUT_SECONDS = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30.0"))
