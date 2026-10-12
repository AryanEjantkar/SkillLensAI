# backend/tests/manual_integration_test.py
"""
Manual Integration Test for SkillLens AI Backend with Live Gemma 4 Model.

Usage:
    python backend/tests/manual_integration_test.py

Requirements:
    - GEMINI_API_KEY must be configured in environment or .env.
    - Active internet connection.
"""
import asyncio
import os
import sys

from dotenv import load_dotenv

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
load_dotenv()

from app.core.config import Settings
from app.providers.gemma_provider import GemmaProvider
from app.services.learning_service import LearningService


if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


async def main():
    print("=" * 60)
    print("  SkillLens AI -- Gemma 4 Live Integration Test")
    print("=" * 60)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() in ("", "your_api_key_here", "your_gemini_api_key_here"):
        print("[SKIPPED] GEMINI_API_KEY is not configured.")
        print("Please configure GEMINI_API_KEY in your .env before running this manual test.")
        sys.exit(1)

    masked_key = api_key[:6] + "..." + api_key[-4:]
    print(f"[KEY] API Key detected: {masked_key}")

    settings = Settings(
        GEMINI_API_KEY=api_key,
        GEMMA_MODEL=os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it"),
        REQUEST_TIMEOUT_SECONDS=90.0
    )
    print(f"[TARGET] Target Model ID: {settings.GEMMA_MODEL}")

    provider = GemmaProvider(settings=settings)
    service = LearningService(ai_provider=provider, settings=settings)

    test_content = (
        "Binary search is an efficient search algorithm that finds the position of a target value "
        "within a sorted array. It works by repeatedly dividing the search interval in half. "
        "Its time complexity is O(log n)."
    )

    print("\nSending educational analysis request to Gemma 4...")
    try:
        result = await service.analyze_content(text=test_content)
        print("\n[SUCCESS] Gemma 4 Learning Analysis Output:")
        print(f"Title: {result.title}")
        print(f"Summary: {result.summary[:150]}...")
        print(f"Explanation: {result.explanation[:150]}...")
        print(f"Generated Flashcards: {len(result.flashcards)}")
        for idx, card in enumerate(result.flashcards[:2], 1):
            print(f"  [{idx}] Q: {card.question} | A: {card.answer}")
        print(f"Generated Quiz Questions: {len(result.quiz)}")
        for idx, q in enumerate(result.quiz[:2], 1):
            print(f"  [{idx}] Q: {q.question}")
            print(f"      Options: {q.options}")
            print(f"      Correct Answer Index: {q.correct_answer} ({q.options[q.correct_answer]})")
        print("\nLive integration test against Gemma 4 verified successfully!")
    except Exception as exc:
        print(f"\n[FAILED] Error during live Gemma integration test: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
