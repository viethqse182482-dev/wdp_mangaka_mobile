import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BookshelfItem } from '../../services/bookshelfService';
import { FeaturedStory } from '../../types/story';
import { colors, radius, spacing } from '../../theme/colors';

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
    <Pressable
      onPress={() => onPress(series._id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
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
        onPress={() => onRemove(series._id)}
        hitSlop={8}
        style={({ pressed }) => [styles.unfollowButton, pressed && styles.pressed]}
      >
        <Ionicons
          name={removeLabel === 'Bỏ theo dõi' ? 'heart' : 'bookmark'}
          size={20}
          color={colors.accent}
        />
      </Pressable>
    </Pressable>
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

const COVER_WIDTH = 64;
const COVER_HEIGHT = 92;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
    lineHeight: 20,
  },
  genres: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.xs,
  },
  chapter: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  updatedAt: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  unfollowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});