import { Ionicons } from '@expo/vector-icons';
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
import { colors, spacing } from '../theme/colors';

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
          await clearReadingHistory();
          setEntries([]);
        },
      },
    ]);
  }, [entries.length]);

  const handleStoryPress = useCallback((storyId: string) => {
    void openStory(storyId);
  }, [openStory]);

  const handleRemove = useCallback(async (storyId: string) => {
    await removeHistoryEntry(storyId);
    setEntries((current) => current.filter((entry) => entry.id !== storyId));
  }, []);

  const renderItem: ListRenderItem<ReadingHistoryEntry> = useCallback(
    ({ item }) => (
      <HistoryStoryRow entry={item} onPress={handleStoryPress} onRemove={handleRemove} />
    ),
    [handleStoryPress, handleRemove],
  );

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

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
    <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.title}>Lịch sử đọc</Text>
          {!loading && entries.length > 0 ? (
            <Text style={styles.subtitle}>{entries.length} truyện</Text>
          ) : (
            <Text style={styles.subtitle}>Truyện đã đọc gần đây</Text>
          )}
        </View>

        <Pressable
          onPress={handleClearAll}
          hitSlop={8}
          disabled={entries.length === 0}
          style={({ pressed }) => [
            styles.clearButton,
            entries.length === 0 && styles.clearButtonDisabled,
            pressed && entries.length > 0 && styles.pressed,
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={entries.length === 0 ? colors.textMuted : colors.textPrimary}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={pagedEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonDisabled: {
    opacity: 0.5,
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
  pressed: {
    opacity: 0.7,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pageArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrowDisabled: {
    opacity: 0.5,
  },
});
