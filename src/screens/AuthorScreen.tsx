import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthorHeader } from '../components/author/AuthorHeader';
import { AuthorBio } from '../components/author/AuthorBio';
import { AuthorStatsBar } from '../components/author/AuthorStatsBar';
import {
  AuthorSeriesFilter,
  AuthorSeriesGrid,
} from '../components/author/AuthorSeriesGrid';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import {
  AuthorProfile,
  AuthorSeriesParams,
  fetchAuthorProfile,
  fetchAuthorSeries,
} from '../services/authorService';
import { AuthorSeriesResult } from '../services/authorService';
import { colors, spacing } from '../theme/colors';

const PAGE_SIZE = 20;

export function AuthorScreen() {
  const router = useRouter();
  const { authorId } = useLocalSearchParams<{ authorId: string }>();

  const { openStory, loginPromptModal: storyLoginModal } = useStoryNavigation();
  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal: tabLoginPromptModal,
  } = useMainTabNavigation('library');

  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [seriesResult, setSeriesResult] = useState<AuthorSeriesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AuthorSeriesFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadProfile = useCallback(async () => {
    if (!authorId) return;
    try {
      const data = await fetchAuthorProfile(authorId);
      setProfile(data);
      setProfileError(false);
    } catch {
      setProfileError(true);
    }
  }, [authorId]);

  const loadSeries = useCallback(
    async (opts: { page?: number; filter?: AuthorSeriesFilter; refresh?: boolean } = {}) => {
      if (!authorId) return;
      const { page: p = 1, filter = activeFilter, refresh = false } = opts;

      if (refresh) {
        setRefreshing(true);
      } else if (p === 1) {
        setLoadingSeries(true);
      }

      try {
        const params: AuthorSeriesParams = {
          page: p,
          limit: PAGE_SIZE,
          sort: 'updatedAt',
        };

        if (filter !== 'all') {
          params.publication_status = filter;
        }

        const result = await fetchAuthorSeries(authorId, params);

        if (p === 1) {
          setSeriesResult(result);
        } else {
          setSeriesResult((prev) =>
            prev
              ? {
                  ...result,
                  stories: [...prev.stories, ...result.stories],
                }
              : result,
          );
        }

        setHasMore(result.stories.length >= PAGE_SIZE);
        setPage(p);
      } catch {
        // series load error — silently keep existing data
      } finally {
        setLoadingSeries(false);
        setRefreshing(false);
      }
    },
    [authorId, activeFilter],
  );

  // Initial load
  useEffect(() => {
    if (!authorId) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setProfileError(false);
      await loadProfile();
      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [authorId, loadProfile]);

  // Load series after profile loaded
  useEffect(() => {
    if (!profile || !authorId) return;
    let mounted = true;
    void loadSeries({ page: 1 });

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?._id, activeFilter]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadProfile(), loadSeries({ page: 1, refresh: true })]);
  }, [loadProfile, loadSeries]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingSeries) return;
    void loadSeries({ page: page + 1 });
  }, [hasMore, loadingSeries, page, loadSeries]);

  const handleFilterChange = useCallback((filter: AuthorSeriesFilter) => {
    setActiveFilter(filter);
    setHasMore(false);
  }, []);

  const handleStoryPress = useCallback(
    (storyId: string) => {
      void openStory(storyId);
    },
    [openStory],
  );

  const handleLoginRequired = useCallback(() => {
    setShowLoginModal(true);
  }, []);

  const handleLoginFromModal = useCallback(() => {
    const redirect = authorId ? `/author/${authorId}` : undefined;
    setShowLoginModal(false);
    if (redirect) {
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [authorId, router]);

  const handleCloseLoginModal = useCallback(() => {
    setShowLoginModal(false);
    router.back();
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error / Not found ──────────────────────────────────────────────────────
  if (profileError || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Không tìm thấy tác giả</Text>
          <Text style={styles.errorSubtitle}>
            Tác giả này không tồn tại hoặc đã bị khóa.
          </Text>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={16} color={colors.accent} />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {profile.full_name || profile.username || 'Tác giả'}
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AuthorHeader profile={profile} onLoginRequired={handleLoginRequired} />
        <AuthorBio bio={profile.bio} socialLinks={profile.social_links} />
        <AuthorStatsBar stats={profile.stats} />
        <AuthorSeriesGrid
          series={seriesResult?.stories ?? []}
          loading={loadingSeries}
          refreshing={refreshing}
          hasMore={hasMore}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onStoryPress={handleStoryPress}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
        />
      </ScrollView>

      <BottomTabBar activeTab="library" onTabPress={handleTabPress} />

      <AccountDrawer
        visible={accountDrawerVisible}
        onClose={() => setAccountDrawerVisible(false)}
        onMenuPress={handleAccountMenuPress}
      />

      <LoginRequiredModal
        visible={showLoginModal}
        onClose={handleCloseLoginModal}
        onLogin={handleLoginFromModal}
      />
      {storyLoginModal}
      {tabLoginPromptModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  topBarSpacer: {
    width: 36,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: spacing.md,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default AuthorScreen;
