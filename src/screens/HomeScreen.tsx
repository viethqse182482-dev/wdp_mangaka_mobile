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
import { hotStories, latestStories } from '../data/mockStories';
import { newStories } from '../data/mockStoryDetails';
import { FeaturedStory, Story } from '../types/story';
import { colors, spacing } from '../theme/colors';
import { StoryFeaturedCard } from '../components/home/StoryFeaturedCard';
import { StoryRankingCard } from '../components/home/StoryRankingCard';
import {
  fetchFeaturedStoriesFromMangaDex,
  searchMangaDexStories,
} from '../services/mangaDexService';

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.md;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

function sortByReaders(stories: FeaturedStory[]): FeaturedStory[] {
  return [...stories].sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    return b.rating - a.rating;
  });
}

export function HomeScreen() {
  const router = useRouter();
  const { openStory, loginPromptModal } = useStoryNavigation();
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>(newStories);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [recommendTab, setRecommendTab] = useState<'all' | 'ranking'>('all');
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

  const gridRows = useMemo(() => {
    const rows: Story[][] = [];
    for (let i = 0; i < latestStories.length; i += GRID_COLUMNS) {
      rows.push(latestStories.slice(i, i + GRID_COLUMNS));
    }
    return rows;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadFeaturedStories = async () => {
      setFeaturedLoading(true);
      try {
        const stories = await fetchFeaturedStoriesFromMangaDex(8);
        if (mounted && stories.length > 0) {
          setFeaturedStories(sortByReaders(stories));
        }
      } catch {
        if (mounted) {
          setFeaturedStories(sortByReaders(newStories));
        }
      } finally {
        if (mounted) {
          setFeaturedLoading(false);
        }
      }
    };

    void loadFeaturedStories();

    return () => {
      mounted = false;
    };
  }, []);

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
      searchMangaDexStories({
        title: keyword,
        limit: 8,
        orderBy: 'followedCount',
      })
        .then((data) => {
          if (!mounted) return;
          setSearchResults(sortByReaders(data));
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

  const rankedStories = useMemo(
    () => sortByReaders(featuredStories),
    [featuredStories],
  );

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
        <BannerSlider stories={hotStories} onStoryPress={handlePressStory} />

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
            <Text style={styles.loadingText}>Đang tải truyện từ MangaDex...</Text>
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
  },
  bottomSpacer: {
    height: spacing.lg,
  },
});
