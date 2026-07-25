/**
 * MoreStoriesScreen — grid 3 cột Liquid Glass.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearSeriesCache, fetchSeriesByTab } from '../services/seriesService';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { FeaturedStory } from '../types/story';
import { formatCompactNumber } from '../utils/formatNumber';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GlassIconButton } from '../theme/uiPrimitives';

const PAGE_SIZE = 12;

function sortByReaders(stories: FeaturedStory[]): FeaturedStory[] {
  return [...stories].sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    return b.rating - a.rating;
  });
}

function StoryPosterCard({
  story,
  width,
  onPress,
}: {
  story: FeaturedStory;
  width: number;
  onPress: (id: string) => void;
}) {
  const coverHeight = width * 1.45;

  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [
        styles.cardWrap,
        { width, transform: [{ scale: pressed ? 0.96 : 1 }], opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <GlassCard
        tint="dark"
        depth={2}
        style={styles.card}
        innerStyle={styles.cardInner}
      >
        <View style={[styles.coverWrapper, { height: coverHeight }]}>
          <Image
            source={{ uri: story.coverUrl }}
            style={styles.coverImage}
            contentFit="cover"
            transition={250}
          />
          <LinearGradient
            colors={colors.gradBanner}
            style={styles.coverOverlay}
            pointerEvents="none"
          />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={11} color={colors.cyan} />
            <Text style={styles.metaText}>{formatCompactNumber(story.views)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={11} color={colors.warning} />
            <Text style={styles.metaText}>{story.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.storyTitle} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={styles.storyChapter}>Chương {story.latestChapter}</Text>
      </GlassCard>
    </Pressable>
  );
}

export function MoreStoriesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<FeaturedStory[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const isUpdatesMode = mode === 'updates';
  const title = isUpdatesMode ? 'Cập Nhật Gần Đây' : 'Truyện Đề Xuất';
  const subtitle = isUpdatesMode ? 'Truyện vừa có chương mới' : 'Truyện được theo dõi nhiều';

  const columnWidth = useMemo(() => {
    const columns = 3;
    const horizontalPadding = spacing.lg * 2;
    const gap = spacing.sm * (columns - 1);
    return Math.floor((screenWidth - horizontalPadding - gap) / columns);
  }, [screenWidth]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSeriesByTab(isUpdatesMode ? 'updates' : 'recommend', 48);
      setStories(isUpdatesMode ? data : sortByReaders(data));
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [isUpdatesMode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      clearSeriesCache();
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(stories.length / PAGE_SIZE));
  const visibleStories = useMemo(
    () => stories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, stories],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const { openStory, loginPromptModal } = useStoryNavigation();

  const handleStoryPress = useCallback(
    (storyId: string) => {
      // `useStoryNavigation` tự check token: nếu chưa đăng nhập → show
      // LoginRequiredModal thay vì navigate vào StoryDetail (BE sẽ trả lỗi
      // nếu thiếu token → Reader/StoryDetail sẽ hiện "Không tải được chi
      // tiết truyện").
      void openStory(storyId);
    },
    [openStory],
  );

  const pageButtons = useMemo(() => {
    const max = Math.min(totalPages, 4);
    return Array.from({ length: max }, (_, index) => index + 1);
  }, [totalPages]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <View style={styles.header}>
          <GlassIconButton
            icon="arrow-back"
            size={40}
            tint="light"
            onPress={() => router.back()}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accentLight} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                onRefresh={handleRefresh}
                refreshing={refreshing}
                tintColor={colors.accentLight}
              />
            }
          >
            <View style={styles.grid}>
              {visibleStories.map((story) => (
                <StoryPosterCard
                  key={story.id}
                  story={story}
                  width={columnWidth}
                  onPress={handleStoryPress}
                />
              ))}
            </View>

            <View style={styles.paginationRow}>
              <Pressable
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                style={({ pressed }) => [
                  styles.pageButton,
                  page === 1 && styles.pageButtonDisabled,
                  pressed && page > 1 && styles.pressed,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={14}
                  color={page === 1 ? colors.textMuted : colors.textPrimary}
                />
              </Pressable>

              {pageButtons.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setPage(item)}
                  style={({ pressed }) => [
                    styles.pageButton,
                    page === item && styles.pageButtonActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.pageText, page === item && styles.pageTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                onPress={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page === totalPages}
                style={({ pressed }) => [
                  styles.pageButton,
                  page === totalPages && styles.pageButtonDisabled,
                  pressed && page < totalPages && styles.pressed,
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={page === totalPages ? colors.textMuted : colors.textPrimary}
                />
              </Pressable>
            </View>
          </ScrollView>
        )}
        {loginPromptModal}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pageButtonActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  pageTextActive: {
    color: colors.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardWrap: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
  },
  cardInner: {
    padding: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  coverWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    margin: spacing.xs,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  coverImage: {
    flex: 1,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  storyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 4,
    letterSpacing: -0.1,
  },
  storyChapter: {
    color: colors.cyan,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
