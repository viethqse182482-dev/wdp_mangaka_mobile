/**
 * HomeHeader — header trang chủ với brand (logo nho) + search + thông báo + lịch sử.
 *
 * Thiết kế Apple Liquid Glass:
 *  - Background blur nhẹ khi cuộn (controlled từ HomeScreen qua `scrolled`).
 *  - Không border dưới cứng.
 *  - Logo dùng ảnh `assets/images/logonho.jpg`.
 */
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { NotificationBell } from './NotificationBell';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassIconButton } from '../../theme/uiPrimitives';
import { LiquidGlass } from '../../theme/LiquidGlass';

interface HomeHeaderProps {
  onSearchPress?: () => void;
  onHistoryPress?: () => void;
  scrolled?: boolean;
  searchOpen?: boolean;
}

export function HomeHeader({ onSearchPress, onHistoryPress, scrolled, searchOpen }: HomeHeaderProps) {
  const router = useRouter();
  return (
    <LiquidGlass
      tint="navy"
      depth={scrolled ? 3 : 2}
      radius={0}
      glow={scrolled}
      showHighlight
      style={styles.glassSurface}
      innerStyle={styles.inner}
    >
      <Pressable
        onPress={() => router.replace('/')}
        style={({ pressed }) => [styles.brand, pressed && { opacity: 0.7 }]}
        hitSlop={8}
      >
        <View style={styles.logoBadge}>
          <Image
            source={require('../../../assets/images/logonho.jpg')}
            style={styles.logo}
            contentFit="cover"
            transition={250}
          />
        </View>
        <View>
          <Text style={styles.appName}>Mangaka</Text>
          <Text style={styles.tagline}>Đọc truyện mọi lúc</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <GlassIconButton
          icon={searchOpen ? 'close-outline' : 'search-outline'}
          size={42}
          tint={searchOpen ? 'accent' : 'light'}
          onPress={onSearchPress}
          accessibilityLabel={searchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
        />
        <NotificationBell />
        <GlassIconButton
          icon="time-outline"
          size={42}
          tint="light"
          onPress={onHistoryPress}
        />
      </View>
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  glassSurface: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.fontFamilyMedium,
    letterSpacing: 0.1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 0,
  },
});
