import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthToken } from '../services/authService';
import { ApiError } from '../services/apiClient';
import {
  CoinPackage,
  Payment,
  PaymentStatus,
  Wallet,
  clearPendingPayment,
  createPayment,
  fetchCoinPackages,
  fetchMyPayments,
  fetchWallet,
  getPendingPayment,
  savePendingPayment,
} from '../services/paymentService';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GradientButton } from '../theme/uiPrimitives';

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const COIN = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

const STATUS_META: Record<PaymentStatus, { label: string; color: string; background: string }> = {
  pending: { label: 'Đang chờ', color: colors.warning, background: colors.warningSoft },
  paid: { label: 'Thành công', color: colors.success, background: colors.successSoft },
  cancelled: { label: 'Đã huỷ', color: colors.textMuted, background: colors.glassLight },
  expired: { label: 'Hết hạn', color: colors.textMuted, background: colors.glassLight },
  failed: { label: 'Thất bại', color: colors.danger, background: colors.dangerSoft },
};

function formatCoin(value: number, displayValue?: string): string {
  const normalized = displayValue === undefined ? value : Number(displayValue);
  return COIN.format(Number.isFinite(normalized) ? normalized : value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingPackageId, setCreatingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        router.replace('/login?redirect=%2Fwallet');
        return;
      }

      const [walletData, packageData, paymentData] = await Promise.all([
        fetchWallet(),
        fetchCoinPackages(),
        fetchMyPayments(),
      ]);
      setWallet(walletData);
      setPackages(packageData);
      setPayments(paymentData);

      const pending = await getPendingPayment();
      if (pending) {
        const restored = paymentData.find(
          (item) => item._id === pending.paymentId || item.order_code === pending.orderCode,
        );
        if (restored && restored.status !== 'pending') {
          await clearPendingPayment(pending.paymentId);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login?redirect=%2Fwallet');
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadData(false);
    }, [loadData]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadData(false);
    });
    return () => subscription.remove();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData(false);
  }, [loadData]);

  const handleBuy = useCallback(async (pkg: CoinPackage) => {
    if (creatingPackageId) return;
    setCreatingPackageId(pkg._id);
    try {
      const payment = await createPayment(pkg._id);
      if (!payment.checkout_url) throw new Error('Backend không trả về đường dẫn thanh toán.');
      await savePendingPayment(payment);
      setPayments((current) => [
        {
          _id: payment.payment_id,
          order_code: payment.order_code,
          amount_vnd: payment.amount_vnd,
          coin_amount: payment.coin_amount,
          coin_amount_coin: payment.coin_amount_coin,
          checkout_url: payment.checkout_url,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        ...current.filter((item) => item._id !== payment.payment_id),
      ]);
      router.push({
        pathname: '/payment/checkout' as never,
        params: { paymentId: payment.payment_id },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục thanh toán.');
        router.replace('/login?redirect=%2Fwallet');
        return;
      }
      Alert.alert('Không thể tạo thanh toán', getErrorMessage(err));
    } finally {
      setCreatingPackageId(null);
    }
  }, [creatingPackageId, router]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={colors.gradBg} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={styles.glowA} />
      <View pointerEvents="none" style={styles.glowB} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Ví & nạp Coin</Text>
            <Text style={styles.subtitle}>Thanh toán an toàn qua PayOS</Text>
          </View>
          <Pressable onPress={handleRefresh} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="refresh" size={20} color={colors.accentLight} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.accentLight} size="large" />
            <Text style={styles.stateText}>Đang tải thông tin ví...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentLight} />
            }
          >
            {error ? (
              <GlassCard tint="dark" depth={1} style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={() => void loadData(true)}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </Pressable>
              </GlassCard>
            ) : null}

            <LinearGradient colors={colors.gradPrimarySoft} style={styles.balanceCard}>
              <View style={styles.balanceTopRow}>
                <View style={styles.coinIcon}>
                  <Ionicons name="diamond" size={22} color={colors.white} />
                </View>
                <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
              </View>
              <Text style={styles.balanceValue}>
                {formatCoin(wallet?.balance ?? 0, wallet?.balance_coin)} Coin
              </Text>
              <View style={styles.balanceStats}>
                <Text style={styles.balanceStat}>
                  Đã nạp {formatCoin(wallet?.total_deposited ?? 0, wallet?.total_deposited_coin)}
                </Text>
                <Text style={styles.balanceDot}>•</Text>
                <Text style={styles.balanceStat}>
                  Đã dùng {formatCoin(wallet?.total_spent ?? 0, wallet?.total_spent_coin)}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Chọn gói Coin</Text>
                <Text style={styles.sectionSubtitle}>Coin được cộng sau khi PayOS xác nhận</Text>
              </View>
            </View>

            <View style={styles.packageList}>
              {packages.map((pkg) => {
                const buying = creatingPackageId === pkg._id;
                return (
                  <GlassCard key={pkg._id} tint="navy" depth={2} style={styles.packageCard}>
                    <View style={styles.packageHeader}>
                      <View style={styles.packageIcon}>
                        <Ionicons name="diamond-outline" size={24} color={colors.cyan} />
                      </View>
                      <View style={styles.packageInfo}>
                        <Text style={styles.packageName}>{pkg.name}</Text>
                        <Text style={styles.packageCoin}>
                          {formatCoin(pkg.total_coin, pkg.total_coin_display)} Coin
                        </Text>
                        {pkg.bonus_coin > 0 ? (
                          <Text style={styles.bonus}>
                            Tặng thêm {formatCoin(pkg.bonus_coin, pkg.bonus_coin_display)} Coin
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.packagePrice}>{VND.format(pkg.price_vnd)}</Text>
                    </View>
                    {pkg.description ? <Text style={styles.packageDescription}>{pkg.description}</Text> : null}
                    <GradientButton
                      label={buying ? 'Đang tạo thanh toán...' : 'Thanh toán qua PayOS'}
                      icon={buying ? undefined : 'card-outline'}
                      onPress={() => void handleBuy(pkg)}
                      disabled={Boolean(creatingPackageId)}
                      fullWidth
                      size="md"
                      style={styles.buyButton}
                    />
                  </GlassCard>
                );
              })}
              {packages.length === 0 && !error ? (
                <Text style={styles.emptyText}>Hiện chưa có gói Coin khả dụng.</Text>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Lịch sử nạp Coin</Text>
                <Text style={styles.sectionSubtitle}>Kéo xuống để cập nhật trạng thái mới nhất</Text>
              </View>
            </View>

            <GlassCard tint="dark" depth={1} style={styles.historyCard}>
              {payments.map((payment, index) => {
                const meta = STATUS_META[payment.status] ?? STATUS_META.failed;
                return (
                  <View key={payment._id} style={[styles.historyRow, index > 0 && styles.historyDivider]}>
                    <View style={[styles.statusIcon, { backgroundColor: meta.background }]}>
                      <Ionicons
                        name={payment.status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                        size={20}
                        color={meta.color}
                      />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyAmount}>
                        +{formatCoin(payment.coin_amount, payment.coin_amount_coin)} Coin
                      </Text>
                      <Text style={styles.historyMeta}>
                        #{payment.order_code} · {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyPrice}>{VND.format(payment.amount_vnd)}</Text>
                      <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>
                );
              })}
              {payments.length === 0 ? <Text style={styles.emptyText}>Bạn chưa có giao dịch nạp Coin.</Text> : null}
            </GlassCard>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  glowA: { position: 'absolute', top: -80, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.accent, opacity: 0.18 },
  glowB: { position: 'absolute', bottom: 80, left: -90, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.cyan, opacity: 0.1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  headerText: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 20, fontFamily: typography.fontFamilyBold, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, fontFamily: typography.fontFamilyRegular, marginTop: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassLight },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  stateText: { color: colors.textSecondary, fontFamily: typography.fontFamilyRegular },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.md },
  errorText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  retryText: { color: colors.accentLight, fontFamily: typography.fontFamilyBold, fontWeight: '700' },
  balanceCard: { borderRadius: radius.xl, padding: spacing.xxl, overflow: 'hidden' },
  balanceTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  coinIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  balanceLabel: { color: colors.white, fontSize: 14, fontFamily: typography.fontFamilyMedium, fontWeight: '600' },
  balanceValue: { color: colors.white, fontSize: 32, fontFamily: typography.fontFamilyBold, fontWeight: '800', marginTop: spacing.lg },
  balanceStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  balanceStat: { color: 'rgba(255,255,255,0.78)', fontSize: 12 },
  balanceDot: { color: 'rgba(255,255,255,0.5)' },
  sectionHeader: { marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: typography.fontFamilyBold, fontWeight: '800' },
  sectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  packageList: { gap: spacing.md },
  packageCard: { padding: spacing.lg },
  packageHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  packageIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft },
  packageInfo: { flex: 1 },
  packageName: { color: colors.textPrimary, fontSize: 15, fontFamily: typography.fontFamilyBold, fontWeight: '700' },
  packageCoin: { color: colors.cyan, fontSize: 14, fontFamily: typography.fontFamilyBold, fontWeight: '700', marginTop: 3 },
  packagePrice: { color: colors.textPrimary, fontSize: 14, fontFamily: typography.fontFamilyBold, fontWeight: '800' },
  bonus: { color: colors.success, fontSize: 11, marginTop: 2 },
  packageDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  buyButton: { marginTop: spacing.md },
  historyCard: { paddingHorizontal: spacing.md },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  historyDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.glassBorder },
  statusIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyAmount: { color: colors.textPrimary, fontSize: 14, fontFamily: typography.fontFamilyBold, fontWeight: '700' },
  historyMeta: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  historyRight: { alignItems: 'flex-end' },
  historyPrice: { color: colors.textSecondary, fontSize: 12 },
  statusText: { fontSize: 11, fontFamily: typography.fontFamilyBold, fontWeight: '700', marginTop: 3 },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
});
