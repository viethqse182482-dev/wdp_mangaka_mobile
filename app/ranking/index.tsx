/**
 * RankingScreen — bảng xếp hạng với:
 *  - Hero header glass gradient (trophy badge + title + period)
 *  - Segmented control cho tab Lượt đọc / Vote / Đánh giá
 *  - PeriodFilter pill group
 *  - FlatList các RankingItem glass
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RankingItem } from '../../src/components/ranking/RankingItem';
import { PeriodFilter } from '../../src/components/ranking/PeriodFilter';
import {
  fetchReaderRankingDashboard,
  clearRankingCache,
} from '../../src/services/seriesService';
import { RankingPeriod, RankingType, ReaderRankingItem } from '../../src/types/story';
import { colors, radius, spacing, typography } from '../../src/theme/colors';
import {
  GlassIconButton,
  GlassSegmentedControl,
  GlassPill,
} from '../../src/theme/uiPrimitives';

const TABS: { value: RankingType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'top_views', label: 'Lượt đọc', icon: 'eye-outline' },
  { value: 'top_votes', label: 'Vote', icon: 'heart-outline' },
  { value: 'top_rating', label: 'Đánh giá', icon: 'star-outline' },
];

export default function RankingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<RankingType>('top_views');
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('weekly');
  const [data, setData] = useState<{
    topViews: ReaderRankingItem[];
    topVotes: ReaderRankingItem[];
    topRating: ReaderRankingItem[];
    periodLabel: string;
  }>({
    topViews: [],
    topVotes: [],
    topRating: [],
    periodLabel: 'Tuần này',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (period: RankingPeriod, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        clearRankingCache();
        const result = await fetchReaderRankingDashboard(period, 10);
        setData({
          topViews: result.topViews,
          topVotes: result.topVotes,
          topRating: result.topRating,
          periodLabel: result.periodLabel,
        });
      } catch {
        setData({
          topViews: [],
          topVotes: [],
          topRating: [],
          periodLabel: 'Tuần này',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData(activePeriod);
  }, [activePeriod, loadData]);

  const handleRefresh = useCallback(() => {
    loadData(activePeriod, true);
  }, [activePeriod, loadData]);

  const handlePeriodChange = useCallback((period: RankingPeriod) => {
    setActivePeriod(period);
  }, []);

  const handlePressItem = useCallback(
    (seriesId: string) => {
      router.push(`/story/${seriesId}` as any);
    },
    [router],
  );

  const getCurrentData = (): ReaderRankingItem[] => {
    switch (activeTab) {
      case 'top_views':
        return data.topViews;
      case 'top_votes':
        return data.topVotes;
      case 'top_rating':
        return data.topRating;
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: ReaderRankingItem }) => (
      <RankingItem item={item} rankingType={activeTab} onPress={handlePressItem} />
    ),
    [activeTab, handlePressItem],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
      <Text style={styles.emptySubtext}>Hãy thử chọn khoảng thời gian khác</Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroBadgeWrap}>
          <LinearGradient
            colors={[colors.accent, colors.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBadge}
          >
            <Ionicons name="trophy" size={22} color={colors.white} />
          </LinearGradient>
        </View>
        <View>
          <Text style={styles.heroTitle}>Bảng xếp hạng</Text>
          <Text style={styles.heroSubtitle}>{data.periodLabel}</Text>
        </View>
      </View>

      <View style={styles.tabWrap}>
        <GlassSegmentedControl
          options={TABS}
          value={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <PeriodFilter selected={activePeriod} onSelect={handlePeriodChange} />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[styles.glowA]} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <GlassIconButton
          icon="arrow-back"
          size={40}
          tint="light"
          onPress={() => router.back()}
        />
        <Text style={styles.topBarTitle}>Bảng xếp hạng</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      ) : (
        <FlatList
          data={getCurrentData()}
          renderItem={renderItem}
          keyExtractor={(item) => `rank-${item.series_id}`}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            getCurrentData().length === 0 ? styles.emptyList : styles.listContent,
            { paddingTop: insets.top + 70 },
          ]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowA: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accent,
    opacity: 0.18,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 100,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    zIndex: 10,
  },
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heroBadgeWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: colors.cyan,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    marginTop: 2,
  },
  tabWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
  },
});
