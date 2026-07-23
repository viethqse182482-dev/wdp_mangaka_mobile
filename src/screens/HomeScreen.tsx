import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Dimensions,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '../components/home/HomeHeader';
import { BannerSlider } from '../components/home/BannerSlider';
import { SectionHeader } from '../components/home/SectionHeader';
import { StoryGridCard } from '../components/home/StoryGridCard';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { FeaturedStory, Story } from '../types/story';
import { colors, spacing } from '../theme/colors';
import { StoryFeaturedCard } from '../components/home/StoryFeaturedCard';
import { StoryRankingCard } from '../components/home/StoryRankingCard';
import {
  fetchFeaturedStories,
  fetchRanking,
  fetchSeriesByTab,
  fetchSeriesList,
  searchSeries,
} from '../services/seriesService';
import { sortByReaders, sortByRelevance } from '../utils/storySort';

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.md;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export function HomeScreen() {
  const router = useRouter();
  const { openStory, loginPromptModal } = useStoryNavigation();
  const [bannerStories, setBannerStories] = useState<Story[]>([]);
  const [gridStories, setGridStories] = useState<Story[]>([]);
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [recommendTab, setRecommendTab] = useState<'all' | 'ranking'>('all');
  const [rankingStories, setRankingStories] = useState<Story[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FeaturedStory[]>([]);
  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal: tabLoginPromptModal,
  } = useMainTabNavigation('home');

  const handlePressStory = useCallback((storyId: string) => {
    void openStory(storyId);
  }, [openStory]);

  const handleSearchPress = useCallback(() => {
    setSearchOpen((prev) => !prev);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleHistoryPress = useCallback(() => {
    router.push('/history');
  }, [router]);

  const handleSeeAllLatest = useCallback(() => {
    router.push({ pathname: '/more-stories', params: { mode: 'updates' } });
  }, [router]);

  const handleSeeAllNewStories = useCallback(() => {
    router.push({ pathname: '/more-stories', params: { mode: 'recommend' } });
  }, [router]);

  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      try {
        const [banner, grid, featured] = await Promise.all([
          fetchSeriesList({ sort: 'average_score', limit: 5 }),
          fetchSeriesList({ sort: 'updatedAt', limit: GRID_COLUMNS * 2 }),
          fetchFeaturedStories(8),
        ]);
        if (!mounted) return;
        setBannerStories(banner.stories);
        setGridStories(grid.stories);
        if (featured.length > 0) setFeaturedStories(sortByReaders(featured));
      } finally {
        if (mounted) setFeaturedLoading(false);
      }
    };

    void loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (recommendTab !== 'ranking') return;
    if (rankingStories.length > 0) return;

    let mounted = true;
    setRankingLoading(true);

    fetchRanking()
      .then((data) => {
        if (!mounted) return;
        setRankingStories(data);
      })
      .catch(() => {
        if (!mounted) return;
        setRankingStories([]);
      })
      .finally(() => {
        if (!mounted) return;
        setRankingLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [recommendTab]);

  useEffect(() => {
    if (!searchOpen) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const keyword = searchQuery.trim();
    if (keyword.length < 1) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let mounted = true;
    setSearchLoading(true);

    const timer = setTimeout(() => {
      searchSeries(keyword, 8)
        .then((data) => {
          if (!mounted) return;
          setSearchResults(sortByRelevance(data, keyword));
        })
        .catch(() => {
          if (!mounted) return;
          setSearchResults([]);
        })
        .finally(() => {
          if (!mounted) return;
          setSearchLoading(false);
        });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [searchOpen, searchQuery]);

  const handleSearchResultPress = useCallback((storyId: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    void handlePressStory(storyId);
  }, [handlePressStory]);

  const rankedStories = useMemo((): FeaturedStory[] => {
    if (recommendTab === 'ranking') {
      return rankingStories.map((story) => ({
        ...story,
        followers: story.views,
      }));
    }
    return featuredStories;
  }, [recommendTab, rankingStories, featuredStories]);

  const gridRows = useMemo(() => {
    const rows: Story[][] = [];
    for (let i = 0; i < gridStories.length; i += GRID_COLUMNS) {
      rows.push(gridStories.slice(i, i + GRID_COLUMNS));
    }
    return rows;
  }, [gridStories]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <HomeHeader
        onSearchPress={handleSearchPress}
        onHistoryPress={handleHistoryPress}
      />

      {searchOpen ? (
        <View style={styles.searchContainer}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            placeholder="Nhập tên truyện..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />

          <View style={styles.searchDropdown}>
            {searchLoading ? (
              <View style={styles.searchLoadingRow}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.searchHint}>Đang tìm truyện...</Text>
              </View>
            ) : searchQuery.trim().length === 0 ? (
              <Text style={styles.searchHint}>Nhập ký tự để tìm truyện</Text>
            ) : searchResults.length === 0 ? (
              <Text style={styles.searchHint}>Không tìm thấy truyện tương ứng</Text>
            ) : (
              searchResults.map((story) => (
                <Pressable
                  key={`search-${story.id}`}
                  onPress={() => handleSearchResultPress(story.id)}
                  style={({ pressed }) => [styles.searchItem, pressed && styles.tabPressed]}
                >
                  <Image
                    source={{ uri: story.coverUrl }}
                    style={styles.searchItemCover}
                    contentFit="cover"
                    transition={120}
                  />
                  <View style={styles.searchItemText}>
                    <Text style={styles.searchItemTitle} numberOfLines={1}>
                      {story.title}
                    </Text>
                    <Text style={styles.searchItemMeta} numberOfLines={1}>
                      {story.genres.join(' · ')}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BannerSlider stories={bannerStories} onStoryPress={handlePressStory} />

        <SectionHeader
          title="Truyện Mới Cập Nhật"
          subtitle="Cập nhật liên tục mỗi ngày"
          onSeeAllPress={handleSeeAllLatest}
        />

        <View style={styles.grid}>
          {gridRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {row.map((story) => (
                <StoryGridCard
                  key={story.id}
                  story={story}
                  width={GRID_ITEM_WIDTH}
                  onPress={handlePressStory}
                />
              ))}
              {row.length < GRID_COLUMNS &&
                Array.from({ length: GRID_COLUMNS - row.length }).map((_, i) => (
                  <View key={`spacer-${i}`} style={{ width: GRID_ITEM_WIDTH }} />
                ))}
            </View>
          ))}
        </View>

        <SectionHeader title="Truyện Đề Xuất" onSeeAllPress={handleSeeAllNewStories} />

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setRecommendTab('all')}
            style={({ pressed }) => [
              styles.tabItem,
              recommendTab === 'all' && styles.tabItemActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.tabText, recommendTab === 'all' && styles.tabTextActive]}>TẤT CẢ</Text>
          </Pressable>
          <Pressable
            onPress={() => setRecommendTab('ranking')}
            style={({ pressed }) => [
              styles.tabItem,
              recommendTab === 'ranking' && styles.tabItemActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.tabText, recommendTab === 'ranking' && styles.tabTextActive]}>BXH</Text>
          </Pressable>
        </View>

        {featuredLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Đang tải truyện...</Text>
          </View>
        ) : recommendTab === 'all' ? (
          <View style={styles.featuredList}>
            {featuredStories.map((story) => (
              <StoryFeaturedCard
                key={`new-${story.id}`}
                story={story}
                onPress={handlePressStory}
              />
            ))}
          </View>
        ) : (
          <View style={styles.featuredList}>
            {rankedStories.map((story, index) => (
              <StoryRankingCard
                key={`rank-${story.id}`}
                story={story}
                rank={index + 1}
                onPress={handlePressStory}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={handleTabPress} />

      <AccountDrawer
        visible={accountDrawerVisible}
        onClose={() => setAccountDrawerVisible(false)}
        onMenuPress={handleAccountMenuPress}
      />

      {loginPromptModal}
      {tabLoginPromptModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    zIndex: 20,
  },
  searchInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  searchDropdown: {
    marginTop: spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchHint: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchItemCover: {
    width: 38,
    height: 54,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  searchItemText: {
    flex: 1,
    minWidth: 0,
  },
  searchItemTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  searchItemMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  grid: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  featuredList: {
    marginBottom: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tabItem: {
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: 'Roboto-Bold',
  },
  tabTextActive: {
    color: colors.accent,
  },
  tabPressed: {
    opacity: 0.75,
  },
  loadingBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
  },
  bottomSpacer: {
    height: spacing.lg,
  },
});
