from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.books import router as books_router
from app.api.v1.health import router as health_router
from app.api.v1.notes import router as notes_router
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Auroral API",
    description="Audio-First Voice-to-Structured Book Notes Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1", tags=["health"])
app.include_router(notes_router, prefix="/api/v1", tags=["notes"])
app.include_router(books_router, prefix="/api/v1", tags=["books"])


@app.get("/")
def root():
    return {"message": "Auroral API is running"}
