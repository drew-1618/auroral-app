import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { StructuredNoteResponse } from '../types';

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

  // On Simulators/Emulators, localhost / 10.0.2.2 is preferred
  if (!Device.isDevice) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }

  // On Physical Device via Expo Go, check hostUri
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
  customBaseUrl?: string
): Promise<StructuredNoteResponse> => {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'recording.m4a';

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: 'audio/m4a',
  } as any);

  if (bookTitle && bookTitle.trim()) {
    formData.append('book_title', bookTitle.trim());
  }

  if (bookAuthor && bookAuthor.trim()) {
    formData.append('book_author', bookAuthor.trim());
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
