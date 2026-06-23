import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { StoryDetail } from '../../types/storyDetail';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryStatsBarProps {
  story: StoryDetail;
}

export function StoryStatsBar({ story }: StoryStatsBarProps) {
  const items = [
    { icon: 'star' as const, value: formatCompactNumber(story.ratingCount) },
    { icon: 'eye' as const, value: formatCompactNumber(story.views) },
    { icon: 'walk' as const, value: formatCompactNumber(story.followers) },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.icon} style={styles.statBox}>
          <Ionicons name={item.icon} size={18} color={colors.textPrimary} />
          <Text style={styles.statValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function StoryRatingRow({ rating }: { rating: number }) {
  return (
    <View style={styles.ratingRow}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Ionicons
            key={index}
            name={index < rating ? 'star' : 'star-outline'}
            size={18}
            color={index < rating ? colors.gold : colors.textMuted}
          />
        ))}
      </View>
      <Text style={styles.ratingText}>
        {rating} / 5
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
