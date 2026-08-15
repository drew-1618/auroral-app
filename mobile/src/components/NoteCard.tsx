import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BookOpen,
  User,
  Quote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MoreVertical,
  Edit3,
  Copy,
  Share2,
  Trash2,
  X,
  FileText,
} from 'lucide-react-native';
import { EditNoteModal } from './EditNoteModal';
import { KeyQuote, NoteItem, StructuredNoteResponse } from '../types';
import { copyTextToClipboard, formatNoteToMarkdown, shareTextContent } from '../utils/markdown';

interface NoteCardProps {
  note: StructuredNoteResponse | NoteItem;
  onDeleteNote?: (noteId: number) => void;
  onUpdateNote?: (noteId: number, data: {
    title: string;
    summary: string;
    key_takeaways: string[];
    key_quotes: KeyQuote[];
  }) => Promise<void>;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onDeleteNote,
  onUpdateNote,
}) => {
  const [showRawTranscription, setShowRawTranscription] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formattedDate = new Date(note.created_at || Date.now()).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const conceptTitle = note.title || 'Book Note';
  const bookTitle = 'book_title' in note ? note.book_title : undefined;
  const bookAuthor = 'book_author' in note ? note.book_author : undefined;
  const noteId = 'note_id' in note ? note.note_id : 'id' in note ? note.id : undefined;
  const keyTakeaways = 'actionable_takeaways' in note ? note.actionable_takeaways : note.key_takeaways;

  const handleCopyMarkdown = async () => {
    setShowMenu(false);
    const md = formatNoteToMarkdown(note, bookTitle, bookAuthor);
    const success = await copyTextToClipboard(md);
    if (success) {
      Alert.alert('Copied!', 'Note copied as Markdown to clipboard.');
    }
  };

  const handleShareMarkdown = async () => {
    setShowMenu(false);
    const md = formatNoteToMarkdown(note, bookTitle, bookAuthor);
    await shareTextContent(conceptTitle, md);
  };

  const handleDeletePress = () => {
    setShowMenu(false);
    if (noteId && onDeleteNote) {
      onDeleteNote(noteId);
    }
  };

  const handleSaveEdit = async (updatedData: {
    title: string;
    summary: string;
    key_takeaways: string[];
    key_quotes: KeyQuote[];
  }) => {
    if (noteId && onUpdateNote) {
      await onUpdateNote(noteId, updatedData);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.conceptTitle}>{conceptTitle}</Text>

          {bookTitle && (
            <View style={styles.badgeContainer}>
              <BookOpen color="#6366F1" size={14} />
              <Text style={styles.bookTitle}>{bookTitle}</Text>
            </View>
          )}

          {bookAuthor && (
            <View style={styles.authorRow}>
              <User color="#94A3B8" size={13} />
              <Text style={styles.bookAuthor}>{bookAuthor}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Clock color="#64748B" size={12} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>

        {/* Subtle 3-Dot Overflow Menu Button */}
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setShowMenu(true)}
        >
          <MoreVertical color="#94A3B8" size={20} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summaryText}>{note.summary}</Text>
      </View>

      {/* Key Quotes */}
      {note.key_quotes && note.key_quotes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Quote color="#8B5CF6" size={18} />
            <Text style={styles.sectionTitle}>Key Quotes</Text>
          </View>
          {note.key_quotes.map((item, index) => (
            <View key={index} style={styles.quoteCard}>
              <Text style={styles.quoteText}>“{item.quote}”</Text>
              {item.chapter_or_topic && (
                <Text style={styles.quoteTopic}>
                  Topic: {item.chapter_or_topic}
                </Text>
              )}
              {item.context && (
                <Text style={styles.quoteContext}>{item.context}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Actionable Takeaways */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <CheckCircle2 color="#10B981" size={18} />
            <Text style={styles.sectionTitle}>Actionable Takeaways</Text>
          </View>
          {keyTakeaways.map((takeaway, index) => (
            <View key={index} style={styles.takeawayRow}>
              <CheckCircle2 color="#10B981" size={16} />
              <Text style={styles.takeawayText}>{takeaway}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Accordion Raw Transcription */}
      <TouchableOpacity
        style={styles.transcriptionHeader}
        activeOpacity={0.7}
        onPress={() => setShowRawTranscription(!showRawTranscription)}
      >
        <Text style={styles.transcriptionLabel}>Raw Voice Transcription</Text>
        {showRawTranscription ? (
          <ChevronUp color="#94A3B8" size={18} />
        ) : (
          <ChevronDown color="#94A3B8" size={18} />
        )}
      </TouchableOpacity>

      {showRawTranscription && (
        <View style={styles.transcriptionBody}>
          <Text style={styles.transcriptionText}>{note.raw_transcription}</Text>
        </View>
      )}

      {/* Action Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContent}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Note Options</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            {onUpdateNote && noteId && (
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  setShowMenu(false);
                  setShowEditModal(true);
                }}
              >
                <Edit3 color="#6366F1" size={18} />
                <Text style={styles.menuOptionText}>Edit Note</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleCopyMarkdown}
            >
              <Copy color="#10B981" size={18} />
              <Text style={styles.menuOptionText}>Copy as Markdown</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleShareMarkdown}
            >
              <Share2 color="#8B5CF6" size={18} />
              <Text style={styles.menuOptionText}>Share Note</Text>
            </TouchableOpacity>

            {onDeleteNote && noteId && (
              <TouchableOpacity
                style={[styles.menuOption, styles.deleteMenuOption]}
                onPress={handleDeletePress}
              >
                <Trash2 color="#EF4444" size={18} />
                <Text style={[styles.menuOptionText, styles.deleteOptionText]}>
                  Delete Note
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Note Modal */}
      <EditNoteModal
        visible={showEditModal}
        note={note}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 14,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  conceptTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  moreBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#0F172A',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bookTitle: {
    color: '#A5B4FC',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  bookAuthor: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dateText: {
    color: '#64748B',
    fontSize: 12,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
  },
  quoteCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  quoteText: {
    color: '#DDD6FE',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteTopic: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  quoteContext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  takeawayText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  transcriptionLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  transcriptionBody: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  transcriptionText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  deleteMenuOption: {
    borderBottomWidth: 0,
  },
  menuOptionText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteOptionText: {
    color: '#EF4444',
  },
});
