import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextField,
} from '../components/auth/AuthForm';
import { ApiError } from '../services/apiClient';
import { login, register } from '../services/authService';
import { colors, spacing } from '../theme/colors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = useCallback(() => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !phoneNumber.trim()) {
      return 'Vui lòng điền đầy đủ thông tin.';
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Email không hợp lệ.';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }
    return '';
  }, [confirmPassword, email, fullName, password, phoneNumber, username]);

  const handleRegister = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await register({
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        role: 'Reader',
      });

      Alert.alert('Đăng ký thành công', response.message, [
        {
          text: 'Đăng nhập',
          onPress: async () => {
            try {
              await login(username.trim(), password);
              router.replace('/');
            } catch {
              router.replace('/login');
            }
          },
        },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [email, fullName, password, phoneNumber, router, username, validate]);

  return (
    <AuthScreenLayout
      title="Đăng ký"
      subtitle="Tạo tài khoản Reader để theo dõi truyện, bình luận và lưu lịch sử đọc."
      onBackHome={() => router.replace('/')}
      footer={
        <Pressable onPress={() => router.replace('/login')} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Đã có tài khoản? <Text style={styles.footerHighlight}>Đăng nhập</Text>
          </Text>
        </Pressable>
      }
    >
      <AuthErrorBanner message={error} />

      <AuthTextField
        label="Họ và tên"
        icon="id-card-outline"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Nguyễn Văn A"
      />

      <AuthTextField
        label="Tên đăng nhập"
        icon="person-outline"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="username"
      />

      <AuthTextField
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="email@example.com"
      />

      <AuthTextField
        label="Số điện thoại"
        icon="call-outline"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholder="09xxxxxxxx"
      />

      <AuthTextField
        label="Mật khẩu"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        isPassword
        placeholder="Tối thiểu 6 ký tự"
      />

      <AuthTextField
        label="Xác nhận mật khẩu"
        icon="shield-checkmark-outline"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
        placeholder="Nhập lại mật khẩu"
      />

      <AuthPrimaryButton label="Đăng ký" onPress={handleRegister} loading={loading} />
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
});
