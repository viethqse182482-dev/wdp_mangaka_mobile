import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { AdminTabBar } from '../components/role/AdminTabBar';
import { RolePage } from '../components/role/RolePage';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { useAuth } from '../context/AuthContext';
import { fetchRoleProfile, RoleProfile } from '../services/roleService';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GradientButton } from '../theme/uiPrimitives';
import { formatCoinUnits } from '../utils/coinUnit';

const ROLE_LABEL = {
  Reader: 'Độc giả', Assistant: 'Trợ lý', Mangaka: 'Tác giả', Admin: 'Quản trị viên',
} as const;

export function RoleProfileScreen() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [profile, setProfile] = useState<RoleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioExpanded, setPortfolioExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchRoleProfile(user.role));
      setPortfolioExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && !user) router.replace('/login');
    else if (user) void load();
  }, [load, ready, router, user]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout, router]);

  const footer = user?.role === 'Admin'
    ? <AdminTabBar active="profile" />
    : user?.role === 'Reader'
      ? <BottomTabBar activeTab="profile" onTabPress={(tab) => {
          if (tab === 'home') router.replace('/');
          else if (tab === 'ranking') router.replace('/ranking');
          else if (tab === 'genres') router.replace('/genres');
          else if (tab === 'library') router.replace('/library');
        }} />
      : undefined;
  const visibleSeries = profile?.series
    ? portfolioExpanded ? profile.series : profile.series.slice(0, 3)
    : [];

  return (
    <RolePage title="Hồ sơ của tôi" subtitle={user ? ROLE_LABEL[user.role] : undefined} loading={loading} error={error} onRefresh={load} footer={footer}>
      {profile ? (
        <>
          <GlassCard depth={3} glow style={styles.hero} innerStyle={styles.heroInner}>
            {profile.coverImageUrl ? <Image source={{ uri: profile.coverImageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" /> : null}
            {profile.coverImageUrl ? <View style={styles.coverOverlay} /> : null}
            <View style={styles.avatar}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.initial}>{(profile.fullName || profile.username || 'U').charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.name}>{profile.fullName || profile.username}</Text>
            {profile.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
            <View style={styles.badge}><Text style={styles.badgeText}>{ROLE_LABEL[profile.role]}</Text></View>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </GlassCard>

          {profile.stats.length ? (
            <View style={styles.stats}>
              {profile.stats.map((item) => (
                <GlassCard key={item.label} style={styles.statCard} innerStyle={styles.statInner}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </GlassCard>
              ))}
            </View>
          ) : null}

          {(profile.role === 'Mangaka' || profile.role === 'Assistant') && profile.earningsUnits !== undefined ? (
            <GlassCard innerStyle={styles.earningsCard}>
              <View><Text style={styles.earningsLabel}>Tổng doanh thu tích lũy</Text><Text style={styles.earningsValue}>{formatCoinUnits(profile.earningsUnits)} <Text style={styles.earningsCoin}>Coin</Text></Text></View>
              <View style={styles.earningsSide}><Text style={styles.earningsSideLabel}>Khả dụng</Text><Text style={styles.availableValue}>{formatCoinUnits(profile.availableUnits)} Coin</Text><Text style={styles.earningsSideLabel}>Đang chờ</Text><Text style={styles.pendingValue}>{formatCoinUnits(profile.pendingUnits)} Coin</Text></View>
            </GlassCard>
          ) : null}

          <GlassCard innerStyle={styles.details}>
            <InfoRow icon="mail-outline" label="Email" value={profile.email || 'Chưa cập nhật'} />
            <InfoRow icon="call-outline" label="Số điện thoại" value={profile.phoneNumber || 'Chưa cập nhật'} />
            {profile.joinedAt ? <InfoRow icon="calendar-outline" label="Tham gia" value={new Date(profile.joinedAt).toLocaleDateString('vi-VN')} /> : null}
          </GlassCard>

          {Object.values(profile.socialLinks).some(Boolean) ? (
            <GlassCard innerStyle={styles.socialCard}>
              <Text style={styles.cardTitle}>Kết nối</Text>
              <View style={styles.socials}>
                {profile.socialLinks.facebook ? <SocialLink icon="logo-facebook" label="Facebook" url={profile.socialLinks.facebook} /> : null}
                {profile.socialLinks.twitter ? <SocialLink icon="logo-twitter" label="Twitter" url={profile.socialLinks.twitter} /> : null}
                {profile.socialLinks.website ? <SocialLink icon="globe-outline" label="Website" url={profile.socialLinks.website} /> : null}
              </View>
            </GlassCard>
          ) : null}

          {profile.role === 'Mangaka' || profile.role === 'Assistant' ? (
            <GlassCard innerStyle={styles.actions}>
              <Shortcut icon="wallet-outline" label="Ví doanh thu" onPress={() => router.push('/creator-wallet' as never)} />
            </GlassCard>
          ) : null}

          {(profile.role === 'Mangaka' || profile.role === 'Assistant') ? (
            <>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.cardTitle}>{profile.role === 'Mangaka' ? 'Tác phẩm của tôi' : 'Dự án đã tham gia'}</Text>
                  <Text style={styles.sectionCount}>{profile.series.length} bộ truyện</Text>
                </View>
                {profile.series.length > 3 ? (
                  <Pressable style={styles.expandButton} onPress={() => setPortfolioExpanded((value) => !value)}>
                    <Text style={styles.expandText}>{portfolioExpanded ? 'Thu gọn' : 'Xem thêm'}</Text>
                    <Ionicons name={portfolioExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.accentLight} />
                  </Pressable>
                ) : null}
              </View>
              <GlassCard innerStyle={styles.seriesList}>
                {profile.series.length ? visibleSeries.map((item) => (
                  <View key={item.id} style={styles.seriesRow}>
                    <View style={styles.seriesCover}>{item.coverImageUrl ? <Image source={{ uri: item.coverImageUrl }} style={styles.seriesCoverImage} contentFit="cover" /> : <Ionicons name="book-outline" size={22} color={colors.textMuted} />}</View>
                    <View style={styles.seriesInfo}><Text style={styles.seriesName} numberOfLines={2}>{item.name}</Text>{item.creatorName ? <Text style={styles.seriesCreator} numberOfLines={1}>Tác giả: {item.creatorName}</Text> : null}<View style={styles.seriesMeta}><Text style={styles.seriesMetaText}>{item.chapterCount} chương</Text><Text style={styles.seriesMetaText}>{item.views.toLocaleString('vi-VN')} lượt xem</Text><Text style={styles.seriesMetaText}>★ {item.score.toFixed(1)}</Text></View>{item.genres.length ? <Text style={styles.genreText} numberOfLines={1}>{item.genres.slice(0, 3).join(' · ')}</Text> : null}</View>
                    <View style={[styles.seriesStatus, item.status === 'published' ? styles.published : styles.draft]}><Text style={styles.seriesStatusText}>{item.status === 'published' ? 'Đã đăng' : item.status || 'Bản nháp'}</Text></View>
                  </View>
                )) : <View style={styles.seriesEmpty}><Ionicons name="albums-outline" size={30} color={colors.textMuted} /><Text style={styles.seriesEmptyText}>Chưa có bộ truyện nào để hiển thị.</Text></View>}
              </GlassCard>
            </>
          ) : null}

          {profile.role === 'Reader' ? (
            <GlassCard innerStyle={styles.actions}>
              <Shortcut icon="wallet-outline" label="Ví Coin" onPress={() => router.push('/wallet')} />
              <Shortcut icon="bookmarks-outline" label="Tủ truyện" onPress={() => router.push('/library')} />
              <Shortcut icon="time-outline" label="Lịch sử đọc" onPress={() => router.push('/history')} />
              <Shortcut icon="notifications-outline" label="Thông báo" onPress={() => router.push('/notifications')} />
            </GlassCard>
          ) : null}

          <GradientButton label="Đăng xuất" icon="log-out-outline" variant="secondary" fullWidth onPress={handleLogout} />
        </>
      ) : null}
    </RolePage>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.row}><Ionicons name={icon} size={20} color={colors.accentLight} /><View style={{ flex: 1 }}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View></View>;
}

function Shortcut({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable style={styles.shortcut} onPress={onPress}><Ionicons name={icon} size={22} color={colors.cyan} /><Text style={styles.shortcutText}>{label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>;
}

function SocialLink({ icon, label, url }: { icon: keyof typeof Ionicons.glyphMap; label: string; url: string }) {
  const open = () => {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    void Linking.openURL(normalized);
  };
  return <Pressable style={styles.socialLink} onPress={open}><Ionicons name={icon} size={18} color={colors.cyan} /><Text style={styles.socialLabel}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, overflow: 'hidden' }, heroInner: { alignItems: 'center', padding: spacing.xxl, minHeight: 260, justifyContent: 'center' }, coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,26,0.72)' },
  avatar: { width: 92, height: 92, borderRadius: 46, overflow: 'hidden', backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarImage: { width: '100%', height: '100%' }, initial: { color: colors.white, fontSize: 36, fontFamily: typography.fontFamilyBold },
  name: { color: colors.textPrimary, fontSize: 22, fontFamily: typography.fontFamilyBold }, username: { color: colors.textSecondary, marginTop: 3 },
  badge: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, marginTop: spacing.sm },
  badgeText: { color: colors.accentLight, fontSize: 12, fontFamily: typography.fontFamilyBold }, bio: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: spacing.sm }, statCard: { flex: 1 }, statInner: { alignItems: 'center', padding: spacing.md },
  statValue: { color: colors.textPrimary, fontSize: 20, fontFamily: typography.fontFamilyBold }, statLabel: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  details: { padding: spacing.lg, gap: spacing.lg }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, rowLabel: { color: colors.textMuted, fontSize: 11 }, rowValue: { color: colors.textPrimary, fontSize: 15, marginTop: 2 },
  actions: { padding: spacing.sm }, shortcut: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }, shortcutText: { flex: 1, color: colors.textPrimary, fontFamily: typography.fontFamilyMedium },
  earningsCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg }, earningsLabel: { color: colors.textMuted, fontSize: 11 }, earningsValue: { color: colors.textPrimary, fontSize: 25, fontFamily: typography.fontFamilyBold, marginTop: 5 }, earningsCoin: { color: colors.cyan, fontSize: 14 }, earningsSide: { alignItems: 'flex-end', gap: 3 }, earningsSideLabel: { color: colors.textMuted, fontSize: 9 }, availableValue: { color: colors.success, fontFamily: typography.fontFamilyBold, fontSize: 12 }, pendingValue: { color: colors.warning, fontFamily: typography.fontFamilyBold, fontSize: 12 },
  socialCard: { padding: spacing.lg }, cardTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: typography.fontFamilyBold }, socials: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }, socialLink: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.accentSoft }, socialLabel: { color: colors.accentLight, fontSize: 12, fontFamily: typography.fontFamilyMedium },
  expandButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.accentSoft }, expandText: { color: colors.accentLight, fontSize: 11, fontFamily: typography.fontFamilyBold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }, sectionCount: { color: colors.textMuted, fontSize: 11 }, seriesList: { padding: spacing.md }, seriesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder }, seriesCover: { width: 58, height: 78, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.glassMedium, alignItems: 'center', justifyContent: 'center' }, seriesCoverImage: { width: '100%', height: '100%' }, seriesInfo: { flex: 1 }, seriesName: { color: colors.textPrimary, fontSize: 14, fontFamily: typography.fontFamilyBold }, seriesCreator: { color: colors.textSecondary, fontSize: 10, marginTop: 3 }, seriesMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 }, seriesMetaText: { color: colors.textMuted, fontSize: 9 }, genreText: { color: colors.accentLight, fontSize: 9, marginTop: 5 }, seriesStatus: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 4 }, published: { backgroundColor: colors.successSoft }, draft: { backgroundColor: colors.warningSoft }, seriesStatusText: { color: colors.textSecondary, fontSize: 8, fontFamily: typography.fontFamilyBold }, seriesEmpty: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl }, seriesEmptyText: { color: colors.textMuted, fontSize: 11 },
});
