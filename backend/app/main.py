from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.health import router as health_router
from app.api.v1.notes import router as notes_router

app = FastAPI(
    title="Auroral API",
    description="Audio-First Voice-to-Structured Book Notes Platform",
    version="0.1.0",
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


@app.get("/")
def root():
    return {"message": "Auroral API is running"}
