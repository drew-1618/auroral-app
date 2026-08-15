from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.book import Book
from app.models.chapter import Chapter
from app.models.note import Note
from app.schemas.notes import NoteResponse, NoteUpdateRequest, StructuredNoteResponse
from app.services.extractor import NoteExtractorService
from app.services.speech import SpeechService

router = APIRouter()


@router.post("/notes/process-audio", response_model=StructuredNoteResponse)
async def process_audio(
    file: UploadFile = File(...),
    book_id: Optional[int] = Form(None),
    chapter_id: Optional[int] = Form(None),
    book_title: Optional[str] = Form(None),
    book_author: Optional[str] = Form(None),
    chapter_title: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
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
        chapter_title=chapter_title,
    )

    resolved_book: Optional[Book] = None

    if book_id is not None:
        result = await db.execute(select(Book).where(Book.id == book_id))
        resolved_book = result.scalar_one_or_none()

    if not resolved_book:
        target_title = structured_note.book_title or "Untitled Book"
        result = await db.execute(
            select(Book).where(func.lower(Book.title) == func.lower(target_title))
        )
        resolved_book = result.scalar_one_or_none()

        if not resolved_book:
            resolved_book = Book(
                title=target_title,
                author=structured_note.book_author or book_author,
            )
            db.add(resolved_book)
            await db.flush()

    resolved_chapter: Optional[Chapter] = None

    if chapter_id is not None:
        result = await db.execute(
            select(Chapter).where(Chapter.id == chapter_id)
        )
        resolved_chapter = result.scalar_one_or_none()

    if not resolved_chapter:
        target_chap_title = (
            chapter_title
            or structured_note.chapter_title
            or "General Notes"
        )
        result = await db.execute(
            select(Chapter).where(
                Chapter.book_id == resolved_book.id,
                func.lower(Chapter.chapter_title_or_number)
                == func.lower(target_chap_title),
            )
        )
        resolved_chapter = result.scalar_one_or_none()

        if not resolved_chapter:
            resolved_chapter = Chapter(
                book_id=resolved_book.id,
                chapter_title_or_number=target_chap_title,
            )
            db.add(resolved_chapter)
            await db.flush()

    new_note = Note(
        chapter_id=resolved_chapter.id,
        title=structured_note.title or "Book Note",
        raw_transcription=structured_note.raw_transcription,
        summary=structured_note.summary,
        key_takeaways=structured_note.actionable_takeaways,
        key_quotes=[q.model_dump() for q in structured_note.key_quotes],
    )
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)

    return StructuredNoteResponse(
        note_id=new_note.id,
        book_id=resolved_book.id,
        chapter_id=resolved_chapter.id,
        title=new_note.title,
        book_title=resolved_book.title,
        book_author=resolved_book.author,
        chapter_title=resolved_chapter.chapter_title_or_number,
        summary=new_note.summary,
        key_ideas=structured_note.key_ideas,
        key_quotes=structured_note.key_quotes,
        actionable_takeaways=new_note.key_takeaways,
        raw_transcription=new_note.raw_transcription,
        language=structured_note.language,
        created_at=new_note.created_at,
    )


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    payload: NoteUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> NoteResponse:
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if payload.title is not None:
        note.title = payload.title
    if payload.summary is not None:
        note.summary = payload.summary
    if payload.key_takeaways is not None:
        note.key_takeaways = payload.key_takeaways
    if payload.key_quotes is not None:
        note.key_quotes = [q.model_dump() for q in payload.key_quotes]

    await db.commit()
    await db.refresh(note)
    return NoteResponse.model_validate(note)


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: int, db: AsyncSession = Depends(get_db)
) -> dict:
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await db.delete(note)
    await db.commit()
    return {"message": f"Note {note_id} deleted successfully"}
