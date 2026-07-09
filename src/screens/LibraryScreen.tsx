import { Ionicons } from '@expo/vector-icons';
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
import { LibraryStoryRow } from '../components/library/LibraryStoryRow';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import {
  BookshelfItem,
  fetchBookshelf,
  removeFromBookshelf,
} from '../services/bookshelfService';
import { fetchFollowedSeries, unfollowSeries } from '../services/followService';
import { FeaturedStory } from '../types/story';
import { colors, spacing } from '../theme/colors';

type TabType = 'bookshelf' | 'following';

export function LibraryScreen() {
  const { openStory, loginPromptModal } = useStoryNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('bookshelf');
  const [bookshelfItems, setBookshelfItems] = useState<BookshelfItem[]>([]);
  const [followingItems, setFollowingItems] = useState<(FeaturedStory & { followedAt: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal: tabLoginPromptModal,
  } = useMainTabNavigation('library');

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (activeTab === 'bookshelf') {
        const response = await fetchBookshelf(1, 100);
        setBookshelfItems(response.data ?? []);
      } else {
        const response = await fetchFollowedSeries(1, 100);
        setFollowingItems(response.data ?? []);
      }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      if (errMessage === 'UNAUTHENTICATED') {
        setBookshelfItems([]);
        setFollowingItems([]);
      } else {
        setError(errMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const handleStoryPress = useCallback((seriesId: string) => {
    void openStory(seriesId);
  }, [openStory]);

  const handleRemoveFromBookshelf = useCallback(async (seriesId: string) => {
    try {
      await removeFromBookshelf(seriesId);
      setBookshelfItems((current) =>
        current.filter((item) => item.series._id !== seriesId),
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      if (errMessage === 'UNAUTHENTICATED') {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
      } else {
        Alert.alert('Không thể xóa khỏi tủ sách', errMessage);
      }
    }
  }, []);

  const handleUnfollow = useCallback(async (seriesId: string) => {
    try {
      await unfollowSeries(seriesId);
      setFollowingItems((current) =>
        current.filter((item) => item._id !== seriesId),
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      if (errMessage === 'UNAUTHENTICATED') {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
      } else {
        Alert.alert('Không thể bỏ theo dõi', errMessage);
      }
    }
  }, []);

  const renderBookshelfItem: ListRenderItem<BookshelfItem> = useCallback(
    ({ item }) => (
      <LibraryStoryRow story={item} onPress={handleStoryPress} onRemove={handleRemoveFromBookshelf} />
    ),
    [handleStoryPress, handleRemoveFromBookshelf],
  );

  const renderFollowingItem: ListRenderItem<FeaturedStory & { followedAt: string }> = useCallback(
    ({ item }) => (
      <LibraryStoryRow
        story={item}
        onPress={handleStoryPress}
        onRemove={handleUnfollow}
        removeLabel="Bỏ theo dõi"
      />
    ),
    [handleStoryPress, handleUnfollow],
  );

  const currentItems = activeTab === 'bookshelf' ? bookshelfItems : followingItems;

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    const isFollowing = activeTab === 'following';
    const emptyTitle = isFollowing ? 'Chưa theo dõi truyện nào' : 'Tủ sách trống';
    const emptySubtitle = isFollowing
      ? 'Nhấn nút "Theo dõi" trên truyện để nhận thông báo khi có chapter mới.'
      : 'Nhấn nút "Lưu vào tủ sách" trên truyện để xem lại tại đây.';

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
          </View>
          <Text style={styles.emptyTitle}>Không tải được dữ liệu</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name={isFollowing ? 'heart-outline' : 'book-outline'} size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
      </View>
    );
  }, [loading, error, activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Thư viện</Text>
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('bookshelf')}
            style={[styles.tab, activeTab === 'bookshelf' && styles.tabActive]}
          >
            <Ionicons
              name="book"
              size={16}
              color={activeTab === 'bookshelf' ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'bookshelf' && styles.tabTextActive]}>
              Tủ sách
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('following')}
            style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          >
            <Ionicons
              name="heart"
              size={16}
              color={activeTab === 'following' ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
              Theo dõi
            </Text>
          </Pressable>
        </View>
        {!loading && currentItems.length > 0 ? (
          <Text style={styles.count}>
            {activeTab === 'bookshelf' ? bookshelfItems.length : followingItems.length} truyện
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={currentItems as BookshelfItem[]}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === 'bookshelf' ? renderBookshelfItem : renderFollowingItem}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            currentItems.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accent,
  },
  count: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
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
    marginLeft: spacing.lg + 64 + spacing.md,
  },
  centered: {
    flex: 1,
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
});