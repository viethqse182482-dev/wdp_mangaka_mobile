/**
 * AuthorScreen — trang tác giả với header glass + FlatList grid các series.
 *
 *  - Avatar ring glow accent.
 *  - 3 stat card glass.
 *  - Follow button gradient.
 *  - Series row glass card.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { AuthorProfile, fetchAuthorProfile, fetchAuthorSeries } from '../services/authorService';
import { ApiError } from '../services/apiClient';
import {
  followAuthor,
  getFollowAuthorStatus,
  unfollowAuthor,
} from '../services/followAuthorService';
import { Story } from '../types/story';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GlassIconButton, GradientButton, Tag } from '../theme/uiPrimitives';
import { formatCompactNumber } from '../utils/formatNumber';

interface AuthorSeriesResult {
  stories: Story[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export function AuthorScreen() {
  const { authorId } = useLocalSearchParams<{ authorId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openStory } = useStoryNavigation();

  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [seriesResult, setSeriesResult] = useState<AuthorSeriesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  // Local override của `profile.stats.total_followers` để phản hồi tức thì
  // khi user bấm follow/unfollow. Nếu BE fail → rollback về giá trị cũ.
  // Sync lại mỗi khi `profile` thay đổi (refresh / load mới) để giữ
  // single source of truth là server.
  const [followerOverride, setFollowerOverride] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    if (!authorId) return;
    try {
      const [profileData, followStatus] = await Promise.all([
        fetchAuthorProfile(authorId),
        getFollowAuthorStatus(authorId).catch(() => false),
      ]);
      setProfile(profileData);
      setIsFollowing(followStatus);
    } catch (error) {
      console.error('Failed to load author profile:', error);
    }
  }, [authorId]);

  const loadSeries = useCallback(async (page = 1) => {
    if (!authorId) return;
    try {
      const result = await fetchAuthorSeries(authorId, { page, limit: 20 });
      if (page === 1) {
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
    } catch (error) {
      console.error('Failed to load author series:', error);
    }
  }, [authorId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadSeries(1)]);
    setLoading(false);
  }, [loadProfile, loadSeries]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Reset followerOverride khi profile mới được fetch từ server (refresh /
  // focus) — đảm bảo single source of truth là server, override chỉ tồn
  // tại trong phiên tương tác follow/unfollow hiện tại.
  useEffect(() => {
    setFollowerOverride(null);
  }, [profile?.stats.total_followers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleLoadMore = useCallback(async () => {
    if (!seriesResult || loadingMore) return;
    const { pagination } = seriesResult;
    if (pagination.page >= pagination.total) return;
    setLoadingMore(true);
    await loadSeries(pagination.page + 1);
    setLoadingMore(false);
  }, [seriesResult, loadingMore, loadSeries]);

  const handleFollow = useCallback(async () => {
    if (!authorId) return;
    if (followLoading) return;

    setFollowLoading(true);
    // Snapshot để rollback nếu BE fail (auth lỗi 401, network lỗi, BE 5xx...).
    const previousFollowing = isFollowing;
    const previousFollowers = followerOverride ?? profile?.stats.total_followers ?? 0;
    const nextFollowing = !previousFollowing;
    const optimisticDelta = nextFollowing ? 1 : -1;

    // Optimistic update UI ngay — cả `isFollowing` lẫn `followerOverride`.
    setIsFollowing(nextFollowing);
    setFollowerOverride(previousFollowers + optimisticDelta);

    try {
      if (nextFollowing) {
        await followAuthor(authorId);
      } else {
        await unfollowAuthor(authorId);
      }
      // Thành công: giữ nguyên override. Có thể re-fetch profile để lấy
      // `total_followers` chính xác từ server (tránh lệch nếu có concurrent
      // follow/unfollow từ session khác).
    } catch (error: unknown) {
      // Rollback toàn bộ state về snapshot.
      setIsFollowing(previousFollowing);
      setFollowerOverride(previousFollowers);
      if (error instanceof ApiError && error.status === 401) {
        setLoginModalVisible(true);
      } else {
        // Báo lỗi nhẹ (silent fail cũ hơn — user không biết tại sao số không đổi).
        const msg = error instanceof Error ? error.message : 'Vui lòng thử lại.';
        Alert.alert('Không thể cập nhật', msg);
      }
    } finally {
      setFollowLoading(false);
    }
  }, [authorId, followLoading, isFollowing, followerOverride, profile?.stats.total_followers]);

  const handleSeriesPress = useCallback(
    (series: Story) => {
      void openStory(series.id);
    },
    [openStory],
  );

  const renderSeriesItem: ListRenderItem<Story> = useCallback(
    ({ item }) => (
      <SeriesCard series={item} onPress={() => handleSeriesPress(item)} />
    ),
    [handleSeriesPress],
  );

  const renderSeriesSeparator = useCallback(() => <View style={styles.seriesSeparator} />, []);

  const renderSeriesFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.seriesFooter}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }, [loadingMore]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient
          colors={colors.gradBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={colors.accentLight} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient
          colors={colors.gradBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>Không tìm thấy tác giả</Text>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[styles.glowA, { top: -60, right: -80 }]} />
      <View pointerEvents="none" style={[styles.glowB, { top: 120, left: -100 }]} />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <GlassIconButton
          icon="chevron-back"
          size={40}
          tint="light"
          onPress={handleBack}
        />
        <Text style={styles.headerTitle}>Tác Giả</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={seriesResult?.stories ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderSeriesItem}
        ItemSeparatorComponent={renderSeriesSeparator}
        ListHeaderComponent={
          <AuthorHeader
            profile={profile}
            isFollowing={isFollowing}
            followLoading={followLoading}
            displayFollowers={
              followerOverride ?? profile.stats.total_followers
            }
            onFollow={handleFollow}
          />
        }
        ListFooterComponent={renderSeriesFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptySeries}>
              <Text style={styles.emptyText}>Tác giả chưa có truyện nào</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <LoginRequiredModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLogin={() => {
          setLoginModalVisible(false);
          router.push('/login');
        }}
      />
    </View>
  );
}

// (no-op)

interface AuthorHeaderProps {
  profile: AuthorProfile;
  isFollowing: boolean;
  followLoading: boolean;
  displayFollowers: number;
  onFollow: () => void;
}

function AuthorHeader({
  profile,
  isFollowing,
  followLoading,
  displayFollowers,
  onFollow,
}: AuthorHeaderProps) {
  return (
    <View style={styles.authorHeader}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} transition={250} />
        ) : (
          <LinearGradient
            colors={colors.gradPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarInitial}>
              {profile.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
            </Text>
          </LinearGradient>
        )}
      </View>

      <Text style={styles.authorName}>{profile.full_name || profile.username}</Text>
      {profile.username && profile.full_name !== profile.username && (
        <Text style={styles.authorUsername}>@{profile.username}</Text>
      )}

      {profile.bio ? <Text style={styles.authorBio}>{profile.bio}</Text> : null}

      <View style={styles.statsContainer}>
        <StatItem
          icon="book-outline"
          value={formatCompactNumber(profile.stats.total_series)}
          label="Truyện"
          accent={colors.accentLight}
        />
        <StatItem
          icon="eye-outline"
          value={formatCompactNumber(displayFollowers)}
          label="Followers"
          accent={colors.cyan}
        />
        <StatItem
          icon="star-outline"
          value={profile.stats.average_rating?.toFixed(1) ?? '0.0'}
          label="Điểm TB"
          accent={colors.warning}
        />
      </View>

      <GradientButton
        label={isFollowing ? 'Đang Follow' : 'Follow'}
        icon={isFollowing ? 'checkmark-circle' : 'add'}
        onPress={onFollow}
        loading={followLoading}
        variant={isFollowing ? 'secondary' : 'primary'}
        size="md"
        glow={!isFollowing}
        style={{ minWidth: 200, marginBottom: spacing.lg }}
      />

      <View style={styles.seriesHeader}>
        <Text style={styles.seriesTitle}>
          Truyện đã đăng ({profile.stats.total_series})
        </Text>
      </View>
    </View>
  );
}

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  accent: string;
}

function StatItem({ icon, value, label, accent }: StatItemProps) {
  return (
    <GlassCard
      tint="dark"
      depth={1}
      style={styles.statCard}
      innerStyle={styles.statCardInner}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

interface SeriesCardProps {
  series: Story;
  onPress: () => void;
}

function SeriesCard({ series, onPress }: SeriesCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}
    >
      <GlassCard
        tint="dark"
        depth={1}
        style={styles.card}
        innerStyle={styles.cardInner}
      >
        {series.coverUrl ? (
          <Image source={{ uri: series.coverUrl }} style={styles.cardCover} transition={250} />
        ) : (
          <View style={styles.cardCoverPlaceholder}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {series.title}
          </Text>
          {series.genres && series.genres.length > 0 && (
            <View style={styles.cardGenreRow}>
              {series.genres.slice(0, 2).map((g, i) => (
                <Tag key={i} label={g} variant="default" size="sm" />
              ))}
            </View>
          )}
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Ionicons name="eye-outline" size={12} color={colors.cyan} />
              <Text style={styles.cardStatText}>{formatCompactNumber(series.views)}</Text>
            </View>
            {series.rating && series.rating > 0 ? (
              <View style={styles.cardStat}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.cardStatText}>{series.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            <View style={styles.cardStat}>
              <Ionicons name="book-outline" size={12} color={colors.accentLight} />
              <Text style={styles.cardStatText}>
                {series.latestChapter > 0 ? `Chương ${series.latestChapter}` : 'Mới'}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowA: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.accent,
    opacity: 0.18,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 100,
  },
  glowB: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.cyan,
    opacity: 0.12,
    shadowColor: colors.cyan,
    shadowOpacity: 0.6,
    shadowRadius: 100,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  authorHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 36,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  authorName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  authorUsername: {
    color: colors.cyan,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  authorBio: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
  },
  statCardInner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
  },
  seriesHeader: {
    width: '100%',
    paddingTop: spacing.md,
  },
  seriesTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  seriesSeparator: {
    height: spacing.xs,
  },
  seriesFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptySeries: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: typography.fontFamilyMedium,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  cardCover: {
    width: 64,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  cardCoverPlaceholder: {
    width: 64,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardGenreRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  cardStats: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
});

export default AuthorScreen;
