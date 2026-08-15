from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.book import Book
    from app.models.note import Note


class Chapter(Base):
    __tablename__ = "chapters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chapter_title_or_number: Mapped[str] = mapped_column(
        String(255), nullable=False, default="General Notes"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    book: Mapped["Book"] = relationship("Book", back_populates="chapters")
    notes: Mapped[List["Note"]] = relationship(
        "Note", back_populates="chapter", cascade="all, delete-orphan"
    )
