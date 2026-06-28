import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { BookPrepareProgress, BookPrepareStage } from '@/types/book';

interface BookPrepareModalProps {
  visible: boolean;
  bookTitle: string;
  progress: BookPrepareProgress | null;
  error: string | null;
  onCancel?: () => void;
}

const STAGE_LABELS: Record<BookPrepareStage, string> = {
  downloading: 'EPUB endirilir',
  parsing: 'Chapter-ler ayrilir',
  saving: 'DB-ye yazilir',
};

const STAGE_ORDER: BookPrepareStage[] = ['downloading', 'parsing', 'saving'];

function getStageIndex(stage: BookPrepareStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function BookPrepareModal({
  visible,
  bookTitle,
  progress,
  error,
  onCancel,
}: BookPrepareModalProps) {
  const activeIndex = progress ? getStageIndex(progress.stage) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title} numberOfLines={2}>
            {bookTitle || 'Kitab hazirlanir'}
          </Text>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <View style={styles.spinnerRow}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>

              <View style={styles.steps}>
                {STAGE_ORDER.map((stage, index) => {
                  const isActive = index === activeIndex;
                  const isDone = index < activeIndex;

                  return (
                    <View key={stage} style={styles.stepRow}>
                      <View
                        style={[
                          styles.stepDot,
                          isActive && styles.stepDotActive,
                          isDone && styles.stepDotDone,
                        ]}
                      />
                      <Text
                        style={[
                          styles.stepLabel,
                          isActive && styles.stepLabelActive,
                          isDone && styles.stepLabelDone,
                        ]}
                      >
                        {STAGE_LABELS[stage]}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.message}>
                {progress?.message ?? 'Gozleyin...'}
              </Text>

              {progress && progress.total > 1 ? (
                <Text style={styles.detail}>
                  {progress.current} / {progress.total}
                </Text>
              ) : null}
            </>
          )}

          {onCancel ? (
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={onCancel}
              disabled={!error}
            >
              <Text style={styles.cancelButtonText}>
                {error ? 'Bagla' : 'Gozleyin'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 22,
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  spinnerRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  steps: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cbd5e1',
  },
  stepDotActive: {
    backgroundColor: '#2563eb',
  },
  stepDotDone: {
    backgroundColor: '#16a34a',
  },
  stepLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  stepLabelActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  stepLabelDone: {
    color: '#16a34a',
  },
  message: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
  },
  detail: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonPressed: {
    opacity: 0.85,
  },
  cancelButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
});
