import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RolePage } from '../components/role/RolePage';
import { SegmentedFilter } from '../components/role/SegmentedFilter';
import { useAuth } from '../context/AuthContext';
import {
  CreatorRevenue,
  CreatorWallet,
  CreatorWithdrawal,
  fetchCreatorRevenues,
  fetchCreatorWallet,
  fetchCreatorWithdrawals,
  requestCreatorWithdrawal,
  RevenueStatus,
  WithdrawalStatus,
} from '../services/creatorWalletService';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GradientButton } from '../theme/uiPrimitives';
import { formatCoinUnits } from '../utils/coinUnit';

type RevenueFilter = 'all' | RevenueStatus;
const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const REVENUE_STATUS: Record<RevenueStatus, { label: string; color: string; background: string }> = {
  pending: { label: 'Đang chờ', color: colors.warning, background: colors.warningSoft },
  available: { label: 'Khả dụng', color: colors.success, background: colors.successSoft },
  withdrawn: { label: 'Đã rút', color: colors.textMuted, background: colors.glassMedium },
};

const WITHDRAWAL_STATUS: Record<WithdrawalStatus, { label: string; color: string; background: string }> = {
  pending: { label: 'Chờ duyệt', color: colors.warning, background: colors.warningSoft },
  approved: { label: 'Đã duyệt', color: colors.cyan, background: colors.cyanSoft },
  completed: { label: 'Hoàn tất', color: colors.success, background: colors.successSoft },
  rejected: { label: 'Từ chối', color: colors.danger, background: colors.dangerSoft },
  cancelled: { label: 'Đã hủy', color: colors.textMuted, background: colors.glassMedium },
};

export function CreatorWalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [revenues, setRevenues] = useState<CreatorRevenue[]>([]);
  const [withdrawals, setWithdrawals] = useState<CreatorWithdrawal[]>([]);
  const [filter, setFilter] = useState<RevenueFilter>('all');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [walletData, revenueData, withdrawalData] = await Promise.all([
        fetchCreatorWallet(), fetchCreatorRevenues(), fetchCreatorWithdrawals(),
      ]);
      setWallet(walletData);
      setRevenues(revenueData);
      setWithdrawals(withdrawalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu ví.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredRevenues = useMemo(
    () => filter === 'all' ? revenues : revenues.filter((item) => item.status === filter),
    [filter, revenues],
  );

  const requestWithdrawal = () => {
    if (!wallet || wallet.available_balance <= 0) return;
    Alert.alert(
      'Xác nhận rút tiền',
      `Bạn sẽ rút toàn bộ ${formatCoinUnits(wallet.available_balance)} Coin khả dụng. Yêu cầu sẽ được gửi cho Admin xử lý.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi yêu cầu',
          onPress: async () => {
            setRequesting(true);
            try {
              await requestCreatorWithdrawal();
              Alert.alert('Thành công', 'Yêu cầu rút tiền đã được gửi.');
              await load();
            } catch (err) {
              Alert.alert('Không thể rút tiền', err instanceof Error ? err.message : 'Vui lòng thử lại.');
            } finally {
              setRequesting(false);
            }
          },
        },
      ],
    );
  };

  const currentBalance = (wallet?.pending_balance ?? 0) + (wallet?.available_balance ?? 0);

  return (
    <RolePage
      title="Ví doanh thu"
      subtitle={user?.role === 'Assistant' ? 'Doanh thu của Trợ lý' : 'Doanh thu của Mangaka'}
      loading={loading}
      error={error}
      onRefresh={load}
      onBack={() => router.replace('/profile' as never)}
    >
      {wallet ? <>
        <GlassCard depth={3} glow style={styles.balanceCard} innerStyle={styles.balanceInner}>
          <View style={styles.balanceHeader}><Text style={styles.balanceLabel}>Tổng số dư hiện tại</Text><Ionicons name="wallet" size={25} color={colors.cyan} /></View>
          <Text style={styles.balanceValue}>{formatCoinUnits(currentBalance)} <Text style={styles.coinLabel}>Coin</Text></Text>
          <Text style={styles.balanceVnd}>{VND.format(wallet.current_balance_vnd ?? 0)}</Text>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceSplit}>
            <BalancePart label="Khả dụng" units={wallet.available_balance} vnd={wallet.available_balance_vnd} color={colors.success} />
            <View style={styles.verticalDivider} />
            <BalancePart label="Đang chờ" units={wallet.pending_balance} vnd={wallet.pending_balance_vnd} color={colors.warning} />
          </View>
        </GlassCard>

        <View style={styles.statsGrid}>
          <WalletStat icon="trending-up" label="Tổng doanh thu" units={wallet.total_revenue} color={colors.cyan} />
          <WalletStat icon="arrow-up-circle" label="Đã rút" units={wallet.total_withdrawn} color={colors.success} />
        </View>

        <GradientButton label="Cập nhật thông tin ngân hàng" icon="business-outline" variant="secondary" fullWidth onPress={() => router.push('/bank-information' as never)} />

        <GradientButton
          label="Rút toàn bộ số dư khả dụng"
          icon="cash-outline"
          fullWidth
          glow
          loading={requesting}
          disabled={wallet.available_balance <= 0}
          onPress={requestWithdrawal}
        />
        <Text style={styles.withdrawHint}>Số tiền được quy đổi theo tỷ giá tại thời điểm gửi yêu cầu. Tài khoản cần cập nhật đầy đủ thông tin ngân hàng.</Text>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Lịch sử doanh thu</Text><Text style={styles.sectionCount}>{filteredRevenues.length} giao dịch</Text></View>
        <SegmentedFilter value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'Tất cả' }, { value: 'pending', label: 'Đang chờ' }, { value: 'available', label: 'Khả dụng' }, { value: 'withdrawn', label: 'Đã rút' },
        ]} />
        <GlassCard innerStyle={styles.list}>
          {filteredRevenues.length ? filteredRevenues.map((item) => <RevenueRow key={item._id} item={item} />) : <Empty label="Chưa có doanh thu phù hợp." />}
        </GlassCard>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Yêu cầu rút tiền</Text><Text style={styles.sectionCount}>{withdrawals.length} yêu cầu</Text></View>
        <GlassCard innerStyle={styles.list}>
          {withdrawals.length ? withdrawals.map((item) => <WithdrawalRow key={item._id} item={item} />) : <Empty label="Chưa có yêu cầu rút tiền." />}
        </GlassCard>
      </> : null}
    </RolePage>
  );
}

function BalancePart({ label, units, vnd, color }: { label: string; units: number; vnd?: number; color: string }) {
  return <View style={styles.balancePart}><Text style={styles.partLabel}>{label}</Text><Text style={[styles.partValue, { color }]}>{formatCoinUnits(units)} Coin</Text><Text style={styles.partVnd}>{VND.format(vnd ?? 0)}</Text></View>;
}

function WalletStat({ icon, label, units, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; units: number; color: string }) {
  return <GlassCard style={styles.statCard} innerStyle={styles.statInner}><Ionicons name={icon} size={22} color={color} /><Text style={styles.statValue}>{formatCoinUnits(units)}</Text><Text style={styles.statLabel}>{label} (Coin)</Text></GlassCard>;
}

function RevenueRow({ item }: { item: CreatorRevenue }) {
  const status = REVENUE_STATUS[item.status];
  return <View style={styles.row}>
    <View style={styles.rowIcon}><Ionicons name="sparkles" size={18} color={colors.cyan} /></View>
    <View style={styles.rowContent}><Text style={styles.rowTitle} numberOfLines={1}>{item.series_id?.name || 'Doanh thu truyện'}</Text><Text style={styles.rowMeta} numberOfLines={1}>Chương {item.chapter_id?.chapter_number ?? '—'} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text><View style={[styles.status, { backgroundColor: status.background }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View></View>
    <View style={styles.amountWrap}><Text style={styles.positiveAmount}>+{formatCoinUnits(item.coin_amount)}</Text><Text style={styles.amountUnit}>Coin</Text></View>
  </View>;
}

function WithdrawalRow({ item }: { item: CreatorWithdrawal }) {
  const status = WITHDRAWAL_STATUS[item.status];
  return <View style={styles.row}>
    <View style={styles.rowIcon}><Ionicons name="cash-outline" size={18} color={colors.accentLight} /></View>
    <View style={styles.rowContent}><Text style={styles.rowTitle}>{VND.format(item.vnd_amount)}</Text><Text style={styles.rowMeta}>{new Date(item.createdAt).toLocaleDateString('vi-VN')} · {item.bank_snapshot?.bank_name || 'Ngân hàng'}</Text><View style={[styles.status, { backgroundColor: status.background }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View></View>
    <View style={styles.amountWrap}><Text style={styles.withdrawAmount}>-{formatCoinUnits(item.coin_amount)}</Text><Text style={styles.amountUnit}>Coin</Text></View>
  </View>;
}

function Empty({ label }: { label: string }) { return <View style={styles.empty}><Ionicons name="file-tray-outline" size={28} color={colors.textMuted} /><Text style={styles.emptyText}>{label}</Text></View>; }

const styles = StyleSheet.create({
  balanceCard: { borderRadius: radius.xl }, balanceInner: { padding: spacing.xl }, balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, balanceLabel: { color: colors.textSecondary, fontSize: 13 }, balanceValue: { color: colors.textPrimary, fontSize: 34, fontFamily: typography.fontFamilyBold, marginTop: spacing.sm }, coinLabel: { color: colors.cyan, fontSize: 18 }, balanceVnd: { color: colors.textMuted, marginTop: 4 }, balanceDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginVertical: spacing.lg }, balanceSplit: { flexDirection: 'row' }, balancePart: { flex: 1 }, verticalDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder, marginHorizontal: spacing.md }, partLabel: { color: colors.textMuted, fontSize: 11 }, partValue: { fontSize: 16, fontFamily: typography.fontFamilyBold, marginTop: 5 }, partVnd: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  statsGrid: { flexDirection: 'row', gap: spacing.sm }, statCard: { flex: 1 }, statInner: { padding: spacing.lg }, statValue: { color: colors.textPrimary, fontSize: 21, fontFamily: typography.fontFamilyBold, marginTop: spacing.sm }, statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, withdrawHint: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }, sectionTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold }, sectionCount: { color: colors.textMuted, fontSize: 11 }, list: { padding: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder }, rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }, rowContent: { flex: 1 }, rowTitle: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold, fontSize: 13 }, rowMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, status: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, marginTop: 5 }, statusText: { fontSize: 9, fontFamily: typography.fontFamilyBold }, amountWrap: { alignItems: 'flex-end' }, positiveAmount: { color: colors.success, fontFamily: typography.fontFamilyBold, fontSize: 15 }, withdrawAmount: { color: colors.warning, fontFamily: typography.fontFamilyBold, fontSize: 15 }, amountUnit: { color: colors.textMuted, fontSize: 9, marginTop: 2 }, empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl }, emptyText: { color: colors.textMuted, fontSize: 12 },
});
