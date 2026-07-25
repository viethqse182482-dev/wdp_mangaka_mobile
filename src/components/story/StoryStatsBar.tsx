/**
 * StoryStatsBar — thanh thống kê nhanh (rating, view) dạng glass card.
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { StoryDetail } from '../../types/storyDetail';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard } from '../../theme/uiPrimitives';

interface StoryStatsBarProps {
  story: StoryDetail;
}

export function StoryStatsBar({ story }: StoryStatsBarProps) {
  const items = [
    {
      icon: 'star' as const,
      label: 'Đánh giá',
      value: Number(story.rating).toFixed(1),
      accent: colors.warning,
    },
    {
      icon: 'eye' as const,
      label: 'Lượt đọc',
      value: formatCompactNumber(story.views),
      accent: colors.cyan,
    },
    {
      icon: 'layers-outline' as const,
      label: 'Số chương',
      value: `${story.chapters.length}`,
      accent: colors.accentLight,
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <GlassCard
          key={item.icon}
          tint="navy"
          depth={2}
          radius={radius.lg}
          style={{ flex: 1 }}
          innerStyle={styles.statBox}
        >
          <View style={[styles.iconBadge, { backgroundColor: `${item.accent}22` }]}>
            <Ionicons name={item.icon} size={18} color={item.accent} />
          </View>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
  },
});
