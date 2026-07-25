/**
 * SolidColor — primitive khối màu đặc thay thế cho LiquidGlass cũ.
 *
 * Trước đây dùng BlurView (expo-blur) + gradient overlay + highlight + glow
 * để mô phỏng "kính lỏng" Apple Liquid Glass (VisionOS / iOS 26).
 *
 * Hiện tại đã bỏ phong cách đó, trở về khối màu bình thường:
 *  - Nền đặc theo `tint` (mapping từ GlassTint sang màu thương hiệu).
 *  - Viền hairline 1px tone nhẹ.
 *  - Không còn BlurView, không gradient overlay, không highlight,
 *    không glow, không shadow tone xanh.
 */
import { ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius as radiusTokens } from './colors';

export type GlassTint = 'light' | 'dark' | 'accent' | 'navy' | 'warm';
export type GlassDepth = 1 | 2 | 3 | 4;

interface SolidColorProps {
  children?: ReactNode;
  tint?: GlassTint;
  /** Không còn hiệu lực — giữ để không phải sửa tất cả callers. */
  depth?: GlassDepth;
  /** Không còn hiệu lực — giữ để không phải sửa tất cả callers. */
  intensity?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  /** Không còn hiệu lực — giữ để không phải sửa tất cả callers. */
  showHighlight?: boolean;
  /** Không còn hiệu lực — giữ để không phải sửa tất cả callers. */
  glow?: boolean;
  /** Không còn hiệu lực — giữ để không phải sửa tất cả callers. */
  noBlur?: boolean;
}

/** Map từ GlassTint sang màu nền đặc. */
const TINT_BG: Record<GlassTint, string> = {
  light: colors.glassLight,
  dark: colors.glassMedium,
  accent: colors.accentSoft,
  navy: colors.surfaceElevated,
  warm: colors.warmSoft,
};

/** Viền tone nhẹ theo tint. */
const TINT_BORDER: Record<GlassTint, string> = {
  light: colors.glassBorder,
  dark: colors.glassBorder,
  accent: 'rgba(79, 139, 255, 0.20)',
  navy: colors.glassBorder,
  warm: 'rgba(255, 107, 53, 0.20)',
};

/**
 * Giữ tên export cũ là `LiquidGlass` để không phải đổi toàn bộ callers.
 * Component thực chất bây giờ chỉ là một `View` màu đặc.
 */
export function LiquidGlass({
  children,
  tint = 'navy',
  radius: r = radiusTokens.lg,
  style,
  innerStyle,
}: SolidColorProps) {
  const backgroundColor = TINT_BG[tint];
  const borderColor = TINT_BORDER[tint];

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: r,
          backgroundColor,
          borderColor,
        },
        style,
      ]}
    >
      <View style={[{ borderRadius: r, overflow: 'hidden' }, innerStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

/** Thời lượng animation ngắn, dùng chung. */
export { motion } from './colors';
