/**
 * HomeScreen — trang chủ với:
 *  - Background gradient (topo lines subtle) + glow blobs
 *  - HomeHeader glass (depth tăng khi scroll)
 *  - Search overlay (khi bật) với GlassTextField mới
 *  - Banner slider (glass overlay)
 *  - Grid "Mới cập nhật" (3 cột)
 *  - "Đề xuất" (StoryFeaturedCard)
 *  - BottomTabBar liquid glass floating
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeHeader } from '../components/home/HomeHeader';
import { BannerSlider } from '../components/home/BannerSlider';
import { SectionHeader } from '../components/home/SectionHeader';
import { StoryGridCard } from '../components/home/StoryGridCard';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { HighlightedText } from '../components/home/HighlightedText';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { FeaturedStory, Story } from '../types/story';
import { colors, radius, spacing, typography } from '../theme/colors';
import { StoryFeaturedCard } from '../components/home/StoryFeaturedCard';
import { GlassCard, Tag, GlassTextField } from '../theme/uiPrimitives';
import {
  clearSeriesCache,
  fetchFeaturedStories,
  fetchSeriesList,
  searchSeries,
} from '../services/seriesService';
import { sortByReaders, sortByRelevance } from '../utils/storySort';

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.md;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const SEARCH_RESULT_CACHE_TTL_MS = 60_000;

interface SearchCacheEntry {
  value: FeaturedStory[];
  timestamp: number;
}

export function HomeScreen() {
  const router = useRouter();
  const { openStory, loginPromptModal } = useStoryNavigation();
  const [bannerStories, setBannerStories] = useState<Story[]>([]);
  const [gridStories, setGridStories] = useState<Story[]>([]);
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FeaturedStory[]>([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchCacheRef = useRef<Map<string, SearchCacheEntry>>(new Map());
  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal: tabLoginPromptModal,
  } = useMainTabNavigation('home');

  const handlePressStory = useCallback(
    (storyId: string) => {
      void openStory(storyId);
    },
    [openStory],
  );

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchAttempted(false);
  }, []);

  const handleSearchPress = useCallback(() => {
    if (searchOpen) {
      closeSearch();
    } else {
      setSearchOpen(true);
      setSearchAttempted(false);
    }
  }, [searchOpen, closeSearch]);

  const handleClearSearchText = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchAttempted(false);
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

  const loadHomeData = useCallback(async () => {
    try {
      const [banner, grid, featured] = await Promise.all([
        fetchSeriesList({ sort: 'average_score', limit: 5 }),
        fetchSeriesList({ sort: 'updatedAt', limit: GRID_COLUMNS * 2 }),
        fetchFeaturedStories(8),
      ]);
      setBannerStories(banner.stories);
      setGridStories(grid.stories);
      if (featured.length > 0) setFeaturedStories(sortByReaders(featured));
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      clearSeriesCache();
      await loadHomeData();
    } finally {
      setRefreshing(false);
    }
  }, [loadHomeData]);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (searchOpen) closeSearch();
      };
    }, [searchOpen, closeSearch]),
  );

  useEffect(() => {
    if (!searchOpen) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchAttempted(false);
      return;
    }

    const keyword = searchQuery.trim();
    if (keyword.length < 1) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchAttempted(false);
      return;
    }

    const cache = searchCacheRef.current;
    const cached = cache.get(keyword);
    if (cached && Date.now() - cached.timestamp < SEARCH_RESULT_CACHE_TTL_MS) {
      setSearchResults(cached.value);
      setSearchLoading(false);
      setSearchAttempted(true);
      return;
    }

    let mounted = true;
    setSearchLoading(true);
    setSearchAttempted(true);

    const timer = setTimeout(() => {
      searchSeries(keyword, 8)
        .then((data) => {
          if (!mounted) return;
          const sorted = sortByRelevance(data, keyword);
          cache.set(keyword, { value: sorted, timestamp: Date.now() });
          setSearchResults(sorted);
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

  const handleSearchResultPress = useCallback(
    (storyId: string) => {
      closeSearch();
      void handlePressStory(storyId);
    },
    [handlePressStory, closeSearch],
  );

  const gridRows = useMemo(() => {
    const rows: Story[][] = [];
    for (let i = 0; i < gridStories.length; i += GRID_COLUMNS) {
      rows.push(gridStories.slice(i, i + GRID_COLUMNS));
    }
    return rows;
  }, [gridStories]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Glow nền */}
      <View pointerEvents="none" style={[styles.glowA]} />
      <View pointerEvents="none" style={[styles.glowB]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <HomeHeader
          onSearchPress={handleSearchPress}
          onHistoryPress={handleHistoryPress}
          scrolled={scrolled}
          searchOpen={searchOpen}
        />

        {searchOpen ? (
          <Pressable
            style={styles.searchBackdrop}
            onPress={closeSearch}
            accessibilityLabel="Đóng tìm kiếm"
          />
        ) : null}

        {searchOpen ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputRow}>
              <View style={{ flex: 1 }}>
                <GlassTextField
                  icon="search"
                  rightIcon={searchQuery.length > 0 ? 'backspace-outline' : 'close-outline'}
                  onRightIconPress={
                    searchQuery.length > 0 ? handleClearSearchText : closeSearch
                  }
                  autoFocus
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Nhập tên truyện..."
                  returnKeyType="search"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <Pressable
                onPress={closeSearch}
                hitSlop={10}
                style={({ pressed }) => [styles.searchCancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.searchCancelText}>Huỷ</Text>
              </Pressable>
            </View>

            <GlassCard
              tint="navy"
              depth={3}
              radius={radius.lg}
              style={styles.searchDropdown}
              innerStyle={styles.searchDropdownInner}
            >
              {searchLoading ? (
                <View style={styles.searchHintRow}>
                  <ActivityIndicator color={colors.accentLight} />
                  <Text style={styles.searchHint}>Đang tìm truyện...</Text>
                </View>
              ) : searchQuery.trim().length === 0 ? (
                <Text style={styles.searchHint}>Nhập từ khoá để tìm truyện</Text>
              ) : !searchAttempted ? null : searchResults.length === 0 ? (
                <View style={styles.searchEmptyWrap}>
                  <Ionicons
                    name="search-outline"
                    size={22}
                    color={colors.textMuted}
                    style={{ marginBottom: spacing.xs }}
                  />
                  <Text style={styles.searchHint}>
                    Không tìm thấy truyện với từ khoá "{searchQuery.trim()}"
                  </Text>
                  <Text style={styles.searchHintSub}>
                    Thử từ khoá khác hoặc kiểm tra chính tả.
                  </Text>
                </View>
              ) : (
                searchResults.map((story, index) => (
                  <Pressable
                    key={`search-${story.id}`}
                    onPress={() => handleSearchResultPress(story.id)}
                    style={({ pressed }) => [
                      styles.searchItem,
                      index === searchResults.length - 1 ? null : styles.searchItemDivider,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Image
                      source={{ uri: story.coverUrl }}
                      style={styles.searchItemCover}
                      contentFit="cover"
                      transition={120}
                    />
                    <View style={styles.searchItemText}>
                      <HighlightedText
                        text={story.title}
                        keyword={searchQuery}
                        numberOfLines={1}
                        style={styles.searchItemTitle}
                      />
                      <View style={styles.searchItemTagRow}>
                        {story.genres.slice(0, 2).map((g) => (
                          <Tag key={g} label={g} size="sm" variant="default" />
                        ))}
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ))
              )}
            </GlassCard>
          </View>
        ) : null}

        <ScrollView
          style={[styles.scroll, searchOpen && styles.scrollHidden]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={searchOpen ? 'on-drag' : 'none'}
          scrollEnabled={!searchOpen}
          onScroll={(e) => {
            const offset = e.nativeEvent.contentOffset.y;
            setScrolled(offset > 8);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              onRefresh={handleRefresh}
              refreshing={refreshing}
              tintColor={colors.accentLight}
            />
          }
        >
          <BannerSlider stories={bannerStories} onStoryPress={handlePressStory} />

          <SectionHeader
            title="Truyện Mới Cập Nhật"
            subtitle="Cập nhật liên tục mỗi ngày"
            onSeeAllPress={handleSeeAllLatest}
            icon="flame-outline"
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

          <SectionHeader
            title="Truyện Đề Xuất"
            subtitle="Gợi ý dành riêng cho bạn"
            onSeeAllPress={handleSeeAllNewStories}
            icon="sparkles-outline"
          />

          {featuredLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.accentLight} />
              <Text style={styles.loadingText}>Đang tải truyện...</Text>
            </View>
          ) : (
            <View style={styles.featuredList}>
              {featuredStories.map((story) => (
                <StoryFeaturedCard
                  key={`new-${story.id}`}
                  story={story}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  glowA: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accent,
    opacity: 0.18,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  glowB: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.cyan,
    opacity: 0.12,
    shadowColor: colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    position: 'relative',
    zIndex: 2,
  },
  searchBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7,11,26,0.55)',
    zIndex: 1,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 2,
  },
  searchCancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchCancelText: {
    color: colors.accentLight,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  searchEmptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  searchHintSub: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyRegular,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  scrollHidden: {
    opacity: 0.4,
  },
  searchDropdown: {
    marginTop: spacing.sm,
  },
  searchDropdownInner: {
    padding: spacing.sm,
  },
  searchHintRow: {
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
    fontFamily: typography.fontFamilyMedium,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  searchItemCover: {
    width: 40,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  searchItemText: {
    flex: 1,
    minWidth: 0,
  },
  searchItemTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  searchItemTagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
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
  loadingBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyRegular,
  },
  bottomSpacer: {
    height: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
});
