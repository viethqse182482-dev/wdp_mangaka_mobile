import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSeriesByTab } from '../services/seriesService';
import { FeaturedStory } from '../types/story';
import { formatCompactNumber } from '../utils/formatNumber';
import { colors, radius, spacing } from '../theme/colors';

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
    <Pressable onPress={() => onPress(story.id)} style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
      <View style={[styles.coverWrapper, { height: coverHeight }]}>
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverTitle} numberOfLines={1}>
            {story.title}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="eye-outline" size={12} color={colors.textSecondary} />
        <Text style={styles.metaText}>{formatCompactNumber(story.views)}</Text>
        <Ionicons name="star" size={11} color={colors.gold} />
        <Text style={styles.metaText}>{story.rating.toFixed(1)}</Text>
      </View>
      <Text style={styles.storyTitle} numberOfLines={2}>
        {story.title}
      </Text>
      <Text style={styles.storyChapter}>Chương {story.latestChapter}</Text>
      <Text style={styles.storyUpdated}>{story.updatedAt}</Text>
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

  const isUpdatesMode = mode === 'updates';
  const title = isUpdatesMode ? 'Cập Nhật Gần Đây' : 'Truyện Đề Xuất';
  const subtitle = isUpdatesMode ? 'Truyện vừa có chương mới' : 'Truyện nổi bật theo theo dõi';

  const columnWidth = useMemo(() => {
    const columns = 3;
    const horizontalPadding = spacing.lg * 2;
    const gap = spacing.sm * (columns - 1);
    return Math.floor((screenWidth - horizontalPadding - gap) / columns);
  }, [screenWidth]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchSeriesByTab(isUpdatesMode ? 'updates' : 'recommend', 48);
        if (mounted) {
          setStories(isUpdatesMode ? data : sortByReaders(data));
        }
      } catch {
        if (mounted) {
          setStories([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [isUpdatesMode]);

  const totalPages = Math.max(1, Math.ceil(stories.length / PAGE_SIZE));
  const visibleStories = useMemo(
    () => stories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, stories],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleStoryPress = useCallback((storyId: string) => {
    router.push(`/story/${storyId}`);
  }, [router]);

  const pageButtons = useMemo(() => {
    const max = Math.min(totalPages, 4);
    return Array.from({ length: max }, (_, index) => index + 1);
  }, [totalPages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {visibleStories.map((story) => (
              <StoryPosterCard key={story.id} story={story} width={columnWidth} onPress={handleStoryPress} />
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
              <Ionicons name="chevron-back" size={14} color={page === 1 ? colors.textMuted : colors.textPrimary} />
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
                <Text style={[styles.pageText, page === item && styles.pageTextActive]}>{item}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
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
    marginTop: spacing.sm,
  },
  pageButton: {
    minWidth: 30,
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  pageButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    color: colors.textPrimary,
    fontSize: 12,
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
  card: {
    marginBottom: spacing.sm,
  },
  coverWrapper: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  coverTitle: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  storyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  storyChapter: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  storyUpdated: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
