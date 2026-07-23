import { apiDelete, apiGet, apiPost } from './apiClient';
import { getAuthToken } from './authService';

export interface FollowedAuthor {
  _id: string;
  reader_id: string;
  author_id: {
    _id: string;
    username?: string;
    full_name?: string;
    fullName?: string;
    avatar_url?: string;
  };
  created_at: string;
  series_count?: number;
}

export interface FollowAuthorStatusResponse {
  success: boolean;
  isFollowing: boolean;
}

export interface FollowAuthorListResponse {
  success: boolean;
  data: FollowedAuthor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface GenericResponse {
  success: boolean;
  message?: string;
}

async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw 'UNAUTHENTICATED';
  return token;
}

export async function followAuthor(authorId: string): Promise<GenericResponse> {
  const token = await requireToken();
  return apiPost<GenericResponse>(`/follow-author/${encodeURIComponent(authorId)}`, {}, { token });
}

export async function unfollowAuthor(authorId: string): Promise<GenericResponse> {
  const token = await requireToken();
  return apiDelete<GenericResponse>(`/follow-author/${encodeURIComponent(authorId)}`, { token });
}

export async function getFollowAuthorStatus(authorId: string): Promise<boolean> {
  try {
    const token = await requireToken();
    const response = await apiGet<FollowAuthorStatusResponse>(
      `/follow-author/${encodeURIComponent(authorId)}/status`,
      { token },
    );
    return response.isFollowing;
  } catch {
    return false;
  }
}

export async function fetchFollowedAuthors(
  page = 1,
  limit = 50,
): Promise<FollowAuthorListResponse> {
  const token = await requireToken();
  return apiGet<FollowAuthorListResponse>('/follow-author/mine', {
    token,
    params: { page, limit },
  });
}