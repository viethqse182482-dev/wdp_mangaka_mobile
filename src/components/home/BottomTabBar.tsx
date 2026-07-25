/**
 * BottomTabBar — thanh điều hướng dưới đáy màn hình với phong cách khối màu.
 *
 * Đặc tính:
 *  - Floating bar, căn giữa, có margin 2 bên.
 *  - Khối màu đặc (LiquidGlass giờ chỉ là View nền màu) + glow nhẹ.
 *  - Tab active có "pill" gradient xanh + icon trắng + label bold.
 *  - Animation mount: fade + slide-up.
 */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabKey } from '../../types/story';
import { colors, motion, radius, spacing, typography } from '../../theme/colors';
import { LiquidGlass } from '../../theme/LiquidGlass';

interface TabItem {
  key: BottomTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home' },
  { key: 'ranking', label: 'BXH', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'genres', label: 'Thể loại', icon: 'grid-outline', activeIcon: 'grid' },
  { key: 'library', label: 'Tủ sách', icon: 'book-outline', activeIcon: 'book' },
  { key: 'profile', label: 'Cá nhân', icon: 'person-outline', activeIcon: 'person' },
];

interface BottomTabBarProps {
  activeTab?: BottomTabKey;
  onTabPress?: (tab: BottomTabKey) => void;
}

export function BottomTabBar({ activeTab = 'home', onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const barOpacity = useRef(new Animated.Value(0)).current;
  const barTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(barOpacity, {
        toValue: 1,
        duration: motion.base,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(barTranslate, {
        toValue: 0,
        duration: motion.base,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [barOpacity, barTranslate]);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.xs },
      ]}
    >
      <Animated.View
        style={[
          styles.bar,
          {
            opacity: barOpacity,
            transform: [{ translateY: barTranslate }],
            shadowColor: colors.accent,
            shadowOpacity: 0.4,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 16,
          },
        ]}
      >
        {/* Glow nền accent */}
        <LinearGradient
          colors={['rgba(79,139,255,0.35)', 'rgba(34,211,238,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.xl }]}
        />
        <LiquidGlass
          tint="navy"
          depth={4}
          radius={radius.xl}
          glow
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingHorizontal: spacing.xs,
            paddingVertical: spacing.xs,
          }}
          innerStyle={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingHorizontal: spacing.xs,
            paddingVertical: spacing.xs,
          }}
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              active={tab.key === activeTab}
              onPress={() => onTabPress?.(tab.key)}
            />
          ))}
        </LiquidGlass>
      </Animated.View>
    </View>
  );
}

interface TabButtonProps {
  tab: TabItem;
  active: boolean;
  onPress: () => void;
}

function TabButton({ tab, active, onPress }: TabButtonProps) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.94)).current;
  const labelOpacity = useRef(new Animated.Value(active ? 1 : 0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1 : 0.94,
        useNativeDriver: true,
        ...motion.spring,
      }),
      Animated.timing(labelOpacity, {
        toValue: active ? 1 : 0.85,
        duration: motion.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, scale, labelOpacity]);

  return (
    <Animated.View
      style={[
        styles.tab,
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
        { transform: [{ scale }] },
      ]}
      onTouchEnd={onPress}
    >
      <View style={styles.iconBox}>
        {active ? (
          <LinearGradient
            colors={colors.gradPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <Ionicons
          name={active ? tab.activeIcon : tab.icon}
          size={22}
          color={active ? colors.white : colors.textSecondary}
        />
      </View>
      <Animated.Text
        style={[
          styles.label,
          active ? styles.labelActive : null,
          { opacity: labelOpacity },
        ]}
        numberOfLines={1}
        onPress={onPress}
        suppressHighlighting
      >
        {tab.label}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      ios: { paddingTop: spacing.sm },
      default: { paddingTop: spacing.xs },
    }),
  },
  bar: {
    width: '100%',
    alignSelf: 'stretch',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
});
