/**
 * Theme tokens cho toàn bộ app.
 *
 * Hướng thiết kế hiện tại:
 *  - Khối màu đặc thay cho Apple Liquid Glass (VisionOS / iOS 26).
 *  - Không còn BlurView, không gradient overlay, không highlight phản chiếu.
 *  - Tông màu mát mẻ (xanh dương) làm primary, dark mode first.
 *  - Font Roboto làm base (đã có trong assets, hỗ trợ đầy đủ tiếng Việt có dấu).
 *
 * Lưu ý: KHÔNG dùng font hệ thống vì một số thiết bị Android không render
 * đúng dấu tiếng Việt (ă, â, ư, ơ, ế, ể…). Roboto hỗ trợ đầy đủ.
 */
import { Platform, TextStyle } from 'react-native';

export const colors = {
  // Nền chính — gradient mát mẻ từ xanh đen -> xanh dương sâu
  background: '#070B1A',
  backgroundElevated: '#0C1226',
  surface: '#0F1832',
  surfaceElevated: '#142048',
  surfaceMuted: '#0B1228',

  // Glass tokens — dùng cho liquid glass (trong suốt + border glow)
  glassLight: 'rgba(255, 255, 255, 0.06)',
  glassMedium: 'rgba(255, 255, 255, 0.10)',
  glassHeavy: 'rgba(255, 255, 255, 0.14)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.18)',

  // Glass depth (intensity cho BlurView)
  glassDepth1: 12,
  glassDepth2: 20,
  glassDepth3: 32,
  glassDepth4: 48,

  // Text
  textPrimary: '#F4F7FF',
  textSecondary: '#B5C0E0',
  textMuted: '#7E8AB0',
  textInverse: '#070B1A',

  // Accent — xanh dương sáng làm primary
  accent: '#4F8BFF',
  accentSoft: 'rgba(79, 139, 255, 0.18)',
  accentGlow: 'rgba(79, 139, 255, 0.45)',
  accentDeep: '#1F58D9',
  accentLight: '#8AB4FF',

  // Cyan phụ trợ — cho highlight/gradient
  cyan: '#22D3EE',
  cyanSoft: 'rgba(34, 211, 238, 0.20)',

  // Warm CTA — cho nút "ĐỌC NGAY" / call-to-action nổi bật
  warm: '#FF6B35',
  warmSoft: 'rgba(255, 107, 53, 0.18)',
  warmGlow: 'rgba(255, 107, 53, 0.40)',

  // Phụ trợ
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.18)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.18)',

  white: '#FFFFFF',
  black: '#000000',

  // Legacy aliases (for backward compatibility with pre-redesign components)
  /** @deprecated dùng glassBorder */
  border: 'rgba(255, 255, 255, 0.08)',
  /** @deprecated dùng warning */
  gold: '#FFD700',
  /** @deprecated dùng backgroundElevated */
  card: '#0C1226',

  // Gradients (dùng với expo-linear-gradient)
  gradBg: ['#0A1130', '#070B1A'] as const,
  gradSplash: ['#0A1130', '#0E1A45', '#070B1A'] as const,
  gradPrimary: ['#4F8BFF', '#22D3EE'] as const,
  gradPrimarySoft: ['rgba(79, 139, 255, 0.85)', 'rgba(34, 211, 238, 0.75)'] as const,
  gradWarm: ['#FF8E53', '#FF6B35'] as const,
  gradCard: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as const,
  gradBanner: ['rgba(7, 11, 26, 0)', 'rgba(7, 11, 26, 0.55)', 'rgba(7, 11, 26, 0.95)'] as const,
  gradHero: ['rgba(7, 11, 26, 0)', 'rgba(7, 11, 26, 0.35)', '#070B1A'] as const,
  gradScrim: ['rgba(7,11,26,0)', 'rgba(7,11,26,0.4)', 'rgba(7,11,26,0.85)'] as const,

  // Shadows — mềm, tone xanh
  shadow: {
    color: '#0A1A4A',
    soft: 'rgba(15, 24, 70, 0.40)',
    glow: 'rgba(79, 139, 255, 0.30)',
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/**
 * Typography scale theo phong cách Apple (iOS 17+):
 *  display, title1, title2, title3, body, callout, footnote, caption, caption2.
 * Tất cả dùng font Roboto (đã load qua expo-font) để hỗ trợ TV có dấu.
 */
export const typography = {
  fontFamilyRegular: 'Roboto-Regular',
  fontFamilyMedium: 'Roboto-Medium',
  fontFamilyBold: 'Roboto-Bold',
  // Vì Roboto không có sẵn trên mọi platform, fallback an toàn cho dấu TV.
  fontFamilyPlatform: Platform.select({
    android: 'sans-serif',
    ios: 'System',
    default: 'System',
  }),

  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 0.4 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 0.36 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' as TextStyle['fontWeight'], letterSpacing: 0.38 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: -0.41 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: -0.32 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: -0.08 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as TextStyle['fontWeight'], letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500' as TextStyle['fontWeight'], letterSpacing: 0.07 },
} as const;

export const motion = {
  fast: 160,
  base: 240,
  slow: 360,
  // Spring config mặc định cho các animation dạng scale/opacity
  spring: {
    damping: 16,
    stiffness: 220,
    mass: 0.7,
  },
  // Spring mượt hơn cho sheet/modal
  springGentle: {
    damping: 22,
    stiffness: 180,
    mass: 0.9,
  },
} as const;

/**
 * Map từ depth (1..4) -> intensity cho BlurView.
 * Apple Liquid Glass: depth1 nhẹ, depth4 nặng.
 */
export function blurIntensityFor(depth: 1 | 2 | 3 | 4): number {
  switch (depth) {
    case 1:
      return 8;
    case 2:
      return 16;
    case 3:
      return 28;
    case 4:
      return 48;
    default:
      return 16;
  }
}
