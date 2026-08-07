import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export function SegmentedFilter<T extends string>({ value, options, onChange }: { value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = option.value === value;
        return <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.item, active && styles.active]}><Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text></Pressable>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 3, gap: 3, borderRadius: radius.lg, backgroundColor: colors.glassLight },
  item: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: spacing.xs },
  active: { backgroundColor: colors.accent }, label: { color: colors.textMuted, fontSize: 12, fontFamily: typography.fontFamilyMedium }, activeLabel: { color: colors.white, fontFamily: typography.fontFamilyBold },
});
