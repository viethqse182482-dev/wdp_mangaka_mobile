/**
 * LibraryStoryRow — row trong Library dạng GlassListItem.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BookshelfItem } from '../../services/bookshelfService';
import { FeaturedStory } from '../../types/story';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassListItem } from '../../theme/uiPrimitives';

type LibraryStoryRowProps = {
  story: BookshelfItem | (FeaturedStory & { followedAt?: string });
  onPress: (id: string) => void;
  onRemove: (id: string) => void;
  removeLabel?: string;
};

export function LibraryStoryRow({ story, onPress, onRemove, removeLabel }: LibraryStoryRowProps) {
  const isBookshelf = 'series' in story;
  const series = isBookshelf ? story.series : story;
  const cover = (series as any).cover_image_url ?? (series as any).coverUrl ?? '';
  const name = (series as any).name ?? (series as any).title ?? '';
  const genres = Array.isArray((series as any).genre) ? (series as any).genre : [];
  const totalChapters = (series as any).total_chapters ?? (series as any).totalChapters ?? 0;
  const latest = (series as any).latest_chapter_number ?? (series as any).latestChapter ?? null;
  const followedAt = 'followedAt' in story ? story.followedAt : null;

  return (
    <View style={styles.row}>
      <GlassListItem
        tint="navy"
        depth={1}
        radius={radius.lg}
        onPress={() => onPress((series as any)._id ?? (series as any).id)}
        innerStyle={styles.cardInner}
      >
        <View style={styles.coverWrapper}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="book-outline" size={24} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {name || 'Truyện chưa đặt tên'}
          </Text>

          {genres.length > 0 ? (
            <Text style={styles.genres} numberOfLines={1}>
              {genres.join(' · ')}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.chapter}>
              {totalChapters > 0
                ? latest != null
                  ? `Chương ${latest}/${totalChapters}`
                  : `${totalChapters} chương`
                : 'Chưa có chương'}
            </Text>
            {followedAt ? (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.updatedAt}>{formatDate(followedAt)}</Text>
              </>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => onRemove((series as any)._id ?? (series as any).id)}
          hitSlop={8}
          style={({ pressed }) => [styles.unfollowButton, pressed && styles.pressed]}
        >
          <Ionicons
            name={removeLabel === 'Bỏ theo dõi' ? 'heart' : 'bookmark'}
            size={18}
            color={colors.accentLight}
          />
        </Pressable>
      </GlassListItem>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
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
    alignItems: 'center',
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
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  genres: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: typography.fontFamilyMedium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.xs,
  },
  chapter: {
    color: colors.cyan,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  dot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  updatedAt: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
  },
  unfollowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pressed: {
    opacity: 0.75,
  },
});
