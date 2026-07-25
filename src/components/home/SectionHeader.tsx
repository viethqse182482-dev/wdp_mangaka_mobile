/**
 * SectionHeader — header cho từng section, có nút "xem thêm" dạng GlassPill.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAllPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function SectionHeader({
  title,
  subtitle,
  onSeeAllPress,
  icon,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <View style={styles.titleRow}>
          {icon ? (
            <View style={styles.iconBadge}>
              <Ionicons name={icon} size={14} color={colors.accentLight} />
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {onSeeAllPress ? (
        <Pressable
          onPress={onSeeAllPress}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.seeAllText}>Xem thêm</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accentLight} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  textGroup: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    color: colors.textPrimary,
    fontSize: 19,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.1,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    shadowColor: colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  seeAllText: {
    color: colors.accentLight,
    fontSize: 12,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});
