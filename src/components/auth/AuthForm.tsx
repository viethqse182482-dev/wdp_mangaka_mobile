/**
 * AuthForm — bộ primitive dùng chung cho form Auth (Login/Register).
 *
 *  - `AuthScreenLayout` — gradient + glow + logo + form card glass
 *  - `AuthTextField`    — input glass có leading icon + toggle password
 *  - `AuthPrimaryButton` — CTA gradient với icon
 *  - `AuthErrorBanner`  — banner lỗi
 *
 * Tất cả dùng typography/font Roboto hỗ trợ TV.
 */
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard, GlassTextField, GradientButton } from '../../theme/uiPrimitives';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string | null;
}

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField(
  {
    label,
    icon,
    isPassword = false,
    error,
    returnKeyType,
    ...inputProps
  },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const resolvedReturnKeyType = returnKeyType ?? (isPassword ? 'go' : 'next');

  return (
    <GlassTextField
      ref={ref}
      label={label}
      icon={icon}
      rightIcon={isPassword ? (visible ? 'eye-off-outline' : 'eye-outline') : undefined}
      onRightIconPress={isPassword ? () => setVisible((p) => !p) : undefined}
      secureTextEntry={isPassword && !visible}
      error={error}
      returnKeyType={resolvedReturnKeyType}
      containerStyle={{ marginBottom: spacing.md }}
      {...inputProps}
    />
  );
});

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  onBackHome?: () => void;
}

const LOGO_SOURCE = require('../../../assets/images/logonho.jpg');

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
  onBackHome,
}: AuthScreenLayoutProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.gradSplash}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[styles.glowA]} />
      <View pointerEvents="none" style={[styles.glowB]} />

      <SafeAreaView style={styles.safeArea}>
        {onBackHome ? (
          <View style={styles.topBar}>
            <Pressable
              onPress={onBackHome}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backHomeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
              <Text style={styles.backHomeText}>Trang chủ</Text>
            </Pressable>
          </View>
        ) : null}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brand}>
              <View style={styles.logoWrap}>
                <LinearGradient
                  colors={colors.gradPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoBadge}
                >
                  <Image
                    source={LOGO_SOURCE}
                    style={styles.logoImage}
                    contentFit="cover"
                    transition={250}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.brandName}>Mangaka</Text>
              <View style={styles.brandLine} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.form}>
              <GlassCard tint="dark" depth={3} radius={radius.xl} style={styles.formCard}>
                {children}
              </GlassCard>
            </View>
            {footer}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function AuthPrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <GradientButton
      label={label}
      icon="log-in-outline"
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      fullWidth
      size="lg"
      glow
      style={{ alignSelf: 'stretch', marginTop: spacing.md }}
    />
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowA: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.accent,
    opacity: 0.25,
    shadowColor: colors.accent,
    shadowOpacity: 0.7,
    shadowRadius: 100,
  },
  glowB: {
    position: 'absolute',
    bottom: -100,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.cyan,
    opacity: 0.18,
    shadowColor: colors.cyan,
    shadowOpacity: 0.7,
    shadowRadius: 100,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.glassLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  backHomeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrap: {
    marginBottom: spacing.sm,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  brandName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    marginBottom: spacing.xs,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.fontFamilyPlatform as string,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  formCard: {
    padding: spacing.lg,
    width: '100%',
    alignSelf: 'stretch',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
