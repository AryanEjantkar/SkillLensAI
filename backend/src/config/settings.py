import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

MODEL_ID = "gemma-4-26b-a4b-it"
MAX_PROMPT_CHARS = 10_000


def get_gemini_api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY")