import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  FollowedStory,
  getFollowedStories,
  unfollowStory,
} from '../services/followService';
import { colors, spacing } from '../theme/colors';

export function LibraryScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<FollowedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
  } = useMainTabNavigation('library');

  const loadStories = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getFollowedStories();
      setStories(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [loadStories]),
  );

  const handleStoryPress = useCallback((storyId: string) => {
    router.push(`/story/${storyId}`);
  }, [router]);

  const handleUnfollow = useCallback(async (storyId: string) => {
    await unfollowStory(storyId);
    setStories((current) => current.filter((story) => story.id !== storyId));
  }, []);

  const renderItem: ListRenderItem<FollowedStory> = useCallback(
    ({ item }) => (
      <LibraryStoryRow story={item} onPress={handleStoryPress} onUnfollow={handleUnfollow} />
    ),
    [handleStoryPress, handleUnfollow],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="book-outline" size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Tủ sách trống</Text>
        <Text style={styles.emptySubtitle}>
          Nhấn biểu tượng bookmark trên truyện để theo dõi và xem lại tại đây.
        </Text>
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Tủ sách</Text>
        <Text style={styles.subtitle}>Truyện bạn đang theo dõi</Text>
        {!loading && stories.length > 0 ? (
          <Text style={styles.count}>{stories.length} truyện</Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            stories.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadStories(true)}
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
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
