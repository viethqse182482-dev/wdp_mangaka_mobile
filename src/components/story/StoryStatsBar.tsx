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
    { icon: 'star' as const, value: Number(story.rating).toFixed(1) },
    { icon: 'eye' as const, value: formatCompactNumber(story.views) },
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
});
