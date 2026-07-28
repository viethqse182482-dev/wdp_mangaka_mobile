/**
 * RegisterScreen — form đăng ký Reader.
 *
 * Validate:
 *  - Họ tên: bắt buộc, 2-60 ký tự
 *  - Username: 3-30 ký tự, chỉ chữ, số, _
 *  - Email: regex chuẩn + TLD >= 2 ký tự
 *  - Số điện thoại VN: 0[3|5|7|8|9] + 8 số
 *  - Mật khẩu: >= 6 ký tự, phải khớp confirm
 *
 * Validation chạy real-time khi blur từng field, hiển thị error inline.
 */
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import {
  AuthErrorBanner,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextField,
} from '../components/auth/AuthForm';
import { ApiError } from '../services/apiClient';
import { login, register } from '../services/authService';
import { emitAuthEvent } from '../services/authEvents';
import { colors, spacing, typography } from '../theme/colors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const PHONE_REGEX = /^(0[3|5|7|8|9])[0-9]{8}$/;

type FieldKey = 'fullName' | 'username' | 'email' | 'phoneNumber' | 'password' | 'confirmPassword';

interface FieldErrors {
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

function validateField(key: FieldKey, values: {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}): string | undefined {
  switch (key) {
    case 'fullName':
      if (!values.fullName.trim()) return 'Vui lòng nhập họ và tên.';
      if (values.fullName.trim().length < 2) return 'Họ tên quá ngắn.';
      if (values.fullName.trim().length > 60) return 'Họ tên quá dài (tối đa 60 ký tự).';
      return undefined;
    case 'username':
      if (!values.username.trim()) return 'Vui lòng nhập tên đăng nhập.';
      if (!USERNAME_REGEX.test(values.username.trim())) {
        return 'Tên đăng nhập 3-30 ký tự, chỉ gồm chữ, số, dấu gạch dưới.';
      }
      return undefined;
    case 'email':
      if (!values.email.trim()) return 'Vui lòng nhập email.';
      if (!EMAIL_REGEX.test(values.email.trim())) return 'Email không hợp lệ.';
      return undefined;
    case 'phoneNumber':
      if (!values.phoneNumber.trim()) return 'Vui lòng nhập số điện thoại.';
      if (!PHONE_REGEX.test(values.phoneNumber.trim())) {
        return 'Số điện thoại không hợp lệ (VD: 0912345678).';
      }
      return undefined;
    case 'password':
      if (!values.password) return 'Vui lòng nhập mật khẩu.';
      if (values.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
      return undefined;
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Vui lòng xác nhận mật khẩu.';
      if (values.confirmPassword !== values.password) return 'Mật khẩu xác nhận không khớp.';
      return undefined;
    default:
      return undefined;
  }
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const confirmRef = useRef<TextInput>(null);

  const values = useMemo(
    () => ({ fullName, username, email, phoneNumber, password, confirmPassword }),
    [fullName, username, email, phoneNumber, password, confirmPassword],
  );

  const validateAll = useCallback((): { ok: boolean; firstInvalid?: FieldKey } => {
    const next: FieldErrors = {
      fullName: validateField('fullName', values),
      username: validateField('username', values),
      email: validateField('email', values),
      phoneNumber: validateField('phoneNumber', values),
      password: validateField('password', values),
      confirmPassword: validateField('confirmPassword', values),
    };
    setFieldErrors(next);
    const order: FieldKey[] = ['fullName', 'username', 'email', 'phoneNumber', 'password', 'confirmPassword'];
    const firstInvalid = order.find((k) => Boolean(next[k]));
    return { ok: !firstInvalid, firstInvalid };
  }, [values]);

  const onFieldBlur = useCallback(
    (key: FieldKey) => {
      setFieldErrors((prev) => ({
        ...prev,
        [key]: validateField(key, values),
      }));
    },
    [values],
  );

  const handleRegister = useCallback(async () => {
    const { ok, firstInvalid } = validateAll();
    if (!ok) {
      setError(
        firstInvalid === 'confirmPassword'
          ? 'Vui lòng kiểm tra lại mật khẩu xác nhận.'
          : 'Vui lòng kiểm tra lại các trường được đánh dấu.',
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        role: 'Reader',
      });

      Alert.alert('Đăng ký thành công', 'Tài khoản đã được tạo. Đang đăng nhập...', [
        {
          text: 'Đăng nhập',
          onPress: async () => {
            try {
              const response = await login(username.trim(), password);
              emitAuthEvent({ type: 'login', token: response.token });
              router.replace('/');
            } catch (loginErr) {
              const msg =
                loginErr instanceof ApiError
                  ? loginErr.message
                  : 'Đăng nhập tự động thất bại. Vui lòng đăng nhập thủ công.';
              Alert.alert('Đăng nhập tự động thất bại', msg, [
                {
                  text: 'Đăng nhập ngay',
                  onPress: () => router.replace('/login'),
                },
              ]);
            }
          },
        },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [email, fullName, password, phoneNumber, router, username, validateAll]);

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
        onBlur={() => onFieldBlur('fullName')}
        error={fieldErrors.fullName}
        returnKeyType="next"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        editable={!loading}
        accessibilityLabel="Họ và tên"
        placeholder="Nguyễn Văn A"
      />

      <AuthTextField
        label="Tên đăng nhập"
        icon="person-outline"
        value={username}
        onChangeText={setUsername}
        onBlur={() => onFieldBlur('username')}
        error={fieldErrors.username}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        editable={!loading}
        accessibilityLabel="Tên đăng nhập"
        placeholder="username"
      />

      <AuthTextField
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        onBlur={() => onFieldBlur('email')}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        editable={!loading}
        accessibilityLabel="Email"
        placeholder="email@example.com"
      />

      <AuthTextField
        label="Số điện thoại"
        icon="call-outline"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        onBlur={() => onFieldBlur('phoneNumber')}
        error={fieldErrors.phoneNumber}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        editable={!loading}
        accessibilityLabel="Số điện thoại"
        placeholder="09xxxxxxxx"
      />

      <AuthTextField
        label="Mật khẩu"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        onBlur={() => onFieldBlur('password')}
        error={fieldErrors.password}
        autoComplete="password-new"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        editable={!loading}
        accessibilityLabel="Mật khẩu"
        placeholder="Tối thiểu 6 ký tự"
        isPassword
      />

      <AuthTextField
        ref={confirmRef}
        label="Xác nhận mật khẩu"
        icon="shield-checkmark-outline"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onBlur={() => onFieldBlur('confirmPassword')}
        error={fieldErrors.confirmPassword}
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleRegister}
        editable={!loading}
        accessibilityLabel="Xác nhận mật khẩu"
        placeholder="Nhập lại mật khẩu"
        isPassword
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
    fontFamily: typography.fontFamilyMedium,
  },
  footerHighlight: {
    color: colors.accentLight,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
});
