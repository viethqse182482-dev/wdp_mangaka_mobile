/**
 * ReadingHistoryScreen — Lịch sử đọc với GlassListItem rows.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { HistoryStoryRow } from '../components/history/HistoryStoryRow';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import {
  ReadingHistoryEntry,
  clearReadingHistory,
  getReadingHistory,
  removeHistoryEntry,
} from '../services/readingHistoryService';
import { colors, radius, spacing, typography } from '../theme/colors';
import {
  GlassIconButton,
  GlassSkeleton,
} from '../theme/uiPrimitives';

const HISTORY_PAGE_SIZE = 10;

export function ReadingHistoryScreen() {
  const router = useRouter();
  const { openStory, loginPromptModal } = useStoryNavigation();
  const [entries, setEntries] = useState<ReadingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getReadingHistory();
      setEntries(data);
      setPage(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleClearAll = useCallback(() => {
    if (entries.length === 0) return;

    Alert.alert('Xóa lịch sử', 'Bạn có chắc muốn xóa toàn bộ lịch sử đọc?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          // Snapshot trước khi gọi BE để rollback nếu fail.
          const snapshot = entries;
          setEntries([]);
          const ok = await clearReadingHistory();
          if (!ok) {
            setEntries(snapshot);
            Alert.alert('Lỗi', 'Không thể xóa lịch sử. Vui lòng thử lại.');
          }
        },
      },
    ]);
  }, [entries]);

  const handleStoryPress = useCallback((storyId: string) => {
    void openStory(storyId);
  }, [openStory]);

  const handleRemove = useCallback(async (storyId: string) => {
    // Optimistic remove + rollback nếu BE fail.
    // Trước đây: xóa local ngay rồi gọi BE silently — nếu BE fail, user
    // thấy đã xóa nhưng refresh lại thì entry xuất hiện lại.
    const previous = entries;
    setEntries((current) => current.filter((entry) => entry.id !== storyId));
    const ok = await removeHistoryEntry(storyId);
    if (!ok) {
      setEntries(previous);
      Alert.alert('Lỗi', 'Không thể xóa truyện khỏi lịch sử. Vui lòng thử lại.');
    }
  }, [entries]);

  const renderItem: ListRenderItem<ReadingHistoryEntry> = useCallback(
    ({ item }) => (
      <HistoryStoryRow entry={item} onPress={handleStoryPress} onRemove={handleRemove} />
    ),
    [handleStoryPress, handleRemove],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(entries.length / HISTORY_PAGE_SIZE)),
    [entries.length],
  );

  const pagedEntries = useMemo(
    () => entries.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE),
    [entries, page],
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="time-outline" size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có lịch sử đọc</Text>
        <Text style={styles.emptySubtitle}>
          Các truyện bạn mở sẽ được lưu tại đây để xem lại nhanh hơn.
        </Text>
      </View>
    );
  }, [loading]);

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
          <GlassIconButton
            icon="chevron-back"
            size={40}
            tint="light"
            onPress={handleBack}
          />

          <View style={styles.headerText}>
            <Text style={styles.title}>Lịch sử đọc</Text>
            {!loading && entries.length > 0 ? (
              <Text style={styles.subtitle}>{entries.length} truyện</Text>
            ) : (
              <Text style={styles.subtitle}>Truyện đã đọc gần đây</Text>
            )}
          </View>

          <GlassIconButton
            icon="trash-outline"
            size={40}
            tint={entries.length === 0 ? 'light' : 'accent'}
            onPress={handleClearAll}
            disabled={entries.length === 0}
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <GlassSkeleton width={180} height={18} />
            <View style={{ height: spacing.md }} />
            <GlassSkeleton width={240} height={14} />
          </View>
        ) : (
          <FlatList
            data={pagedEntries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.listContent,
              entries.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadHistory(true)}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          />
        )}

        {!loading && entries.length > 0 ? (
          <View style={styles.paginationRow}>
            <Pressable
              onPress={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              style={({ pressed }) => [
                styles.pageArrowButton,
                page === 1 && styles.pageArrowDisabled,
                pressed && page > 1 && styles.pressed,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={page === 1 ? colors.textMuted : colors.textPrimary}
              />
            </Pressable>
            <Text style={styles.pageInfo}>{page}/{totalPages}</Text>
            <Pressable
              onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              style={({ pressed }) => [
                styles.pageArrowButton,
                page === totalPages && styles.pageArrowDisabled,
                pressed && page < totalPages && styles.pressed,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={page === totalPages ? colors.textMuted : colors.textPrimary}
              />
            </Pressable>
          </View>
        ) : null}

        {loginPromptModal}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamilyMedium,
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
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pageArrowButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrowDisabled: {
    opacity: 0.5,
  },
  pageInfo: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    minWidth: 36,
    textAlign: 'center',
  },
});

export default ReadingHistoryScreen;
