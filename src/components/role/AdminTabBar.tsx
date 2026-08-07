import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../theme/colors';

export type AdminTabKey = 'dashboard' | 'rankings' | 'finance' | 'profile';

const TABS: Array<{
  key: AdminTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
}> = [
  { key: 'dashboard', label: 'Tổng quan', icon: 'grid-outline', path: '/admin/dashboard' },
  { key: 'rankings', label: 'BXH', icon: 'trophy-outline', path: '/admin/rankings' },
  { key: 'finance', label: 'Tài chính', icon: 'wallet-outline', path: '/admin/finance' },
  { key: 'profile', label: 'Cá nhân', icon: 'person-outline', path: '/profile' },
];

export function AdminTabBar({ active }: { active: AdminTabKey }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <Pressable key={tab.key} style={styles.tab} onPress={() => router.replace(tab.path as never)}>
              <View style={[styles.icon, selected && styles.iconSelected]}>
                <Ionicons name={tab.icon} size={20} color={selected ? colors.white : colors.textMuted} />
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md },
  bar: {
    flexDirection: 'row', backgroundColor: colors.backgroundElevated,
    borderColor: colors.glassBorder, borderWidth: 1, borderRadius: radius.xl,
    padding: spacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: spacing.xs },
  icon: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  iconSelected: { backgroundColor: colors.accent },
  label: { color: colors.textMuted, fontSize: 10, fontFamily: typography.fontFamilyMedium },
  labelSelected: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold },
});
