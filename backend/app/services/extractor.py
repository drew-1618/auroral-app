import json
from typing import Optional
from fastapi import HTTPException
from groq import AsyncGroq
from app.core.config import settings
from app.schemas.notes import ErrorDetails, KeyQuote, StructuredNoteResponse


class NoteExtractorService:
    def __init__(
        self, api_key: Optional[str] = None, model: Optional[str] = None
    ) -> None:
        self.api_key = (
            api_key if api_key is not None else settings.groq_api_key
        )
        self.model = model or settings.llm_model
        self.client = AsyncGroq(api_key=self.api_key or "placeholder_key")

    async def extract_structured_note(
        self,
        transcription_text: str,
        book_title: Optional[str] = None,
        book_author: Optional[str] = None,
        chapter_title: Optional[str] = None,
    ) -> StructuredNoteResponse:
        if not transcription_text.strip():
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "EMPTY_TRANSCRIPTION",
                    "message": "Cannot extract structured notes from empty transcription text.",
                    "details": ErrorDetails().model_dump(),
                },
            )

        if not self.api_key:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "GROQ_API_KEY_MISSING",
                    "message": "Groq API key is not configured.",
                    "details": ErrorDetails().model_dump(),
                },
            )

        system_prompt = (
            "You are an expert literary assistant specializing in extracting structured book notes "
            "from raw voice recordings. Analyze the transcription and format the response as JSON with "
            "the following keys: title (a concise, punchy 3-6 word title capturing the core concept), "
            "book_title, book_author, chapter_title, summary, key_ideas (list of strings), "
            "key_quotes (list of objects with quote, chapter_or_topic, context), and actionable_takeaways (list of strings)."
        )

        user_content = f'Raw Voice Transcription:\n"{transcription_text}"\n'
        if book_title:
            user_content += f"User Provided Book Title: {book_title}\n"
        if book_author:
            user_content += f"User Provided Author: {book_author}\n"
        if chapter_title:
            user_content += f"User Provided Chapter/Topic: {chapter_title}\n"

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            raw_json = response.choices[0].message.content
            parsed = json.loads(raw_json)

            quotes = [
                KeyQuote(
                    quote=q.get("quote", ""),
                    chapter_or_topic=q.get("chapter_or_topic"),
                    context=q.get("context"),
                )
                for q in parsed.get("key_quotes", [])
                if isinstance(q, dict) and q.get("quote")
            ]

            return StructuredNoteResponse(
                title=parsed.get("title", "Book Note"),
                book_title=book_title or parsed.get("book_title"),
                book_author=book_author or parsed.get("book_author"),
                chapter_title=chapter_title
                or parsed.get("chapter_title")
                or "General Notes",
                summary=parsed.get(
                    "summary", "No summary could be generated."
                ),
                key_ideas=parsed.get("key_ideas", []),
                key_quotes=quotes,
                actionable_takeaways=parsed.get("actionable_takeaways", []),
                raw_transcription=transcription_text,
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "NOTE_EXTRACTION_FAILED",
                    "message": f"LLM note extraction failed: {str(e)}",
                    "details": ErrorDetails(
                        exception=type(e).__name__
                    ).model_dump(),
                },
            )
