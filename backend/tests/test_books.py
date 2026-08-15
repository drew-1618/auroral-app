import pytest
from app.schemas.notes import KeyQuote


@pytest.mark.asyncio
async def test_list_books_empty(async_client):
    response = await async_client.get("/api/v1/books")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_get_update_export_delete(async_client):
    from unittest.mock import AsyncMock, patch
    from app.schemas.notes import StructuredNoteResponse, TranscriptionResponse

    mock_transcription = TranscriptionResponse(
        text="Deep work is focus.", language="en", duration=5.0
    )
    mock_note = StructuredNoteResponse(
        title="Deep Focus Mastery",
        book_title="Deep Work",
        book_author="Cal Newport",
        chapter_title="Principles",
        summary="Focus deeply to produce elite output.",
        key_ideas=["Schedule deep work blocks"],
        key_quotes=[KeyQuote(quote="Work deeply.", context="Core thesis")],
        actionable_takeaways=["No distractions"],
        raw_transcription="Deep work is focus.",
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
        files = {"file": ("test.mp3", b"dummy mp3 content", "audio/mpeg")}
        res_create = await async_client.post("/api/v1/notes/process-audio", files=files)
        assert res_create.status_code == 200
        created_data = res_create.json()
        note_id = created_data["note_id"]
        book_id = created_data["book_id"]
        assert created_data["title"] == "Deep Focus Mastery"

    # Test PATCH /api/v1/notes/{id} including title update
    patch_payload = {
        "title": "Elite Deep Work Rituals",
        "summary": "Updated summary text for deep work.",
        "key_takeaways": ["New takeaway bullet 1", "New takeaway bullet 2"],
        "key_quotes": [{"quote": "Updated quote text", "context": "New context"}],
    }
    res_patch = await async_client.patch(f"/api/v1/notes/{note_id}", json=patch_payload)
    assert res_patch.status_code == 200
    patched = res_patch.json()
    assert patched["title"] == "Elite Deep Work Rituals"
    assert patched["summary"] == "Updated summary text for deep work."
    assert len(patched["key_takeaways"]) == 2

    # Test GET /api/v1/books/{id}/export
    res_export = await async_client.get(f"/api/v1/books/{book_id}/export")
    assert res_export.status_code == 200
    assert "# Deep Work" in res_export.text

    # Test Delete Note
    res_del = await async_client.delete(f"/api/v1/notes/{note_id}")
    assert res_del.status_code == 200

    # Verify Note Deleted
    res_detail_after = await async_client.get(f"/api/v1/books/{book_id}")
    assert len(res_detail_after.json()["chapters"][0]["notes"]) == 0
