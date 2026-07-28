/**
 * LoginScreen — form đăng nhập.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextField,
} from '../components/auth/AuthForm';
import { ApiError } from '../services/apiClient';
import { login } from '../services/authService';
import { emitAuthEvent } from '../services/authEvents';
import { clearSeriesCache } from '../services/seriesService';
import { colors, radius, spacing, typography } from '../theme/colors';

const LOGIN_REQUIRED_PREFIXES = ['/story/', '/library', '/history', '/notifications'];

function isLoginRequiredPath(path: string | undefined): boolean {
  if (!path || typeof path !== 'string') return false;
  return LOGIN_REQUIRED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = useCallback(async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await login(trimmedUsername, password);
      emitAuthEvent({ type: 'login', token: response.token });
      clearSeriesCache();
      const redirectPath =
        typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/';
      router.replace(redirectPath as any);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [password, redirect, router, username]);

  return (
    <AuthScreenLayout
      title="Đăng nhập"
      subtitle="Chào mừng trở lại! Đăng nhập để đọc truyện, đồng bộ tủ sách và lịch sử."
      onBackHome={() => router.replace('/')}
      footer={
        <Pressable onPress={() => router.push('/register')} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Chưa có tài khoản? <Text style={styles.footerHighlight}>Đăng ký ngay</Text>
          </Text>
        </Pressable>
      }
    >
      <AuthErrorBanner message={error} />
      {isLoginRequiredPath(typeof redirect === 'string' ? redirect : undefined) ? (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>
            Bạn cần đăng nhập để tiếp tục sử dụng tính năng này.
          </Text>
        </View>
      ) : null}

      <AuthTextField
        label="Tên đăng nhập"
        icon="person-outline"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!loading}
        accessibilityLabel="Tên đăng nhập"
        accessibilityHint="Nhập tên đăng nhập hoặc email đã đăng ký"
        placeholder="Nhập tên đăng nhập"
      />

      <AuthTextField
        ref={passwordRef}
        label="Mật khẩu"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        isPassword
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        editable={!loading}
        accessibilityLabel="Mật khẩu"
        accessibilityHint="Nhập mật khẩu của bạn"
        placeholder="Nhập mật khẩu"
      />

      <AuthPrimaryButton label="Đăng nhập" onPress={handleLogin} loading={loading} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  footerLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
  },
  footerHighlight: {
    color: colors.accentLight,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  noticeBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noticeText: {
    color: colors.accentLight,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
});
