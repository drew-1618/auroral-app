from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class KeyQuote(BaseModel):
    model_config = ConfigDict(frozen=True)

    quote: str = Field(..., description="Exact or polished key quote from audio")
    chapter_or_topic: Optional[str] = Field(
        None, description="Associated book chapter or topic context"
    )
    context: Optional[str] = Field(
        None, description="Relevance or insight about why this quote matters"
    )


class StructuredNoteResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    note_id: Optional[int] = Field(None, description="Saved note database ID")
    book_id: Optional[int] = Field(None, description="Associated book ID")
    chapter_id: Optional[int] = Field(None, description="Associated chapter ID")
    title: str = Field(
        "Book Note",
        description="Concise, descriptive 3-6 word title summarizing the core concept",
    )
    book_title: Optional[str] = Field(
        None, description="Identified or provided book title"
    )
    book_author: Optional[str] = Field(
        None, description="Identified or provided book author"
    )
    chapter_title: Optional[str] = Field(
        None, description="Identified or provided chapter name/number"
    )
    summary: str = Field(
        ..., description="Structured executive summary of the audio note"
    )
    key_ideas: List[str] = Field(
        default_factory=list, description="Core insights/concepts extracted"
    )
    key_quotes: List[KeyQuote] = Field(
        default_factory=list, description="Extracted key quotes with context"
    )
    actionable_takeaways: List[str] = Field(
        default_factory=list, description="Action items or personal takeaways"
    )
    raw_transcription: str = Field(
        ..., description="Raw text output from Whisper model"
    )
    language: str = Field("en", description="Detected spoken language")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class NoteUpdateRequest(BaseModel):
    model_config = ConfigDict(frozen=True)

    title: Optional[str] = None
    summary: Optional[str] = None
    key_takeaways: Optional[List[str]] = None
    key_quotes: Optional[List[KeyQuote]] = None


class NoteResponse(BaseModel):
    id: int
    chapter_id: int
    title: str = "Book Note"
    raw_transcription: str
    summary: str
    key_takeaways: List[str]
    key_quotes: List[KeyQuote]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TranscriptionResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    text: str = Field(..., description="Transcribed audio text")
    language: str = Field("en", description="Detected language")
    duration: Optional[float] = Field(
        None, description="Audio duration in seconds"
    )


class ErrorDetails(BaseModel):
    model_config = ConfigDict(frozen=True)

    filename: Optional[str] = None
    extension: Optional[str] = None
    exception: Optional[str] = None


class StandardErrorResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    error: str = Field(..., description="Short error code identifier")
    message: str = Field(..., description="Human-readable error description")
    details: ErrorDetails = Field(
        default_factory=ErrorDetails, description="Structured error details"
    )
