import { apiDelete, apiGet, apiPost } from './apiClient';
import { getAuthToken } from './authService';

export interface BookshelfAuthor {
  userId?: string;
  _id?: string;
  username?: string;
  full_name?: string;
  fullName?: string;
  avatar_url?: string;
}

export interface BookshelfSeries {
  _id: string;
  name: string;
  cover_image_url?: string;
  genre?: string[];
  status?: string;
  is_public?: boolean;
  author_id?: BookshelfAuthor | string;
  total_chapters?: number;
  latest_chapter_number?: number | null;
}

export interface BookshelfItem {
  _id: string;
  added_at: string;
  series: BookshelfSeries;
}

export interface BookshelfPagination {
  total: number;
  page: number;
  limit: number;
}

interface BookshelfListResponse {
  success: boolean;
  data: BookshelfItem[];
  pagination: BookshelfPagination;
}

interface BookshelfCheckResponse {
  success: boolean;
  data: Record<string, boolean>;
}

interface BookshelfToggleResponse {
  success: boolean;
  in_bookshelf: boolean;
  message?: string;
  data?: unknown;
}

async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    throw 'UNAUTHENTICATED';
  }
  return token;
}

export async function fetchBookshelf(page = 1, limit = 50): Promise<BookshelfListResponse> {
  const token = await requireToken();
  return apiGet<BookshelfListResponse>('/reader/bookshelf', {
    token,
    params: { page, limit },
  });
}

export async function checkBookshelfStatus(seriesIds: string[]): Promise<Record<string, boolean>> {
  const filtered = (seriesIds || []).filter(Boolean);
  if (filtered.length === 0) return {};

  const token = await requireToken();
  const response = await apiGet<BookshelfCheckResponse>('/reader/bookshelf/check', {
    token,
    params: { series_ids: filtered.join(',') },
  });
  return response.data ?? {};
}

export async function addToBookshelf(seriesId: string): Promise<boolean> {
  const token = await requireToken();
  const response = await apiPost<BookshelfToggleResponse>(
    '/reader/bookshelf',
    { series_id: seriesId },
    { token },
  );
  return Boolean(response.in_bookshelf);
}

export async function removeFromBookshelf(seriesId: string): Promise<boolean> {
  const token = await requireToken();
  const response = await apiDelete<BookshelfToggleResponse>(
    `/reader/bookshelf/${encodeURIComponent(seriesId)}`,
    { token },
  );
  return !response.in_bookshelf;
}

export async function toggleBookshelf(seriesId: string, currentlyIn: boolean): Promise<boolean> {
  if (currentlyIn) {
    await removeFromBookshelf(seriesId);
    return false;
  }
  await addToBookshelf(seriesId);
  return true;
}