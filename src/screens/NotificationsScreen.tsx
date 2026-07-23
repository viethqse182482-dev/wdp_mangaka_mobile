import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
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
import {
  useNotification,
} from '../context/NotificationContext';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { NotificationItem } from '../services/notificationService';
import { colors, radius, spacing } from '../theme/colors';
import { formatReadTime } from '../utils/formatReadTime';

export function NotificationsScreen() {
  const router = useRouter();
  const { openStory, loginPromptModal } = useStoryNavigation();
  const {
    notifications,
    loading,
    hasMore,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
    unreadCount,
  } = useNotification();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleItemPress = useCallback(
    (item: NotificationItem) => {
      void markAsRead(item._id);
      const seriesId = item.meta?.series_id;
      if (seriesId) {
        void openStory(seriesId);
      }
    },
    [markAsRead, openStory],
  );

  const handleLongPress = useCallback(
    (item: NotificationItem) => {
      Alert.alert('Xoá thông báo?', undefined, [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => void removeNotification(item._id),
        },
      ]);
    },
    [removeNotification],
  );

  const handleMarkAll = useCallback(() => {
    if (notifications.length === 0) return;
    if (unreadCount === 0) {
      Alert.alert('Không có thông báo chưa đọc');
      return;
    }
    Alert.alert(
      'Đánh dấu đã đọc tất cả?',
      'Toàn bộ thông báo sẽ chuyển sang trạng thái đã đọc.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => void markAllAsRead() },
      ],
    );
  }, [notifications.length, unreadCount, markAllAsRead]);

  const renderItem: ListRenderItem<NotificationItem> = useCallback(
    ({ item }) => (
      <NotificationRow
        item={item}
        onPress={handleItemPress}
        onLongPress={handleLongPress}
      />
    ),
    [handleItemPress, handleLongPress],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }, [hasMore]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
        <Text style={styles.emptySubtitle}>
          Theo dõi tác giả hoặc bật thông báo truyện để nhận cập nhật mới.
        </Text>
      </View>
    );
  }, [loading]);

  const headerRightLabel = useMemo(
    () => (unreadCount > 0 ? `Đánh dấu tất cả (${unreadCount})` : 'Đánh dấu tất cả'),
    [unreadCount],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Thông báo</Text>
          {!loading ? (
            <Text style={styles.subtitle}>
              {notifications.length > 0
                ? `${notifications.length} thông báo${unreadCount > 0 ? ` • ${unreadCount} chưa đọc` : ''}`
                : 'Cập nhật mới nhất sẽ hiện ở đây'}
            </Text>
          ) : (
            <Text style={styles.subtitle}>Đang tải...</Text>
          )}
        </View>

        <Pressable
          onPress={handleMarkAll}
          hitSlop={8}
          disabled={unreadCount === 0}
          style={({ pressed }) => [
            styles.markAllButton,
            unreadCount === 0 && styles.markAllButtonDisabled,
            pressed && unreadCount > 0 && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 && styles.markAllTextDisabled,
            ]}
            numberOfLines={1}
          >
            {headerRightLabel}
          </Text>
        </Pressable>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && notifications.length > 0}
              onRefresh={() => void refresh()}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
        />
      )}

      {loginPromptModal}
    </SafeAreaView>
  );
}

interface NotificationRowProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
  onLongPress: (item: NotificationItem) => void;
}

function NotificationRow({ item, onPress, onLongPress }: NotificationRowProps) {
  const isUnread = !item.is_read;
  const iconName = getIconForType(item.type);
  const iconColor = getColorForType(item.type);

  return (
    <Pressable
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.row,
        isUnread && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
    >
      {isUnread ? <View style={styles.unreadDot} /> : null}

      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title || 'Thông báo'}
        </Text>
        <Text style={styles.rowMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.rowTime}>
          {formatReadTime(item.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

function getIconForType(type: string): keyof typeof Ionicons.glyphMap {
  if (type === 'new_chapter_published') return 'book-outline';
  if (type === 'new_series_from_author') return 'sparkles-outline';
  return 'notifications-outline';
}

function getColorForType(type: string): string {
  if (type === 'new_chapter_published') return colors.accent;
  if (type === 'new_series_from_author') return '#8B5CF6';
  return colors.textSecondary;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    maxWidth: 160,
  },
  markAllButtonDisabled: {
    opacity: 0.45,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  markAllText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  markAllTextDisabled: {
    color: colors.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowUnread: {
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  rowPressed: {
    opacity: 0.75,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowTime: {
    color: colors.textMuted,
    fontSize: 11,
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
  pressed: {
    opacity: 0.7,
  },
});

export default NotificationsScreen;