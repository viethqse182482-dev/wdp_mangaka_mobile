import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AdminTabBar } from '../components/role/AdminTabBar';
import { ChapterStatusChart } from '../components/role/ChartVariants';
import { RolePage } from '../components/role/RolePage';
import {
  AdminDashboardData,
  ChapterStatusDistribution,
  fetchAdminDashboard,
  fetchChapterStatusDistribution,
} from '../services/roleService';
import { colors, spacing, typography } from '../theme/colors';
import { GlassCard } from '../theme/uiPrimitives';

const NUMBER = new Intl.NumberFormat('vi-VN');

export function AdminDashboardScreen() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [chapterStatus, setChapterStatus] = useState<ChapterStatusDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [dashboard, distribution] = await Promise.all([
        fetchAdminDashboard(),
        fetchChapterStatusDistribution(),
      ]);
      setData(dashboard);
      setChapterStatus(distribution);
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể tải dashboard.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <RolePage title="Dashboard" subtitle="Tổng quan hoạt động hệ thống" loading={loading} error={error} onRefresh={load} footer={<AdminTabBar active="dashboard" />}>
      {data ? <>
        <View style={styles.grid}>
          <Stat label="Tổng lượt xem" value={data.stats.totalViews} />
          <Stat label="Tổng người dùng" value={data.stats.totalUsers} />
          <Stat label="Tổng chương" value={data.stats.totalReads} />
          <Stat label="Bình luận" value={data.stats.totalComments} />
        </View>
        {chapterStatus ? <ChapterStatusChart data={chapterStatus} /> : null}
        <Text style={styles.section}>Truyện nổi bật</Text>
        <GlassCard innerStyle={styles.list}>
          {data.topManga.length ? data.topManga.map((item, index) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <View style={styles.cover}>{item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={styles.coverImage} contentFit="cover" /> : <Ionicons name="book-outline" size={20} color={colors.textMuted} />}</View>
              <Text style={styles.name} numberOfLines={2}>{item.title}</Text><Text style={styles.meta}>{NUMBER.format(item.views)} lượt xem</Text>
            </View>
          )) : <Text style={styles.empty}>Chưa có dữ liệu.</Text>}
        </GlassCard>
        <Text style={styles.section}>Hoạt động gần đây</Text>
        <GlassCard innerStyle={styles.list}>
          {data.recentActivity.length ? data.recentActivity.map((item) => (
            <View key={item.id} style={styles.activity}><Text style={styles.name}>{item.message}</Text><Text style={styles.meta}>{new Date(item.time).toLocaleString('vi-VN')}</Text></View>
          )) : <Text style={styles.empty}>Chưa có hoạt động.</Text>}
        </GlassCard>
      </> : null}
    </RolePage>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <GlassCard style={styles.stat} innerStyle={styles.statInner}><Text style={styles.value}>{NUMBER.format(value)}</Text><Text style={styles.label}>{label}</Text></GlassCard>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, stat: { width: '48%' }, statInner: { padding: spacing.lg },
  value: { color: colors.textPrimary, fontSize: 23, fontFamily: typography.fontFamilyBold }, label: { color: colors.textMuted, marginTop: 5, fontSize: 12 },
  section: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold, marginTop: spacing.sm }, list: { padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }, rank: { color: colors.cyan, width: 30, fontFamily: typography.fontFamilyBold },
  cover: { width: 44, height: 58, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.glassMedium, alignItems: 'center', justifyContent: 'center' }, coverImage: { width: '100%', height: '100%' },
  name: { flex: 1, color: colors.textPrimary, fontFamily: typography.fontFamilyMedium }, meta: { color: colors.textMuted, fontSize: 11 },
  activity: { gap: 4, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder }, empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.md },
});
