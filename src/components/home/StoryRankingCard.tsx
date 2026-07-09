import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '../../types/story';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryRankingCardProps {
  story: Story;
  rank: number;
  onPress: (id: string) => void;
}

export function StoryRankingCard({ story, rank, onPress }: StoryRankingCardProps) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(story.rating)));

  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={styles.coverWrapper}>
        <Image source={{ uri: story.coverUrl }} style={styles.cover} contentFit="cover" transition={200} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>

        <View style={styles.starRow}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Ionicons
              key={index}
              name={index < roundedRating ? 'star' : 'star-outline'}
              size={12}
              color={index < roundedRating ? colors.gold : colors.textMuted}
            />
          ))}
          <Text style={styles.ratingText}>{story.rating.toFixed(1)}/5</Text>
        </View>

        <Text style={styles.metaText}>Lượt đọc: {formatCompactNumber(story.views)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  coverWrapper: {
    width: 56,
    height: 80,
    borderRadius: radius.sm,
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
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  ratingText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: colors.surface,
  },
});
