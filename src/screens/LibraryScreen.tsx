/**
 * LibraryScreen — Tủ truyện của tôi với GlassSegmentedControl.
 *
 * Tabs: Đã lưu | Đã mua | Theo dõi | Tác giả
 *
 * Mỗi tab có data + loading + error + empty + refresh riêng để
 * không ảnh hưởng lẫn nhau khi đổi tab. Pull-to-refresh chỉ refresh
 * data của tab hiện tại đang active.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { FollowedAuthorRow } from '../components/library/FollowedAuthorRow';
import { LibraryStoryRow } from '../components/library/LibraryStoryRow';
import {
  PurchasedSeriesCard,
  PurchasedSeriesGroup,
} from '../components/library/PurchasedSeriesCard';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import {
  BookshelfItem,
  fetchBookshelf,
  removeFromBookshelf,
} from '../services/bookshelfService';
import {
  fetchFollowedAuthors,
  FollowedAuthor,
} from '../services/followAuthorService';
import { getAuthToken } from '../services/authService';
import {
  fetchPurchasedChapters,
} from '../services/purchasedChapterService';
import { getReadingHistory } from '../services/readingHistoryService';
import { PurchasedChapterEntry } from '../types/storyDetail';
import { colors, radius, spacing, typography } from '../theme/colors';
import {
  GlassListItem,
  GlassSegmentedControl,
  GlassSkeleton,
} from '../theme/uiPrimitives';
import { formatCoinUnits } from '../utils/coinUnit';

type TabKey = 'saved' | 'purchased' | 'followed' | 'authors';

const TAB_DEFS: Array<{ key: TabKey; label: string }> = [
  { key: 'saved', label: 'Đã lưu' },
  { key: 'purchased', label: 'Đã mua' },
  { key: 'followed', label: 'Theo dõi' },
  { key: 'authors', label: 'Tác giả' },
];

const PURCHASED_PAGE_SIZE = 20;

interface SavedEmptyProps {
  onBrowsePress: () => void;
}

function SavedEmpty({ onBrowsePress }: SavedEmptyProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bookmark-outline" size={36} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Chưa lưu truyện nào</Text>
      <Text style={styles.emptySubtitle}>
        Bấm "Lưu vào tủ" trong trang chi tiết truyện để xem lại tại đây.
      </Text>
      <Pressable
        onPress={onBrowsePress}
        style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
      >
        <Text style={styles.emptyActionText}>Khám phá truyện</Text>
      </Pressable>
    </View>
  );
}

function FollowedEmpty() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="notifications-outline" size={36} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Chưa theo dõi truyện nào</Text>
      <Text style={styles.emptySubtitle}>
        Bấm "Bật thông báo" trong trang chi tiết truyện để nhận cập nhật chương mới.
      </Text>
    </View>
  );
}

function AuthorsEmpty() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="person-add-outline" size={36} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Chưa theo dõi tác giả</Text>
      <Text style={styles.emptySubtitle}>
        Bấm "Theo dõi tác giả" trong trang chi tiết truyện để nhận notify khi họ ra series mới.
      </Text>
    </View>
  );
}

interface PurchasedEmptyProps {
  onBrowsePress: () => void;
}

function PurchasedEmpty({ onBrowsePress }: PurchasedEmptyProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Bạn chưa mua chương nào</Text>
      <Text style={styles.emptySubtitle}>
        Các chương đã mua sẽ được lưu tại đây để bạn đọc lại bất cứ lúc nào.
      </Text>
      <Pressable
        onPress={onBrowsePress}
        style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
      >
        <Text style={styles.emptyActionText}>Khám phá truyện</Text>
      </Pressable>
    </View>
  );
}

/**
 * Gom các purchase entry theo series và trả về danh sách `PurchasedSeriesGroup`.
 *
 * Quy tắc:
 *  - Một chapter chỉ tính 1 lần trong tổng (dedupe theo `chapter_id`).
 *  - Tổng Coin chỉ cộng 1 lần cho mỗi chapter duy nhất.
 *  - Chapter trong cùng truyện sort theo `chapter_number` giảm dần.
 *  - Series thiếu → nhóm vào group với `seriesId = null`, `seriesName = '...'`.
 *  - Danh sách truyện sort theo lần mua gần nhất (desc).
 */
function groupPurchasesBySeries(entries: PurchasedChapterEntry[]): PurchasedSeriesGroup[] {
  // Dedupe theo `chapter_id` (một chapter có thể bị mua nhiều lần trong lịch sử,
  // nhưng về mặt người dùng chỉ "sở hữu" một lần → chỉ tính 1 lần trong tổng).
  const chapterMap = new Map<string, PurchasedChapterEntry>();
  for (const entry of entries) {
    if (!entry.chapterId) continue;
    const existing = chapterMap.get(entry.chapterId);
    if (!existing) {
      chapterMap.set(entry.chapterId, entry);
      continue;
    }
    // Giữ entry có `purchasedAt` mới nhất → cập nhật thời gian mua gần nhất.
    const existingTime = new Date(existing.purchasedAt).getTime();
    const incomingTime = new Date(entry.purchasedAt).getTime();
    if (incomingTime > existingTime) {
      chapterMap.set(entry.chapterId, { ...existing, purchasedAt: entry.purchasedAt });
    }
  }

  const deduped = Array.from(chapterMap.values());

  // Group theo seriesId. Series có thể undefined / empty → dùng key 'unknown'.
  const groupsByKey = new Map<string, PurchasedChapterEntry[]>();
  for (const entry of deduped) {
    const key = entry.series?.id && entry.series.id.length > 0
      ? entry.series.id
      : '__unknown__';
    const list = groupsByKey.get(key) ?? [];
    list.push(entry);
    groupsByKey.set(key, list);
  }

  const groups: PurchasedSeriesGroup[] = [];
  for (const [key, list] of groupsByKey.entries()) {
    const sorted = [...list].sort((a, b) => b.chapterNumber - a.chapterNumber);
    const latestChapter = sorted[0] ?? null;
    const totalCoinUnit = sorted.reduce((sum, item) => sum + (item.priceCoinUnit ?? 0), 0);
    const latestPurchasedAt = sorted.reduce<string>(
      (acc, item) => {
        const t = new Date(item.purchasedAt).getTime();
        if (!Number.isFinite(t)) return acc;
        return t > new Date(acc).getTime() ? item.purchasedAt : acc;
      },
      sorted[0]?.purchasedAt ?? new Date(0).toISOString(),
    );

    const firstEntry = sorted[0];
    const seriesName = firstEntry?.series?.name || 'Truyện không còn tồn tại';

    groups.push({
      seriesId: key === '__unknown__' ? null : key,
      seriesName,
      seriesCoverUrl: firstEntry?.series?.coverImageUrl,
      totalCoinUnit,
      latestPurchasedAt,
      latestChapter,
      chapters: sorted,
    });
  }

  // Sort: truyện nào có lần mua gần nhất lên đầu.
  groups.sort(
    (a, b) =>
      new Date(b.latestPurchasedAt).getTime() -
      new Date(a.latestPurchasedAt).getTime(),
  );

  return groups;
}

export function LibraryScreen() {
  const router = useRouter();
  const { openStory } = useStoryNavigation();
  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal: tabLoginPromptModal,
  } = useMainTabNavigation('library');

  const [activeTab, setActiveTab] = useState<TabKey>('saved');

  // ── Đã lưu (bookshelf) ─────────────────────────────────────────────
  const [bookshelf, setBookshelf] = useState<BookshelfItem[]>([]);
  const [loadingBookshelf, setLoadingBookshelf] = useState(true);
  const [bookshelfError, setBookshelfError] = useState<string | null>(null);

  // ── Đã mua (chapter purchases) ──────────────────────────────────────
  const [purchasedEntries, setPurchasedEntries] = useState<PurchasedChapterEntry[]>([]);
  const [loadingPurchased, setLoadingPurchased] = useState(true);
  const [loadingMorePurchased, setLoadingMorePurchased] = useState(false);
  const [purchasedError, setPurchasedError] = useState<string | null>(null);
  const [purchasedPage, setPurchasedPage] = useState(1);
  const [purchasedHasMore, setPurchasedHasMore] = useState(false);
  const [purchasedTotalPages, setPurchasedTotalPages] = useState(1);

  // ── Theo dõi + Tác giả ──────────────────────────────────────────────
  const [authors, setAuthors] = useState<FollowedAuthor[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);

  /**
   * `refreshing` được share cho tất cả tab — chỉ true khi user đang pull-to-refresh
   * trên tab hiện tại. Tách riêng `loadingPurchased` (loading skeleton lần đầu)
   * và `loadingMorePurchased` (append trang) để không xung đột với refresh.
   */
  const [refreshing, setRefreshing] = useState(false);

  // Lịch sử đọc: dùng để ưu tiên chapter "Đọc tiếp" trong card Purchased.
  const [historyBySeries, setHistoryBySeries] = useState<Record<string, number>>({});

  const purchasedRef = useRef({
    page: 1,
    hasMore: false,
    totalPages: 1,
  });

  const loadBookshelf = useCallback(async () => {
    setLoadingBookshelf(true);
    setBookshelfError(null);
    try {
      const res = await fetchBookshelf(1, 100);
      setBookshelf(res.data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'UNAUTHENTICATED') {
        setBookshelf([]);
      } else {
        setBookshelfError(msg);
      }
    } finally {
      setLoadingBookshelf(false);
    }
  }, []);

  const loadAuthors = useCallback(async () => {
    setLoadingAuthors(true);
    setAuthorsError(null);
    try {
      const res = await fetchFollowedAuthors(1, 100);
      setAuthors(res.data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'UNAUTHENTICATED') {
        setAuthors([]);
      } else {
        setAuthorsError(msg);
      }
    } finally {
      setLoadingAuthors(false);
    }
  }, []);

  /**
   * Load purchases:
   *  - `reset=true` → fetch page 1 và thay thế toàn bộ list
   *  - `reset=false` → append page `nextPage` (nếu còn trang)
   *
   * Không setState sau khi component unmount để tránh warning.
   */
  const loadPurchased = useCallback(
    async (params: { reset: boolean; page?: number; showRefresh?: boolean }) => {
      const isReset = params.reset;
      const targetPage = params.page ?? (isReset ? 1 : purchasedRef.current.page + 1);
      const showRefresh = params.showRefresh ?? isReset;

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoadingMorePurchased(true);
      }
      setPurchasedError(null);

      try {
        const token = await getAuthToken();
        if (!token) {
          // Chưa đăng nhập → list rỗng, không bật error UI.
          setPurchasedEntries([]);
          purchasedRef.current = { page: 1, hasMore: false, totalPages: 1 };
          setPurchasedPage(1);
          setPurchasedHasMore(false);
          setPurchasedTotalPages(1);
          return;
        }

        const res = await fetchPurchasedChapters(targetPage, PURCHASED_PAGE_SIZE);
        const incoming = res.data ?? [];

        // Dedupe theo `chapter_id` ưu tiên, fallback `_id` của purchase
        // (đề phòng BE trùng record giữa các page).
        setPurchasedEntries((current) => {
          const base = isReset ? [] : current;
          const seenChapter = new Set(base.map((item) => item.chapterId));
          const seenPurchase = new Set(base.map((item) => item.id));
          const appended: PurchasedChapterEntry[] = [];
          for (const entry of incoming) {
            if (seenChapter.has(entry.chapterId) || seenPurchase.has(entry.id)) continue;
            seenChapter.add(entry.chapterId);
            seenPurchase.add(entry.id);
            appended.push(entry);
          }
          return [...base, ...appended];
        });

        const totalPages = res.pagination?.totalPages ?? targetPage;
        const hasMore = targetPage < totalPages;
        purchasedRef.current = {
          page: targetPage,
          hasMore,
          totalPages,
        };
        setPurchasedPage(targetPage);
        setPurchasedHasMore(hasMore);
        setPurchasedTotalPages(totalPages);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'UNAUTHENTICATED') {
          setPurchasedEntries([]);
          purchasedRef.current = { page: 1, hasMore: false, totalPages: 1 };
          setPurchasedPage(1);
          setPurchasedHasMore(false);
          setPurchasedTotalPages(1);
        } else {
          setPurchasedError(msg);
        }
      } finally {
        if (showRefresh) {
          setRefreshing(false);
        } else {
          setLoadingMorePurchased(false);
        }
        // Loading state chính (skeleton lần đầu) chỉ tắt sau lần reset đầu tiên.
        setLoadingPurchased(false);
      }
    },
    [],
  );

  // Tải lịch sử đọc 1 lần để ưu tiên chapter "Đọc tiếp".
  const loadHistory = useCallback(async () => {
    try {
      const entries = await getReadingHistory();
      const map: Record<string, number> = {};
      for (const item of entries) {
        if (item.id && item.lastReadChapter > 0) {
          map[item.id] = item.lastReadChapter;
        }
      }
      setHistoryBySeries(map);
    } catch {
      // ignore — lịch sử đọc là phụ, không ảnh hưởng Purchased flow chính.
    }
  }, []);

  // ── Refresh tổng khi pull-to-refresh trên tab đang active ────────────
  const refreshActiveTab = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'saved') {
        await loadBookshelf();
        return;
      }
      if (activeTab === 'purchased') {
        await loadPurchased({ reset: true, showRefresh: true });
        await loadHistory();
        return;
      }
      if (activeTab === 'followed') {
        await loadBookshelf();
        return;
      }
      if (activeTab === 'authors') {
        await loadAuthors();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, loadBookshelf, loadAuthors, loadPurchased, loadHistory]);

  // Khi tab Purchased mount lần đầu hoặc refresh → loading skeleton cho đến khi
  // loadPurchased({reset:true}) hoàn tất (setLoadingPurchased(false) trong finally).
  const [purchasedInitialLoaded, setPurchasedInitialLoaded] = useState(false);

  // useFocusEffect — mỗi lần screen focus, tải lại cả 3 data source để
  // bookshelf / purchased / authors luôn đồng bộ với backend.
  useFocusEffect(
    useCallback(() => {
      void loadBookshelf();
      void loadAuthors();
      void loadPurchased({ reset: true });
      void loadHistory();
    }, [loadBookshelf, loadAuthors, loadPurchased, loadHistory]),
  );

  // Effect riêng cho lần load Purchased đầu tiên — chỉ bật/tắt skeleton lần đầu
  // để tránh nhấp nháy khi refresh hoặc loadMore.
  useEffect(() => {
    if (loadingPurchased === false) {
      setPurchasedInitialLoaded(true);
    }
  }, [loadingPurchased]);

  // ── Pagination: khi gần cuối Purchased list → loadMore ───────────────
  const purchasedGroups = useMemo(
    () => groupPurchasesBySeries(purchasedEntries),
    [purchasedEntries],
  );

  // Tổng từ dữ liệu backend (đã dedupe theo chapter).
  const totalPurchasedChapters = useMemo(() => {
    const seen = new Set<string>();
    for (const entry of purchasedEntries) {
      if (entry.chapterId) seen.add(entry.chapterId);
    }
    return seen.size;
  }, [purchasedEntries]);

  const totalCoinSpent = useMemo(() => {
    // Tổng từ group để tránh cộng trùng 1 chapter trên 2 purchase entry trùng chapter.
    return purchasedGroups.reduce((sum, g) => sum + g.totalCoinUnit, 0);
  }, [purchasedGroups]);

  // ── Actions ─────────────────────────────────────────────────────────
  const handleStoryPress = useCallback(
    (seriesId: string) => {
      void openStory(seriesId);
    },
    [openStory],
  );

  const handleAuthorPress = useCallback(
    (authorId: string) => {
      router.push(`/author/${encodeURIComponent(authorId)}`);
    },
    [router],
  );

  const handleRemoveFromBookshelf = useCallback(async (seriesId: string) => {
    try {
      await removeFromBookshelf(seriesId);
      setBookshelf((current) => current.filter((item) => item.series._id !== seriesId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'UNAUTHENTICATED') {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
      } else {
        Alert.alert('Không thể xoá khỏi tủ', msg);
      }
    }
  }, []);

  const handleUnfollowAuthor = useCallback((authorId: string) => {
    setAuthors((current) => current.filter((it) => String(it.author_id?._id ?? it.author_id) !== authorId));
  }, []);

  const handleReadChapter = useCallback(
    ({ seriesId, chapterNumber }: { seriesId: string; chapterNumber: number }) => {
      // Reader vẫn tự gọi API kiểm tra quyền truy cập; client chỉ điều hướng.
      router.push(`/read/${encodeURIComponent(seriesId)}/${chapterNumber}`);
    },
    [router],
  );

  const handleEndReachedPurchased = useCallback(() => {
    if (
      activeTab !== 'purchased' ||
      loadingPurchased ||
      loadingMorePurchased ||
      !purchasedHasMore ||
      purchasedError
    ) {
      return;
    }
    void loadPurchased({ reset: false });
  }, [
    activeTab,
    loadingPurchased,
    loadingMorePurchased,
    purchasedHasMore,
    purchasedError,
    loadPurchased,
  ]);

  const followedItems = bookshelf.filter((it) => it.subscribed === true);

  const savedCount = bookshelf.length;
  const followedCount = followedItems.length;
  const authorsCount = authors.length;

  const headerSubtitle = (() => {
    if (activeTab === 'saved') {
      return bookshelfError
        ? 'Không tải được dữ liệu'
        : `${savedCount} truyện trong tủ`;
    }
    if (activeTab === 'purchased') {
      if (purchasedError) return 'Không tải được dữ liệu';
      if (!purchasedInitialLoaded) return 'Đang tải...';
      if (purchasedGroups.length === 0) return 'Chưa mua chương nào';
      const seriesWord = purchasedGroups.length === 1 ? 'truyện' : 'truyện';
      return `${totalPurchasedChapters} chương đã mua trong ${purchasedGroups.length} ${seriesWord}`;
    }
    if (activeTab === 'followed') {
      return `${followedCount} truyện đang theo dõi`;
    }
    return `${authorsCount} tác giả đang theo dõi`;
  })();

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

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Tủ truyện</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        </View>

        <View style={styles.tabsWrap}>
          <GlassSegmentedControl
            options={TAB_DEFS.map((t) => ({ value: t.key, label: t.label }))}
            value={activeTab}
            onChange={(v) => setActiveTab(v as TabKey)}
          />
        </View>

        {activeTab === 'saved' ? (
          <SavedTabContent
            loading={loadingBookshelf}
            bookshelf={bookshelf}
            error={bookshelfError}
            refreshing={refreshing}
            onRefresh={refreshActiveTab}
            onStoryPress={handleStoryPress}
            onRemove={handleRemoveFromBookshelf}
            onBrowsePress={() => handleTabPress('home')}
          />
        ) : null}

        {activeTab === 'purchased' ? (
          <PurchasedTabContent
            groups={purchasedGroups}
            loading={loadingPurchased && !purchasedInitialLoaded}
            loadingMore={loadingMorePurchased}
            refreshing={refreshing}
            error={purchasedError}
            totalChapters={totalPurchasedChapters}
            totalCoinSpent={totalCoinSpent}
            historyBySeries={historyBySeries}
            onRefresh={refreshActiveTab}
            onEndReached={handleEndReachedPurchased}
            onOpenSeries={handleStoryPress}
            onReadChapter={handleReadChapter}
            onBrowsePress={() => handleTabPress('home')}
          />
        ) : null}

        {activeTab === 'followed' ? (
          <FollowedTabContent
            loading={loadingBookshelf}
            items={followedItems}
            refreshing={refreshing}
            onRefresh={refreshActiveTab}
            onPress={handleStoryPress}
          />
        ) : null}

        {activeTab === 'authors' ? (
          <AuthorsTabContent
            loading={loadingAuthors}
            items={authors}
            error={authorsError}
            refreshing={refreshing}
            onRefresh={refreshActiveTab}
            onPress={handleAuthorPress}
          />
        ) : null}

        <BottomTabBar activeTab="library" onTabPress={handleTabPress} />

        <AccountDrawer
          visible={accountDrawerVisible}
          onClose={() => setAccountDrawerVisible(false)}
          onMenuPress={handleAccountMenuPress}
        />

        {tabLoginPromptModal}
      </SafeAreaView>
    </View>
  );
}

/* ============================================================
 * SavedTabContent — tab "Đã lưu".
 * Tách riêng để tránh re-render cả screen khi state đổi.
 * ============================================================ */
interface SavedTabContentProps {
  loading: boolean;
  bookshelf: BookshelfItem[];
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onStoryPress: (id: string) => void;
  onRemove: (id: string) => Promise<void>;
  onBrowsePress: () => void;
}

function SavedTabContent({
  loading,
  bookshelf,
  error,
  refreshing,
  onRefresh,
  onStoryPress,
  onRemove,
  onBrowsePress,
}: SavedTabContentProps) {
  const renderSaved: ListRenderItem<BookshelfItem> = useCallback(
    ({ item }) => (
      <LibraryStoryRow story={item} onPress={onStoryPress} onRemove={onRemove} />
    ),
    [onStoryPress, onRemove],
  );

  if (loading) {
    return <CenteredSkeleton />;
  }
  return (
    <FlatList
      data={bookshelf}
      keyExtractor={(item) => item._id}
      renderItem={renderSaved}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListEmptyComponent={
        error ? (
          <ErrorState message={error} onRetry={onRefresh} />
        ) : (
          <SavedEmpty onBrowsePress={onBrowsePress} />
        )
      }
      contentContainerStyle={[
        styles.listContent,
        bookshelf.length === 0 && styles.listContentEmpty,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

/* ============================================================
 * FollowedTabContent — tab "Theo dõi".
 * ============================================================ */
interface FollowedTabContentProps {
  loading: boolean;
  items: BookshelfItem[];
  refreshing: boolean;
  onRefresh: () => void;
  onPress: (id: string) => void;
}

function FollowedTabContent({
  loading,
  items,
  refreshing,
  onRefresh,
  onPress,
}: FollowedTabContentProps) {
  const renderFollowed: ListRenderItem<BookshelfItem> = useCallback(
    ({ item }) => <FollowedSeriesRow item={item} onPress={onPress} />,
    [onPress],
  );

  if (loading) {
    return <CenteredSkeleton />;
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      renderItem={renderFollowed}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListEmptyComponent={<FollowedEmpty />}
      contentContainerStyle={[
        styles.listContent,
        items.length === 0 && styles.listContentEmpty,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

/* ============================================================
 * AuthorsTabContent — tab "Tác giả".
 * ============================================================ */
interface AuthorsTabContentProps {
  loading: boolean;
  items: FollowedAuthor[];
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onPress: (id: string) => void;
}

function AuthorsTabContent({
  loading,
  items,
  error,
  refreshing,
  onRefresh,
  onPress,
}: AuthorsTabContentProps) {
  const renderAuthors: ListRenderItem<FollowedAuthor> = useCallback(
    ({ item }) => <FollowedAuthorRow item={item} onPress={onPress} />,
    [onPress],
  );

  if (loading) {
    return <CenteredSkeleton />;
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      renderItem={renderAuthors}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListEmptyComponent={
        error ? (
          <ErrorState message={error} onRetry={onRefresh} />
        ) : (
          <AuthorsEmpty />
        )
      }
      contentContainerStyle={[
        styles.listContent,
        items.length === 0 && styles.listContentEmpty,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

/* ============================================================
 * PurchasedTabContent — tab "Đã mua".
 * ============================================================ */
interface PurchasedTabContentProps {
  groups: PurchasedSeriesGroup[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  totalChapters: number;
  totalCoinSpent: number;
  historyBySeries: Record<string, number>;
  onRefresh: () => void;
  onEndReached: () => void;
  onOpenSeries: (id: string) => void;
  onReadChapter: (params: { seriesId: string; chapterNumber: number }) => void;
  onBrowsePress: () => void;
}

function PurchasedTabContent({
  groups,
  loading,
  loadingMore,
  refreshing,
  error,
  totalChapters,
  totalCoinSpent,
  historyBySeries,
  onRefresh,
  onEndReached,
  onOpenSeries,
  onReadChapter,
  onBrowsePress,
}: PurchasedTabContentProps) {
  if (loading) {
    return <CenteredSkeleton />;
  }

  const summary =
    groups.length > 0
      ? `${totalChapters} chương đã mua trong ${groups.length} truyện`
      : null;

  return (
    <FlatList
      data={groups}
      keyExtractor={(item, index) =>
        item.seriesId ?? `__unknown_${index}`
      }
      renderItem={({ item }) => (
        <PurchasedSeriesCard
          group={item}
          historyChapterBySeries={historyBySeries}
          onOpenSeries={onOpenSeries}
          onReadChapter={onReadChapter}
        />
      )}
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListHeaderComponent={
        summary || totalCoinSpent > 0 ? (
          <View style={styles.purchasedSummary}>
            <Text style={styles.purchasedSummaryText}>{summary}</Text>
            {totalCoinSpent > 0 ? (
              <Text style={styles.purchasedSummarySub}>
                Tổng đã chi: {formatCoinUnits(totalCoinSpent)} Coin
              </Text>
            ) : null}
          </View>
        ) : null
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoading}>
            <GlassSkeleton width={120} height={14} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        error ? (
          <ErrorState message={error} onRetry={onRefresh} />
        ) : (
          <PurchasedEmpty onBrowsePress={onBrowsePress} />
        )
      }
      contentContainerStyle={[
        styles.listContent,
        groups.length === 0 && styles.listContentEmpty,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

/* ============================================================
 * Shared UI bits
 * ============================================================ */
function CenteredSkeleton() {
  return (
    <View style={styles.centered}>
      <GlassSkeleton width={160} height={18} />
      <View style={{ height: spacing.md }} />
      <GlassSkeleton width={240} height={14} />
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
      </View>
      <Text style={styles.emptyTitle}>Không tải được dữ liệu</Text>
      <Text style={styles.emptySubtitle}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
      >
        <Text style={styles.emptyActionText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

/* ============================================================
 * Local component: FollowedSeriesRow — giữ nguyên từ phiên bản cũ
 * ============================================================ */
interface FollowedSeriesRowProps {
  item: BookshelfItem;
  onPress: (id: string) => void;
}

function FollowedSeriesRow({ item, onPress }: FollowedSeriesRowProps) {
  const series = item.series;
  const newCount = item.new_chapters_count ?? 0;
  const lastRead = item.last_read_chapter ?? 0;
  const latest = series.latest_chapter_number ?? 0;

  return (
    <View style={styles.row}>
      <GlassListItem
        tint="navy"
        depth={1}
        radius={radius.lg}
        onPress={() => onPress(series._id)}
        innerStyle={styles.rowInner}
      >
        <View style={styles.coverWrapper}>
          {series.cover_image_url ? (
            <Image source={{ uri: series.cover_image_url }} style={styles.cover} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="book-outline" size={24} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {series.name || 'Truyện chưa đặt tên'}
          </Text>
          <Text style={styles.metaLine}>
            {latest > 0
              ? `Mới nhất chương ${latest}${lastRead > 0 ? ` • đã đọc ${lastRead}` : ''}`
              : 'Chưa có chương'}
          </Text>
          {newCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {newCount} chương mới
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.iconHint}>
          <Ionicons name="notifications" size={18} color={colors.accentLight} />
        </View>
      </GlassListItem>
    </View>
  );
}

/* ============================================================
 * Styles
 * ============================================================ */
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamilyMedium,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  coverWrapper: {
    width: 60,
    height: 86,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  metaLine: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontFamily: typography.fontFamilyMedium,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
    shadowColor: colors.danger,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  iconHint: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: typography.fontFamilyMedium,
  },
  emptyAction: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyActionText: {
    color: colors.accentLight,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  purchasedSummary: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  purchasedSummaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  purchasedSummarySub: {
    color: colors.cyan,
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamilyMedium,
  },
  footerLoading: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
});

export default LibraryScreen;