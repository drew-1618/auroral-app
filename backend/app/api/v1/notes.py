from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile
from app.schemas.notes import StructuredNoteResponse
from app.services.extractor import NoteExtractorService
from app.services.speech import SpeechService

router = APIRouter()


@router.post("/notes/process-audio", response_model=StructuredNoteResponse)
async def process_audio(
    file: UploadFile = File(...),
    book_title: Optional[str] = Form(None),
    book_author: Optional[str] = Form(None),
) -> StructuredNoteResponse:
    content_bytes = await file.read()
    filename = file.filename or "audio.mp3"

    speech_service = SpeechService()
    extractor_service = NoteExtractorService()

    transcription = await speech_service.transcribe_audio(
        content_bytes, filename
    )
    structured_note = await extractor_service.extract_structured_note(
        transcription_text=transcription.text,
        book_title=book_title,
        book_author=book_author,
    )
    return structured_note
