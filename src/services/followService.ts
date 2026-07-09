import { apiGet, apiPost, apiDelete } from './apiClient';
import { getAuthToken } from './authService';
import { FeaturedStory } from '../types/story';

interface FollowResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    user_id: string;
    series_id: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface FollowStatusResponse {
  success: boolean;
  isFollowing: boolean;
}

interface FollowListResponse {
  success: boolean;
  data: (FeaturedStory & { followedAt: string })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function followSeries(seriesId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập để theo dõi truyện.');

  const response = await apiPost<FollowResponse>(`/follow/${seriesId}`, {}, { token });
  if (!response.success) {
    throw new Error(response.message || 'Theo dõi thất bại.');
  }
}

export async function unfollowSeries(seriesId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập để bỏ theo dõi truyện.');

  const response = await apiDelete<FollowResponse>(`/follow/${seriesId}`, { token });
  if (!response.success) {
    throw new Error(response.message || 'Bỏ theo dõi thất bại.');
  }
}

export async function checkFollowStatus(seriesId: string): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;

  try {
    const response = await apiGet<FollowStatusResponse>(`/follow/${seriesId}/status`, { token });
    return response.isFollowing;
  } catch {
    return false;
  }
}

export async function fetchFollowedSeries(page = 1, limit = 20): Promise<{
  data: (FeaturedStory & { followedAt: string })[];
  total: number;
}> {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập.');

  const response = await apiGet<FollowListResponse>('/follow/mine', {
    token,
    params: { page, limit },
  });

  return {
    data: response.data,
    total: response.pagination.total,
  };
}
