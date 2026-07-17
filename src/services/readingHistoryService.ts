import { apiGet, apiDelete, apiPost } from './apiClient';
import { getAuthToken } from './authService';
import { Story } from '../types/story';

export interface ReadingHistoryEntry {
  id: string;
  title: string;
  coverUrl: string;
  latestChapter: number;
  updatedAt: string;
  views: number;
  genres: string[];
  lastReadChapter: number;
  readAt: string;
}

interface BeHistoryItem {
  _id: string;
  series_id: string;
  last_read_chapter: number;
  read_at: string;
  series?: {
    _id: string;
    name?: string;
    cover_image_url?: string;
    total_chapters?: number;
    views_count?: number;
    genre?: string[];
    updatedAt?: string;
  };
}

interface BeHistoryListResponse {
  success: boolean;
  data?: BeHistoryItem[];
}

interface BeHistoryUpsertResponse {
  success: boolean;
  data?: {
    _id: string;
    series_id: string;
    last_read_chapter: number;
    read_at: string;
  };
}

function mapBeToEntry(item: BeHistoryItem): ReadingHistoryEntry {
  const series: NonNullable<BeHistoryItem['series']> = item.series ?? {
    _id: '',
  };
  return {
    id: String(item.series_id ?? series._id ?? ''),
    title: series.name ?? '',
    coverUrl: series.cover_image_url ?? '',
    latestChapter: series.total_chapters ?? 0,
    updatedAt: series.updatedAt ?? '',
    views: series.views_count ?? 0,
    genres: Array.isArray(series.genre) ? series.genre : [],
    lastReadChapter: item.last_read_chapter ?? 0,
    readAt: item.read_at ?? new Date().toISOString(),
  };
}

export async function getReadingHistory(): Promise<ReadingHistoryEntry[]> {
  const token = await getAuthToken();
  if (!token) return [];

  try {
    const response = await apiGet<BeHistoryListResponse>('/reader/history', { token });
    if (!response.success || !Array.isArray(response.data)) return [];
    return response.data
      .map(mapBeToEntry)
      .sort(
        (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime(),
      );
  } catch {
    return [];
  }
}

export async function recordReadingHistory(
  story: Story,
  lastReadChapter?: number,
): Promise<void> {
  if (!story?.id) return;
  const token = await getAuthToken();
  if (!token) return;

  const chapter = lastReadChapter ?? story.latestChapter ?? 0;

  try {
    await apiPost<BeHistoryUpsertResponse>(
      '/reader/history',
      { series_id: story.id, last_read_chapter: chapter },
      { token },
    );
  } catch {
    // Silent fail - reading history là chức năng phụ.
  }
}

export async function removeHistoryEntry(storyId: string): Promise<void> {
  if (!storyId) return;
  const token = await getAuthToken();
  if (!token) return;

  try {
    await apiDelete<{ success: boolean; removed: boolean }>(
      `/reader/history/${encodeURIComponent(storyId)}`,
      { token },
    );
  } catch {
    // ignore
  }
}

export async function clearReadingHistory(): Promise<void> {
  const token = await getAuthToken();
  if (!token) return;

  try {
    await apiDelete<{ success: boolean; deleted: number }>(
      '/reader/history',
      { token },
    );
  } catch {
    // ignore
  }
}
