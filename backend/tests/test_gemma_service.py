from types import SimpleNamespace
from unittest.mock import Mock

from backend.src.config.settings import MODEL_ID
from backend.src.services.gemma_service import GemmaRequestError, GemmaService


def test_generate_calls_the_explicit_gemma_model() -> None:
    client = Mock()
    client.models.generate_content.return_value = SimpleNamespace(text="  Hello  ")
    service = GemmaService(client=client)

    response = service.generate("Say hello")

    assert response == "Hello"
    client.models.generate_content.assert_called_once_with(
        model="gemma-4-26b-a4b-it",
        contents="Say hello",
    )
    assert MODEL_ID == "gemma-4-26b-a4b-it"


def test_generate_sends_png_and_text_to_the_explicit_gemma_model() -> None:
    client = Mock()
    client.models.generate_content.return_value = SimpleNamespace(text="Red")
    image_data = b"\x89PNG\r\n\x1a\nimage-bytes"
    service = GemmaService(client=client)

    response = service.generate(
        "Describe this image",
        image_data=image_data,
        image_mime_type="image/png",
    )

    assert response == "Red"
    call = client.models.generate_content.call_args.kwargs
    assert call["model"] == "gemma-4-26b-a4b-it"
    assert call["contents"][0].text == "Describe this image"
    assert call["contents"][1].inline_data.mime_type == "image/png"
    assert call["contents"][1].inline_data.data == image_data


def test_generate_rejects_unverified_image_mime_type() -> None:
    client = Mock()
    service = GemmaService(client=client)

    try:
        service.generate("Describe this image", b"image", "image/jpeg")
    except GemmaRequestError as error:
        assert str(error) == "Only PNG image input is supported"
    else:
        raise AssertionError("Unverified image MIME type was accepted")
    client.models.generate_content.assert_not_called()