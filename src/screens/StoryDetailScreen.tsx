/**
 * StoryDetailScreen — màn chi tiết truyện với:
 *  - Floating glass top bar (back + title)
 *  - StoryHero cinematic (parallax + integrated inline stats)
 *  - StoryActionBar compact (quick actions + prominent CTA)
 *  - StoryAuthorCard (author nổi bật)
 *  - StoryOverview (synopsis + info)
 *  - ChapterList
 *  - CommentSection
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
import { ChapterList } from '../components/story/ChapterList';
import { ChapterAccessBadge } from '../components/story/ChapterAccessBadge';
import { CommentSection } from '../components/story/CommentSection';
import { ReadActionSheet } from '../components/story/ReadActionSheet';
import { StoryActionBar } from '../components/story/StoryActionBar';
import { StoryAuthorCard } from '../components/story/StoryAuthorCard';
import { StoryHero, STORY_HERO_HEIGHT } from '../components/story/StoryHero';
import { StoryOverview } from '../components/story/StoryOverview';
import { getAuthToken } from '../services/authService';
import { getReadingHistory, recordReadingHistory } from '../services/readingHistoryService';
import {
  fetchStoryDetail,
  invalidateSeriesDetailCache,
} from '../services/seriesService';
import { StoryDetail, Chapter } from '../types/storyDetail';
import { Story } from '../types/story';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GlassIconButton, GlassFAB } from '../theme/uiPrimitives';

/**
 * ChapterPickerModal — bottom sheet chọn chương từ StoryDetailScreen.
 * Reuse cùng pattern với ChapterListModal trong ReaderScreen.
 */
function ChapterPickerModal({
  chapters,
  visible,
  onSelect,
  onClose,
}: {
  chapters: Chapter[];
  visible: boolean;
  onSelect: (chapter: Chapter) => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={pickerStyles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
      />

      <View style={pickerStyles.sheetContainer}>
        <GlassCard
          tint="navy"
          depth={3}
          radius={0}
          style={pickerStyles.sheet}
          innerStyle={pickerStyles.sheetInner}
          showHighlight
        >
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Chọn chương</Text>
          <ScrollView
            style={pickerStyles.list}
            showsVerticalScrollIndicator={false}
          >
            {chapters.map((chapter) => (
              <Pressable
                key={chapter.id}
                onPress={() => onSelect(chapter)}
                style={({ pressed }) => [
                  pickerStyles.item,
                  pressed && pickerStyles.itemPressed,
                ]}
              >
                <Text style={pickerStyles.itemText} numberOfLines={1}>
                  Chương {chapter.number}
                </Text>
                <View style={pickerStyles.itemMetaWrap}>
                  <ChapterAccessBadge chapter={chapter} />
                  <Text style={pickerStyles.itemMeta} numberOfLines={1}>
                    {chapter.releasedAt}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </GlassCard>
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  sheetInner: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassHeavy,
    alignSelf: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 460,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.glassLight,
  },
  itemPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '500',
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
  },
  itemMetaWrap: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});

export function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [showTopFab, setShowTopFab] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<number | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showReadSheet, setShowReadSheet] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const fabTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    let mounted = true;
    getAuthToken().then((token) => {
      if (mounted) {
        setIsLoggedIn(!!token);
        setAuthChecked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof id !== 'string') return;
    let mounted = true;
    setLoadingDetail(true);
    setDetailError(false);
    setStory(null);

    fetchStoryDetail(id)
      .then((detail) => {
        if (!mounted) return;
        if (!detail) {
          setDetailError(true);
          return;
        }
        setStory(detail);
      })
      .catch(() => {
        if (!mounted) return;
        setDetailError(true);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingDetail(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (typeof id !== 'string') return;
      invalidateSeriesDetailCache(id);
      let active = true;
      fetchStoryDetail(id)
        .then((detail) => {
          if (!active || !detail) return;
          setStory(detail);
        })
        .catch(() => {
          // ignore
        });
      return () => {
        active = false;
      };
    }, [id]),
  );

  useEffect(() => {
    if (!authChecked || !isLoggedIn || typeof id !== 'string') return;
    void getReadingHistory().then((entries) => {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        setLastReadChapter(entry.lastReadChapter);
      } else {
        // Entry không tồn tại → reset state. Trước đây state cũ vẫn giữ
        // → "Tiếp tục đọc" hiển thị sai.
        setLastReadChapter(undefined);
      }
    });
  }, [authChecked, isLoggedIn, id]);

  // Refresh lịch sử đọc mỗi khi user quay lại StoryDetailScreen (sau khi
  // đọc chương mới ở ReaderScreen). Nếu không, `lastReadChapter` cũ vẫn
  // hiển thị → pill "Tiếp tục đọc" sai → bấm sẽ mở lại chương cũ.
  useFocusEffect(
    useCallback(() => {
      if (typeof id !== 'string') return;
      if (!authChecked || !isLoggedIn) return;
      let active = true;
      void getReadingHistory().then((entries) => {
        if (!active) return;
        const entry = entries.find((e) => e.id === id);
        setLastReadChapter(entry?.lastReadChapter);
      });
      return () => {
        active = false;
      };
    }, [authChecked, isLoggedIn, id]),
  );

  const handleLoginFromModal = useCallback(() => {
    const redirectPath = typeof id === 'string' ? `/story/${id}` : '/';
    setShowLoginModal(false);
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }, [id, router]);

  const handleCloseLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const handleBack = useCallback(() => {
    // Nếu có thể quay lại trang trước trong stack → dùng back() để giữ
    // lịch sử điều hướng. Nếu không (ví dụ: vào thẳng từ deep link,
    // refresh trang, hoặc app mount lại) → fall back về trang chủ.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const navigateToReader = useCallback(
    (chapterNumber: number) => {
      if (!story) return;
      const baseStory: Story = {
        id: story.id,
        title: story.title,
        coverUrl: story.coverUrl,
        latestChapter: story.latestChapter,
        updatedAt: story.updatedAt,
        views: story.views,
        genres: story.genres,
      };
      void recordReadingHistory(baseStory, chapterNumber);
      router.push(`/read/${story.id}/${chapterNumber}`);
    },
    [story, router],
  );

  /**
   * Có lịch sử đọc trước đó hay không (chỉ user đã đăng nhập mới có history).
   *   - false: bấm CTA chính → đi thẳng chương 1, page 1.
   *   - true : bấm CTA chính → mở ReadActionSheet để chọn tiếp/lại/chọn chương.
   * Lưu ý: cả khi lastReadChapter = 1 vẫn tính là có history, vì user đã mở
   * chapter 1 và có ngữ cảnh "đã đọc" (đặc biệt nếu họ thoát ra giữa chừng).
   */
  const hasHistory =
    typeof lastReadChapter === 'number' && lastReadChapter > 0;

  const handleContinueReading = useCallback(() => {
    if (typeof lastReadChapter === 'number') {
      navigateToReader(lastReadChapter);
    }
  }, [lastReadChapter, navigateToReader]);

  /**
   * Handler cho primary CTA "ĐỌC NGAY" / "BẮT ĐẦU ĐỌC".
   *   - Chưa từng đọc (`!hasHistory`) → đi thẳng chương 1, page 1.
   *   - Đã từng đọc → mở ReadActionSheet để user chọn tiếp/lại/chọn chương.
   */
  const handlePrimaryRead = useCallback(() => {
    if (!hasHistory) {
      navigateToReader(1);
      return;
    }
    setShowReadSheet(true);
  }, [hasHistory, navigateToReader]);

  const handleCloseReadSheet = useCallback(() => {
    setShowReadSheet(false);
  }, []);

  const handleContinueFromSheet = useCallback(() => {
    setShowReadSheet(false);
    if (typeof lastReadChapter === 'number' && lastReadChapter > 0) {
      navigateToReader(lastReadChapter);
    } else {
      navigateToReader(1);
    }
  }, [lastReadChapter, navigateToReader]);

  const handleRestartFromSheet = useCallback(() => {
    setShowReadSheet(false);
    navigateToReader(1);
  }, [navigateToReader]);

  /**
   * Từ ReadActionSheet → "Chọn chương": đóng sheet, mở ChapterPickerModal.
   */
  const handlePickChapterFromSheet = useCallback(() => {
    setShowReadSheet(false);
    setShowChapterPicker(true);
  }, []);

  const handleCloseChapterPicker = useCallback(() => {
    setShowChapterPicker(false);
  }, []);

  const handleChapterPicked = useCallback(
    (chapter: Chapter) => {
      setShowChapterPicker(false);
      navigateToReader(chapter.number);
    },
    [navigateToReader],
  );

  const handleChapterPress = useCallback(
    (chapter: Chapter) => {
      navigateToReader(chapter.number);
    },
    [navigateToReader],
  );

  const handleAuthorPress = useCallback(() => {
    if (story?.authorId) {
      router.push(`/author/${encodeURIComponent(story.authorId)}`);
    }
  }, [story?.authorId, router]);

  const handleVoteSuccess = useCallback(
    (seriesId: string, averageScore: number, totalVotes: number) => {
      setStory((current) => {
        if (!current) return current;
        return {
          ...current,
          rating: averageScore,
          ratingCount: totalVotes,
        };
      });
    },
    [],
  );

  const handleVoteRemoved = useCallback(
    (seriesId: string, averageScore: number, totalVotes: number) => {
      setStory((current) => {
        if (!current) return current;
        return {
          ...current,
          rating: averageScore,
          ratingCount: totalVotes,
        };
      });
    },
    [],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      setShowTopFab(offset > 320);
      scrollY.setValue(offset);
    },
    [scrollY],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fabOpacity, {
        toValue: showTopFab ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fabTranslate, {
        toValue: showTopFab ? 0 : 20,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [showTopFab, fabOpacity, fabTranslate]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  if (loadingDetail) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={colors.gradBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accentLight} size="large" />
            <Text style={styles.loadingText}>Đang tải chi tiết truyện...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (detailError || !story) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={colors.gradBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.notFound}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
            <Text style={styles.notFoundTitle}>
              {detailError
                ? 'Không tải được chi tiết truyện'
                : 'Không tìm thấy truyện'}
            </Text>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
            >
              <Text style={styles.backLinkText}>Về trang chủ</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Top bar glass opacity
  const topBarOpacity = scrollY.interpolate({
    inputRange: [0, 200, STORY_HERO_HEIGHT - 80],
    outputRange: [0, 0.4, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LoginRequiredModal
        visible={showLoginModal}
        onClose={handleCloseLoginModal}
        onLogin={handleLoginFromModal}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.topBarWrap, { opacity: topBarOpacity }]}
      >
        <LinearGradient
          colors={['rgba(10,17,48,0.0)', 'rgba(7,11,26,0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <View style={styles.topBarContent}>
          <GlassIconButton
            icon="arrow-back"
            size={40}
            tint="light"
            onPress={handleBack}
          />
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {story.title}
          </Text>
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll },
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <StoryHero story={story} scrollY={scrollY} />

          <StoryActionBar
            story={story}
            authorId={story.authorId}
            authorName={story.author}
            lastReadChapter={lastReadChapter}
            hasHistory={hasHistory}
            onRead={handlePrimaryRead}
            onContinueReading={handleContinueReading}
            onLoginRequired={() => setShowLoginModal(true)}
          />

          {story.authorId ? (
            <View style={styles.authorWrap}>
              <StoryAuthorCard
                authorId={story.authorId}
                authorName={story.author}
                onAuthorPress={handleAuthorPress}
                onLoginRequired={() => setShowLoginModal(true)}
              />
            </View>
          ) : null}

          <View style={styles.overviewWrap}>
            <StoryOverview story={story} onAuthorPress={handleAuthorPress} />
          </View>

          <View style={styles.chapterWrap}>
            <ChapterList
              chapters={story.chapters}
              latestChapterNumber={story.latestChapter}
              onChapterPress={handleChapterPress}
            />
          </View>

          <CommentSection
            story={story}
            isLoggedIn={isLoggedIn}
            onVoteSuccess={handleVoteSuccess}
            onVoteRemoved={handleVoteRemoved}
          />
        </Animated.ScrollView>

        {showTopFab ? (
          <Animated.View
            style={[
              styles.fabWrap,
              { opacity: fabOpacity, transform: [{ translateY: fabTranslate }] },
            ]}
          >
            <GlassFAB icon="arrow-up" onPress={scrollToTop} size={52} />
          </Animated.View>
        ) : null}

        <ReadActionSheet
          visible={showReadSheet}
          lastReadChapter={lastReadChapter}
          hasMultipleChapters={story.chapters.length > 1}
          onContinue={handleContinueFromSheet}
          onRestart={handleRestartFromSheet}
          onPickChapter={handlePickChapterFromSheet}
          onClose={handleCloseReadSheet}
        />

        <ChapterPickerModal
          chapters={story.chapters}
          visible={showChapterPicker}
          onSelect={handleChapterPicked}
          onClose={handleCloseChapterPicker}
        />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  notFoundTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    textAlign: 'center',
  },
  backLink: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    color: colors.accentLight,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  topBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 100,
    zIndex: 9,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    zIndex: 10,
  },
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  authorWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  overviewWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  chapterWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
  },
  pressed: {
    opacity: 0.7,
  },
});
