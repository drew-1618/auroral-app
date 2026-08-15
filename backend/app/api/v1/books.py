from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.book import Book
from app.models.chapter import Chapter
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


@router.get("/books/{book_id}/export")
async def export_book_markdown(
    book_id: int, db: AsyncSession = Depends(get_db)
) -> Response:
    result = await db.execute(
        select(Book)
        .where(Book.id == book_id)
        .options(selectinload(Book.chapters).selectinload(Chapter.notes))
    )
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    md_lines = [
        f"# {book.title}",
    ]
    if book.author:
        md_lines.append(f"*Author: {book.author}*\n")

    md_lines.append("---\n")

    for chapter in book.chapters:
        md_lines.append(f"## Chapter: {chapter.chapter_title_or_number}\n")
        if not chapter.notes:
            md_lines.append("*No notes recorded for this chapter.*\n")
            continue

        for i, note in enumerate(chapter.notes, 1):
            date_str = note.created_at.strftime("%B %d, %Y")
            md_lines.append(f"### Note #{i} ({date_str})\n")
            md_lines.append(f"**Summary:**\n{note.summary}\n")

            if note.key_quotes:
                md_lines.append("**Key Quotes:**")
                for q in note.key_quotes:
                    quote_text = q.get("quote", "")
                    context = q.get("context")
                    topic = q.get("chapter_or_topic")
                    suffix = f" ({topic})" if topic else ""
                    if context:
                        suffix += f" — *{context}*"
                    md_lines.append(f'> "{quote_text}"{suffix}')
                md_lines.append("")

            if note.key_takeaways:
                md_lines.append("**Actionable Takeaways:**")
                for takeaway in note.key_takeaways:
                    md_lines.append(f"- {takeaway}")
                md_lines.append("")

            md_lines.append("---\n")

    full_markdown = "\n".join(md_lines)
    return Response(content=full_markdown, media_type="text/markdown")
