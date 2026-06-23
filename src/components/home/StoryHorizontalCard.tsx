import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Story } from '../../types/story';
import { colors, radius, spacing } from '../../theme/colors';
import { FollowButton } from '../library/FollowButton';

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
        <View style={styles.followButton}>
          <FollowButton story={story} size={18} />
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {story.title}
      </Text>

      <Text style={styles.views}>{formatViews(story.views)} lượt xem</Text>
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
  followButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    minHeight: 32,
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
