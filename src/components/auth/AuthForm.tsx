import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme/colors';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function AuthTextField({
  label,
  icon,
  isPassword = false,
  ...inputProps
}: AuthTextFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.leadingIcon} />
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && !visible}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        {isPassword ? (
          <Pressable onPress={() => setVisible((prev) => !prev)} hitSlop={8} style={styles.trailingIcon}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  onBackHome?: () => void;
}

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
  onBackHome,
}: AuthScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {onBackHome ? (
        <View style={styles.topBar}>
          <Pressable
            onPress={onBackHome}
            hitSlop={8}
            style={({ pressed }) => [styles.backHomeButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
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
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.brandName}>Mangaka</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.form}>{children}</View>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.primaryButtonDisabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{loading ? 'Đang xử lý...' : label}</Text>
    </Pressable>
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backHomeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  brandName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 50,
  },
  leadingIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  trailingIcon: {
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
