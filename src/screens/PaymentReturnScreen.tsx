import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../services/apiClient';
import {
  Payment,
  Wallet,
  clearPendingPayment,
  fetchMyPayments,
  fetchPayment,
  fetchWallet,
  getPendingPayment,
} from '../services/paymentService';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GradientButton } from '../theme/uiPrimitives';

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 15;
const COIN = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

type ResultState =
  | 'checking'
  | 'paid'
  | 'cancelled'
  | 'expired'
  | 'failed'
  | 'pending-timeout'
  | 'unauthorized'
  | 'error';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatCoin(payment: Payment | null): string {
  if (!payment) return '0';
  const value = payment.coin_amount_coin === undefined
    ? payment.coin_amount
    : Number(payment.coin_amount_coin);
  return COIN.format(Number.isFinite(value) ? value : payment.coin_amount);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không thể xác nhận thanh toán.';
}

export default function PaymentReturnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    id?: string | string[];
    cancel?: string | string[];
    status?: string | string[];
    orderCode?: string | string[];
  }>();
  const [resultState, setResultState] = useState<ResultState>('checking');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [message, setMessage] = useState('Đang chờ backend xác nhận giao dịch...');
  const [retryKey, setRetryKey] = useState(0);

  const returnedOrderCode = useMemo(() => {
    const raw = firstParam(params.orderCode);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : null;
  }, [params.orderCode]);
  const payosCallback = useMemo(() => ({
    code: firstParam(params.code),
    id: firstParam(params.id),
    cancel: firstParam(params.cancel),
    status: firstParam(params.status),
  }), [params.cancel, params.code, params.id, params.status]);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    setResultState('checking');
    setMessage('Đang chờ backend xác nhận giao dịch...');

    const resolvePayment = async (): Promise<Payment> => {
      const pending = await getPendingPayment();
      if (pending?.paymentId) return fetchPayment(pending.paymentId);

      const orderCode = returnedOrderCode ?? pending?.orderCode;
      if (!orderCode) {
        throw new Error('Deep link thiếu orderCode và không tìm thấy giao dịch đang chờ trên thiết bị.');
      }

      const payments = await fetchMyPayments(1, 100);
      const matched = payments.find((item) => item.order_code === orderCode);
      if (!matched) throw new Error(`Không tìm thấy giao dịch #${orderCode} trong tài khoản này.`);
      return matched;
    };

    const check = async () => {
      attempts += 1;
      try {
        const current = await resolvePayment();
        if (disposed) return;
        setPayment(current);

        const status = String(current.status).toLowerCase();
        if (status === 'paid') {
          await clearPendingPayment(current._id);
          const latestWallet = await fetchWallet();
          if (disposed) return;
          setWallet(latestWallet);
          setResultState('paid');
          setMessage('Backend đã xác nhận thanh toán và cập nhật ví.');
          return;
        }

        if (status === 'cancelled' || status === 'expired' || status === 'failed') {
          await clearPendingPayment(current._id);
          if (disposed) return;
          setResultState(status as 'cancelled' | 'expired' | 'failed');
          setMessage(
            status === 'cancelled'
              ? 'Giao dịch đã bị huỷ.'
              : status === 'expired'
                ? 'Liên kết thanh toán đã hết hạn.'
                : 'Backend xác nhận giao dịch thất bại.',
          );
          return;
        }

        if (attempts >= MAX_POLL_ATTEMPTS) {
          setResultState('pending-timeout');
          setMessage('Webhook chưa tới sau 30 giây. Giao dịch vẫn được lưu để kiểm tra lại sau.');
          return;
        }

        setMessage(`Đang xác nhận thanh toán... (${attempts}/${MAX_POLL_ATTEMPTS})`);
        timer = setTimeout(() => void check(), POLL_INTERVAL_MS);
      } catch (error) {
        if (disposed) return;
        if (error instanceof ApiError && error.status === 401) {
          setResultState('unauthorized');
          setMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để kiểm tra giao dịch.');
          return;
        }
        setResultState('error');
        setMessage(errorMessage(error));
      }
    };

    void check();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [returnedOrderCode, retryKey]);

  const paid = resultState === 'paid';
  const checking = resultState === 'checking';
  const terminalError = ['cancelled', 'expired', 'failed'].includes(resultState);

  return (
    <View style={styles.root}>
      <LinearGradient colors={colors.gradBg} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <GlassCard tint="navy" depth={3} style={styles.card}>
            <View
              style={[
                styles.iconCircle,
                paid && styles.successIcon,
                terminalError && styles.errorIcon,
              ]}
            >
              {checking ? (
                <ActivityIndicator size="large" color={colors.accentLight} />
              ) : (
                <Ionicons
                  name={paid ? 'checkmark-circle' : terminalError ? 'close-circle' : 'time-outline'}
                  size={52}
                  color={paid ? colors.success : terminalError ? colors.danger : colors.warning}
                />
              )}
            </View>

            <Text style={styles.title}>
              {paid
                ? 'Nạp Coin thành công'
                : checking
                  ? 'Đang xác nhận thanh toán'
                  : terminalError
                    ? 'Thanh toán chưa thành công'
                    : 'Chưa thể xác nhận'}
            </Text>
            <Text style={styles.message}>{message}</Text>

            {payment ? (
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mã giao dịch</Text>
                  <Text style={styles.summaryValue}>#{payment.order_code}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Coin</Text>
                  <Text style={[styles.summaryValue, paid && styles.successText]}>
                    +{formatCoin(payment)} Coin
                  </Text>
                </View>
                {payosCallback.status ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>PayOS trả về</Text>
                    <Text style={styles.summaryValue}>{payosCallback.status}</Text>
                  </View>
                ) : null}
                {wallet ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Số dư mới</Text>
                    <Text style={styles.summaryValue}>
                      {COIN.format(Number(wallet.balance_coin ?? wallet.balance))} Coin
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {(resultState === 'pending-timeout' || resultState === 'error') ? (
              <GradientButton
                label="Kiểm tra lại"
                icon="refresh"
                onPress={() => setRetryKey((value) => value + 1)}
                fullWidth
                style={styles.button}
              />
            ) : null}

            {resultState === 'unauthorized' ? (
              <GradientButton
                label="Đăng nhập lại"
                icon="log-in-outline"
                onPress={() => router.replace('/login?redirect=%2Fpayment%2Freturn')}
                fullWidth
                style={styles.button}
              />
            ) : null}

            <Pressable onPress={() => router.replace('/wallet' as never)} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Quay về ví</Text>
            </Pressable>
          </GlassCard>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.xxl, alignItems: 'center' },
  iconCircle: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  successIcon: { backgroundColor: colors.successSoft },
  errorIcon: { backgroundColor: colors.dangerSoft },
  title: { color: colors.textPrimary, fontSize: 22, fontFamily: typography.fontFamilyBold, fontWeight: '800', textAlign: 'center', marginTop: spacing.xl },
  message: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm },
  summary: { width: '100%', backgroundColor: colors.glassLight, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl, gap: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.textPrimary, fontSize: 14, fontFamily: typography.fontFamilyBold, fontWeight: '700' },
  successText: { color: colors.success },
  button: { width: '100%', marginTop: spacing.xl },
  secondaryButton: { width: '100%', alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  secondaryText: { color: colors.accentLight, fontFamily: typography.fontFamilyBold, fontWeight: '700' },
});
