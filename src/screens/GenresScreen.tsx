import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { GenreListItem } from '../components/genres/GenreListItem';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { fetchGenres } from '../services/genreService';
import { Genre } from '../types/genre';
import { colors, spacing } from '../theme/colors';

export function GenresScreen() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
  } = useMainTabNavigation('genres');

  const loadGenres = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchGenres();
      setGenres(data);
    } catch {
      setError('Không tải được danh sách thể loại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  const handleGenrePress = useCallback((genre: Genre) => {
    // TODO: router.push(`/genre/${genre.id}?name=${encodeURIComponent(genre.name)}`)
    console.log('[Navigation] Mở thể loại:', genre.name);
  }, []);

  const renderItem: ListRenderItem<Genre> = useCallback(
    ({ item, index }) => (
      <GenreListItem
        genre={item}
        onPress={handleGenrePress}
        showDivider={index < genres.length - 1}
      />
    ),
    [genres.length, handleGenrePress],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Thể loại</Text>
        <Pressable
          onPress={loadGenres}
          hitSlop={8}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadGenres} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={genres}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomTabBar activeTab="genres" onTabPress={handleTabPress} />

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
  },
  retryText: {
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
