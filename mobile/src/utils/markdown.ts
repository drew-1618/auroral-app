import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Share, Platform } from 'react-native';
import { KeyQuote, StructuredNoteResponse, NoteItem } from '../types';

export const formatNoteToMarkdown = (
  note: StructuredNoteResponse | NoteItem,
  bookTitle?: string,
  author?: string
): string => {
  const title = bookTitle || ('book_title' in note ? note.book_title : 'Book Note');
  const lines: string[] = [
    `# ${title}`,
  ];

  if (author || ('book_author' in note && note.book_author)) {
    lines.push(`*Author: ${author || (note as StructuredNoteResponse).book_author}*`);
  }

  lines.push('\n## Summary');
  lines.push(note.summary);

  const takeaways = 'actionable_takeaways' in note ? note.actionable_takeaways : note.key_takeaways;
  if (takeaways && takeaways.length > 0) {
    lines.push('\n## Actionable Takeaways');
    takeaways.forEach((t) => lines.push(`- ${t}`));
  }

  if (note.key_quotes && note.key_quotes.length > 0) {
    lines.push('\n## Key Quotes');
    note.key_quotes.forEach((q: KeyQuote) => {
      let suffix = q.chapter_or_topic ? ` (${q.chapter_or_topic})` : '';
      if (q.context) suffix += ` — *${q.context}*`;
      lines.push(`> "${q.quote}"${suffix}`);
    });
  }

  return lines.join('\n');
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
};

export const shareTextContent = async (
  title: string,
  content: string
): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      // Create temporary share string via native share or clipboard
      await Share.share({
        title,
        message: content,
      });
    } else {
      await Share.share({
        title,
        message: content,
      });
    }
  } catch (err) {
    console.error('Error sharing content', err);
  }
};
