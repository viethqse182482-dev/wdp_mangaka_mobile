import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  LayoutChangeEvent,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { StoryFeaturedCard } from '../components/home/StoryFeaturedCard';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import {
  fetchMangaDexTagOptions,
  MangaDexTagOption,
  searchMangaDexStories,
} from '../services/mangaDexService';
import { fetchSeriesByFilter, searchSeries } from '../services/seriesService';
import { FeaturedStory } from '../types/story';
import { colors, spacing } from '../theme/colors';

interface FilterOption {
  id: string;
  label: string;
}

const STATUS_OPTIONS: FilterOption[] = [
  { id: 'none', label: 'Chưa bắt đầu' },
  { id: 'cancelled', label: 'Đã dừng' },
  { id: 'hiatus', label: 'Hoãn lại' },
  { id: 'ongoing', label: 'Đang thực hiện' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'novel', label: 'Có Truyện Chữ' },
];

const SORT_OPTIONS: FilterOption[] = [
  { id: 'latestUploadedChapter', label: 'Lượt xem' },
  { id: 'rating', label: 'Lượt đánh giá' },
  { id: 'followedCount', label: 'Lượt theo dõi' },
  { id: 'updatedAt', label: 'Ngày Cập Nhật' },
  { id: 'createdAt', label: 'Truyện Mới' },
];

const radiusSm = 8;
const GRID_COLUMNS = 3;
const GRID_GAP = spacing.sm;
const STORIES_PER_PAGE = 6;

function FilterCheckbox({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.checkboxItem, pressed && styles.pressed]}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
      </View>
      <Text style={styles.checkboxText} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterCheckboxGrid({
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
          <FilterCheckbox
            label={item.label}
            checked={checked(item.id)}
            onPress={() => onToggle(item.id)}
          />
        </View>
      ))}
    </View>
  );
}

export function GenresScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [keyword, setKeyword] = useState('');
  const [genres, setGenres] = useState<MangaDexTagOption[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState('followedCount');
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
  const [sortExpanded, setSortExpanded] = useState(true);

  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal,
  } = useMainTabNavigation('genres');

  const toggleMultiSelect = useCallback((id: string, selected: string[], setFn: (value: string[]) => void) => {
    setFn(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }, []);

  const loadFilters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchMangaDexTagOptions();
      const preferred = data.filter((tag) => tag.group === 'genre' || tag.group === 'theme');
      setGenres(preferred.slice(0, 36));
    } catch {
      setError('Không tải được bộ lọc thể loại từ MangaDex.');
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async () => {
    setSearching(true);
    setHasAppliedFilters(true);
    setGenreExpanded(false);
    setSortExpanded(false);
    setError(null);
    try {
      // Nếu user không chọn filter nặng (genre tag MangaDex / status) -> ưu tiên BE
      const hasHeavyFilters = selectedGenreIds.length > 0 || selectedStatuses.length > 0;
      if (!hasHeavyFilters) {
        const data = await fetchSeriesByFilter({ title: keyword, limit: 60 });
        if (data.length > 0) {
          setStories(data);
          setResultPage(1);
          return;
        }
        // BE rỗng -> thử MangaDex
      }

      const mappedStatuses = selectedStatuses.filter(
        (status): status is 'ongoing' | 'completed' | 'hiatus' | 'cancelled' =>
          ['ongoing', 'completed', 'hiatus', 'cancelled'].includes(status),
      );
      const data = await searchMangaDexStories({
        title: keyword,
        limit: 60,
        includedTagIds: selectedGenreIds,
        statuses: mappedStatuses,
        orderBy: selectedSort as
          | 'followedCount'
          | 'rating'
          | 'updatedAt'
          | 'latestUploadedChapter'
          | 'createdAt',
      });
      setStories(data);
      setResultPage(1);
    } catch {
      setError('Không thể tìm truyện. Vui lòng thử lại.');
    } finally {
      setSearching(false);
    }
  }, [keyword, selectedGenreIds, selectedSort, selectedStatuses]);

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
          setSuggestStories(data);
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

  const onStoryPress = useCallback((storyId: string) => {
    router.push(`/story/${storyId}`);
  }, [router]);

  const onSuggestPress = useCallback((story: FeaturedStory) => {
    setKeyword(story.title);
    setSuggestStories([]);
    router.push(`/story/${story.id}`);
  }, [router]);

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchRow}>
          <Pressable style={styles.searchButton} onPress={() => void runSearch()}>
            <Text style={styles.searchButtonText}>TÌM KIẾM</Text>
          </Pressable>
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Nhập từ khóa"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => void runSearch()}
          />
        </View>
        {keyword.trim().length > 0 ? (
          <View style={styles.searchDropdown}>
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
          </View>
        ) : null}

        <Text style={styles.groupTitle}>Trạng Thái</Text>
        <View style={styles.groupBox}>
          <FilterCheckboxGrid
            options={STATUS_OPTIONS}
            columnWidth={columnWidth}
            checked={(id) => selectedStatuses.includes(id)}
            onToggle={(id) => toggleMultiSelect(id, selectedStatuses, setSelectedStatuses)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Pressable
            onPress={() => setGenreExpanded((prev) => !prev)}
            style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
          >
            <Text style={styles.sectionTitle}>Thể Loại</Text>
            <Ionicons
              name={genreExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
        {genreExpanded ? (
          <View style={styles.groupBox}>
            {loading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <FilterCheckboxGrid
                options={genreOptions}
                columnWidth={columnWidth}
                checked={(id) => selectedGenreIds.includes(id)}
                onToggle={(id) => toggleMultiSelect(id, selectedGenreIds, setSelectedGenreIds)}
              />
            )}
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Pressable
            onPress={() => setSortExpanded((prev) => !prev)}
            style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
          >
            <Text style={styles.sectionTitle}>Sắp Xếp</Text>
            <Ionicons
              name={sortExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
        {sortExpanded ? (
          <View style={styles.groupBox}>
            <FilterCheckboxGrid
              options={SORT_OPTIONS}
              columnWidth={columnWidth}
              checked={(id) => selectedSort === id}
              onToggle={setSelectedSort}
            />
          </View>
        ) : null}

        <Pressable onPress={() => void runSearch()} style={styles.applyButton}>
          {searching ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.applyText}>Áp dụng bộ lọc</Text>
          )}
        </Pressable>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  searchButton: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  searchButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusSm,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  searchDropdown: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusSm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
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
  },
  searchSuggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchCover: {
    width: 34,
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  searchTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  searchTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  searchMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: spacing.lg,
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  groupTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  groupBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusSm,
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
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
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  checkbox: {
    width: 16,
    height: 16,
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  applyButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radiusSm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  loadingInline: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.md,
    fontSize: 13,
  },
  resultList: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  pageArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrowDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});

