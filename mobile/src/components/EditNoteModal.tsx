import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { X, Plus, Trash2, Check } from 'lucide-react-native';
import { KeyQuote, NoteItem, StructuredNoteResponse } from '../types';

interface EditNoteModalProps {
  visible: boolean;
  note: StructuredNoteResponse | NoteItem | null;
  onClose: () => void;
  onSave: (updatedData: {
    summary: string;
    key_takeaways: string[];
    key_quotes: KeyQuote[];
  }) => Promise<void>;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  visible,
  note,
  onClose,
  onSave,
}) => {
  const [summary, setSummary] = useState<string>('');
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<KeyQuote[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (note) {
      setSummary(note.summary || '');
      const noteTakeaways =
        'actionable_takeaways' in note
          ? note.actionable_takeaways
          : note.key_takeaways;
      setTakeaways(noteTakeaways ? [...noteTakeaways] : []);
      setQuotes(note.key_quotes ? [...note.key_quotes] : []);
    }
  }, [note]);

  const handleAddTakeaway = () => {
    setTakeaways([...takeaways, '']);
  };

  const handleUpdateTakeaway = (text: string, index: number) => {
    const updated = [...takeaways];
    updated[index] = text;
    setTakeaways(updated);
  };

  const handleRemoveTakeaway = (index: number) => {
    setTakeaways(takeaways.filter((_, i) => i !== index));
  };

  const handleAddQuote = () => {
    setQuotes([...quotes, { quote: '', chapter_or_topic: '', context: '' }]);
  };

  const handleUpdateQuote = (
    field: keyof KeyQuote,
    value: string,
    index: number
  ) => {
    const updated = [...quotes];
    updated[index] = { ...updated[index], [field]: value };
    setQuotes(updated);
  };

  const handleRemoveQuote = (index: number) => {
    setQuotes(quotes.filter((_, i) => i !== index));
  };

  const handleSavePress = async () => {
    try {
      setSaving(true);
      await onSave({
        summary,
        key_takeaways: takeaways.filter((t) => t.trim().length > 0),
        key_quotes: quotes.filter((q) => q.quote.trim().length > 0),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save edited note', err);
    } finally {
      setSaving(false);
    }
  };

  if (!note) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#94A3B8" size={24} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Book Note</Text>

          <TouchableOpacity
            onPress={handleSavePress}
            disabled={saving}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Check color="#FFFFFF" size={18} />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary Input */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Executive Summary</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              multiline
              numberOfLines={4}
              value={summary}
              onChangeText={setSummary}
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Actionable Takeaways */}
          <View style={styles.fieldSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Actionable Takeaways</Text>
              <TouchableOpacity
                onPress={handleAddTakeaway}
                style={styles.addItemBtn}
              >
                <Plus color="#6366F1" size={16} />
                <Text style={styles.addItemBtnText}>Add Bullet</Text>
              </TouchableOpacity>
            </View>

            {takeaways.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <TextInput
                  style={[styles.input, styles.itemInput]}
                  value={item}
                  onChangeText={(text) => handleUpdateTakeaway(text, index)}
                  placeholder={`Takeaway #${index + 1}`}
                  placeholderTextColor="#64748B"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveTakeaway(index)}
                  style={styles.deleteItemBtn}
                >
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Key Quotes */}
          <View style={styles.fieldSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Key Quotes</Text>
              <TouchableOpacity
                onPress={handleAddQuote}
                style={styles.addItemBtn}
              >
                <Plus color="#8B5CF6" size={16} />
                <Text style={styles.addItemBtnText}>Add Quote</Text>
              </TouchableOpacity>
            </View>

            {quotes.map((q, index) => (
              <View key={index} style={styles.quoteBox}>
                <View style={styles.quoteBoxHeader}>
                  <Text style={styles.quoteBoxTitle}>Quote #{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveQuote(index)}
                  >
                    <Trash2 color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.quoteTextInput]}
                  multiline
                  value={q.quote}
                  onChangeText={(text) =>
                    handleUpdateQuote('quote', text, index)
                  }
                  placeholder="Quote text..."
                  placeholderTextColor="#64748B"
                />
                <TextInput
                  style={styles.input}
                  value={q.chapter_or_topic || ''}
                  onChangeText={(text) =>
                    handleUpdateQuote('chapter_or_topic', text, index)
                  }
                  placeholder="Chapter or Topic Context (Optional)"
                  placeholderTextColor="#64748B"
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fieldSection: {
    marginBottom: 24,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemBtnText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemInput: {
    flex: 1,
  },
  deleteItemBtn: {
    padding: 8,
  },
  quoteBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  quoteBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteBoxTitle: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },
  quoteTextInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
