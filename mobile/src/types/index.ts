export interface KeyQuote {
  quote: string;
  chapter_or_topic?: string;
  context?: string;
}

export interface StructuredNoteResponse {
  book_title?: string;
  book_author?: string;
  summary: string;
  key_ideas: string[];
  key_quotes: KeyQuote[];
  actionable_takeaways: string[];
  raw_transcription: string;
  language: string;
  created_at: string;
}

export type RecordingStatus = 'idle' | 'recording' | 'uploading' | 'success' | 'error';

export interface ApiErrorDetails {
  filename?: string;
  extension?: string;
  exception?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ApiErrorDetails;
}
