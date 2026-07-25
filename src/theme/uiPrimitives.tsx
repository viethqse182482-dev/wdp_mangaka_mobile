/**
 * Bộ primitive UI dùng chung cho toàn app, theo design system mới:
 *  - Khối màu đặc thay cho Apple Liquid Glass (VisionOS / iOS 26)
 *  - Không còn BlurView, không gradient overlay, không highlight trên cùng
 *  - Gradient xanh dương làm primary, warm cam cho CTA nổi bật
 *  - Animation: pressed scale 0.97 + opacity 0.85
 *  - Typography scale Apple (display/title1..caption2)
 */
import { forwardRef, ReactNode, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ModalProps,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  radius,
  spacing,
  typography,
  motion,
} from './colors';
import { GlassTint, GlassDepth, LiquidGlass } from './LiquidGlass';

export { LiquidGlass };
export type { GlassTint, GlassDepth };

/* =====================================================================
 * GradientButton — CTA gradient (primary/secondary/ghost/subtle/warm).
 * ===================================================================== */
interface GradientButtonProps {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'subtle' | 'warm' | 'accent';
  /** Alias thân thiện hơn cho `variant`. Ưu tiên `tint` nếu cả hai truyền. */
  tint?: 'primary' | 'secondary' | 'ghost' | 'subtle' | 'warm' | 'accent';
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}

export function GradientButton({
  label,
  onPress,
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth = false,
  size = 'md',
  variant,
  tint,
  style,
  glow = false,
}: GradientButtonProps) {
  const resolvedVariant = ((tint as any) ?? variant ?? 'primary') as NonNullable<
    GradientButtonProps['variant'] | GradientButtonProps['tint']
  >;
  const heightBySize = size === 'sm' ? 38 : size === 'lg' ? 56 : 48;
  const fontSizeBySize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;
  const iconSize = fontSizeBySize + 2;

  const gradientColors =
    resolvedVariant === 'warm'
      ? colors.gradWarm
      : resolvedVariant === 'primary' || resolvedVariant === 'accent'
      ? colors.gradPrimary
      : undefined;

  const labelColor =
    resolvedVariant === 'primary' || resolvedVariant === 'accent' || resolvedVariant === 'warm'
      ? colors.white
      : resolvedVariant === 'subtle'
      ? colors.accentLight
      : resolvedVariant === 'secondary'
      ? colors.textPrimary
      : colors.textPrimary;

  const iconColor = labelColor;

  const renderInner = () => {
    if (loading) return <ActivityIndicator color={labelColor} />;
    return (
      <>
        {icon ? <Ionicons name={icon} size={iconSize} color={iconColor} /> : null}
        <Text
          style={[
            styles.buttonLabel,
            {
              fontSize: fontSizeBySize,
              color: labelColor,
              letterSpacing:
                resolvedVariant === 'primary' || resolvedVariant === 'accent' || resolvedVariant === 'warm' ? 0.6 : 0.2,
            },
          ]}
        >
          {label}
        </Text>
        {iconRight ? <Ionicons name={iconRight} size={iconSize} color={iconColor} /> : null}
      </>
    );
  };

  const containerStyle: ViewStyle = {
    height: heightBySize,
    borderRadius: size === 'sm' ? radius.md : size === 'lg' ? radius.xl : radius.lg,
    overflow: 'hidden',
  };

  const innerBg: ViewStyle = (() => {
    if (resolvedVariant === 'primary' || resolvedVariant === 'accent' || resolvedVariant === 'warm') return {};
    if (resolvedVariant === 'subtle') return { backgroundColor: colors.accentSoft };
    if (resolvedVariant === 'secondary') return { backgroundColor: colors.glassMedium };
    return { backgroundColor: 'rgba(255,255,255,0.05)' };
  })();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          shadowColor: glow ? colors.accentGlow : 'transparent',
          shadowOpacity: glow ? 0.6 : 0,
          shadowRadius: glow ? 18 : 0,
          shadowOffset: { width: 0, height: glow ? 8 : 0 },
          elevation: glow ? 12 : 0,
        },
        style,
      ]}
    >
      <View style={[styles.buttonBase, containerStyle, innerBg]}>
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject]}
          />
        ) : null}
        {resolvedVariant === 'primary' || resolvedVariant === 'accent' || resolvedVariant === 'warm' ? (
          <View pointerEvents="none" style={styles.buttonShine} />
        ) : null}
        {renderInner()}
      </View>
    </Pressable>
  );
}

/* =====================================================================
 * GlassCard — panel nội dung liquid glass.
 * ===================================================================== */
interface GlassCardProps {
  children: ReactNode;
  tint?: GlassTint;
  depth?: GlassDepth;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  glow?: boolean;
  showHighlight?: boolean;
  noBlur?: boolean;
}

export function GlassCard({
  children,
  tint = 'navy',
  depth = 2,
  radius: r = radius.lg,
  style,
  innerStyle,
  glow = false,
  showHighlight = true,
  noBlur = false,
}: GlassCardProps) {
  return (
    <LiquidGlass
      tint={tint}
      depth={depth}
      radius={r}
      glow={glow}
      showHighlight={showHighlight}
      noBlur={noBlur}
      style={[{ alignSelf: 'stretch' }, style]}
      innerStyle={[{ alignSelf: 'stretch' }, innerStyle]}
    >
      {children}
    </LiquidGlass>
  );
}

/* =====================================================================
 * Tag — viên thẻ nhỏ gắn nhãn (thể loại, badge, ...).
 * ===================================================================== */
interface TagProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'accent' | 'cyan' | 'success' | 'danger' | 'warning' | 'warm' | 'solid';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Tag({ label, icon, variant = 'default', size = 'sm', style }: TagProps) {
  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'accent':
        return { backgroundColor: colors.accentSoft };
      case 'cyan':
        return { backgroundColor: colors.cyanSoft };
      case 'success':
        return { backgroundColor: colors.successSoft };
      case 'danger':
        return { backgroundColor: colors.dangerSoft };
      case 'warning':
        return { backgroundColor: colors.warningSoft };
      case 'warm':
        return { backgroundColor: colors.warmSoft };
      case 'solid':
        return { backgroundColor: colors.accent };
      default:
        return { backgroundColor: colors.glassLight };
    }
  })();

  const variantText: TextStyle = (() => {
    switch (variant) {
      case 'accent':
        return { color: colors.accentLight };
      case 'cyan':
        return { color: colors.cyan };
      case 'success':
        return { color: colors.success };
      case 'danger':
        return { color: colors.danger };
      case 'warning':
        return { color: colors.warning };
      case 'warm':
        return { color: colors.warm };
      case 'solid':
        return { color: colors.white };
      default:
        return { color: colors.textSecondary };
    }
  })();

  const padV = size === 'sm' ? 4 : 6;
  const padH = size === 'sm' ? spacing.sm : spacing.md;
  const fontSize = size === 'sm' ? 11 : 12;
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: variantStyle.backgroundColor,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={iconSize} color={variantText.color as string} /> : null}
      <Text
        style={[styles.tagText, { color: variantText.color, fontSize }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

/* =====================================================================
 * GlassIconButton — icon button tròn kiểu glass.
 * ===================================================================== */
interface GlassIconButtonProps extends Omit<PressableProps, 'style'> {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  tint?: GlassTint;
  badge?: number | null;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function GlassIconButton({
  icon,
  size = 44,
  tint = 'light',
  badge,
  color,
  style,
  ...rest
}: GlassIconButtonProps) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.94 : 1 }],
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <LiquidGlass
        tint={tint}
        depth={2}
        radius={size / 2}
        showHighlight
        style={StyleSheet.absoluteFillObject as ViewStyle}
      />
      <Ionicons
        name={icon}
        size={size * 0.45}
        color={color ?? colors.textPrimary}
      />
      {typeof badge === 'number' && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* =====================================================================
 * GlassPill — chip filter/tab nhỏ gọn.
 * ===================================================================== */
interface GlassPillProps extends Omit<PressableProps, 'style'> {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  /** Alias thân thiện cho `active`. */
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'accent' | 'warm';
  tint?: GlassTint;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassPill({
  label,
  icon,
  active,
  selected,
  onPress,
  variant = 'default',
  tint = 'light',
  size = 'md',
  disabled,
  style,
  ...rest
}: GlassPillProps) {
  const isActive = active ?? selected ?? false;
  const height = size === 'sm' ? 30 : 36;
  return (
    <Pressable
      {...rest}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed && !disabled ? 0.96 : 1 }],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {isActive ? (
        <LinearGradient
          colors={
            variant === 'warm'
              ? colors.gradWarm
              : colors.gradPrimary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.pill,
            {
              height,
              borderRadius: radius.pill,
              paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
              shadowColor: variant === 'warm' ? colors.warmGlow : colors.accentGlow,
              shadowOpacity: 0.45,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            },
          ]}
        >
          {icon ? (
            <Ionicons name={icon} size={size === 'sm' ? 13 : 15} color={colors.white} />
          ) : null}
          <Text
            style={[
              styles.pillLabel,
              { fontSize: size === 'sm' ? 12 : 13 },
            ]}
          >
            {label}
          </Text>
        </LinearGradient>
      ) : (
        <LiquidGlass
          tint={tint}
          depth={1}
          radius={999}
          style={{ height, paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg }}
          innerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {icon ? (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 13 : 15}
              color={colors.textSecondary}
            />
          ) : null}
          <Text
            style={[
              styles.pillLabel,
              { fontSize: size === 'sm' ? 12 : 13, color: colors.textSecondary },
            ]}
          >
            {label}
          </Text>
        </LiquidGlass>
      )}
    </Pressable>
  );
}

/* =====================================================================
 * GlassSegmentedControl — selector nhiều nút (cho tab filter).
 * ===================================================================== */
interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface GlassSegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function GlassSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: GlassSegmentedControlProps<T>) {
  return (
    <LiquidGlass
      tint="navy"
      depth={2}
      radius={999}
      style={[
        {
          padding: 4,
          flexDirection: 'row',
          alignSelf: 'flex-start',
        },
        style,
      ]}
      innerStyle={{ flexDirection: 'row', gap: 4 }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              {
                paddingHorizontal: spacing.lg,
                paddingVertical: 8,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            {active ? (
              <LinearGradient
                colors={colors.gradPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
              />
            ) : null}
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={14}
                color={active ? colors.white : colors.textSecondary}
              />
            ) : null}
            <Text
              style={{
                color: active ? colors.white : colors.textSecondary,
                fontSize: 13,
                fontFamily: typography.fontFamilyMedium,
                fontWeight: active ? '700' : '500',
                letterSpacing: 0.2,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </LiquidGlass>
  );
}

/* =====================================================================
 * GlassTextField — input glass với leading icon, focus glow.
 * ===================================================================== */
interface GlassTextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string | null;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Style bổ sung áp vào trực tiếp TextInput. */
  inputStyle?: StyleProp<TextStyle>;
}

export const GlassTextField = forwardRef<TextInput, GlassTextFieldProps>(function GlassTextField(
  {
    label,
    icon,
    rightIcon,
    onRightIconPress,
    error,
    hint,
    containerStyle,
    inputStyle,
    ...inputProps
  },
  ref,
) {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: motion.base,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    inputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: motion.base,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    inputProps.onBlur?.(e);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.10)', colors.accent],
  });
  const glowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  return (
    <View style={[{ gap: spacing.xs, alignSelf: 'stretch', width: '100%' }, containerStyle]}>
      {label ? (
        <Text style={styles.fieldLabel}>{label}</Text>
      ) : null}
      <Animated.View style={{ borderRadius: radius.lg, width: '100%' }}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: error ? colors.danger : borderColor,
              shadowColor: colors.accent,
              shadowOpacity: glowOpacity,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 },
            },
          ]}
        />
        <LiquidGlass
          tint="navy"
          depth={1}
          radius={radius.lg}
          style={{ width: '100%' }}
          innerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            height: 56,
          }}
        >
          {icon ? (
            <Ionicons
              name={icon}
              size={20}
              color={colors.textMuted}
              style={{ marginRight: spacing.xs }}
            />
          ) : null}
          <TextInput
            {...inputProps}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              inputProps.multiline ? { height: 'auto', paddingVertical: spacing.md } : null,
              inputStyle,
            ]}
          />
          {rightIcon ? (
            <Pressable
              onPress={onRightIconPress}
              hitSlop={12}
              style={({ pressed }) => ({
                padding: 6,
                marginLeft: spacing.xs,
                borderRadius: radius.sm,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </LiquidGlass>
      </Animated.View>
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
});

/* =====================================================================
 * GlassListItem — row cho list (Library/History/Notification/Comment).
 * ===================================================================== */
interface GlassListItemProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  tint?: GlassTint;
  depth?: GlassDepth;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  glow?: boolean;
  showHighlight?: boolean;
  noBlur?: boolean;
}

export function GlassListItem({
  children,
  onPress,
  onLongPress,
  tint = 'navy',
  depth = 1,
  radius: r = radius.lg,
  style,
  innerStyle,
  glow = false,
  showHighlight = true,
  noBlur = false,
}: GlassListItemProps) {
  const content = (
    <GlassCard
      tint={tint}
      depth={depth}
      radius={r}
      glow={glow}
      showHighlight={showHighlight}
      noBlur={noBlur}
      style={style}
      innerStyle={[{ padding: spacing.md }, innerStyle]}
    >
      {children}
    </GlassCard>
  );

  if (!onPress && !onLongPress) return content;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}

/* =====================================================================
 * GlassSwitch — toggle on/off style glass.
 * ===================================================================== */
interface GlassSwitchProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function GlassSwitch({
  value,
  onValueChange,
  disabled,
  size = 'md',
}: GlassSwitchProps) {
  const trackWidth = size === 'sm' ? 42 : 52;
  const trackHeight = size === 'sm' ? 26 : 32;
  const knob = size === 'sm' ? 20 : 26;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      hitSlop={6}
      style={({ pressed }) => ({
        width: trackWidth,
        height: trackHeight,
        borderRadius: trackHeight / 2,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <LiquidGlass
        tint={value ? 'accent' : 'dark'}
        depth={1}
        radius={trackHeight / 2}
        style={StyleSheet.absoluteFillObject}
        glow={value}
      />
      <View style={[StyleSheet.absoluteFillObject, { padding: (trackHeight - knob) / 2 }]}>
        <View
          style={{
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            backgroundColor: colors.white,
            transform: [{ translateX: value ? trackWidth - knob - (trackHeight - knob) : 0 }],
            shadowColor: colors.black,
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        />
      </View>
    </Pressable>
  );
}

/* =====================================================================
 * GlassFAB — floating action button.
 * ===================================================================== */
interface GlassFABProps extends Omit<PressableProps, 'style'> {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  variant?: 'accent' | 'warm' | 'default';
  style?: StyleProp<ViewStyle>;
}

export function GlassFAB({
  icon,
  onPress,
  size = 56,
  variant = 'accent',
  style,
  ...rest
}: GlassFABProps) {
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.92 : 1 }],
          opacity: pressed ? 0.9 : 1,
          shadowColor: variant === 'warm' ? colors.warmGlow : colors.accentGlow,
          shadowOpacity: 0.55,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={
          variant === 'warm'
            ? colors.gradWarm
            : variant === 'accent'
            ? colors.gradPrimary
            : [colors.glassHeavy, colors.glassLight]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject]}
      />
      <Ionicons name={icon} size={size * 0.45} color={colors.white} />
    </Pressable>
  );
}

/* =====================================================================
 * GlassSheet — bottom sheet với backdrop màu tối.
 * ===================================================================== */
interface GlassSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: number | string;
  showHandle?: boolean;
}

export function GlassSheet({
  visible,
  onClose,
  children,
  height = '60%',
  showHandle = true,
}: GlassSheetProps) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: motion.base,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [800, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFillObject}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: 'rgba(7,11,26,0.6)' },
            ]}
          />
        </Pressable>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: height as any,
              transform: [{ translateY }],
            },
          ]}
        >
          <LiquidGlass
            tint="navy"
            depth={4}
            radius={0}
            style={{
              flex: 1,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
            innerStyle={{
              flex: 1,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              overflow: 'hidden',
            }}
          >
            {showHandle ? (
              <View style={styles.sheetHandle}>
                <View style={styles.sheetHandleBar} />
              </View>
            ) : null}
            <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
              {children}
            </SafeAreaView>
          </LiquidGlass>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* =====================================================================
 * GlassTabBar — bottom tab bar khối màu.
 * ===================================================================== */
interface GlassTabBarProps<T extends string> {
  tabs: Array<{
    key: T;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive?: keyof typeof Ionicons.glyphMap;
  }>;
  value: T;
  onChange: (v: T) => void;
}

export function GlassTabBar<T extends string>({
  tabs,
  value,
  onChange,
}: GlassTabBarProps<T>) {
  return (
    <LiquidGlass
      tint="navy"
      depth={4}
      radius={999}
      style={{
        flexDirection: 'row',
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
        marginHorizontal: spacing.lg,
      }}
      innerStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        const icon = active && tab.iconActive ? tab.iconActive : tab.icon;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: spacing.sm,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            {active ? (
              <LinearGradient
                colors={colors.gradPrimarySoft}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
              />
            ) : null}
            <Ionicons
              name={icon}
              size={22}
              color={active ? colors.white : colors.textSecondary}
            />
            <Text
              style={{
                fontSize: 10,
                fontFamily: typography.fontFamilyMedium,
                fontWeight: active ? '700' : '500',
                color: active ? colors.white : colors.textSecondary,
                marginTop: 2,
                letterSpacing: 0.2,
              }}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </LiquidGlass>
  );
}

/* =====================================================================
 * GlassSkeleton — shimmer loading.
 * ===================================================================== */
interface GlassSkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassSkeleton({
  width = '100%',
  height = 16,
  radius: r = radius.sm,
  style,
}: GlassSkeletonProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: r,
          backgroundColor: colors.glassLight,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
            backgroundColor: 'rgba(255,255,255,0.06)',
          },
        ]}
      />
    </View>
  );
}

/* =====================================================================
 * GlassModal — wrap Modal với backdrop màu tối.
 * ===================================================================== */
interface GlassModalProps extends Omit<ModalProps, 'children' | 'transparent'> {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function GlassModal({ visible, onClose, children, ...rest }: GlassModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} {...rest}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(7,11,26,0.7)' },
          ]}
        />
      </Pressable>
      <View pointerEvents="box-none" style={styles.modalContent}>
        {children}
      </View>
    </Modal>
  );
}

/* =====================================================================
 * Styles
 * ===================================================================== */
const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  buttonShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  buttonLabel: {
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    gap: 4,
  },
  tagText: {
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillLabel: {
    color: colors.white,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyRegular,
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: typography.fontFamilyRegular,
    paddingHorizontal: spacing.xs,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyRegular,
    paddingHorizontal: spacing.xs,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sheetHandleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.glassHeavy,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
