import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { FollowedAuthorRow } from '../components/library/FollowedAuthorRow';
import { LibraryStoryRow } from '../components/library/LibraryStoryRow';
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
import { colors, radius, spacing } from '../theme/colors';

type TabKey = 'saved' | 'followed' | 'authors';

const TAB_DEFS: Array<{ key: TabKey; label: string }> = [
  { key: 'saved', label: 'Đã lưu' },
  { key: 'followed', label: 'Theo dõi' },
  { key: 'authors', label: 'Tác giả' },
];

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

function TabBar({ active, onChange }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      {TAB_DEFS.map((t) => {
        const isActive = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [
              styles.tabItem,
              isActive && styles.tabItemActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
              {t.label}
            </Text>
            {isActive ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

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

export function LibraryScreen() {
  const { openStory, loginPromptModal } = useStoryNavigation();
  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal: tabLoginPromptModal,
  } = useMainTabNavigation('library');

  const [activeTab, setActiveTab] = useState<TabKey>('saved');
  const [bookshelf, setBookshelf] = useState<BookshelfItem[]>([]);
  const [authors, setAuthors] = useState<FollowedAuthor[]>([]);
  const [loadingBookshelf, setLoadingBookshelf] = useState(true);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookshelfError, setBookshelfError] = useState<string | null>(null);
  const [authorsError, setAuthorsError] = useState<string | null>(null);

  const loadBookshelf = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingBookshelf(true);
    }
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
      setRefreshing(false);
    }
  }, []);

  const loadAuthors = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingAuthors(true);
    }
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
      setRefreshing(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadBookshelf(true), loadAuthors(true)]);
  }, [loadBookshelf, loadAuthors]);

  useFocusEffect(
    useCallback(() => {
      void loadBookshelf();
      void loadAuthors();
    }, [loadBookshelf, loadAuthors]),
  );

  const handleStoryPress = useCallback(
    (seriesId: string) => {
      void openStory(seriesId);
    },
    [openStory],
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

  // ── Filter cho tab "Theo dõi" — chỉ series có subscribed=true ───────
  const followedItems = bookshelf.filter((it) => it.subscribed === true);

  // ── Counts ──────────────────────────────────────────────────────────
  const savedCount = bookshelf.length;
  const followedCount = followedItems.length;
  const authorsCount = authors.length;

  // ── Renderers ───────────────────────────────────────────────────────
  const renderSaved: ListRenderItem<BookshelfItem> = useCallback(
    ({ item }) => (
      <LibraryStoryRow story={item} onPress={handleStoryPress} onRemove={handleRemoveFromBookshelf} />
    ),
    [handleStoryPress, handleRemoveFromBookshelf],
  );

  const renderFollowed: ListRenderItem<BookshelfItem> = useCallback(
    ({ item }) => (
      <FollowedSeriesRow item={item} onPress={handleStoryPress} />
    ),
    [handleStoryPress],
  );

  const renderAuthors: ListRenderItem<FollowedAuthor> = useCallback(
    ({ item }) => (
      <FollowedAuthorRowWithUnfollow
        item={item}
        onUnfollow={handleUnfollowAuthor}
      />
    ),
    [handleUnfollowAuthor],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const isLoading =
    activeTab === 'authors' ? loadingAuthors : loadingBookshelf;
  const error =
    activeTab === 'authors' ? authorsError : bookshelfError;

  const headerSubtitle = (() => {
    if (activeTab === 'saved') {
      return bookshelfError
        ? 'Không tải được dữ liệu'
        : `${savedCount} truyện trong tủ`;
    }
    if (activeTab === 'followed') {
      return `${followedCount} truyện đang theo dõi`;
    }
    return `${authorsCount} tác giả đang theo dõi`;
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Tủ truyện</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>
      </View>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ═══ TAB 1: ĐÃ LƯU — toàn bộ bookshelf ═══════════════════════════════ */}
      {activeTab === 'saved' ? (
        isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={bookshelf}
            keyExtractor={(item) => item._id}
            renderItem={renderSaved}
            ItemSeparatorComponent={renderSeparator}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshAll}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={
              error ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
                  </View>
                  <Text style={styles.emptyTitle}>Không tải được dữ liệu</Text>
                  <Text style={styles.emptySubtitle}>{error}</Text>
                </View>
              ) : (
                <SavedEmpty onBrowsePress={() => handleTabPress('home')} />
              )
            }
            contentContainerStyle={[
              styles.listContent,
              bookshelf.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : null}

      {/* ═══ TAB 2: TRUYỆN THEO DÕI — lọc theo subscribed=true ═══════════════ */}
      {activeTab === 'followed' ? (
        isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={followedItems}
            keyExtractor={(item) => item._id}
            renderItem={renderFollowed}
            ItemSeparatorComponent={renderSeparator}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshAll}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={<FollowedEmpty />}
            contentContainerStyle={[
              styles.listContent,
              followedItems.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : null}

      {/* ═══ TAB 3: TÁC GIẢ ĐANG THEO DÕI ═══════════════════════════════════ */}
      {activeTab === 'authors' ? (
        isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={authors}
            keyExtractor={(item) => item._id}
            renderItem={renderAuthors}
            ItemSeparatorComponent={renderSeparator}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshAll}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={
              authorsError ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
                  </View>
                  <Text style={styles.emptyTitle}>Không tải được tác giả</Text>
                  <Text style={styles.emptySubtitle}>{authorsError}</Text>
                </View>
              ) : (
                <AuthorsEmpty />
              )
            }
            contentContainerStyle={[
              styles.listContent,
              authors.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : null}

      <BottomTabBar activeTab="library" onTabPress={handleTabPress} />

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

// ── FollowedSeriesRow — dùng cho tab "Theo dõi", hiện badge "chương mới" ──
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
    <Pressable
      onPress={() => onPress(series._id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
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
        <Ionicons name="notifications" size={20} color={colors.accent} />
      </View>
    </Pressable>
  );
}

interface FollowedAuthorRowWithUnfollowProps {
  item: FollowedAuthor;
  onUnfollow: (authorId: string) => void;
}

function FollowedAuthorRowWithUnfollow({
  item,
  onUnfollow,
}: FollowedAuthorRowWithUnfollowProps) {
  const authorId = String(item.author_id?._id ?? item.author_id);
  return (
    <FollowedAuthorRow
      item={item}
      onPress={() => {
        // Tác giả là compact button row — không navigate story ở đây.
        // Có thể mở trang tác giả trong tương lai.
      }}
    />
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
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {},
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accent,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg + 64 + spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  coverWrapper: {
    width: 64,
    height: 92,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
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
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  iconHint: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
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
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  emptyActionText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});

export default LibraryScreen;