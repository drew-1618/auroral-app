import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def get_database_url() -> str:
    raw_url = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/auroral_db"
    )
    # Convert postgresql:// to postgresql+asyncpg:// if needed
    if raw_url.startswith("postgresql://"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    return raw_url


# Use sqlite+aiosqlite for fallback/local development if asyncpg PostgreSQL is offline
DATABASE_URL = get_database_url()

try:
    engine = create_async_engine(DATABASE_URL, echo=False)
except Exception:
    # Fallback to local SQLite async DB if PostgreSQL connection string fails
    DATABASE_URL = "sqlite+aiosqlite:///./auroral_app.db"
    engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
