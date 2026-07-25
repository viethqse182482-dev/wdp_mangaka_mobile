/**
 * StoryRankingCard — card dạng row cho ranking.
 *
 *  - Top 3 rank badge gradient (gold/silver/bronze).
 *  - Cover nhỏ + title + rating row + meta.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '../../types/story';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing, typography } from '../../theme/colors';

interface StoryRankingCardProps {
  story: Story;
  rank: number;
  onPress: (id: string) => void;
}

const RANK_COLORS: Record<number, [string, string]> = {
  1: ['#FFD56B', '#FF9A3D'],
  2: ['#E8ECEF', '#A5B0BD'],
  3: ['#F4A56A', '#B86E3C'],
};

export function StoryRankingCard({ story, rank, onPress }: StoryRankingCardProps) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(story.rating ?? 0)));
  const isTop3 = rank <= 3;

  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 },
      ]}
    >
      {isTop3 ? (
        <LinearGradient
          colors={RANK_COLORS[rank]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rankBadge}
        >
          <Text style={styles.rankText}>{rank}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.rankBadge, styles.rankBadgeMuted]}>
          <Text style={styles.rankTextMuted}>{rank}</Text>
        </View>
      )}

      <View style={styles.coverWrapper}>
        <Image
          source={{ uri: story.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
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
              color={index < roundedRating ? colors.warning : colors.textMuted}
            />
          ))}
          <Text style={styles.ratingText}>{(story.rating ?? 0).toFixed(1)}/5</Text>
        </View>

        <Text style={styles.metaText}>Lượt đọc: {formatCompactNumber(story.views)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.warning,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  rankBadgeMuted: {
    backgroundColor: colors.glassMedium,
    shadowOpacity: 0,
  },
  rankText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  rankTextMuted: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  coverWrapper: {
    width: 56,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
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
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  ratingText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
  },
});
