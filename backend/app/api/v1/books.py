from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.book import Book
from app.models.chapter import Chapter
from app.models.note import Note
from app.schemas.books import BookDetailResponse, BookSummaryResponse

router = APIRouter()


@router.get("/books", response_model=List[BookSummaryResponse])
async def list_books(
    db: AsyncSession = Depends(get_db),
) -> List[BookSummaryResponse]:
    result = await db.execute(
        select(Book).options(
            selectinload(Book.chapters).selectinload(Chapter.notes)
        )
    )
    books = result.scalars().all()

    summaries = []
    for b in books:
        chap_count = len(b.chapters)
        note_count = sum(len(c.notes) for c in b.chapters)
        summaries.append(
            BookSummaryResponse(
                id=b.id,
                title=b.title,
                author=b.author,
                created_at=b.created_at,
                total_chapters=chap_count,
                total_notes=note_count,
            )
        )

    return summaries


@router.get("/books/{book_id}", response_model=BookDetailResponse)
async def get_book_details(
    book_id: int, db: AsyncSession = Depends(get_db)
) -> BookDetailResponse:
    result = await db.execute(
        select(Book)
        .where(Book.id == book_id)
        .options(selectinload(Book.chapters).selectinload(Chapter.notes))
    )
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    return BookDetailResponse.model_validate(book)
