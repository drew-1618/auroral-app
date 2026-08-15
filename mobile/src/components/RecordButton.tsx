import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mic, Square, Check, AlertCircle } from 'lucide-react-native';
import { RecordingStatus } from '../types';

interface RecordButtonProps {
  status: RecordingStatus;
  durationSeconds: number;
  onPress: () => void;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  status,
  durationSeconds,
  onPress,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'recording':
        return 'Recording Audio...';
      case 'uploading':
        return 'Transcribing & Extracting...';
      case 'success':
        return 'Note Processed!';
      case 'error':
        return 'Processing Failed. Tap to Retry';
      default:
        return 'Tap to Record Book Note';
    }
  };

  return (
    <View style={styles.container}>
      {status === 'recording' && (
        <Text style={styles.timerText}>{formatTimer(durationSeconds)}</Text>
      )}

      <View style={styles.buttonWrapper}>
        {status === 'recording' && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          disabled={status === 'uploading'}
          style={[
            styles.button,
            status === 'recording' && styles.recordingButton,
            status === 'uploading' && styles.uploadingButton,
            status === 'error' && styles.errorButton,
          ]}
        >
          {status === 'idle' && <Mic color="#FFFFFF" size={36} />}
          {status === 'recording' && <Square color="#FFFFFF" size={32} fill="#FFFFFF" />}
          {status === 'uploading' && <ActivityIndicator size="large" color="#FFFFFF" />}
          {status === 'success' && <Check color="#FFFFFF" size={36} />}
          {status === 'error' && <AlertCircle color="#FFFFFF" size={36} />}
        </TouchableOpacity>
      </View>

      <Text
        style={[
          styles.statusText,
          status === 'recording' && styles.recordingStatusText,
          status === 'error' && styles.errorStatusText,
        ]}
      >
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  timerText: {
    color: '#F43F5E',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 100,
    height: 100,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(244, 63, 94, 0.35)',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#F43F5E',
    shadowColor: '#F43F5E',
  },
  uploadingButton: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  errorButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  recordingStatusText: {
    color: '#F43F5E',
  },
  errorStatusText: {
    color: '#EF4444',
  },
});
