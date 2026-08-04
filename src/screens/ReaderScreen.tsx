/**
 * ReaderScreen — màn đọc truyện với top/bottom bar khối màu + sheet danh sách chương.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chapter, StoryDetail } from '../types/storyDetail';
import {
  fetchChapterAccess,
  fetchChapterPages,
  purchaseChapter,
  trackChapterView,
  ChapterDetail,
} from '../services/chapterService';
import { ApiError } from '../services/apiClient';
import {
  bumpChapterViewInCache,
  fetchStoryDetail,
} from '../services/seriesService';
import { recordReadingHistory } from '../services/readingHistoryService';
import { getAuthToken } from '../services/authService';
import { Story } from '../types/story';
import { formatCoinUnits } from '../utils/coinUnit';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GlassIconButton, GlassListItem } from '../theme/uiPrimitives';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReaderScreenProps {
  story?: StoryDetail | Story;
  initialChapter?: number;
  mangaDexChapterId?: string;
}

const DISMISS_VELOCITY_THRESHOLD = 800; // px/s
const DISMISS_DISTANCE_RATIO = 0.25; // 25% chiều cao sheet

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
  const maxSheetHeight = Math.round(SCREEN_HEIGHT * 0.75);
  const insets = useSafeAreaInsets();
  // Dùng `maxSheetHeight` cố định cho cả animation (translateY) lẫn cap
  // container (maxHeight 75% màn hình). KHÔNG đo lại chiều cao sheet sau
  // layout → tránh re-render liên tục → tránh "nhấp nháy"/"không cho bấm".
  //
  // Cơ chế "snug vs cap" được xử lý bằng layout tự nhiên của React Native:
  // - Ít chương → wrap co theo content (snug, không trống đáy).
  // - Nhiều chương → wrap bị cap ở maxHeight → ScrollView tự scroll bên trong.
  const translateY = useRef(new Animated.Value(maxSheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate in/out theo `visible`. Khi `visible` false → animate xuống
  // xong mới unmount để có cảm giác "tuột xuống".
  useEffect(() => {
    if (visible) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setMounted(true);
      translateY.setValue(maxSheetHeight);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: maxSheetHeight,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          // Chỉ bắt gesture vuốt xuống (dy dương) và gesture dọc
          // (tránh xung đột với scroll ngang trong reader).
          g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => {
          // Chỉ cho kéo xuống, không cho kéo lên.
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          const dismissByDistance = g.dy > maxSheetHeight * DISMISS_DISTANCE_RATIO;
          const dismissByVelocity = g.vy > DISMISS_VELOCITY_THRESHOLD;
          if (dismissByDistance || dismissByVelocity) {
            // Snap xuống rồi đóng.
            Animated.timing(translateY, {
              toValue: maxSheetHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => onClose());
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }).start();
          } else {
            // Snap back lên.
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
          }
        },
      }),
    [translateY, backdropOpacity, onClose],
  );

  if (!mounted) return null;

  return (
    <View style={modalStyles.overlay}>
      {/*
        Pressable overlay ở NGOÀI cùng (z-index dưới) để bấm ra ngoài đóng sheet.
        QUAN TRỌNG: KHÔNG để thêm 1 View dim phía sau Pressable — nếu có, View
        đó mặc định nhận pointer events và ăn gesture trước Pressable, khiến
        bấm ra ngoài không đóng được.
      */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropOpacity },
        ]}
      />

      <Animated.View
        style={[
          modalStyles.sheetContainer,
          {
            transform: [{ translateY }],
            // Bù safe-area đáy (gesture bar / home indicator) để danh sách
            // không bị đẩy lên cao khỏi cạnh dưới điện thoại.
            paddingBottom: insets.bottom,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <GlassCard
          tint="navy"
          depth={3}
          radius={0}
          style={modalStyles.sheet}
          innerStyle={modalStyles.sheetInner}
          showHighlight
        >
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Danh Sách Chương</Text>
          <ScrollView
            style={modalStyles.list}
            contentContainerStyle={modalStyles.listContent}
            showsVerticalScrollIndicator={false}
          >
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
                    chapter.number === currentChapter &&
                      modalStyles.itemTextActive,
                  ]}
                >
                  Chương {chapter.number}
                </Text>
                <Text style={modalStyles.itemMeta}>{chapter.releasedAt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </GlassCard>
      </Animated.View>
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

function ErrorState({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <View style={pageStyles.errorState}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
      <Text style={pageStyles.errorText}>
        {message ?? 'Không tải được nội dung chương'}
      </Text>
      <Pressable onPress={onRetry} style={pageStyles.retryButton}>
        <Text style={pageStyles.retryText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

interface PurchasePrompt {
  chapterId: string;
  chapterNumber: number;
  coinPrice: number;
}

function PurchaseChapterModal({
  prompt,
  purchasing,
  errorMessage,
  onPurchase,
  onCancel,
  onTopUp,
}: {
  prompt: PurchasePrompt | null;
  purchasing: boolean;
  errorMessage: string | null;
  onPurchase: () => void;
  onCancel: () => void;
  onTopUp: () => void;
}) {
  return (
    <Modal
      visible={prompt !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!purchasing) onCancel();
      }}
    >
      <View style={purchaseStyles.backdrop}>
        <View style={purchaseStyles.card}>
          <View style={purchaseStyles.iconWrap}>
            <Ionicons name="lock-closed" size={28} color={colors.warning} />
          </View>
          <Text style={purchaseStyles.title}>Mở khóa chương {prompt?.chapterNumber}</Text>
          <Text style={purchaseStyles.description}>
            Chương này có tính phí. Coin chỉ được trừ sau khi bạn xác nhận mua.
          </Text>
          <View style={purchaseStyles.priceRow}>
            <Text style={purchaseStyles.priceLabel}>Giá mở khóa</Text>
            <Text style={purchaseStyles.priceValue}>
              {formatCoinUnits(prompt?.coinPrice ?? 0)} Coin
            </Text>
          </View>

          {errorMessage ? (
            <View style={purchaseStyles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={purchaseStyles.errorMessage}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={purchasing}
            onPress={onPurchase}
            style={({ pressed }) => [
              purchaseStyles.purchaseButton,
              purchasing && purchaseStyles.buttonDisabled,
              pressed && !purchasing && styles.pressed,
            ]}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="diamond-outline" size={19} color={colors.white} />
            )}
            <Text style={purchaseStyles.purchaseButtonText}>
              {purchasing
                ? 'Đang mua…'
                : `Mua với ${formatCoinUnits(prompt?.coinPrice ?? 0)} Coin`}
            </Text>
          </Pressable>

          <View style={purchaseStyles.secondaryRow}>
            <Pressable
              disabled={purchasing}
              onPress={onCancel}
              style={({ pressed }) => [purchaseStyles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={purchaseStyles.secondaryText}>Quay lại</Text>
            </Pressable>
            <Pressable
              disabled={purchasing}
              onPress={onTopUp}
              style={({ pressed }) => [purchaseStyles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={purchaseStyles.topUpText}>Nạp Coin</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  // Robust parse: nếu chapterParam là "abc" → NaN → fallback 1, tránh bị stuck ở ErrorState.
  const parsedChapter = Number(chapterParam ?? initialChapter ?? 1);
  const effectiveChapter = Number.isFinite(parsedChapter) && parsedChapter > 0 ? parsedChapter : 1;

  const [chapterDetail, setChapterDetail] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Message kèm theo error (vd: timeout 30s → "Máy chủ phản hồi quá lâu...").
  // Lưu riêng để hiển thị thông tin cụ thể cho user thay vì message chung chung.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uiVisible, setUiVisible] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [storyDetail, setStoryDetail] = useState<StoryDetail | null>(null);
  const [purchasePrompt, setPurchasePrompt] = useState<PurchasePrompt | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic counter để chống race condition khi người dùng bấm
  // "Sau" liên tục (nhiều fetch chạy song song, response về không đúng thứ tự).
  const loadTokenRef = useRef(0);

  // `chapters` memoize theo storyDetail/story prop để giữ reference ổn định
  // giữa các render. Nếu không, `array.find(...)` tuần tự tạo object mới mỗi render
  // → `currentChapterData` thay đổi identity → `loadChapter` re-create →
  // `useEffect` re-trigger → fetch liên tục (vòng lặp vô hạn tiềm ẩn).
  const chapters: Chapter[] = useMemo(() => {
    if (storyDetail) return storyDetail.chapters;
    if (story && 'chapters' in story) return story.chapters;
    return [];
  }, [storyDetail, story]);

  const currentChapterData = useMemo(
    () => chapters.find((c) => c.number === effectiveChapter),
    [chapters, effectiveChapter],
  );

  const loadChapter = useCallback(async () => {
    const capturedChapter = currentChapterData;
    if (!capturedChapter) {
      setLoading(true);
      setError(true);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setError(false);
    setErrorMessage(null);
    setChapterDetail(null);

    // Tăng token trước khi fetch. Khi response về, chỉ setState nếu token khớp
    // (đảm bảo đây là response mới nhất, không phải response của request bị hủy).
    const myToken = ++loadTokenRef.current;

    try {
      const access = await fetchChapterAccess(capturedChapter.id);
      if (loadTokenRef.current !== myToken) return;

      if (access.needsPurchase) {
        setPurchaseError(null);
        setPurchasePrompt({
          chapterId: capturedChapter.id,
          chapterNumber: capturedChapter.number,
          coinPrice: access.coinPrice,
        });
        return;
      }

      const detail = await fetchChapterPages(
        effectiveStoryId,
        effectiveChapter,
        capturedChapter.id,
      );
      if (loadTokenRef.current !== myToken) return; // đã có fetch mới hơn
      setChapterDetail(detail);
    } catch (err) {
      if (loadTokenRef.current !== myToken) return;
      setError(true);
      // Ưu tiên message từ ApiError (vd: "Máy chủ phản hồi quá lâu, vui lòng
      // thử lại." khi timeout 30s). Fallback về message mặc định.
      setErrorMessage(
        err instanceof ApiError && err.message
          ? err.message
          : 'Không tải được nội dung chương',
      );
    } finally {
      if (loadTokenRef.current === myToken) {
        setLoading(false);
      }
    }
  }, [currentChapterData, effectiveStoryId, effectiveChapter]);

  const handlePurchase = useCallback(async () => {
    if (!purchasePrompt || purchasing) return;

    const chapterId = purchasePrompt.chapterId;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      await purchaseChapter(chapterId);
      setPurchasePrompt(null);
      await loadChapter();
    } catch (err) {
      setPurchaseError(
        err instanceof Error ? err.message : 'Không thể mua chương. Vui lòng thử lại.',
      );
    } finally {
      setPurchasing(false);
    }
  }, [purchasePrompt, purchasing, loadChapter]);

  useEffect(() => {
    void loadChapter();
  }, [loadChapter]);

  // Tự ghi lịch sử đọc khi user mở 1 chapter. Điều này đảm bảo ngay cả khi
  // user sử dụng nút "Trước"/"Sau"/chapter picker để chuyển chương trong Reader,
  // lịch sử vẫn phản ánh chương CUỐI cùng user đã mở — không phải chương đầu
  // mở từ StoryDetailScreen.
  useEffect(() => {
    if (!effectiveStoryId || !currentChapterData) return;
    let cancelled = false;
    void (async () => {
      const token = await getAuthToken();
      if (cancelled || !token) return;
      // Lấy title từ storyDetail/story nếu có; nếu không (mock/incomplete),
      // vẫn ghi — server upsert sẽ tự cập nhật sau khi StoryDetail fetch xong.
      const baseStory: Story = {
        id: effectiveStoryId,
        title: story?.title ?? storyDetail?.title ?? '',
        coverUrl: story?.coverUrl ?? storyDetail?.coverUrl ?? '',
        latestChapter:
          story?.latestChapter ?? storyDetail?.latestChapter ?? effectiveChapter,
        updatedAt: story?.updatedAt ?? storyDetail?.updatedAt ?? '',
        views: story?.views ?? storyDetail?.views ?? 0,
        genres: story?.genres ?? storyDetail?.genres ?? [],
      };
      void recordReadingHistory(baseStory, effectiveChapter);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    effectiveStoryId,
    effectiveChapter,
    currentChapterData,
    story?.title,
    story?.coverUrl,
    story?.latestChapter,
    story?.updatedAt,
    story?.views,
    story?.genres,
    storyDetail?.title,
    storyDetail?.coverUrl,
    storyDetail?.latestChapter,
    storyDetail?.updatedAt,
    storyDetail?.views,
    storyDetail?.genres,
  ]);

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

      try {
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
        const detail = await fetchStoryDetail(effectiveStoryId);
        if (detail) {
          setStoryDetail(detail);
        }
      };
      void fetchDetail();
    }
  }, [effectiveStoryId]);

  const prevChapter = chapters.find((c) => c.number === effectiveChapter - 1);
  const nextChapter = chapters.find((c) => c.number === effectiveChapter + 1);

  const handleTap = useCallback(() => {
    setUiVisible((v) => !v);
  }, []);

  const handlePrev = useCallback(() => {
    if (prevChapter) {
      const path = `/read/${effectiveStoryId}/${prevChapter.number}`;
      router.push(path as any);
    }
  }, [prevChapter, effectiveStoryId, router]);

  const handleNext = useCallback(() => {
    if (nextChapter) {
      const path = `/read/${effectiveStoryId}/${nextChapter.number}`;
      router.push(path as any);
    }
  }, [nextChapter, effectiveStoryId, router]);

  const handleChapterSelect = useCallback(
    (chapter: Chapter) => {
      setShowChapterList(false);
      const path = `/read/${effectiveStoryId}/${chapter.number}`;
      router.push(path as any);
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
        <ErrorState onRetry={loadChapter} message={errorMessage ?? undefined} />
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
            <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7,11,26,0.85)' }]}
              />
              <View style={styles.topBarInner}>
                <GlassIconButton
                  icon="arrow-back"
                  size={40}
                  tint="light"
                  onPress={handleBack}
                />
                <Text style={styles.topTitle} numberOfLines={1}>
                  {story?.title ?? storyDetail?.title ?? ''}
                </Text>
                <GlassListItem
                  tint="light"
                  depth={1}
                  radius={radius.md}
                  onPress={() => setShowChapterList(true)}
                  innerStyle={styles.chapterBadgeInner}
                >
                  <Text style={styles.chapterBadgeText}>Ch.{effectiveChapter}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.white} />
                </GlassListItem>
              </View>
            </SafeAreaView>
          )}

          {uiVisible && (
            <SafeAreaView style={styles.bottomBar} edges={['bottom']} pointerEvents="box-none">
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7,11,26,0.85)' }]}
              />
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

      <PurchaseChapterModal
        prompt={purchasePrompt}
        purchasing={purchasing}
        errorMessage={purchaseError}
        onPurchase={() => void handlePurchase()}
        onCancel={() => {
          if (!purchasing) router.back();
        }}
        onTopUp={() => {
          if (purchasing) return;
          setPurchasePrompt(null);
          router.replace('/wallet');
        }}
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
    overflow: 'hidden',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  topTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chapterBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chapterBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  navBtnText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
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
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  listBtnText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  chapterIndicator: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  chapterIndicatorText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
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
    fontFamily: typography.fontFamilyMedium,
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
    fontFamily: typography.fontFamilyMedium,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
});

const purchaseStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: spacing.xxl,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    textAlign: 'center',
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: typography.fontFamilyRegular,
    marginTop: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
    marginTop: spacing.lg,
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
  },
  priceValue: {
    color: colors.warning,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    marginTop: spacing.md,
  },
  errorMessage: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamilyMedium,
  },
  purchaseButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  purchaseButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
  },
  topUpText: {
    color: colors.accentLight,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    // position: absolute + bottom: 0 để sheet LUÔN dính đáy màn hình.
    // Dùng `maxHeight` thay cho `height` cứng → View nội dung bên trong
    // (`sheet`) sẽ tự co theo content khi ít (sheet "snug" không trống đáy),
    // và bị cap ở 75% màn hình khi nhiều (ScrollView bên trong scroll).
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: Math.round(SCREEN_HEIGHT * 0.75),
    overflow: 'hidden',
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
    paddingHorizontal: 0,
  },
  listContent: {
    // Padding đáy bù safe-area cho nội dung scroll (chương cuối cách
    // gesture bar 1 khoảng an toàn, không bị khuất khi sheet full height).
    paddingBottom: spacing.lg,
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
  itemActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
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
  itemTextActive: {
    color: colors.accentLight,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
  },
});

export default ReaderScreen;
