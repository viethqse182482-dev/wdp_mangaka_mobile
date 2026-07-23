import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Story } from '../../types/story';
import { StoryGridCard } from '../home/StoryGridCard';
import { colors, radius, spacing } from '../../theme/colors';

export type AuthorSeriesFilter = 'all' | 'ongoing' | 'completed' | 'hiatus' | 'dropped';

interface AuthorSeriesGridProps {
  series: Story[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  activeFilter: AuthorSeriesFilter;
  onFilterChange: (filter: AuthorSeriesFilter) => void;
  onStoryPress: (id: string) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
}

const FILTER_TABS: { key: AuthorSeriesFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ongoing', label: 'Đang ra' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'hiatus', label: 'Tạm ngưng' },
];

const GRID_COLUMNS = 2;
const GRID_GAP = spacing.sm;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

function SeriesEmpty({ filterLabel }: { filterLabel: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="book-outline" size={32} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Không có truyện</Text>
      <Text style={styles.emptySubtitle}>
        Tác giả chưa có truyện {filterLabel !== 'Tất cả' ? `(${filterLabel})` : ''}.
      </Text>
    </View>
  );
}

export function AuthorSeriesGrid({
  series,
  loading,
  refreshing,
  hasMore,
  activeFilter,
  onFilterChange,
  onStoryPress,
  onRefresh,
  onLoadMore,
}: AuthorSeriesGridProps) {
  const activeLabel = FILTER_TABS.find((t) => t.key === activeFilter)?.label ?? 'Tất cả';

  const renderItem: ListRenderItem<Story> = useCallback(
    ({ item }) => (
      <StoryGridCard story={item} width={GRID_ITEM_WIDTH} onPress={onStoryPress} />
    ),
    [onStoryPress],
  );

  const keyExtractor = useCallback((item: Story) => item.id, []);

  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

  const ListFooter = useCallback(() => {
    if (!loading || series.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }, [loading, series.length]);

  const ListEmpty = useCallback(() => {
    if (loading) return null;
    return <SeriesEmpty filterLabel={activeLabel} />;
  }, [loading, activeLabel]);

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onFilterChange(tab.key)}
              style={({ pressed }) => [styles.tab, isActive && styles.tabActive, pressed && styles.pressed]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Grid */}
      <FlatList
        data={series}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          series.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onEndReached={hasMore && !loading ? onLoadMore : undefined}
        onEndReachedThreshold={0.4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accent,
  },
  columnWrapper: {
    paddingHorizontal: spacing.lg,
    gap: GRID_GAP,
  },
  separator: {
    height: GRID_GAP,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
