import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RolePage } from '../components/role/RolePage';
import { BankInformation, fetchBankInformation, updateBankInformation } from '../services/bankInformationService';
import { colors, spacing, typography } from '../theme/colors';
import { GlassCard, GlassTextField, GradientButton } from '../theme/uiPrimitives';

interface FormErrors {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  password?: string;
}

export function BankInformationScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState<BankInformation | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const info = await fetchBankInformation();
      setCurrent(info);
      setBankName(info.bank_name || '');
      setAccountHolder(info.account_holder || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin ngân hàng.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const validate = () => {
    const next: FormErrors = {};
    if (!bankName.trim()) next.bankName = 'Tên ngân hàng không được để trống.';
    if (!accountHolder.trim()) next.accountHolder = 'Tên chủ tài khoản không được để trống.';
    if (!accountNumber.trim()) next.accountNumber = 'Số tài khoản không được để trống.';
    else if (accountNumber.trim().length > 30) next.accountNumber = 'Số tài khoản tối đa 30 ký tự.';
    if (!password.trim()) next.password = 'Bạn phải nhập mật khẩu hiện tại để lưu.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await updateBankInformation({
        bank_name: bankName.trim(),
        account_holder: accountHolder.trim(),
        bank_account_number: accountNumber.trim(),
        current_password: password,
      });
      setCurrent(updated);
      setPassword('');
      setAccountNumber('');
      setErrors({});
      Alert.alert('Đã lưu', 'Thông tin ngân hàng đã được cập nhật thành công.');
    } catch (err) {
      Alert.alert('Không thể lưu', err instanceof Error ? err.message : 'Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RolePage title="Thông tin ngân hàng" subtitle="Dùng để nhận tiền khi yêu cầu rút" loading={loading} error={error} onRefresh={load} onBack={() => router.back()}>
      {current?.has_bank_info ? (
        <GlassCard innerStyle={styles.currentCard}>
          <View style={styles.currentIcon}><Ionicons name="shield-checkmark" size={25} color={colors.success} /></View>
          <View style={{ flex: 1 }}><Text style={styles.currentTitle}>Thông tin đang sử dụng</Text><Text style={styles.currentText}>{current.bank_name} · {current.account_number_masked}</Text><Text style={styles.currentText}>{current.account_holder}</Text></View>
        </GlassCard>
      ) : (
        <GlassCard innerStyle={styles.notice}><Ionicons name="information-circle" size={22} color={colors.warning} /><Text style={styles.noticeText}>Bạn chưa có thông tin ngân hàng. Hãy cập nhật trước khi gửi yêu cầu rút tiền.</Text></GlassCard>
      )}

      <Text style={styles.sectionTitle}>{current?.has_bank_info ? 'Cập nhật thông tin mới' : 'Thêm thông tin ngân hàng'}</Text>
      <GlassTextField label="Tên ngân hàng" icon="business-outline" placeholder="Ví dụ: Vietcombank" value={bankName} onChangeText={(value) => { setBankName(value); setErrors((prev) => ({ ...prev, bankName: undefined })); }} error={errors.bankName} editable={!saving} />
      <GlassTextField label="Tên chủ tài khoản" icon="person-outline" placeholder="NGUYEN VAN A" autoCapitalize="characters" value={accountHolder} onChangeText={(value) => { setAccountHolder(value); setErrors((prev) => ({ ...prev, accountHolder: undefined })); }} error={errors.accountHolder} editable={!saving} />
      <GlassTextField label="Số tài khoản mới" icon="card-outline" placeholder={current?.account_number_masked || 'Nhập số tài khoản'} keyboardType="number-pad" maxLength={30} value={accountNumber} onChangeText={(value) => { setAccountNumber(value); setErrors((prev) => ({ ...prev, accountNumber: undefined })); }} error={errors.accountNumber} hint={current?.has_account_number ? 'Vì lý do bảo mật, hãy nhập lại đầy đủ số tài khoản.' : undefined} editable={!saving} />
      <GlassTextField label="Mật khẩu hiện tại" icon="lock-closed-outline" placeholder="Bắt buộc để xác nhận thay đổi" secureTextEntry={!showPassword} value={password} onChangeText={(value) => { setPassword(value); setErrors((prev) => ({ ...prev, password: undefined })); }} error={errors.password} rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'} onRightIconPress={() => setShowPassword((value) => !value)} editable={!saving} />

      <GlassCard innerStyle={styles.security}><Ionicons name="lock-closed" size={18} color={colors.accentLight} /><Text style={styles.securityText}>Mật khẩu chỉ được dùng để xác minh yêu cầu này và không được lưu trên thiết bị.</Text></GlassCard>
      <GradientButton label="Lưu thông tin ngân hàng" icon="save-outline" fullWidth glow loading={saving} onPress={save} />
    </RolePage>
  );
}

const styles = StyleSheet.create({
  currentCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }, currentIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft }, currentTitle: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold }, currentText: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg }, noticeText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 }, sectionTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold, marginTop: spacing.sm },
  security: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md }, securityText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 16 },
});
