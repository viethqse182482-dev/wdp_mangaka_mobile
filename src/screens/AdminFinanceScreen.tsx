import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AdminTabBar } from '../components/role/AdminTabBar';
import { StackedRevenueChart } from '../components/role/ChartVariants';
import { RolePage } from '../components/role/RolePage';
import { SegmentedFilter } from '../components/role/SegmentedFilter';
import {
  AdminFinanceAnalytics,
  AdminFinanceSummary,
  fetchAdminFinance,
  fetchAdminFinanceAnalytics,
} from '../services/roleService';
import { colors, spacing, typography } from '../theme/colors';
import { GlassCard } from '../theme/uiPrimitives';

type FinancePeriod = 'month' | 'quarter' | 'year';
const NUMBER = new Intl.NumberFormat('vi-VN');
const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const coin = (units: number) => `${NUMBER.format(units / 100)} Coin`;

export function AdminFinanceScreen() {
  const [summary, setSummary] = useState<AdminFinanceSummary | null>(null);
  const [analytics, setAnalytics] = useState<AdminFinanceAnalytics | null>(null);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = anchor.getFullYear();
  const month = anchor.getMonth() + 1;
  const quarter = Math.floor(anchor.getMonth() / 3) + 1;
  const filter = useMemo(() => ({
    period,
    year,
    ...(period === 'month' ? { month } : {}),
    ...(period === 'quarter' ? { quarter } : {}),
  }), [month, period, quarter, year]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [summaryData, analyticsData] = await Promise.all([
        fetchAdminFinance(),
        fetchAdminFinanceAnalytics(filter),
      ]);
      setSummary(summaryData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu tài chính.');
    } finally {
      setLoading(false);
    }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);

  const shiftPeriod = (direction: number) => {
    setAnchor((current) => {
      if (period === 'month') return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      if (period === 'quarter') return new Date(current.getFullYear(), current.getMonth() + direction * 3, 1);
      return new Date(current.getFullYear() + direction, current.getMonth(), 1);
    });
  };
  const periodLabel = period === 'month' ? `Tháng ${month}/${year}` : period === 'quarter' ? `Quý ${quarter}/${year}` : `Năm ${year}`;

  return (
    <RolePage title="Tài chính" subtitle="Tổng quan dòng tiền hệ thống" loading={loading} error={error} onRefresh={load} footer={<AdminTabBar active="finance" />}>
      <SegmentedFilter value={period} onChange={(value) => { setPeriod(value); setAnchor(new Date()); }} options={[{ value: 'month', label: 'Theo tháng' }, { value: 'quarter', label: 'Theo quý' }, { value: 'year', label: 'Theo năm' }]} />
      <View style={styles.periodNav}>
        <Pressable style={styles.navButton} onPress={() => shiftPeriod(-1)}><Ionicons name="chevron-back" size={20} color={colors.accentLight} /></Pressable>
        <Text style={styles.periodLabel}>{periodLabel}</Text>
        <Pressable style={styles.navButton} onPress={() => shiftPeriod(1)}><Ionicons name="chevron-forward" size={20} color={colors.accentLight} /></Pressable>
      </View>

      {analytics ? <>
        <FinanceCard label={`Tổng doanh thu · ${periodLabel}`} value={coin(analytics.summary.gross_revenue_coin)} tone="success" />
        <View style={styles.grid}>
          <SmallCard label="Doanh thu tác giả" value={coin(analytics.summary.creator_revenue_coin)} />
          <SmallCard label="Phí nền tảng" value={coin(analytics.summary.platform_fee_coin)} />
        </View>
        <StackedRevenueChart title={`Cơ cấu doanh thu · ${periodLabel}`} points={analytics.points.map((point) => ({ label: point.label, primary: (point.mangaka_revenue_coin + point.assistant_revenue_coin) / 100, secondary: point.platform_fee_coin / 100 }))} />

        <Text style={styles.section}>Top 5 truyện doanh thu cao nhất</Text>
        <GlassCard innerStyle={styles.list}>
          {analytics.top_series.length ? analytics.top_series.slice(0, 5).map((item, index) => (
            <View key={item.series_id} style={styles.seriesRow}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <View style={styles.cover}>{item.cover_image_url ? <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} contentFit="cover" /> : <Ionicons name="book-outline" size={20} color={colors.textMuted} />}</View>
              <View style={styles.seriesInfo}><Text style={styles.seriesName} numberOfLines={2}>{item.series_name}</Text><Text style={styles.author} numberOfLines={1}>{item.author?.full_name || item.author?.username || 'Chưa rõ tác giả'} · {NUMBER.format(item.chapters_sold)} lượt mua</Text></View>
              <Text style={styles.revenue}>{coin(item.gross_revenue_coin)}</Text>
            </View>
          )) : <Text style={styles.empty}>Chưa có doanh thu trong kỳ này.</Text>}
        </GlassCard>
      </> : null}

      {summary ? <>
        <Text style={styles.section}>Toàn hệ thống</Text>
        <FinanceCard label="Coin đang lưu hành" value={coin(summary.total_circulation_coin)} tone="cyan" />
        <FinanceCard label="Tổng tiền đã rút" value={VND.format(summary.total_withdrawn_vnd)} tone="warning" />
        <View style={styles.grid}>
          <SmallCard label="Yêu cầu chờ duyệt" value={NUMBER.format(summary.pending_withdrawals.count)} />
          <SmallCard label="Người dùng có số dư" value={NUMBER.format(summary.total_users_with_balance)} />
        </View>
      </> : null}
    </RolePage>
  );
}

function FinanceCard({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'success' | 'warning' }) {
  const color = tone === 'cyan' ? colors.cyan : tone === 'success' ? colors.success : colors.warning;
  return <GlassCard innerStyle={styles.card}><Text style={styles.cardLabel}>{label}</Text><Text style={[styles.cardValue, { color }]}>{value}</Text></GlassCard>;
}
function SmallCard({ label, value }: { label: string; value: string }) { return <GlassCard style={styles.small} innerStyle={styles.smallInner}><Text style={styles.smallValue}>{value}</Text><Text style={styles.smallLabel}>{label}</Text></GlassCard>; }

const styles = StyleSheet.create({
  periodNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, navButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassLight }, periodLabel: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold, fontSize: 16 },
  card: { padding: spacing.xl }, cardLabel: { color: colors.textMuted, fontSize: 13 }, cardValue: { fontSize: 25, fontFamily: typography.fontFamilyBold, marginTop: spacing.sm },
  grid: { flexDirection: 'row', gap: spacing.sm }, small: { flex: 1 }, smallInner: { padding: spacing.lg }, smallValue: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold }, smallLabel: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  section: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold, marginTop: spacing.sm }, list: { padding: spacing.md }, seriesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder },
  rank: { width: 26, color: colors.cyan, fontFamily: typography.fontFamilyBold }, cover: { width: 44, height: 60, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.glassMedium, alignItems: 'center', justifyContent: 'center' }, coverImage: { width: '100%', height: '100%' },
  seriesInfo: { flex: 1 }, seriesName: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold }, author: { color: colors.textMuted, fontSize: 11, marginTop: 4 }, revenue: { color: colors.success, fontSize: 12, fontFamily: typography.fontFamilyBold }, empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
});
