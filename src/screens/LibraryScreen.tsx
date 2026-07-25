/**
 * LibraryScreen — Tủ truyện của tôi với GlassSegmentedControl.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { colors, radius, spacing, typography } from '../theme/colors';
import {
  GlassCard,
  GlassIconButton,
  GlassListItem,
  GlassSegmentedControl,
  GlassSkeleton,
} from '../theme/uiPrimitives';

type TabKey = 'saved' | 'followed' | 'authors';

const TAB_DEFS: Array<{ key: TabKey; label: string }> = [
  { key: 'saved', label: 'Đã lưu' },
  { key: 'followed', label: 'Theo dõi' },
  { key: 'authors', label: 'Tác giả' },
];

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

  const followedItems = bookshelf.filter((it) => it.subscribed === true);

  const savedCount = bookshelf.length;
  const followedCount = followedItems.length;
  const authorsCount = authors.length;

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
      <FollowedAuthorRow item={item} onPress={handleAuthorPress} />
    ),
    [handleAuthorPress],
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
          isLoading ? (
            <View style={styles.centered}>
              <GlassSkeleton width={160} height={18} />
              <View style={{ height: spacing.md }} />
              <GlassSkeleton width={240} height={14} />
            </View>
          ) : (
            <FlatList
              data={bookshelf}
              keyExtractor={(item) => item._id}
              renderItem={renderSaved}
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

        {activeTab === 'followed' ? (
          isLoading ? (
            <View style={styles.centered}>
              <GlassSkeleton width={160} height={18} />
              <View style={{ height: spacing.md }} />
              <GlassSkeleton width={240} height={14} />
            </View>
          ) : (
            <FlatList
              data={followedItems}
              keyExtractor={(item) => item._id}
              renderItem={renderFollowed}
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

        {activeTab === 'authors' ? (
          isLoading ? (
            <View style={styles.centered}>
              <GlassSkeleton width={160} height={18} />
              <View style={{ height: spacing.md }} />
              <GlassSkeleton width={240} height={14} />
            </View>
          ) : (
            <FlatList
              data={authors}
              keyExtractor={(item) => item._id}
              renderItem={renderAuthors}
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

        {tabLoginPromptModal}
      </SafeAreaView>
    </View>
  );
}

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
});

export default LibraryScreen;
