import React, { useState } from 'react';
import {
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
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react-native';
import { StructuredNoteResponse } from '../types';

interface NoteCardProps {
  note: StructuredNoteResponse;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const [showRawTranscription, setShowRawTranscription] = useState(false);

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

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <BookOpen color="#6366F1" size={18} />
          <Text style={styles.bookTitle}>
            {note.book_title || 'Untitled Book Note'}
          </Text>
        </View>

        {note.book_author && (
          <View style={styles.authorRow}>
            <User color="#94A3B8" size={14} />
            <Text style={styles.bookAuthor}>{note.book_author}</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <Clock color="#64748B" size={12} />
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.langTag}>{note.language.toUpperCase()}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summaryText}>{note.summary}</Text>
      </View>

      {/* Key Ideas */}
      {note.key_ideas && note.key_ideas.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Lightbulb color="#F59E0B" size={18} />
            <Text style={styles.sectionTitle}>Key Ideas</Text>
          </View>
          {note.key_ideas.map((idea, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{idea}</Text>
            </View>
          ))}
        </View>
      )}

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
      {note.actionable_takeaways && note.actionable_takeaways.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <CheckCircle2 color="#10B981" size={18} />
            <Text style={styles.sectionTitle}>Actionable Takeaways</Text>
          </View>
          {note.actionable_takeaways.map((takeaway, index) => (
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
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 14,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bookTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    flexShrink: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  bookAuthor: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dateText: {
    color: '#64748B',
    fontSize: 12,
  },
  langTag: {
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
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
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 8,
  },
  bulletText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
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
});
