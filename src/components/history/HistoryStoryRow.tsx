/**
 * HistoryStoryRow — row lịch sử đọc dạng GlassListItem.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ReadingHistoryEntry } from '../../services/readingHistoryService';
import { formatReadTime } from '../../utils/formatReadTime';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassListItem } from '../../theme/uiPrimitives';

interface HistoryStoryRowProps {
  entry: ReadingHistoryEntry;
  onPress: (id: string) => void;
  onRemove: (id: string) => void;
}

export function HistoryStoryRow({ entry, onPress, onRemove }: HistoryStoryRowProps) {
  return (
    <View style={styles.row}>
      <GlassListItem
        tint="navy"
        depth={1}
        radius={radius.lg}
        onPress={() => onPress(entry.id)}
        innerStyle={styles.cardInner}
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

          <Text style={styles.continue}>Tiếp tục đọc →</Text>
        </View>

        <Pressable
          onPress={() => onRemove(entry.id)}
          hitSlop={8}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </GlassListItem>
    </View>
  );
}

const COVER_WIDTH = 60;
const COVER_HEIGHT = 86;

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
  },
  coverWrapper: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  progress: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    fontFamily: typography.fontFamilyMedium,
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
    fontFamily: typography.fontFamilyMedium,
  },
  continue: {
    color: colors.accentLight,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
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
