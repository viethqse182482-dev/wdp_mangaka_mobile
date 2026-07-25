/**
 * ChapterList — danh sách chapter dạng glass card, có nút "Xem tất cả".
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chapter } from '../../types/storyDetail';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard } from '../../theme/uiPrimitives';

interface ChapterListProps {
  chapters: Chapter[];
  latestChapterNumber?: number;
  onChapterPress?: (chapter: Chapter) => void;
}

const INITIAL_VISIBLE = 6;

export function ChapterList({
  chapters,
  latestChapterNumber,
  onChapterPress,
}: ChapterListProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleChapters = showAll ? chapters : chapters.slice(0, INITIAL_VISIBLE);

  return (
    <GlassCard
      tint="navy"
      depth={2}
      radius={radius.lg}
      innerStyle={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleBadge}>
            <Ionicons name="list" size={14} color={colors.cyan} />
          </View>
          <Text style={styles.title}>Danh sách chương</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{chapters.length} chương</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {visibleChapters.map((chapter, idx) => (
        <ChapterRow
          key={chapter.id}
          chapter={chapter}
          latest={
            latestChapterNumber != null
              ? chapter.number === latestChapterNumber
              : idx === 0
          }
          onPress={() => onChapterPress?.(chapter)}
        />
      ))}

      {chapters.length > INITIAL_VISIBLE ? (
        <Pressable
          onPress={() => setShowAll((prev) => !prev)}
          style={({ pressed }) => [
            styles.showAllButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.showAllText}>
            {showAll ? 'Thu gọn' : `Hiển thị tất cả (${chapters.length})`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.accentLight}
          />
        </Pressable>
      ) : null}
    </GlassCard>
  );
}

function ChapterRow({
  chapter,
  latest,
  onPress,
}: {
  chapter: Chapter;
  latest: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chapterRow, pressed && styles.pressed]}
    >
      {chapter.coverUrl ? (
        <Image
          source={{ uri: chapter.coverUrl }}
          style={styles.chapterIcon}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={
            latest
              ? [colors.accent, colors.cyan]
              : [colors.surfaceElevated, colors.surface]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chapterIcon}
        >
          <Ionicons
            name={latest ? 'flame' : 'book-outline'}
            size={16}
            color={colors.white}
          />
        </LinearGradient>
      )}

      <View style={styles.chapterInfo}>
        <Text style={styles.chapterNumber} numberOfLines={1}>
          Chương {chapter.number}
          {latest ? <Text style={styles.latestTag}>  • MỚI NHẤT</Text> : null}
        </Text>
        <Text style={styles.chapterDate} numberOfLines={1}>
          {chapter.releasedAt}
        </Text>
      </View>

      <View style={styles.views}>
        <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
        <Text style={styles.viewsText}>
          {formatCompactNumber(chapter.views)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countPill: {
    backgroundColor: colors.glassLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.md,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glassLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  chapterIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterInfo: {
    flex: 1,
    minWidth: 0,
  },
  chapterNumber: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  latestTag: {
    color: colors.cyan,
    fontSize: 11,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chapterDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.fontFamilyMedium,
  },
  views: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
  },
  showAllText: {
    color: colors.accentLight,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
});
