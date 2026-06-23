import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabKey } from '../../types/story';
import { colors, spacing } from '../../theme/colors';

interface TabItem {
  key: BottomTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home' },
  { key: 'genres', label: 'Thể loại', icon: 'grid-outline', activeIcon: 'grid' },
  { key: 'library', label: 'Tủ sách', icon: 'book-outline', activeIcon: 'book' },
  { key: 'profile', label: 'Cá nhân', icon: 'person-outline', activeIcon: 'person' },
];

interface BottomTabBarProps {
  activeTab?: BottomTabKey;
  onTabPress?: (tab: BottomTabKey) => void;
}

export function BottomTabBar({ activeTab = 'home', onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress?.(tab.key)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={isActive ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
