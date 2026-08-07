import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { AdminTabBar } from '../components/role/AdminTabBar';
import { RolePage } from '../components/role/RolePage';
import {
  AdminRankingItem,
  AdminRankingPeriod,
  AdminRankingStats,
  AdminRankingType,
  fetchAdminRankings,
  fetchAdminRankingStats,
} from '../services/roleService';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard } from '../theme/uiPrimitives';

const NUMBER = new Intl.NumberFormat('vi-VN');
const METRICS: Array<{ value: AdminRankingType; label: string; shortLabel: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'views', label: 'lượt xem', shortLabel: 'Xem', icon: 'eye-outline' },
  { value: 'votes', label: 'bình chọn', shortLabel: 'Bình chọn', icon: 'heart-outline' },
  { value: 'rating', label: 'điểm số', shortLabel: 'Điểm', icon: 'star-outline' },
];
const PERIODS: Array<{ value: AdminRankingPeriod; label: string }> = [
  { value: 'daily', label: 'Ngày' }, { value: 'weekly', label: 'Tuần' }, { value: 'monthly', label: 'Tháng' }, { value: 'all', label: 'Tất cả' },
];

export function AdminRankingsScreen() {
  const [items, setItems] = useState<AdminRankingItem[]>([]);
  const [stats, setStats] = useState<AdminRankingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<AdminRankingType>('views');
  const [period, setPeriod] = useState<AdminRankingPeriod>('all');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rankingItems, rankingStats] = await Promise.all([
        fetchAdminRankings({ type, period }), fetchAdminRankingStats(),
      ]);
      setItems(rankingItems);
      setStats(rankingStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải bảng xếp hạng.');
    } finally {
      setLoading(false);
    }
  }, [period, type]);
  useEffect(() => { void load(); }, [load]);

  const insight = useMemo(() => {
    const values = items.map((item) => metric(item, type, period));
    const leaderValue = values[0] ?? 0;
    const secondValue = values[1] ?? 0;
    const positiveValues = values.filter((value) => value > 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    const average = positiveValues.length ? total / positiveValues.length : 0;
    const leaderShare = type === 'rating'
      ? Math.min(100, leaderValue / 10 * 100)
      : total > 0 ? leaderValue / total * 100 : 0;
    let change: number | null = null;
    if (type === 'views' && period === 'daily') change = stats?.views_today.change ?? null;
    else if (type === 'views' && period === 'weekly') change = stats?.views_this_week.change ?? null;
    else if (type === 'votes' && period === 'weekly') change = stats?.votes_this_week.change ?? null;
    return {
      mainValue: type === 'rating' ? average : total,
      leaderValue,
      gap: Math.max(0, leaderValue - secondValue),
      leaderShare,
      active: stats?.active_series.value ?? positiveValues.length,
      change,
    };
  }, [items, period, stats, type]);

  const metricLabel = METRICS.find((item) => item.value === type)?.label ?? 'lượt xem';

  return (
    <RolePage title="Bảng xếp hạng" subtitle={`Phân tích toàn hệ thống theo ${metricLabel}`} loading={loading} error={error} onRefresh={load} footer={<AdminTabBar active="rankings" />}>
      <MetricSelector value={type} onChange={setType} />
      <PeriodSelector value={period} onChange={setPeriod} />
      <RankingInsight type={type} period={period} items={items} insight={insight} />

      <View style={styles.listHeading}><View><Text style={styles.listTitle}>Danh sách xếp hạng</Text><Text style={styles.listSubtitle}>Sắp xếp theo {metricLabel}</Text></View><View style={styles.resultBadge}><Text style={styles.resultText}>{items.length} kết quả</Text></View></View>
      <GlassCard innerStyle={styles.list}>
        {items.length ? items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.rank, item.rank <= 3 && styles.topRank]}><Text style={[styles.rankText, item.rank <= 3 && styles.topRankText]}>{item.rank}</Text></View>
            <View style={styles.cover}>{item.cover_image_url ? <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} contentFit="cover" /> : <Ionicons name="book-outline" size={20} color={colors.textMuted} />}</View>
            <View style={styles.content}><Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.author} numberOfLines={1}>{item.author || 'Chưa rõ tác giả'}</Text></View>
            <View style={styles.metrics}><Text style={styles.metricValue}>{type === 'rating' ? metric(item, type, period).toFixed(1) : NUMBER.format(metric(item, type, period))}</Text><Text style={styles.metricUnit}>{type === 'views' ? 'lượt xem' : type === 'votes' ? 'bình chọn' : 'điểm'}</Text></View>
          </View>
        )) : <Text style={styles.empty}>Chưa có dữ liệu xếp hạng.</Text>}
      </GlassCard>
    </RolePage>
  );
}

function MetricSelector({ value, onChange }: { value: AdminRankingType; onChange: (value: AdminRankingType) => void }) {
  return <View style={styles.metricSelector}>{METRICS.map((item) => {
    const active = value === item.value;
    return <Pressable key={item.value} style={[styles.metricOption, active && styles.metricOptionActive]} onPress={() => onChange(item.value)}><Ionicons name={active ? item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : item.icon} size={17} color={active ? colors.white : colors.textMuted} /><Text style={[styles.metricOptionText, active && styles.metricOptionTextActive]}>{item.shortLabel}</Text></Pressable>;
  })}</View>;
}

function PeriodSelector({ value, onChange }: { value: AdminRankingPeriod; onChange: (value: AdminRankingPeriod) => void }) {
  return <View style={styles.periodSection}><View style={styles.periodLabelWrap}><Ionicons name="calendar-outline" size={15} color={colors.textMuted} /><Text style={styles.periodLabel}>Khoảng thời gian</Text></View><View style={styles.periodChips}>{PERIODS.map((item) => {
    const active = item.value === value;
    return <Pressable key={item.value} style={[styles.periodChip, active && styles.periodChipActive]} onPress={() => onChange(item.value)}><Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>{item.label}</Text></Pressable>;
  })}</View></View>;
}

function RankingInsight({ type, period, items, insight }: {
  type: AdminRankingType;
  period: AdminRankingPeriod;
  items: AdminRankingItem[];
  insight: { mainValue: number; leaderValue: number; gap: number; leaderShare: number; active: number; change: number | null };
}) {
  const leader = items[0];
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? '';
  const mainLabel = type === 'rating' ? 'Điểm trung bình' : type === 'views' ? 'Tổng lượt xem' : 'Tổng bình chọn';
  const shareLabel = type === 'rating' ? 'Mức điểm cao nhất' : 'Tỷ trọng dẫn đầu';
  return <GlassCard depth={3} glow innerStyle={styles.insightCard}>
    <View style={styles.insightHeader}><View><Text style={styles.insightTitle}>Tổng quan {periodLabel.toLowerCase()}</Text><Text style={styles.insightSubtitle}>{mainLabel}</Text></View>{insight.change !== null ? <View style={[styles.changeBadge, insight.change < 0 && styles.changeNegative]}><Ionicons name={insight.change >= 0 ? 'trending-up' : 'trending-down'} size={14} color={insight.change >= 0 ? colors.success : colors.danger} /><Text style={[styles.changeText, insight.change < 0 && styles.changeTextNegative]}>{insight.change >= 0 ? '+' : ''}{insight.change}%</Text></View> : <View style={styles.periodBadge}><Text style={styles.periodBadgeText}>{periodLabel}</Text></View>}</View>
    <View style={styles.insightMain}>
      <View style={{ flex: 1 }}><Text style={styles.insightValue}>{type === 'rating' ? insight.mainValue.toFixed(1) : NUMBER.format(insight.mainValue)}</Text><Text style={styles.insightUnit}>{type === 'rating' ? 'trên thang điểm 10' : type === 'views' ? 'lượt xem trong kỳ' : 'bình chọn trong kỳ'}</Text>{leader ? <Text style={styles.leaderName} numberOfLines={1}>Dẫn đầu: {leader.title}</Text> : null}</View>
      <Donut value={insight.leaderShare} label={type === 'rating' ? insight.leaderValue.toFixed(1) : `${insight.leaderShare.toFixed(0)}%`} />
    </View>
    <View style={styles.insightTiles}>
      <InsightTile icon="pulse-outline" value={NUMBER.format(insight.active)} label="Truyện hoạt động" color={colors.cyan} />
      <InsightTile icon="pie-chart-outline" value={type === 'rating' ? insight.leaderValue.toFixed(1) : `${insight.leaderShare.toFixed(1)}%`} label={shareLabel} color={colors.warning} />
      <InsightTile icon="git-compare-outline" value={type === 'rating' ? insight.gap.toFixed(1) : NUMBER.format(insight.gap)} label="Cách biệt #1–#2" color={colors.success} />
    </View>
  </GlassCard>;
}

function Donut({ value, label }: { value: number; label: string }) {
  const radiusValue = 34;
  const circumference = Math.PI * 2 * radiusValue;
  const progress = Math.min(100, Math.max(0, value));
  return <View style={styles.donutWrap}><Svg width="90" height="90"><G rotation="-90" origin="45,45"><Circle cx="45" cy="45" r={radiusValue} fill="none" stroke={colors.glassMedium} strokeWidth="9" /><Circle cx="45" cy="45" r={radiusValue} fill="none" stroke={colors.cyan} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${circumference * progress / 100} ${circumference}`} /></G></Svg><Text style={styles.donutLabel}>{label}</Text></View>;
}

function InsightTile({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; color: string }) {
  return <View style={styles.insightTile}><Ionicons name={icon} size={17} color={color} /><Text style={styles.tileValue}>{value}</Text><Text style={styles.tileLabel}>{label}</Text></View>;
}

function metric(item: AdminRankingItem, type: AdminRankingType, period: AdminRankingPeriod) {
  if (type === 'rating') return item.average_score || 0;
  if (type === 'votes') return period === 'all' ? item.votes_total || 0 : item.votes_count || 0;
  return period === 'all' ? item.views_total || 0 : item.views_count || 0;
}

const styles = StyleSheet.create({
  metricSelector: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.xl, backgroundColor: colors.glassLight }, metricOption: { flex: 1, minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.lg }, metricOptionActive: { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 }, metricOptionText: { color: colors.textMuted, fontSize: 12, fontFamily: typography.fontFamilyMedium }, metricOptionTextActive: { color: colors.white, fontFamily: typography.fontFamilyBold },
  periodSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, periodLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 }, periodLabel: { color: colors.textMuted, fontSize: 10 }, periodChips: { flexDirection: 'row', gap: 5 }, periodChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassLight }, periodChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent }, periodChipText: { color: colors.textMuted, fontSize: 10, fontFamily: typography.fontFamilyMedium }, periodChipTextActive: { color: colors.accentLight, fontFamily: typography.fontFamilyBold },
  insightCard: { padding: spacing.lg }, insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, insightTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold }, insightSubtitle: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.successSoft }, changeNegative: { backgroundColor: colors.dangerSoft }, changeText: { color: colors.success, fontSize: 11, fontFamily: typography.fontFamilyBold }, changeTextNegative: { color: colors.danger }, periodBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.accentSoft }, periodBadgeText: { color: colors.accentLight, fontSize: 10, fontFamily: typography.fontFamilyBold },
  insightMain: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg }, insightValue: { color: colors.textPrimary, fontSize: 31, fontFamily: typography.fontFamilyBold }, insightUnit: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, leaderName: { color: colors.cyan, fontSize: 11, fontFamily: typography.fontFamilyMedium, marginTop: spacing.sm }, donutWrap: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }, donutLabel: { position: 'absolute', color: colors.textPrimary, fontSize: 13, fontFamily: typography.fontFamilyBold }, insightTiles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }, insightTile: { flex: 1, minHeight: 88, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.glassLight }, tileValue: { color: colors.textPrimary, fontSize: 15, fontFamily: typography.fontFamilyBold, marginTop: 7 }, tileLabel: { color: colors.textMuted, fontSize: 8, lineHeight: 11, marginTop: 3 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }, listTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold }, listSubtitle: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, resultBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.glassLight }, resultText: { color: colors.textMuted, fontSize: 9 },
  list: { padding: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder }, rank: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassMedium }, topRank: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)' }, rankText: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold }, topRankText: { color: colors.warning },
  cover: { width: 46, height: 62, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.glassMedium, alignItems: 'center', justifyContent: 'center' }, coverImage: { width: '100%', height: '100%' }, content: { flex: 1 }, itemTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: typography.fontFamilyBold }, author: { color: colors.textMuted, fontSize: 12, marginTop: 3 }, metrics: { alignItems: 'flex-end' }, metricValue: { color: colors.cyan, fontFamily: typography.fontFamilyBold }, metricUnit: { color: colors.textMuted, fontSize: 10 }, empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
});
