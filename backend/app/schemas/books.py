from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.notes import NoteResponse


class ChapterDetailResponse(BaseModel):
    id: int
    book_id: int
    chapter_title_or_number: str
    created_at: datetime
    notes: List[NoteResponse] = []

    model_config = ConfigDict(from_attributes=True)


class BookDetailResponse(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    created_at: datetime
    chapters: List[ChapterDetailResponse] = []

    model_config = ConfigDict(from_attributes=True)


class BookSummaryResponse(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    created_at: datetime
    total_chapters: int = 0
    total_notes: int = 0

    model_config = ConfigDict(from_attributes=True)
