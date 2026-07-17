import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ListRenderItem,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chapter, StoryDetail } from '../types/storyDetail';
import { fetchChapterPages, trackChapterView, ChapterDetail } from '../services/chapterService';
import { getStoryDetailById } from '../data/mockStoryDetails';
import { Story } from '../types/story';
import { colors, spacing } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReaderScreenProps {
  story?: StoryDetail | Story;
  initialChapter?: number;
  mangaDexChapterId?: string;
}

function ChapterListModal({
  chapters,
  currentChapter,
  visible,
  onSelect,
  onClose,
}: {
  chapters: Chapter[];
  currentChapter: number;
  visible: boolean;
  onSelect: (chapter: Chapter) => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />
        <Text style={modalStyles.title}>Danh Sách Chương</Text>
        <ScrollView style={modalStyles.list} showsVerticalScrollIndicator={false}>
          {chapters.map((chapter) => (
            <Pressable
              key={chapter.id}
              onPress={() => onSelect(chapter)}
              style={({ pressed }) => [
                modalStyles.item,
                chapter.number === currentChapter && modalStyles.itemActive,
                pressed && modalStyles.itemPressed,
              ]}
            >
              <Text
                style={[
                  modalStyles.itemText,
                  chapter.number === currentChapter && modalStyles.itemTextActive,
                ]}
              >
                Chương {chapter.number}
              </Text>
              <Text style={modalStyles.itemMeta}>{chapter.releasedAt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function PageSkeleton() {
  return (
    <View style={pageStyles.skeleton}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={pageStyles.skeletonText}>Đang tải trang...</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={pageStyles.errorState}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
      <Text style={pageStyles.errorText}>Không tải được nội dung chương</Text>
      <Pressable onPress={onRetry} style={pageStyles.retryButton}>
        <Text style={pageStyles.retryText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

const CHAPTER_VIEW_THRESHOLD_MS = 15_000;

export function ReaderScreen({ story, initialChapter }: ReaderScreenProps) {
  const router = useRouter();
  const { storyId, chapter: chapterParam } = useLocalSearchParams<{
    storyId: string;
    chapter: string;
  }>();

  const effectiveStoryId = storyId ?? story?.id ?? '';
  const effectiveChapter = Number(chapterParam ?? initialChapter ?? 1);

  const [chapterDetail, setChapterDetail] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [storyDetail, setStoryDetail] = useState<StoryDetail | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chapters: Chapter[] = (() => {
    if (storyDetail) {
      return storyDetail.chapters;
    }
    if (story && 'chapters' in story) {
      return story.chapters;
    }
    return [];
  })();

  const currentChapterData = chapters.find((c) => c.number === effectiveChapter);

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setError(false);
    setChapterDetail(null);

    try {
      if (!currentChapterData) {
        throw new Error('Chapter not found');
      }
      const detail = await fetchChapterPages(
        effectiveStoryId,
        effectiveChapter,
        currentChapterData.id,
      );
      setChapterDetail(detail);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentChapterData, effectiveStoryId, effectiveChapter]);

  useEffect(() => {
    void loadChapter();
  }, [loadChapter]);

  // Đếm 1 view khi user ở cùng 1 chapter đủ 15 giây kể từ lúc pages load thành công.
  // - Trong 15s user đọc bao nhiêu page / scroll tới đâu không quan trọng,
  //   miễn còn ở chapter này và chapter không lỗi thì vẫn tính 1 view.
  // - Timer reset khi đổi chapter (`currentChapterData.id` đổi) hoặc unmount.
  // - Lỗi load pages sẽ không gọi API view (chapterDetail = null → early return).
  useEffect(() => {
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
    if (!chapterDetail || !currentChapterData?.id) return;

    const chapterId = currentChapterData.id;
    const storyId = effectiveStoryId;

    viewTimerRef.current = setTimeout(async () => {
      viewTimerRef.current = null;
      const result = await trackChapterView(chapterId);
      if (!result) return;

      // Cập nhật cache detail của series ngay để khi quay lại StoryDetail thấy số mới.
      try {
        const { bumpChapterViewInCache } = await import('../services/seriesService');
        bumpChapterViewInCache(storyId, chapterId, result.views_count);
      } catch {
        // ignore
      }
    }, CHAPTER_VIEW_THRESHOLD_MS);

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [chapterDetail, currentChapterData?.id, effectiveStoryId]);

  useEffect(() => {
    if (effectiveStoryId) {
      const fetchDetail = async () => {
        const { fetchStoryDetail } = await import('../services/seriesService');
        const detail = await fetchStoryDetail(effectiveStoryId);
        if (detail) {
          setStoryDetail(detail);
        }
      };
      void fetchDetail();
    }
  }, [effectiveStoryId]);

  const currentChapterId = currentChapterData?.id;

  const prevChapter = chapters.find((c) => c.number === effectiveChapter - 1);
  const nextChapter = chapters.find((c) => c.number === effectiveChapter + 1);

  const handleTap = useCallback(() => {
    setUiVisible((v) => !v);
  }, []);

  const handlePrev = useCallback(() => {
    if (prevChapter) {
      const path = `/read/${effectiveStoryId}/${prevChapter.number}`;
      router.push(path);
    }
  }, [prevChapter, effectiveStoryId, router]);

  const handleNext = useCallback(() => {
    if (nextChapter) {
      const path = `/read/${effectiveStoryId}/${nextChapter.number}`;
      router.push(path);
    }
  }, [nextChapter, effectiveStoryId, router]);

  const handleChapterSelect = useCallback(
    (chapter: Chapter) => {
      setShowChapterList(false);
      const path = `/read/${effectiveStoryId}/${chapter.number}`;
      router.push(path);
    },
    [effectiveStoryId, router],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderPage: ListRenderItem<string> = useCallback(
    ({ item: url }) => (
      <Pressable onPress={handleTap} style={pageStyles.pageContainer}>
        <Image
          source={{ uri: url }}
          style={pageStyles.pageImage}
          resizeMode="contain"
        />
      </Pressable>
    ),
    [handleTap],
  );

  const pageUrls = chapterDetail?.pages.map((p) => p.url) ?? [];

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden={!uiVisible} />

      {loading ? (
        <PageSkeleton />
      ) : error ? (
        <ErrorState onRetry={loadChapter} />
      ) : (
        <>
          <FlatList
            data={pageUrls}
            renderItem={renderPage}
            keyExtractor={(_, index) => `page-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            initialNumToRender={2}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews
          />

          {uiVisible && (
            <SafeAreaView style={styles.topBar} edges={['top']}>
              <View style={styles.topBarInner}>
                <Pressable
                  onPress={handleBack}
                  hitSlop={8}
                  style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="arrow-back" size={22} color={colors.white} />
                </Pressable>

                <Text style={styles.topTitle} numberOfLines={1}>
                  {story?.title ?? storyDetail?.title ?? ''}
                </Text>

                <Pressable
                  onPress={() => setShowChapterList(true)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.chapterBadge, pressed && styles.pressed]}
                >
                  <Text style={styles.chapterBadgeText}>Ch.{effectiveChapter}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.white} />
                </Pressable>
              </View>
            </SafeAreaView>
          )}

          {uiVisible && (
            <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
              <View style={styles.bottomBarInner}>
                <Pressable
                  onPress={handlePrev}
                  disabled={!prevChapter}
                  style={({ pressed }) => [
                    styles.navBtn,
                    !prevChapter && styles.navBtnDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={prevChapter ? colors.white : colors.textMuted}
                  />
                  <Text style={[styles.navBtnText, !prevChapter && styles.navBtnTextDisabled]}>
                    Trước
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowChapterList(true)}
                  style={({ pressed }) => [styles.listBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="list" size={18} color={colors.white} />
                  <Text style={styles.listBtnText}>Chương</Text>
                </Pressable>

                <Pressable
                  onPress={handleNext}
                  disabled={!nextChapter}
                  style={({ pressed }) => [
                    styles.navBtn,
                    !nextChapter && styles.navBtnDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.navBtnText, !nextChapter && styles.navBtnTextDisabled]}>
                    Sau
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={nextChapter ? colors.white : colors.textMuted}
                  />
                </Pressable>
              </View>

              {chapters.length > 0 && (
                <View style={styles.chapterIndicator}>
                  <Text style={styles.chapterIndicatorText}>
                    {effectiveChapter} / {chapters.length}
                  </Text>
                </View>
              )}
            </SafeAreaView>
          )}
        </>
      )}

      <ChapterListModal
        chapters={chapters}
        currentChapter={effectiveChapter}
        visible={showChapterList}
        onSelect={handleChapterSelect}
        onClose={() => setShowChapterList(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chapterBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  navBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  navBtnTextDisabled: {
    color: colors.textMuted,
  },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  chapterIndicator: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  chapterIndicatorText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});

const pageStyles = StyleSheet.create({
  pageContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  skeleton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    gap: spacing.md,
  },
  skeletonText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: SCREEN_HEIGHT * 0.65,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  itemActive: {
    backgroundColor: colors.accentSoft,
  },
  itemPressed: {
    opacity: 0.75,
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  itemTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
