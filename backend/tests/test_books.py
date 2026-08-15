import pytest
from app.models.book import Book
from app.models.chapter import Chapter
from app.models.note import Note


@pytest.mark.asyncio
async def test_list_books_empty(async_client):
    response = await async_client.get("/api/v1/books")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_and_get_book_details(async_client):
    # Process audio note via endpoint to test end-to-end database persistence
    from unittest.mock import AsyncMock, patch
    from app.schemas.notes import KeyQuote, StructuredNoteResponse, TranscriptionResponse

    mock_transcription = TranscriptionResponse(
        text="Deep work is focus.", language="en", duration=5.0
    )
    mock_note = StructuredNoteResponse(
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

    # Test List Books
    res_list = await async_client.get("/api/v1/books")
    assert res_list.status_code == 200
    books = res_list.json()
    assert len(books) == 1
    assert books[0]["title"] == "Deep Work"
    assert books[0]["total_chapters"] == 1
    assert books[0]["total_notes"] == 1

    # Test Get Book Details
    res_detail = await async_client.get(f"/api/v1/books/{book_id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["title"] == "Deep Work"
    assert len(detail["chapters"]) == 1
    assert len(detail["chapters"][0]["notes"]) == 1
    assert detail["chapters"][0]["notes"][0]["id"] == note_id

    # Test Delete Note
    res_del = await async_client.delete(f"/api/v1/notes/{note_id}")
    assert res_del.status_code == 200

    # Verify Note Deleted
    res_detail_after = await async_client.get(f"/api/v1/books/{book_id}")
    assert len(res_detail_after.json()["chapters"][0]["notes"]) == 0
