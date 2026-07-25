/**
 * PeriodFilter — chip chọn khoảng thời gian (Ngày/Tuần/Tháng/Tất cả) — dùng GlassPill.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { RankingPeriod } from '../../types/story';
import { colors, spacing } from '../../theme/colors';
import { GlassPill } from '../../theme/uiPrimitives';

interface PeriodFilterProps {
  selected: RankingPeriod;
  onSelect: (period: RankingPeriod) => void;
}

const PERIODS: { value: RankingPeriod; label: string; icon: any }[] = [
  { value: 'daily', label: 'Hôm nay', icon: 'sunny-outline' },
  { value: 'weekly', label: 'Tuần', icon: 'calendar-outline' },
  { value: 'monthly', label: 'Tháng', icon: 'calendar' },
  { value: 'all', label: 'Tất cả', icon: 'infinite-outline' },
];

export function PeriodFilter({ selected, onSelect }: PeriodFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PERIODS.map((period) => (
          <GlassPill
            key={period.value}
            label={period.label}
            icon={period.icon}
            active={period.value === selected}
            onPress={() => onSelect(period.value)}
            size="sm"
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});
