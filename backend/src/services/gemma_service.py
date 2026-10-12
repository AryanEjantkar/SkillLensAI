from google import genai
from google.genai import types

from backend.src.config.settings import MODEL_ID, get_gemini_api_key


class GemmaConfigurationError(RuntimeError):
    pass


class GemmaRequestError(RuntimeError):
    pass


class GemmaService:
    def __init__(self, client: genai.Client | None = None) -> None:
        self._client = client

    def generate(
        self,
        prompt: str,
        image_data: bytes | None = None,
        image_mime_type: str | None = None,
    ) -> str:
        if self._client is None:
            api_key = get_gemini_api_key()
            if not api_key:
                raise GemmaConfigurationError("GEMINI_API_KEY is not configured")
            self._client = genai.Client(api_key=api_key)

        try:
            contents: str | list[types.Part] = prompt
            if image_data is not None:
                if image_mime_type != "image/png":
                    raise GemmaRequestError("Only PNG image input is supported")
                contents = [
                    types.Part.from_text(text=prompt),
                    types.Part.from_bytes(data=image_data, mime_type=image_mime_type),
                ]
            response = self._client.models.generate_content(model=MODEL_ID, contents=contents)
        except GemmaRequestError:
            raise
        except Exception as error:
            raise GemmaRequestError from error

        text = response.text
        if not text or not text.strip():
            raise GemmaRequestError("Gemma returned an empty response")
        return text.strip()