from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
from app.schemas.notes import TranscriptionResponse
from app.services.speech import SpeechService


@pytest.mark.asyncio
async def test_validate_audio_file_empty():
    service = SpeechService(api_key="mock_key")
    with pytest.raises(HTTPException) as exc_info:
        service.validate_audio_file("test.mp3", b"")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["error"] == "EMPTY_AUDIO_FILE"


@pytest.mark.asyncio
async def test_validate_audio_file_invalid_format():
    service = SpeechService(api_key="mock_key")
    with pytest.raises(HTTPException) as exc_info:
        service.validate_audio_file("test.txt", b"some content")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["error"] == "INVALID_AUDIO_FORMAT"


@pytest.mark.asyncio
async def test_transcribe_audio_success():
    service = SpeechService(api_key="mock_key")

    mock_transcription = MagicMock()
    mock_transcription.text = (
        "In Atomic Habits, James Clear explains identity-based habits."
    )
    mock_transcription.language = "en"
    mock_transcription.duration = 15.0

    mock_create = AsyncMock(return_value=mock_transcription)

    with patch.object(service.client.audio.transcriptions, "create", mock_create):
        result = await service.transcribe_audio(b"fake_mp3_data", "test.mp3")

        assert isinstance(result, TranscriptionResponse)
        assert (
            result.text
            == "In Atomic Habits, James Clear explains identity-based habits."
        )
        assert result.language == "en"
        assert result.duration == 15.0
        mock_create.assert_called_once()
