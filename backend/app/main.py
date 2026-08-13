from fastapi import FastAPI
from app.api.v1.health import router as health_router

app = FastAPI(
    title="Auroral API",
    description="Audio-First Voice-to-Structured Book Notes Platform",
    version="0.1.0",
)

app.include_router(health_router, prefix="/api/v1", tags=["health"])


@app.get("/")
def root():
    return {"message": "Auroral API is running"}
