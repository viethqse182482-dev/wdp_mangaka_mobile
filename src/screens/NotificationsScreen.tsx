/**
 * NotificationsScreen — danh sách thông báo với Liquid Glass cards.
 *
 *  - Mỗi thông báo là GlassListItem glass.
 *  - Unread có glow + dot cyan.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from '../context/NotificationContext';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { NotificationItem } from '../services/notificationService';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GlassIconButton, GlassListItem, GlassPill, Tag } from '../theme/uiPrimitives';
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

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    void loadMore();
  }, [hasMore, loading, loadMore]);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

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
    Alert.alert('Đánh dấu đã đọc tất cả?', 'Toàn bộ thông báo sẽ chuyển sang trạng thái đã đọc.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đồng ý', onPress: () => void markAllAsRead() },
    ]);
  }, [notifications.length, unreadCount, markAllAsRead]);

  const renderItem: ListRenderItem<NotificationItem> = useCallback(
    ({ item }) => (
      <NotificationRow item={item} onPress={handleItemPress} onLongPress={handleLongPress} />
    ),
    [handleItemPress, handleLongPress],
  );

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accentLight} />
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
    () => (unreadCount > 0 ? `Đánh dấu (${unreadCount})` : 'Đánh dấu'),
    [unreadCount],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <View style={styles.header}>
          <GlassIconButton icon="arrow-back" size={40} tint="light" onPress={handleBack} />

          <View style={styles.headerText}>
            <Text style={styles.title}>Thông báo</Text>
            {!loading && notifications.length > 0 && (
              <Text style={styles.subtitle}>
                {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc hết'}
              </Text>
            )}
          </View>

          <GlassPill
            label={headerRightLabel}
            icon="checkmark-done"
            selected={unreadCount > 0}
            disabled={unreadCount === 0}
            onPress={handleMarkAll}
            tint="accent"
            size="sm"
          />
        </View>

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
            notifications.length === 0 && loading && styles.listContentLoading,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && notifications.length > 0}
              onRefresh={handleRefresh}
              tintColor={colors.accentLight}
              colors={[colors.accent]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
        />

        {loading && notifications.length === 0 ? (
          <View style={styles.initialLoadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.accentLight} />
          </View>
        ) : null}

        {loginPromptModal}
      </SafeAreaView>
    </View>
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
    <GlassListItem
      tint="dark"
      depth={isUnread ? 2 : 1}
      glow={isUnread}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
    >
      <View style={styles.rowInner}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}22` }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        <View style={styles.rowContent}>
          <View style={styles.titleRow}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {item.title || 'Thông báo'}
            </Text>
            {isUnread ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.rowMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.rowTime}>{formatReadTime(item.created_at)}</Text>
            <Tag label={getTypeLabel(item.type)} variant="default" size="sm" />
          </View>
        </View>
      </View>
    </GlassListItem>
  );
}

function getTypeLabel(type: string): string {
  if (type === 'new_chapter_published') return 'Chương mới';
  if (type === 'new_series_from_author') return 'Truyện mới';
  return 'Hệ thống';
}

function getIconForType(type: string): keyof typeof Ionicons.glyphMap {
  if (type === 'new_chapter_published') return 'book-outline';
  if (type === 'new_series_from_author') return 'sparkles-outline';
  return 'notifications-outline';
}

function getColorForType(type: string): string {
  if (type === 'new_chapter_published') return colors.accentLight;
  if (type === 'new_series_from_author') return colors.cyan;
  return colors.textSecondary;
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    marginTop: 2,
  },
  initialLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.huge,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listContentLoading: {
    justifyContent: 'center',
  },
  separator: {
    height: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  rowMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamilyPlatform as string,
  },
  rowTime: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    fontFamily: typography.fontFamilyPlatform as string,
    lineHeight: 20,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default NotificationsScreen;
