import { apiGet } from './apiClient';
import { getAuthToken } from './authService';
import { Story } from '../types/story';

export interface AuthorSocialLinks {
  facebook?: string;
  twitter?: string;
  website?: string;
}

export interface AuthorStats {
  total_series: number;
  total_chapters: number;
  total_followers: number;
  average_rating: number;
}

export interface AuthorProfile {
  _id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  social_links?: AuthorSocialLinks;
  joined_at?: string;
  stats: AuthorStats;
  /** Có thể undefined nếu user là Mangaka/Editor/... chứ không phải Reader */
  isFollowing?: boolean;
}

interface BeAuthorProfileResponse {
  success: boolean;
  data: AuthorProfile;
}

interface AuthorSeriesItem {
  _id: string;
  name: string;
  cover_image_url?: string;
  genre?: string[];
  synopsis?: string;
  average_score?: number;
  total_votes?: number;
  views_count?: number;
  publication_status?: string;
  total_chapters: number;
  latest_chapter_number: number | null;
  updatedAt?: string;
  author_id?: {
    _id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface BeAuthorSeriesResponse {
  success: boolean;
  data: AuthorSeriesItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface BeAuthorFollowersCountResponse {
  success: boolean;
  data: {
    author_id: string;
    followers_count: number;
  };
}

async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw 'UNAUTHENTICATED';
  return token;
}

function relativeTimeFromIso(iso?: string | null): string {
  if (!iso) return 'Mới cập nhật';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Mới cập nhật';
  const diff = Date.now() - d.getTime();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  if (diff < hourMs) return 'Vừa xong';
  const hours = Math.floor(diff / hourMs);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(diff / dayMs);
  if (days < 30) return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

function mapBeSeriesToStory(series: AuthorSeriesItem): Story {
  return {
    id: series._id,
    title: series.name,
    coverUrl: series.cover_image_url ?? '',
    latestChapter: series.latest_chapter_number ?? series.total_chapters ?? 0,
    updatedAt: relativeTimeFromIso(series.updatedAt),
    views: series.views_count ?? 0,
    genres: Array.isArray(series.genre) ? series.genre : [],
    rating: Number((series.average_score ?? 0).toFixed(1)),
    ratingCount: series.total_votes ?? 0,
  };
}

export interface AuthorSeriesParams {
  page?: number;
  limit?: number;
  sort?: 'updatedAt' | 'createdAt' | 'average_score' | 'chapter_count';
  publication_status?: 'ongoing' | 'completed' | 'hiatus' | 'dropped';
}

export interface AuthorSeriesResult {
  stories: Story[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function fetchAuthorProfile(authorId: string): Promise<AuthorProfile> {
  const token = await requireToken();
  const response = await apiGet<BeAuthorProfileResponse>(
    `/authors/${encodeURIComponent(authorId)}`,
    { token },
  );
  if (!response.success) {
    throw new Error('Không thể tải thông tin tác giả');
  }
  return response.data;
}

export async function fetchAuthorSeries(
  authorId: string,
  params: AuthorSeriesParams = {},
): Promise<AuthorSeriesResult> {
  const token = await requireToken();
  const requestParams: Record<string, string | number | undefined> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
  if (params.sort) requestParams.sort = params.sort;
  if (params.publication_status) requestParams.publication_status = params.publication_status;

  const response = await apiGet<BeAuthorSeriesResponse>(
    `/authors/${encodeURIComponent(authorId)}/series`,
    { token, params: requestParams },
  );
  if (!response.success) {
    throw new Error('Không thể tải danh sách truyện của tác giả');
  }
  return {
    stories: (response.data ?? []).map(mapBeSeriesToStory),
    pagination: response.pagination,
  };
}

export async function fetchAuthorFollowersCount(authorId: string): Promise<number> {
  const response = await apiGet<BeAuthorFollowersCountResponse>(
    `/authors/${encodeURIComponent(authorId)}/followers/count`,
    {},
  );
  return response.success ? response.data.followers_count : 0;
}
