export interface KeyQuote {
  quote: string;
  chapter_or_topic?: string;
  context?: string;
}

export interface StructuredNoteResponse {
  note_id?: number;
  book_id?: number;
  chapter_id?: number;
  book_title?: string;
  book_author?: string;
  chapter_title?: string;
  summary: string;
  key_ideas: string[];
  key_quotes: KeyQuote[];
  actionable_takeaways: string[];
  raw_transcription: string;
  language: string;
  created_at: string;
}

export interface NoteItem {
  id: number;
  chapter_id: number;
  raw_transcription: string;
  summary: string;
  key_takeaways: string[];
  key_quotes: KeyQuote[];
  created_at: string;
}

export interface ChapterDetail {
  id: number;
  book_id: number;
  chapter_title_or_number: string;
  created_at: string;
  notes: NoteItem[];
}

export interface BookDetail {
  id: number;
  title: string;
  author?: string;
  created_at: string;
  chapters: ChapterDetail[];
}

export interface BookSummary {
  id: number;
  title: string;
  author?: string;
  created_at: string;
  total_chapters: number;
  total_notes: number;
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
