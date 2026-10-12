import sys

from backend.src.services.gemma_service import (
    GemmaConfigurationError,
    GemmaRequestError,
    GemmaService,
)


def main() -> int:
    prompt = "Reply with exactly: GEMMA_API_OK"
    try:
        response = GemmaService().generate(prompt)
    except GemmaConfigurationError:
        print("GEMINI_API_KEY is not set. Configure it locally and retry.")
        return 1
    except GemmaRequestError:
        print(
            "Gemma smoke test failed. Check the key, network access, and whether "
            "gemma-4-26b-a4b-it is available to this account."
        )
        return 1

    print(f"Model: gemma-4-26b-a4b-it\nResponse: {response}")
    return 0


if __name__ == "__main__":
    sys.exit(main())