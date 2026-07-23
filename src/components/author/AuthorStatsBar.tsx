import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthorStats } from '../../services/authorService';
import { colors, radius, spacing } from '../../theme/colors';

interface AuthorStatsProps {
  stats: AuthorStats;
  onSeriesPress?: () => void;
}

interface StatCard {
  key: keyof Omit<AuthorStats, 'average_rating'>;
  label: string;
  icon: string;
  format?: (v: number) => string;
}

const STAT_CARDS: StatCard[] = [
  { key: 'total_series', label: 'Truyện', icon: '📚' },
  { key: 'total_chapters', label: 'Chương', icon: '📖' },
  { key: 'total_followers', label: 'Theo dõi', icon: '👥' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('vi-VN');
}

export function AuthorStatsBar({ stats, onSeriesPress }: AuthorStatsProps) {
  const rating =
    stats.average_rating > 0 ? stats.average_rating.toFixed(1) : null;

  return (
    <View style={styles.container}>
      {STAT_CARDS.map((card) => {
        const value = stats[card.key];
        return (
          <View key={card.key} style={styles.card}>
            <Text style={styles.icon}>{card.icon}</Text>
            <Text style={styles.value}>{formatNumber(value)}</Text>
            <Text style={styles.label}>{card.label}</Text>
          </View>
        );
      })}

      {rating !== null && (
        <View style={styles.card}>
          <Text style={styles.icon}>⭐</Text>
          <Text style={styles.value}>{rating}</Text>
          <Text style={styles.label}>Đánh giá</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});
