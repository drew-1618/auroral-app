import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { BookDetail, BookSummary, KeyQuote, StructuredNoteResponse } from '../types';

let overrideApiBaseUrl: string | null = null;

export const setApiBaseUrl = (url: string): void => {
  let cleaned = url.trim();
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  overrideApiBaseUrl = cleaned || null;
};

export const getApiBaseUrl = (): string => {
  if (overrideApiBaseUrl) {
    return overrideApiBaseUrl;
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (!Device.isDevice) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) return `http://${ip}:8000`;
  }

  return 'http://localhost:8000';
};

export const uploadAudioForProcessing = async (
  fileUri: string,
  bookTitle?: string,
  bookAuthor?: string,
  customBaseUrl?: string,
  bookId?: number,
  chapterId?: number,
  chapterTitle?: string
): Promise<StructuredNoteResponse> => {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'recording.m4a';

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: 'audio/m4a',
  } as any);

  if (bookId !== undefined) {
    formData.append('book_id', bookId.toString());
  }

  if (chapterId !== undefined) {
    formData.append('chapter_id', chapterId.toString());
  }

  if (bookTitle && bookTitle.trim()) {
    formData.append('book_title', bookTitle.trim());
  }

  if (bookAuthor && bookAuthor.trim()) {
    formData.append('book_author', bookAuthor.trim());
  }

  if (chapterTitle && chapterTitle.trim()) {
    formData.append('chapter_title', chapterTitle.trim());
  }

  const baseUrl = customBaseUrl ? customBaseUrl : getApiBaseUrl();
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/notes/process-audio`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.detail?.message ||
        errorData?.message ||
        `Server returned status ${response.status}`;
      throw new Error(message);
    }

    const data: StructuredNoteResponse = await response.json();
    return data;
  } catch (err: any) {
    if (err.message && err.message.includes('Server returned')) {
      throw err;
    }
    throw new Error(
      `Cannot connect to ${baseUrl}. Check server URL and ensure FastAPI is running with '--host 0.0.0.0 --port 8000'.`
    );
  }
};

export interface NoteUpdateRequestData {
  title?: string;
  summary?: string;
  key_takeaways?: string[];
  key_quotes?: KeyQuote[];
}


export const updateNote = async (
  noteId: number,
  data: NoteUpdateRequestData,
  customBaseUrl?: string
): Promise<void> => {
  const baseUrl = customBaseUrl ? customBaseUrl : getApiBaseUrl();
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/notes/${noteId}`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update note: ${response.statusText}`);
  }
};

export const fetchBooks = async (customBaseUrl?: string): Promise<BookSummary[]> => {
  const baseUrl = customBaseUrl ? customBaseUrl : getApiBaseUrl();
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/books`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to fetch books: ${response.statusText}`);
  }
  return await response.json();
};

export const fetchBookDetails = async (
  bookId: number,
  customBaseUrl?: string
): Promise<BookDetail> => {
  const baseUrl = customBaseUrl ? customBaseUrl : getApiBaseUrl();
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/books/${bookId}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to fetch book details: ${response.statusText}`);
  }
  return await response.json();
};

export const exportBookMarkdown = async (
  bookId: number,
  customBaseUrl?: string
): Promise<string> => {
  const baseUrl = customBaseUrl ? customBaseUrl : getApiBaseUrl();
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/books/${bookId}/export`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to export book markdown: ${response.statusText}`);
  }
  return await response.text();
};

export const deleteNote = async (
  noteId: number,
  customBaseUrl?: string
): Promise<void> => {
  const baseUrl = customBaseUrl ? customBaseUrl : getApiBaseUrl();
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/notes/${noteId}`;

  const response = await fetch(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to delete note: ${response.statusText}`);
  }
};
