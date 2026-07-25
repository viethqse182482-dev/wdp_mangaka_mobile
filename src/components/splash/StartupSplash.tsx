/**
 * StartupSplash — splash với logo + animation xuất hiện trước khi vào app.
 *
 *  - Halo pulse quanh logo (gradient cyan → accent).
 *  - Fade + scale + slide animation tuần tự cho logo → title → tagline → footer.
 *  - Glass footer pill ở dưới.
 */
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, motion, radius, spacing, typography } from '../../theme/colors';
import { LiquidGlass } from '../../theme/LiquidGlass';

interface StartupSplashProps {
  statusMessage?: string;
  /** Bắt buộc hiển thị tối thiểu (ms). Mặc định 2000ms theo yêu cầu. */
  minDurationMs?: number;
  /** Logo tùy chỉnh (mặc định = logonho.jpg trong assets). */
  logoSource?: number;
}

export function StartupSplash({
  statusMessage,
  minDurationMs = 2000,
  logoSource,
}: StartupSplashProps) {
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoTranslate = useRef(new Animated.Value(20)).current;
  const haloScale = useRef(new Animated.Value(0.6)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const loopHalo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(40),
        Animated.parallel([
          Animated.timing(haloOpacity, {
            toValue: 0.9,
            duration: motion.slow,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(haloScale, {
            toValue: 1.0,
            duration: motion.slow,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: motion.base,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: motion.base + 60,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslate, {
            toValue: 0,
            duration: motion.base,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(280),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: motion.base,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslate, {
            toValue: 0,
            duration: motion.base,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(420),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: motion.base,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(620),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: motion.base,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Halo phát sáng nhịp nhàng (pulse) quanh logo trong suốt thời gian splash
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loopHalo, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(loopHalo, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [
    logoOpacity,
    logoScale,
    logoTranslate,
    haloOpacity,
    haloScale,
    loopHalo,
    titleOpacity,
    titleTranslate,
    taglineOpacity,
    footerOpacity,
  ]);

  const haloOuter = loopHalo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.12],
  });
  const haloAlpha = loopHalo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.85],
  });

  useEffect(() => {
    if (__DEV__) {
      console.log(`[StartupSplash] minDuration=${minDurationMs}ms`);
    }
  }, [minDurationMs]);

  return (
    <LinearGradient
      colors={colors.gradSplash}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* glow nền */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bgGlow,
          {
            transform: [{ scale: haloOuter }],
            opacity: haloAlpha,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bgGlow2,
          {
            transform: [{ scale: haloOuter }],
            opacity: haloAlpha,
          },
        ]}
      />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoHalo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.cyan, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoHaloGradient}
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoTranslate }],
          }}
        >
          <View style={styles.logoBadge}>
            <Image
              source={logoSource ?? require('../../../assets/images/logonho.jpg')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslate }],
            },
          ]}
        >
          Mangaka
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Đọc truyện tranh mọi lúc mọi nơi
        </Animated.Text>
      </View>

      <Animated.View style={[styles.footerWrap, { opacity: footerOpacity }]}>
        <LiquidGlass
          tint="dark"
          depth={2}
          radius={999}
          style={styles.footerGlass}
          innerStyle={styles.footerInner}
        >
          <ActivityIndicator color={colors.accentLight} size="small" />
          <Text style={styles.status}>{statusMessage ?? 'Đang khởi động...'}</Text>
        </LiquidGlass>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 64,
  },
  bgGlow: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: colors.accent,
    opacity: 0.45,
    top: '20%',
    alignSelf: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 120,
  },
  bgGlow2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.cyan,
    opacity: 0.25,
    top: '50%',
    left: -50,
    shadowColor: colors.cyan,
    shadowOpacity: 0.6,
    shadowRadius: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHaloGradient: {
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.6,
  },
  logoBadge: {
    width: 156,
    height: 156,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    shadowColor: colors.accent,
    shadowOpacity: 0.7,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 40,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    marginTop: 28,
    letterSpacing: 1.5,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    letterSpacing: 0.6,
    fontFamily: typography.fontFamilyMedium,
  },
  footerWrap: {
    paddingHorizontal: spacing.xl,
  },
  footerGlass: {
    alignSelf: 'stretch',
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  status: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
  },
});
