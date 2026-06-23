import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';

interface HomeHeaderProps {
  onSearchPress?: () => void;
  onHistoryPress?: () => void;
}

export function HomeHeader({ onSearchPress, onHistoryPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <View>
          <Text style={styles.appName}>Mangaka</Text>
          <Text style={styles.tagline}>Đọc truyện mọi lúc</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onSearchPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="search-outline" size={22} color={colors.white} />
        </Pressable>
        <Pressable
          onPress={onHistoryPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="time-outline" size={22} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
