/**
 * GenresScreen — Trang thể loại với GlassTextField + GlassPill group.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  LayoutChangeEvent,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { StoryFeaturedCard } from '../components/home/StoryFeaturedCard';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { fetchGenres, fetchTags } from '../services/genreService';
import { fetchSeriesByFilter, searchSeries } from '../services/seriesService';
import { Genre } from '../types/genre';
import { FeaturedStory } from '../types/story';
import { colors, radius, spacing, typography } from '../theme/colors';
import {
  GlassCard,
  GlassPill,
  GlassTextField,
  GradientButton,
} from '../theme/uiPrimitives';
import { sortByRelevance } from '../utils/storySort';

interface FilterOption {
  id: string;
  label: string;
}

const SORT_OPTIONS: FilterOption[] = [
  { id: 'average_score', label: 'Điểm Đánh Giá' },
  { id: 'view_count', label: 'Lượt Xem' },
  { id: 'updatedAt', label: 'Ngày Cập Nhật' },
  { id: 'createdAt', label: 'Truyện Mới' },
];

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;
const STORIES_PER_PAGE = 6;

function FilterPillGrid({
  options,
  columnWidth,
  checked,
  onToggle,
}: {
  options: FilterOption[];
  columnWidth: number;
  checked: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.optionGrid}>
      {options.map((item) => (
        <View key={item.id} style={[styles.gridCell, { width: columnWidth }]}>
          <GlassPill
            label={item.label}
            selected={checked(item.id)}
            onPress={() => onToggle(item.id)}
            tint="navy"
            size="sm"
          />
        </View>
      ))}
    </View>
  );
}

export function GenresScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [keyword, setKeyword] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState('average_score');
  const [stories, setStories] = useState<FeaturedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestStories, setSuggestStories] = useState<FeaturedStory[]>([]);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [resultPage, setResultPage] = useState(1);
  const [resultListTopY, setResultListTopY] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [genreExpanded, setGenreExpanded] = useState(true);
  const [tagExpanded, setTagExpanded] = useState(true);
  const [sortExpanded, setSortExpanded] = useState(true);

  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal,
  } = useMainTabNavigation('genres');

  const { openStory, loginPromptModal: storyLoginPromptModal } = useStoryNavigation();

  const toggleGenre = useCallback((genre: Genre) => {
    setSelectedGenres((prev) =>
      prev.some((g) => g.id === genre.id)
        ? prev.filter((g) => g.id !== genre.id)
        : [...prev, genre],
    );
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const loadFilters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [genreList, tagList] = await Promise.all([
        fetchGenres(),
        fetchTags(),
      ]);
      setGenres(genreList);
      setTags(tagList);
    } catch {
      setError('Không tải được bộ lọc thể loại.');
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async () => {
    setSearching(true);
    setHasAppliedFilters(true);
    setGenreExpanded(false);
    setTagExpanded(false);
    setSortExpanded(false);
    setError(null);

    try {
      const genreNames = selectedGenres.map((g) => g.name);
      const trimmedKeyword = keyword.trim();
      const data = await fetchSeriesByFilter({
        title: trimmedKeyword || undefined,
        genre: genreNames.length > 0 ? genreNames : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: selectedSort as 'average_score' | 'views_count' | 'createdAt' | 'updatedAt',
        limit: 60,
      });
      setStories(trimmedKeyword ? sortByRelevance(data, trimmedKeyword) : data);
      setResultPage(1);
    } catch {
      setError('Không thể tìm truyện. Vui lòng thử lại.');
    } finally {
      setSearching(false);
    }
  }, [keyword, selectedGenres, selectedTags, selectedSort]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    const query = keyword.trim();
    if (!query) {
      setSuggestStories([]);
      setSuggestLoading(false);
      return;
    }

    let mounted = true;
    setSuggestLoading(true);
    const timer = setTimeout(() => {
      searchSeries(query, 8)
        .then((data) => {
          if (!mounted) return;
          setSuggestStories(sortByRelevance(data, query));
        })
        .catch(() => {
          if (!mounted) return;
          setSuggestStories([]);
        })
        .finally(() => {
          if (!mounted) return;
          setSuggestLoading(false);
        });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [keyword]);

  const genreOptions = useMemo(
    () => genres.map((genre) => ({ id: genre.id, label: genre.name })),
    [genres],
  );

  const tagOptions = useMemo(
    () => tags.map((tag) => ({ id: tag, label: tag })),
    [tags],
  );

  const columnWidth = useMemo(() => {
    const boxInnerWidth =
      screenWidth - spacing.lg * 2 - spacing.md * 2 - 2;
    const totalGap = GRID_GAP * (GRID_COLUMNS - 1);
    return Math.floor((boxInnerWidth - totalGap) / GRID_COLUMNS);
  }, [screenWidth]);

  const totalResultPages = useMemo(
    () => Math.max(1, Math.ceil(stories.length / STORIES_PER_PAGE)),
    [stories.length],
  );

  const pagedStories = useMemo(
    () =>
      stories.slice(
        (resultPage - 1) * STORIES_PER_PAGE,
        resultPage * STORIES_PER_PAGE,
      ),
    [resultPage, stories],
  );

  const onStoryPress = useCallback(
    (storyId: string) => {
      // `useStoryNavigation` sẽ check token: nếu chưa đăng nhập → show
      // LoginRequiredModal thay vì navigate vào StoryDetail (BE sẽ trả lỗi
      // nếu gọi story detail mà không có token → Reader/StoryDetail sẽ hiện
      // "Không tải được chi tiết truyện").
      void openStory(storyId);
    },
    [openStory],
  );

  const onSuggestPress = useCallback(
    (story: FeaturedStory) => {
      setKeyword(story.title);
      setSuggestStories([]);
      void openStory(story.id);
    },
    [openStory],
  );

  const handleResultListLayout = useCallback((event: LayoutChangeEvent) => {
    setResultListTopY(event.nativeEvent.layout.y);
  }, []);

  const goToResultPage = useCallback((nextPage: number) => {
    setResultPage(nextPage);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, resultListTopY - spacing.lg),
        animated: true,
      });
    });
  }, [resultListTopY]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchRow}>
            <GlassTextField
              containerStyle={{ flex: 1 }}
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Nhập từ khóa truyện..."
              icon="search"
              onSubmitEditing={() => void runSearch()}
              returnKeyType="search"
            />
            <GradientButton
              label="TÌM"
              onPress={() => void runSearch()}
              size="md"
              icon="search"
              tint="warm"
            />
          </View>

          {keyword.trim().length > 0 ? (
            <GlassCard
              tint="navy"
              depth={2}
              radius={radius.lg}
              style={styles.searchDropdown}
              innerStyle={styles.searchDropdownInner}
            >
              {suggestLoading ? (
                <View style={styles.searchHintRow}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.searchHint}>Đang tìm truyện...</Text>
                </View>
              ) : suggestStories.length === 0 ? (
                <Text style={styles.searchHint}>Không có truyện phù hợp</Text>
              ) : (
                suggestStories.map((story) => (
                  <Pressable
                    key={`suggest-${story.id}`}
                    onPress={() => onSuggestPress(story)}
                    style={({ pressed }) => [styles.searchSuggestItem, pressed && styles.pressed]}
                  >
                    <Image source={{ uri: story.coverUrl }} style={styles.searchCover} contentFit="cover" />
                    <View style={styles.searchTextWrap}>
                      <Text style={styles.searchTitle} numberOfLines={1}>
                        {story.title}
                      </Text>
                      <Text style={styles.searchMeta} numberOfLines={1}>
                        {story.genres.join(' · ')}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </GlassCard>
          ) : null}

          <Pressable
            onPress={() => setGenreExpanded((prev) => !prev)}
            style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
          >
            <Text style={styles.sectionTitle}>Thể Loại</Text>
            <Ionicons
              name={genreExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textPrimary}
            />
          </Pressable>
          {genreExpanded ? (
            <GlassCard
              tint="navy"
              depth={1}
              radius={radius.lg}
              style={styles.groupBox}
              innerStyle={styles.groupBoxInner}
            >
              {loading ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              ) : (
                <FilterPillGrid
                  options={genreOptions}
                  columnWidth={columnWidth}
                  checked={(id) => selectedGenres.some((g) => g.id === id)}
                  onToggle={(id) => {
                    const found = genres.find((g) => g.id === id);
                    if (found) toggleGenre(found);
                  }}
                />
              )}
            </GlassCard>
          ) : null}

          <Pressable
            onPress={() => setTagExpanded((prev) => !prev)}
            style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
          >
            <Text style={styles.sectionTitle}>Tag</Text>
            <Ionicons
              name={tagExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textPrimary}
            />
          </Pressable>
          {tagExpanded ? (
            <GlassCard
              tint="navy"
              depth={1}
              radius={radius.lg}
              style={styles.groupBox}
              innerStyle={styles.groupBoxInner}
            >
              {loading ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              ) : tagOptions.length === 0 ? (
                <Text style={styles.searchHint}>Chưa có tag nào.</Text>
              ) : (
                <FilterPillGrid
                  options={tagOptions}
                  columnWidth={columnWidth}
                  checked={(id) => selectedTags.includes(id)}
                  onToggle={toggleTag}
                />
              )}
            </GlassCard>
          ) : null}

          <Pressable
            onPress={() => setSortExpanded((prev) => !prev)}
            style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
          >
            <Text style={styles.sectionTitle}>Sắp Xếp</Text>
            <Ionicons
              name={sortExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textPrimary}
            />
          </Pressable>
          {sortExpanded ? (
            <GlassCard
              tint="navy"
              depth={1}
              radius={radius.lg}
              style={styles.groupBox}
              innerStyle={styles.groupBoxInner}
            >
              <FilterPillGrid
                options={SORT_OPTIONS}
                columnWidth={columnWidth}
                checked={(id) => selectedSort === id}
                onToggle={setSelectedSort}
              />
            </GlassCard>
          ) : null}

          <GradientButton
            label="Áp dụng bộ lọc"
            onPress={() => void runSearch()}
            size="lg"
            icon="options"
            tint="accent"
            loading={searching}
            fullWidth
            style={{ marginTop: spacing.lg }}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.resultList} onLayout={handleResultListLayout}>
            {pagedStories.map((story) => (
              <StoryFeaturedCard key={story.id} story={story} onPress={onStoryPress} />
            ))}
            {hasAppliedFilters && !searching && stories.length === 0 ? (
              <Text style={styles.emptyText}>Không tìm thấy truyện phù hợp bộ lọc.</Text>
            ) : null}
          </View>

          {hasAppliedFilters && stories.length > STORIES_PER_PAGE ? (
            <View style={styles.paginationRow}>
              <Pressable
                onPress={() => goToResultPage(Math.max(1, resultPage - 1))}
                disabled={resultPage === 1}
                style={({ pressed }) => [
                  styles.pageArrowButton,
                  resultPage === 1 && styles.pageArrowDisabled,
                  pressed && resultPage > 1 && styles.pressed,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={resultPage === 1 ? colors.textMuted : colors.textPrimary}
                />
              </Pressable>
              <Text style={styles.pageInfo}>
                {resultPage}/{totalResultPages}
              </Text>
              <Pressable
                onPress={() => goToResultPage(Math.min(totalResultPages, resultPage + 1))}
                disabled={resultPage === totalResultPages}
                style={({ pressed }) => [
                  styles.pageArrowButton,
                  resultPage === totalResultPages && styles.pageArrowDisabled,
                  pressed && resultPage < totalResultPages && styles.pressed,
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={resultPage === totalResultPages ? colors.textMuted : colors.textPrimary}
                />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <BottomTabBar activeTab="genres" onTabPress={handleTabPress} />

        <AccountDrawer
          visible={accountDrawerVisible}
          onClose={() => setAccountDrawerVisible(false)}
          onMenuPress={handleAccountMenuPress}
        />

        {loginPromptModal}
        {storyLoginPromptModal}
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  searchDropdown: {
    marginTop: spacing.xs,
    borderRadius: radius.lg,
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
  searchSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchCover: {
    width: 34,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  searchTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  searchTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  searchMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamilyMedium,
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  groupBox: {
    borderRadius: radius.lg,
  },
  groupBoxInner: {
    padding: spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridCell: {
    flexGrow: 0,
    flexShrink: 0,
  },
  loadingInline: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.md,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
  },
  resultList: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  pageArrowButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrowDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    minWidth: 32,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});

export default GenresScreen;
