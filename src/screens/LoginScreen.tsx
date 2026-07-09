import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextField,
} from '../components/auth/AuthForm';
import { ApiError } from '../services/apiClient';
import { login } from '../services/authService';
import { clearSeriesCache } from '../services/seriesService';
import { colors, spacing } from '../theme/colors';

export function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(trimmedUsername, password);
      clearSeriesCache();
      const redirectPath =
        typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/';
      router.replace(redirectPath);
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
      {typeof redirect === 'string' && redirect.startsWith('/story/') ? (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>Vui lòng đăng nhập để đọc truyện.</Text>
        </View>
      ) : null}

      <AuthTextField
        label="Tên đăng nhập"
        icon="person-outline"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Nhập tên đăng nhập"
      />

      <AuthTextField
        label="Mật khẩu"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        isPassword
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
  },
  footerHighlight: {
    color: colors.accent,
    fontWeight: '700',
  },
  noticeBanner: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.35)',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noticeText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
