import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  BookOpen,
  User,
  Layers,
  Trash2,
  Quote,
  CheckCircle2,
  Mic,
} from 'lucide-react-native';
import { deleteNote, fetchBookDetails } from '../services/api';
import { BookDetail, NoteItem } from '../types';

interface BookDetailScreenProps {
  route: any;
  navigation: any;
}

export const BookDetailScreen: React.FC<BookDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { bookId } = route.params;
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBookDetail = async () => {
    try {
      setErrorMessage(null);
      const data = await fetchBookDetails(bookId);
      setBook(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookDetail();
    }, [bookId])
  );

  const handleDeleteNote = (noteId: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this book note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              loadBookDetail();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete note');
            }
          },
        },
      ]
    );
  };

  const handleInContextRecord = (chapterId?: number, chapterTitle?: string) => {
    navigation.navigate('Quick Record', {
      preboundBookId: book?.id,
      preboundBookTitle: book?.title,
      preboundBookAuthor: book?.author,
      preboundChapterId: chapterId,
      preboundChapterTitle: chapterTitle,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !book) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#F8FAFC" size={20} />
            <Text style={styles.backBtnText}>Back to Library</Text>
          </TouchableOpacity>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Error Loading Book</Text>
            <Text style={styles.errorText}>
              {errorMessage || 'Book not found.'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeaderNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#F8FAFC" size={20} />
          <Text style={styles.backBtnText}>Library</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inContextRecordNavBtn}
          onPress={() => handleInContextRecord()}
        >
          <Mic color="#FFFFFF" size={16} />
          <Text style={styles.inContextRecordNavBtnText}>Record Note</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Book Header Card */}
        <View style={styles.bookHeaderCard}>
          <View style={styles.bookIconBadge}>
            <BookOpen color="#6366F1" size={28} />
          </View>
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.author && (
            <View style={styles.authorRow}>
              <User color="#94A3B8" size={14} />
              <Text style={styles.bookAuthor}>{book.author}</Text>
            </View>
          )}
        </View>

        {/* Chapters and Notes */}
        {book.chapters && book.chapters.length > 0 ? (
          book.chapters.map((chapter) => (
            <View key={chapter.id} style={styles.chapterSection}>
              <View style={styles.chapterHeader}>
                <View style={styles.chapterTitleRow}>
                  <Layers color="#8B5CF6" size={18} />
                  <Text style={styles.chapterTitle}>
                    {chapter.chapter_title_or_number}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.chapterRecordBtn}
                  onPress={() =>
                    handleInContextRecord(
                      chapter.id,
                      chapter.chapter_title_or_number
                    )
                  }
                >
                  <Mic color="#8B5CF6" size={14} />
                  <Text style={styles.chapterRecordBtnText}>Record Here</Text>
                </TouchableOpacity>
              </View>

              {chapter.notes && chapter.notes.length > 0 ? (
                chapter.notes.map((note: NoteItem) => (
                  <View key={note.id} style={styles.noteCard}>
                    <View style={styles.noteCardHeader}>
                      <Text style={styles.noteDate}>
                        {new Date(note.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 color="#EF4444" size={18} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.summaryText}>{note.summary}</Text>

                    {/* Key Quotes */}
                    {note.key_quotes && note.key_quotes.length > 0 && (
                      <View style={styles.quoteBlockContainer}>
                        {note.key_quotes.map((q, idx) => (
                          <View key={idx} style={styles.quoteCard}>
                            <Quote color="#8B5CF6" size={14} />
                            <Text style={styles.quoteText}>“{q.quote}”</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Key Takeaways */}
                    {note.key_takeaways && note.key_takeaways.length > 0 && (
                      <View style={styles.takeawaysContainer}>
                        {note.key_takeaways.map((t, idx) => (
                          <View key={idx} style={styles.takeawayRow}>
                            <CheckCircle2 color="#10B981" size={14} />
                            <Text style={styles.takeawayText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noNotesText}>
                  No notes recorded for this chapter yet.
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyChaptersContainer}>
            <Text style={styles.noNotesText}>
              No chapters or notes found for this book.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  inContextRecordNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inContextRecordNavBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bookHeaderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bookIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bookTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  bookAuthor: {
    color: '#94A3B8',
    fontSize: 14,
  },
  chapterSection: {
    marginBottom: 24,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterTitle: {
    color: '#E2E8F0',
    fontSize: 17,
    fontWeight: '700',
  },
  chapterRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chapterRecordBtnText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noteDate: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  quoteBlockContainer: {
    gap: 6,
    marginBottom: 10,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  quoteText: {
    color: '#DDD6FE',
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  takeawaysContainer: {
    gap: 6,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  takeawayText: {
    color: '#CBD5E1',
    fontSize: 13,
    flex: 1,
  },
  noNotesText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyChaptersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginTop: 4,
  },
});
