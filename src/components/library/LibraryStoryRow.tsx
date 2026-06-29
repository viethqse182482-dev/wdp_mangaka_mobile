import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BookshelfItem } from '../../services/bookshelfService';
import { colors, radius, spacing } from '../../theme/colors';

interface LibraryStoryRowProps {
  story: BookshelfItem;
  onPress: (id: string) => void;
  onRemove: (id: string) => void;
}

export function LibraryStoryRow({ story, onPress, onRemove }: LibraryStoryRowProps) {
  const { series } = story;
  const cover = series.cover_image_url ?? '';
  const genres = Array.isArray(series.genre) ? series.genre : [];
  const totalChapters = series.total_chapters ?? 0;
  const latest = series.latest_chapter_number ?? null;
  const addedAt = formatAddedAt(story.added_at);

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
          {series.name || 'Truyện chưa đặt tên'}
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
          <Text style={styles.dot}>•</Text>
          <Text style={styles.updatedAt}>{addedAt}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => onRemove(series._id)}
        hitSlop={8}
        style={({ pressed }) => [styles.unfollowButton, pressed && styles.pressed]}
      >
        <Ionicons name="bookmark" size={20} color={colors.accent} />
      </Pressable>
    </Pressable>
  );
}

function formatAddedAt(iso: string): string {
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