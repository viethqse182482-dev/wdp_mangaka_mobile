import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chapter } from '../../types/storyDetail';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing } from '../../theme/colors';

interface ChapterListProps {
  chapters: Chapter[];
  onChapterPress?: (chapter: Chapter) => void;
}

const INITIAL_VISIBLE = 6;

export function ChapterList({ chapters, onChapterPress }: ChapterListProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleChapters = showAll ? chapters : chapters.slice(0, INITIAL_VISIBLE);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh Sách</Text>
        <View style={styles.headerActions}>
          <View style={styles.headerButton}>
            <Text style={styles.headerButtonText}>ĐI TỚI</Text>
          </View>
          <View style={[styles.headerButton, styles.headerButtonActive]}>
            <Text style={styles.headerButtonText}>CHƯƠNG</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {visibleChapters.map((chapter) => (
        <Pressable
          key={chapter.id}
          onPress={() => onChapterPress?.(chapter)}
          style={({ pressed }) => [styles.chapterRow, pressed && styles.pressed]}
        >
          <View style={styles.chapterIconBox}>
            <Ionicons name="eye" size={16} color={colors.danger} />
          </View>

          <View style={styles.chapterInfo}>
            <Text style={styles.chapterNumber}>#{chapter.number}</Text>
            <Text style={styles.chapterDate}>{chapter.releasedAt}</Text>
          </View>

          <View style={styles.views}>
            <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
            <Text style={styles.viewsText}>{formatCompactNumber(chapter.views)}</Text>
          </View>
        </Pressable>
      ))}

      {chapters.length > INITIAL_VISIBLE ? (
        <Pressable
          onPress={() => setShowAll((prev) => !prev)}
          style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}
        >
          <Text style={styles.showAllText}>
            {showAll ? 'THU GỌN' : 'HIỂN THỊ TẤT CẢ'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerButtonActive: {
    backgroundColor: colors.background,
  },
  headerButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  chapterIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterNumber: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  chapterDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  views: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  showAllButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  showAllText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.75,
  },
});
