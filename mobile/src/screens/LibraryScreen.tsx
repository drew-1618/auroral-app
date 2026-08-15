import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BookOpen, Layers, FileText, ChevronRight, User } from 'lucide-react-native';
import { fetchBooks } from '../services/api';
import { BookSummary } from '../types';

interface LibraryScreenProps {
  navigation: any;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBooks = async () => {
    try {
      setErrorMessage(null);
      const data = await fetchBooks();
      setBooks(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load books library.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  const renderBookCard = ({ item }: { item: BookSummary }) => {
    const dateFormatted = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.bookCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <BookOpen color="#6366F1" size={24} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.bookTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.author ? (
              <View style={styles.authorRow}>
                <User color="#94A3B8" size={13} />
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {item.author}
                </Text>
              </View>
            ) : null}
          </View>
          <ChevronRight color="#64748B" size={20} />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Layers color="#8B5CF6" size={13} />
              <Text style={styles.badgeText}>{item.total_chapters} Chapters</Text>
            </View>
            <View style={styles.badge}>
              <FileText color="#10B981" size={13} />
              <Text style={styles.badgeText}>{item.total_notes} Notes</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{dateFormatted}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.screenHeader}>
          <Text style={styles.titleText}>My Library</Text>
          <Text style={styles.subtitleText}>
            Structured Voice Notes Organized by Book
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Library Load Error</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadBooks}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBookCard}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6366F1"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen color="#475569" size={48} />
                <Text style={styles.emptyTitle}>No Books in Library Yet</Text>
                <Text style={styles.emptyText}>
                  Record your first audio book note in the Quick Record tab to start building your library.
                </Text>
              </View>
            }
          />
        )}
      </View>
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
  screenHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  titleText: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 24,
  },
  bookCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  bookTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bookAuthor: {
    color: '#94A3B8',
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#64748B',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
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
  retryBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
