import { apiGet } from './apiClient';
import { getAuthToken } from './authService';
import { UserRole } from '../types/auth';

export interface RoleProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  avatarUrl: string;
  coverImageUrl: string;
  bio: string;
  joinedAt?: string;
  stats: Array<{ label: string; value: number | string }>;
  socialLinks: { facebook: string; twitter: string; website: string };
  series: ProfileSeries[];
  earningsUnits?: number;
  availableUnits?: number;
  pendingUnits?: number;
}

export interface ProfileSeries {
  id: string;
  name: string;
  coverImageUrl: string;
  status: string;
  genres: string[];
  views: number;
  votes: number;
  score: number;
  chapterCount: number;
  creatorName?: string;
}

async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw new Error('Chưa đăng nhập');
  return token;
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const count = (value: unknown) => (typeof value === 'number' ? value : 0);

export async function fetchRoleProfile(role: UserRole): Promise<RoleProfile> {
  const token = await requireToken();

  if (role === 'Reader') {
    const response = await apiGet<{ success: boolean; data: Record<string, any> }>('/profile', { token });
    const user = response.data;
    return {
      id: text(user._id),
      username: text(user.username),
      fullName: text(user.full_name),
      email: text(user.email),
      phoneNumber: text(user.phoneNumber),
      role,
      avatarUrl: text(user.avatar_url),
      coverImageUrl: text(user.cover_image_url),
      bio: text(user.bio),
      stats: [],
      socialLinks: user.social_links ?? { facebook: '', twitter: '', website: '' },
      series: [],
    };
  }

  if (role === 'Admin') {
    const response = await apiGet<{ success: boolean; data: Record<string, any> }>('/admin/profile', { token });
    const user = response.data;
    return {
      id: text(user.id),
      username: '',
      fullName: text(user.name),
      email: text(user.email),
      phoneNumber: text(user.phoneNumber),
      role,
      avatarUrl: '',
      coverImageUrl: '',
      bio: '',
      joinedAt: text(user.createdAt),
      stats: [{ label: 'Trạng thái', value: text(user.status) || 'active' }],
      socialLinks: { facebook: '', twitter: '', website: '' },
      series: [],
    };
  }

  const path = role === 'Mangaka' ? '/mangaka/profile' : '/assistant/profile';
  const [response, genericProfile, walletResponse] = await Promise.all([
    apiGet<{
      success: boolean;
      data: { user: Record<string, any>; stats: Record<string, any>; series?: Record<string, any>[] };
    }>(path, { token }),
    apiGet<{ success: boolean; data: Record<string, any> }>('/profile', { token }),
    apiGet<{ success: boolean; data: Record<string, any> }>('/wallet', { token }),
  ]);
  const user = response.data.user;
  const generic = genericProfile.data;
  const wallet = walletResponse.data;
  const stats = response.data.stats ?? {};
  const series = (response.data.series ?? []).map((item): ProfileSeries => ({
    id: text(item.id ?? item._id),
    name: text(item.name),
    coverImageUrl: text(item.cover_image_url),
    status: text(item.status),
    genres: Array.isArray(item.genre) ? item.genre.filter((value): value is string => typeof value === 'string') : [],
    views: count(item.views_count),
    votes: count(item.total_votes),
    score: count(item.average_score),
    chapterCount: count(item.chapter_count ?? item.chaptersParticipated),
    creatorName: text(item.mangaka?.full_name ?? item.mangaka?.username),
  }));
  const roleStats = role === 'Mangaka'
    ? [
        { label: 'Bộ truyện', value: count(stats.total_series) },
        { label: 'Đã xuất bản', value: count(stats.published) },
        { label: 'Người theo dõi', value: count(stats.followers_count) },
      ]
    : [
        { label: 'Bộ truyện', value: count(stats.total_series ?? stats.totalSeries) },
        { label: 'Công việc', value: count(stats.total_tasks ?? stats.totalTasks) },
        { label: 'Đã duyệt', value: count(stats.approved_tasks ?? stats.approvedTasks) },
      ];

  return {
    id: text(user.id ?? user._id),
    username: text(user.username),
    fullName: text(user.full_name),
    email: text(user.email),
    phoneNumber: text(user.phoneNumber ?? generic.phoneNumber),
    role,
    avatarUrl: text(user.avatar_url),
    coverImageUrl: text(user.cover_image_url),
    bio: text(user.bio ?? generic.bio),
    joinedAt: text(user.joined_at ?? user.createdAt),
    stats: roleStats,
    socialLinks: user.social_links ?? generic.social_links ?? { facebook: '', twitter: '', website: '' },
    series,
    earningsUnits: count(wallet.total_revenue ?? stats.earnings),
    availableUnits: count(wallet.available_balance ?? stats.availableBalance ?? stats.availableEarnings),
    pendingUnits: count(wallet.pending_balance ?? stats.pendingBalance ?? stats.pendingEarnings),
  };
}

export interface AdminDashboardData {
  stats: { totalViews: number; totalReads: number; totalUsers: number; totalComments: number };
  viewsPerDay: Array<{ date: string; views: number }>;
  topManga: Array<{ id: string; title: string; views: number; thumbnail: string }>;
  recentActivity: Array<{ id: string; message: string; time: string }>;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: AdminDashboardData }>('/admin/dashboard', { token });
  return response.data;
}

export interface ChapterStatusDistribution {
  approved: number;
  pending: number;
  revision: number;
  total: number;
}

type ChapterCountResponse = {
  success: boolean;
  pagination: { total: number };
};

export async function fetchChapterStatusDistribution(): Promise<ChapterStatusDistribution> {
  const token = await requireToken();
  const countByStatus = async (status?: string) => {
    const response = await apiGet<ChapterCountResponse>('/admin/chapters-legacy', {
      token,
      params: { page: 1, limit: 1, status },
    });
    return count(response.pagination?.total);
  };

  const [total, approvedByEb, published, teRevision, ebRevision, revisionRequested] = await Promise.all([
    countByStatus(),
    countByStatus('approved_by_EB'),
    countByStatus('published'),
    countByStatus('TE_revision'),
    countByStatus('EB_revision'),
    countByStatus('revision_requested'),
  ]);
  const approved = approvedByEb + published;
  const revision = teRevision + ebRevision + revisionRequested;

  return {
    approved,
    revision,
    pending: Math.max(0, total - approved - revision),
    total,
  };
}

export interface AdminRankingItem {
  id: string;
  title: string;
  author: string;
  rank: number;
  views_count: number;
  views_total: number;
  votes_count: number;
  votes_total: number;
  average_score: number;
  cover_image_url: string;
}

export type AdminRankingType = 'views' | 'votes' | 'rating';
export type AdminRankingPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

export interface AdminRankingStats {
  views_today: { value: number; change: number };
  views_this_week: { value: number; change: number };
  votes_this_week: { value: number; change: number };
  active_series: { value: number };
}

export async function fetchAdminRankingStats(): Promise<AdminRankingStats> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: AdminRankingStats }>(
    '/admin/rankings/stats',
    { token },
  );
  return response.data;
}

export async function fetchAdminRankings(filters: {
  type: AdminRankingType;
  period: AdminRankingPeriod;
}): Promise<AdminRankingItem[]> {
  const token = await requireToken();
  const response = await apiGet<{
    success: boolean;
    data: { items: AdminRankingItem[]; total: number };
  }>('/admin/rankings/list', {
    token,
    params: { type: filters.type, period: filters.period, page: 1, limit: 50 },
  });
  return response.data.items;
}

export interface AdminFinanceAnalytics {
  filter: { period: 'month' | 'quarter' | 'year'; year: number; month?: number; quarter?: number };
  summary: {
    gross_revenue_coin: number;
    creator_revenue_coin: number;
    platform_fee_coin: number;
    platform_fee_vnd: number;
    chapters_sold: number;
  };
  points: Array<{ key: string; label: string; gross_revenue_coin: number; mangaka_revenue_coin: number; assistant_revenue_coin: number; platform_fee_coin: number; chapters_sold: number }>;
  top_series: Array<{
    series_id: string;
    series_name: string;
    cover_image_url: string;
    author: { full_name?: string; username?: string } | null;
    gross_revenue_coin: number;
    platform_fee_vnd: number;
    chapters_sold: number;
  }>;
}

export async function fetchAdminFinanceAnalytics(filter: {
  period: 'month' | 'quarter' | 'year';
  year: number;
  month?: number;
  quarter?: number;
}): Promise<AdminFinanceAnalytics> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: AdminFinanceAnalytics }>(
    '/admin/finance/revenue-analytics',
    { token, params: { ...filter, limit: 5 } },
  );
  return response.data;
}

export interface AdminFinanceSummary {
  total_circulation_coin: number;
  total_revenue_all_time_coin: number;
  total_withdrawn_vnd: number;
  pending_withdrawals: { count: number; coin: number };
  total_users_with_balance: number;
  coin_to_vnd_rate: number;
}

export async function fetchAdminFinance(): Promise<AdminFinanceSummary> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: AdminFinanceSummary }>(
    '/admin/finance/summary',
    { token },
  );
  return response.data;
}
