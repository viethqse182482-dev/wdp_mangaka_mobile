import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ReadingHistoryEntry } from '../../services/readingHistoryService';
import { formatReadTime } from '../../utils/formatReadTime';
import { colors, radius, spacing } from '../../theme/colors';

interface HistoryStoryRowProps {
  entry: ReadingHistoryEntry;
  onPress: (id: string) => void;
  onRemove: (id: string) => void;
}

export function HistoryStoryRow({ entry, onPress, onRemove }: HistoryStoryRowProps) {
  return (
    <Pressable
      onPress={() => onPress(entry.id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.coverWrapper}>
        <Image source={{ uri: entry.coverUrl }} style={styles.cover} contentFit="cover" transition={200} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {entry.title}
        </Text>

        <Text style={styles.progress}>
          Đã đọc đến chương {entry.lastReadChapter}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.readAt}>{formatReadTime(entry.readAt)}</Text>
        </View>

        <Text style={styles.continue}>Tiếp tục đọc</Text>
      </View>

      <Pressable
        onPress={() => onRemove(entry.id)}
        hitSlop={8}
        style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const COVER_WIDTH = 64;
const COVER_HEIGHT = 92;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  coverWrapper: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  progress: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  readAt: {
    color: colors.textMuted,
    fontSize: 12,
  },
  continue: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
