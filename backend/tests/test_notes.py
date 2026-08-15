from unittest.mock import AsyncMock, patch
import pytest
from app.schemas.notes import KeyQuote, StructuredNoteResponse, TranscriptionResponse


@pytest.mark.asyncio
async def test_process_audio_success(async_client):
    mock_transcription = TranscriptionResponse(
        text="Atomic Habits teaches small continuous improvements.",
        language="en",
        duration=10.0,
    )
    mock_note = StructuredNoteResponse(
        book_title="Atomic Habits",
        book_author="James Clear",
        chapter_title="Fundamentals",
        summary="Small 1% daily habits lead to significant long term results.",
        key_ideas=["1% daily improvement rule", "Identity-based habit formation"],
        key_quotes=[
            KeyQuote(
                quote="You do not rise to the level of your goals.",
                chapter_or_topic="Habit Fundamentals",
                context="Focus on systems over outcomes",
            )
        ],
        actionable_takeaways=["Build 2-minute habit triggers"],
        raw_transcription="Atomic Habits teaches small continuous improvements.",
        language="en",
    )

    with patch(
        "app.api.v1.notes.SpeechService.transcribe_audio",
        new_callable=AsyncMock,
        return_value=mock_transcription,
    ), patch(
        "app.api.v1.notes.NoteExtractorService.extract_structured_note",
        new_callable=AsyncMock,
        return_value=mock_note,
    ):
        files = {"file": ("test.mp3", b"dummy mp3 audio content", "audio/mpeg")}
        data = {"book_title": "Atomic Habits", "book_author": "James Clear"}
        response = await async_client.post(
            "/api/v1/notes/process-audio", files=files, data=data
        )

        assert response.status_code == 200
        json_resp = response.json()
        assert json_resp["book_title"] == "Atomic Habits"
        assert json_resp["book_author"] == "James Clear"
        assert json_resp["note_id"] is not None
        assert json_resp["book_id"] is not None
        assert json_resp["chapter_id"] is not None
        assert json_resp["summary"] == "Small 1% daily habits lead to significant long term results."


@pytest.mark.asyncio
async def test_process_audio_invalid_file_format(async_client):
    files = {"file": ("document.txt", b"plain text file", "text/plain")}
    response = await async_client.post(
        "/api/v1/notes/process-audio", files=files
    )

    assert response.status_code == 400
    json_resp = response.json()
    assert "detail" in json_resp
    assert json_resp["detail"]["error"] == "INVALID_AUDIO_FORMAT"


@pytest.mark.asyncio
async def test_process_audio_missing_file(async_client):
    response = await async_client.post("/api/v1/notes/process-audio")
    assert response.status_code == 422
