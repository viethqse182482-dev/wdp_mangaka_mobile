import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
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
import { colors, spacing } from '../theme/colors';

export function LibraryScreen() {
  const { openStory, loginPromptModal } = useStoryNavigation();
  const [bookshelfItems, setBookshelfItems] = useState<BookshelfItem[]>([]);
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
      const response = await fetchBookshelf(1, 100);
      setBookshelfItems(response.data ?? []);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      if (errMessage === 'UNAUTHENTICATED') {
        setBookshelfItems([]);
      } else {
        setError(errMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const renderBookshelfItem: ListRenderItem<BookshelfItem> = useCallback(
    ({ item }) => (
      <LibraryStoryRow story={item} onPress={handleStoryPress} onRemove={handleRemoveFromBookshelf} />
    ),
    [handleStoryPress, handleRemoveFromBookshelf],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;

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
          <Ionicons name="book-outline" size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Tủ sách trống</Text>
        <Text style={styles.emptySubtitle}>
          Nhấn nút "Lưu vào tủ sách" trên truyện để xem lại tại đây.
        </Text>
      </View>
    );
  }, [loading, error]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Thư viện</Text>
        {!loading && bookshelfItems.length > 0 ? (
          <Text style={styles.count}>{bookshelfItems.length} truyện</Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={bookshelfItems}
          keyExtractor={(item) => item._id}
          renderItem={renderBookshelfItem}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            bookshelfItems.length === 0 && styles.listContentEmpty,
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