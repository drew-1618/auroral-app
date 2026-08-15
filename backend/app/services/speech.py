from typing import Optional, Set
from fastapi import HTTPException
from groq import AsyncGroq
from app.core.config import settings
from app.schemas.notes import ErrorDetails, TranscriptionResponse

ALLOWED_EXTENSIONS: Set[str] = {"mp3", "m4a", "wav", "webm", "ogg", "flac"}


class SpeechService:
    def __init__(
        self, api_key: Optional[str] = None, model: Optional[str] = None
    ) -> None:
        self.api_key = (
            api_key if api_key is not None else settings.groq_api_key
        )
        self.model = model or settings.whisper_model
        self.client = AsyncGroq(api_key=self.api_key or "placeholder_key")

    def validate_audio_file(self, filename: str, content_bytes: bytes) -> None:
        if not content_bytes:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "EMPTY_AUDIO_FILE",
                    "message": "Uploaded audio file is empty.",
                    "details": ErrorDetails(
                        filename=filename
                    ).model_dump(),
                },
            )
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_AUDIO_FORMAT",
                    "message": f"Unsupported audio format '.{ext}'. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
                    "details": ErrorDetails(
                        filename=filename, extension=ext
                    ).model_dump(),
                },
            )

    async def transcribe_audio(
        self, file_bytes: bytes, filename: str
    ) -> TranscriptionResponse:
        self.validate_audio_file(filename, file_bytes)

        if not self.api_key:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "GROQ_API_KEY_MISSING",
                    "message": "Groq API key is not configured.",
                    "details": ErrorDetails().model_dump(),
                },
            )

        try:
            transcription = await self.client.audio.transcriptions.create(
                file=(filename, file_bytes),
                model=self.model,
                response_format="verbose_json",
            )
            return TranscriptionResponse(
                text=getattr(transcription, "text", str(transcription)),
                language=getattr(transcription, "language", "en"),
                duration=getattr(transcription, "duration", None),
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "SPEECH_TRANSCRIPTION_FAILED",
                    "message": f"Groq Whisper transcription failed: {str(e)}",
                    "details": ErrorDetails(
                        filename=filename, exception=type(e).__name__
                    ).model_dump(),
                },
            )
