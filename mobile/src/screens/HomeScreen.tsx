import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { Settings, Server, Check, Bookmark } from 'lucide-react-native';
import { RecordButton } from '../components/RecordButton';
import { NoteCard } from '../components/NoteCard';
import { getApiBaseUrl, setApiBaseUrl, uploadAudioForProcessing } from '../services/api';
import {
  triggerErrorHaptic,
  triggerStartHaptic,
  triggerStopHaptic,
  triggerSuccessHaptic,
} from '../services/audio';
import { RecordingStatus, StructuredNoteResponse } from '../types';

interface HomeScreenProps {
  route?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ route }) => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookAuthor, setBookAuthor] = useState<string>('');
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [boundBookId, setBoundBookId] = useState<number | undefined>(undefined);
  const [boundChapterId, setBoundChapterId] = useState<number | undefined>(undefined);
  const [serverUrl, setServerUrl] = useState<string>(getApiBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState<boolean>(false);
  const [noteResult, setNoteResult] = useState<StructuredNoteResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (route?.params) {
      const {
        preboundBookId,
        preboundBookTitle,
        preboundBookAuthor,
        preboundChapterId,
        preboundChapterTitle,
      } = route.params;

      if (preboundBookId) setBoundBookId(preboundBookId);
      if (preboundBookTitle) setBookTitle(preboundBookTitle);
      if (preboundBookAuthor) setBookAuthor(preboundBookAuthor);
      if (preboundChapterId) setBoundChapterId(preboundChapterId);
      if (preboundChapterTitle) setChapterTitle(preboundChapterTitle);
    }
  }, [route?.params]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSaveServerUrl = () => {
    setApiBaseUrl(serverUrl);
    setShowServerConfig(false);
  };

  const startTimer = () => {
    setDurationSeconds(0);
    timerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    try {
      setErrorMessage(null);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required to record book notes.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setStatus('recording');
      startTimer();
      await triggerStartHaptic();
    } catch (err: any) {
      console.error('Failed to start recording', err);
      setStatus('error');
      setErrorMessage(err.message || 'Could not access microphone');
      await triggerErrorHaptic();
    }
  };

  const handleStopRecording = async () => {
    try {
      stopTimer();
      await triggerStopHaptic();
      setStatus('uploading');

      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('Recording URI not found');
      }

      const structuredNote = await uploadAudioForProcessing(
        uri,
        bookTitle,
        bookAuthor,
        serverUrl,
        boundBookId,
        boundChapterId,
        chapterTitle
      );

      setNoteResult(structuredNote);
      setStatus('success');
      await triggerSuccessHaptic();
    } catch (err: any) {
      console.error('Error processing audio', err);
      setStatus('error');
      const msg = err.message || 'Failed to process audio';
      setErrorMessage(msg);
      setShowServerConfig(true);
      await triggerErrorHaptic();
    }
  };

  const handlePressRecord = () => {
    if (status === 'idle' || status === 'success' || status === 'error') {
      handleStartRecording();
    } else if (status === 'recording') {
      handleStopRecording();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.titleText}>Auroral</Text>
          <Text style={styles.subtitleText}>
            Voice-to-Structured Book Notes
          </Text>
        </View>

        {/* Server Config Toggle Bar */}
        <TouchableOpacity
          style={styles.serverBar}
          activeOpacity={0.7}
          onPress={() => setShowServerConfig(!showServerConfig)}
        >
          <Server color="#6366F1" size={16} />
          <Text style={styles.serverBarText} numberOfLines={1}>
            Server: {serverUrl}
          </Text>
          <Settings color="#94A3B8" size={16} />
        </TouchableOpacity>

        {/* Expanded Server Config Form */}
        {showServerConfig && (
          <View style={styles.serverConfigCard}>
            <Text style={styles.serverConfigTitle}>Backend Server URL</Text>
            <Text style={styles.serverConfigSubtitle}>
              Enter your computer's Wi-Fi IP (e.g., http://192.168.1.50:8000) or ngrok URL:
            </Text>
            <View style={styles.serverInputRow}>
              <TextInput
                style={[styles.input, styles.serverInput]}
                placeholder="http://192.168.1.X:8000"
                placeholderTextColor="#64748B"
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.saveServerBtn}
                onPress={handleSaveServerUrl}
              >
                <Check color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* In-Context Bound Metadata Banner */}
        {(boundBookId || boundChapterId) && (
          <View style={styles.contextBanner}>
            <Bookmark color="#6366F1" size={16} />
            <Text style={styles.contextBannerText}>
              Recording bound to: {bookTitle} {chapterTitle ? `• ${chapterTitle}` : ''}
            </Text>
          </View>
        )}

        {/* Optional Metadata Inputs */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Book Title (Optional)"
            placeholderTextColor="#64748B"
            value={bookTitle}
            onChangeText={setBookTitle}
            editable={status !== 'recording' && status !== 'uploading'}
          />
          <TextInput
            style={styles.input}
            placeholder="Author (Optional)"
            placeholderTextColor="#64748B"
            value={bookAuthor}
            onChangeText={setBookAuthor}
            editable={status !== 'recording' && status !== 'uploading'}
          />
          <TextInput
            style={styles.input}
            placeholder="Chapter / Topic (Optional)"
            placeholderTextColor="#64748B"
            value={chapterTitle}
            onChangeText={setChapterTitle}
            editable={status !== 'recording' && status !== 'uploading'}
          />
        </View>

        {/* Record Control */}
        <RecordButton
          status={status}
          durationSeconds={durationSeconds}
          onPress={handlePressRecord}
        />

        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Structured Note Result */}
        {noteResult && <NoteCard note={noteResult} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  titleText: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  serverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serverBarText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  serverConfigCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  serverConfigTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  serverConfigSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  serverInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serverInput: {
    flex: 1,
  },
  saveServerBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  contextBannerText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    gap: 10,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginTop: 4,
  },
});
