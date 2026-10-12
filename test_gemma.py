"""
Standalone Integration Test for Google's Gemma 4 (gemma-4-26b-a4b-it) in Python.
Requires: pip install google-genai python-dotenv

Usage:
    python test_gemma.py
"""

import os
import sys
import time
from dotenv import load_dotenv

load_dotenv()

GEMMA_MODEL_ID = "gemma-4-26b-a4b-it"

def main():
    print("=" * 60)
    print("  GEMMA 4 PYTHON INTEGRATION TEST")
    print(f"  Target Model: {GEMMA_MODEL_ID}")
    print("=" * 60)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("\n❌ [FAIL] GEMINI_API_KEY environment variable is missing or empty.")
        print("Please configure GEMINI_API_KEY in your .env file or environment.")
        sys.exit(1)

    try:
        from google import genai
    except ImportError:
        print("\n❌ [FAIL] 'google-genai' package is not installed.")
        print("Run: pip install google-genai python-dotenv")
        sys.exit(1)

    masked_key = api_key[:6] + "..." + api_key[-4:]
    print(f"\n🔑 [CHECK 1] GEMINI_API_KEY detected: {masked_key}")

    client = genai.Client(api_key=api_key)

    # 1. Verify model availability
    print(f"\n🔍 [CHECK 2] Verifying model '{GEMMA_MODEL_ID}' availability...")
    try:
        model = client.models.get(model=GEMMA_MODEL_ID)
        print(f"✅ [PASS] Model '{GEMMA_MODEL_ID}' is available.")
    except Exception as e:
        print(f"⚠️ [NOTICE] Direct get check: {e}")
        print("Proceeding to test prompt generation directly...")

    # 2. Test generation
    test_prompt = "Briefly state three fundamental laws of robotics in 3 bullet points."
    print(f"\n🚀 [CHECK 3] Sending test prompt to '{GEMMA_MODEL_ID}'...")
    print(f"Prompt: \"{test_prompt}\"")

    start_time = time.time()
    try:
        response = client.models.generate_content(
            model=GEMMA_MODEL_ID,
            contents=test_prompt
        )
        elapsed_ms = int((time.time() - start_time) * 1000)

        print("\n" + "-" * 60)
        print(f"✅ [SUCCESS] Gemma 4 Response ({elapsed_ms}ms):")
        print("-" * 60)
        print(response.text.strip())
        print("-" * 60)
        print(f"Model ID Confirmed: {GEMMA_MODEL_ID}")
        print("\n🎉 Gemma 4 Python test passed!")
    except Exception as e:
        print(f"\n❌ [FAIL] Error calling Gemma 4: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
