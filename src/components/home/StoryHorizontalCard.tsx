import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Story } from '../../types/story';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryHorizontalCardProps {
  story: Story;
  rank?: number;
  onPress: (id: string) => void;
}

const CARD_WIDTH = 110;
const COVER_HEIGHT = CARD_WIDTH * 1.4;

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return String(views);
}

export function StoryHorizontalCard({ story, rank, onPress }: StoryHorizontalCardProps) {
  const hasRating = story.rating && story.rating > 0;

  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {rank != null ? (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      ) : null}

      <View style={styles.coverWrapper}>
        <Image
          source={{ uri: story.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
        {hasRating && (
          <View style={styles.ratingOverlay}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={styles.ratingText}>{story.rating}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {story.title}
      </Text>

      {hasRating ? (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={10} color={colors.warning} />
          <Text style={styles.ratingValue}> {story.rating}</Text>
          <Text style={styles.ratingCount}>({story.ratingCount})</Text>
        </View>
      ) : (
        <Text style={styles.views}>{formatViews(story.views)} lượt xem</Text>
      )}
      <Text style={styles.chapter}>Chương {story.latestChapter}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    zIndex: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  coverWrapper: {
    width: CARD_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  ratingOverlay: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  ratingText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    minHeight: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingValue: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  ratingCount: {
    color: colors.textMuted,
    fontSize: 10,
  },
  views: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  chapter: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});

export const HORIZONTAL_CARD_WIDTH = CARD_WIDTH + spacing.md;
