import { apiGet } from './apiClient';
import { getAuthToken } from './authService';
import {
  fetchFeaturedStoriesFromMangaDex,
  fetchMangaDexStoryDetail,
  searchMangaDexStories,
} from './mangaDexService';
import { FeaturedStory, Story } from '../types/story';
import { StoryDetail } from '../types/storyDetail';

interface BeAuthor {
  _id?: string;
  username?: string;
  full_name?: string;
  fullName?: string;
  phoneNumber?: string;
  avatar_url?: string;
  avatarUrl?: string;
}

interface BeChapterStub {
  _id?: string;
  chapter_number?: number;
  title?: string;
  published_at?: string;
}

interface BeSeries {
  _id: string;
  name: string;
  description?: string;
  synopsis?: string;
  cover_image_url?: string;
  genre?: string[];
  status?: string;
  average_score?: number;
  total_votes?: number;
  views_count?: number;
  total_chapters?: number;
  latest_chapter_number?: number | null;
  latest_chapter?: BeChapterStub | null;
  author_id?: BeAuthor | string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface BeSeriesListResponse {
  success: boolean;
  data: BeSeries[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

interface BeSeriesDetailResponse {
  success: boolean;
  data: BeSeries;
}

interface BeChapterListItem {
  _id: string;
  chapter_number: number;
  title?: string;
  published_at?: string;
  views?: number;
}

interface BeChapterListResponse {
  success: boolean;
  data: BeChapterListItem[];
}

export interface SeriesListParams {
  sort?: 'average_score' | 'views_count' | 'createdAt' | 'updatedAt';
  genre?: string;
  page?: number;
  limit?: number;
}

export interface SeriesListResult {
  stories: Story[];
  source: 'be' | 'mangadex' | 'empty';
  total?: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60_000;
const listCache = new Map<string, CacheEntry<SeriesListResult>>();
const detailCache = new Map<string, CacheEntry<StoryDetail | null>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  cache.set(key, { value, timestamp: Date.now() });
}

export function clearSeriesCache(): void {
  listCache.clear();
  detailCache.clear();
}

function pickAuthorName(author: BeAuthor | string | undefined): string {
  if (!author) return 'Đang cập nhật';
  if (typeof author === 'string') return 'Đang cập nhật';
  return author.full_name ?? author.fullName ?? author.username ?? 'Đang cập nhật';
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

function mapBeSeriesToStory(series: BeSeries): Story {
  return {
    id: series._id,
    title: series.name,
    coverUrl: series.cover_image_url ?? '',
    latestChapter: series.latest_chapter_number ?? series.total_chapters ?? 0,
    updatedAt: relativeTimeFromIso(series.updatedAt ?? series.latest_chapter?.published_at),
    views: series.views_count ?? 0,
    genres: Array.isArray(series.genre) ? series.genre : [],
  };
}

function mapBeSeriesToFeaturedStory(series: BeSeries): FeaturedStory {
  const base = mapBeSeriesToStory(series);
  return {
    ...base,
    synopsis: series.synopsis ?? series.description ?? 'Chưa có mô tả.',
    rating: Number(((series.average_score ?? 0)).toFixed(1)),
    followers: series.total_votes ?? 0,
  };
}

function mapBeChapterToChapterItem(chapter: BeChapterListItem) {
  return {
    id: chapter._id,
    number: chapter.chapter_number,
    releasedAt: relativeTimeFromIso(chapter.published_at),
    views: chapter.views ?? 0,
  };
}

async function tryFetchBeList(params: SeriesListParams): Promise<Story[] | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await apiGet<BeSeriesListResponse>('/reader/series', {
      token,
      params: {
        sort: params.sort ?? 'average_score',
        genre: params.genre,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    });
    if (!response.success || !Array.isArray(response.data)) return null;
    return response.data.map(mapBeSeriesToStory);
  } catch {
    return null;
  }
}

async function fetchMangaDexListAsStories(params: SeriesListParams): Promise<Story[]> {
  try {
    const mangadex = await fetchFeaturedStoriesFromMangaDex(params.limit ?? 20);
    return mangadex.map((s) => ({
      id: s.id,
      title: s.title,
      coverUrl: s.coverUrl,
      latestChapter: s.latestChapter,
      updatedAt: s.updatedAt,
      views: s.views,
      genres: s.genres,
    }));
  } catch {
    return [];
  }
}

export async function fetchSeriesList(params: SeriesListParams = {}): Promise<SeriesListResult> {
  const cacheKey = JSON.stringify({
    sort: params.sort ?? 'average_score',
    genre: params.genre ?? '',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });

  const cached = getCached(listCache, cacheKey);
  if (cached) return cached;

  const beStories = await tryFetchBeList(params);
  if (beStories && beStories.length > 0) {
    const result: SeriesListResult = { stories: beStories, source: 'be' };
    setCached(listCache, cacheKey, result);
    return result;
  }

  const mangadexStories = await fetchMangaDexListAsStories(params);
  if (mangadexStories.length > 0) {
    const result: SeriesListResult = { stories: mangadexStories, source: 'mangadex' };
    setCached(listCache, cacheKey, result);
    return result;
  }

  const result: SeriesListResult = { stories: [], source: 'empty' };
  setCached(listCache, cacheKey, result);
  return result;
}

export async function fetchFeaturedStories(limit = 8): Promise<FeaturedStory[]> {
  const listResult = await fetchSeriesList({ sort: 'average_score', limit });
  if (listResult.stories.length > 0 && listResult.source === 'be') {
    // BE không trả synopsis/rating đầy đủ trong list, gọi lại MangaDex nếu thiếu để giữ UX feature-card.
    // Tuy nhiên ưu tiên giữ BE trước — chỉ fallback khi list rỗng.
  }
  if (listResult.stories.length === 0) {
    try {
      return await fetchFeaturedStoriesFromMangaDex(limit);
    } catch {
      return [];
    }
  }

  // Map tối thiểu từ Story (BE) sang FeaturedStory (BE không có synopsis/rating đầy đủ).
  return listResult.stories.map((story) => ({
    ...story,
    synopsis: '',
    rating: 0,
    followers: story.views,
  }));
}

export async function searchSeries(query: string, limit = 20): Promise<FeaturedStory[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const beStories = await tryFetchBeList({ limit: 50 });
  if (beStories && beStories.length > 0) {
    const lower = trimmed.toLowerCase();
    const matched = beStories
      .filter((s) => s.title.toLowerCase().includes(lower))
      .slice(0, limit);
    if (matched.length > 0) {
      return matched.map((story) => ({
        ...story,
        synopsis: '',
        rating: 0,
        followers: story.views,
      }));
    }
  }

  try {
    return await searchMangaDexStories({ title: trimmed, limit });
  } catch {
    return [];
  }
}

export async function fetchStoryDetail(id: string): Promise<StoryDetail | null> {
  const cached = getCached(detailCache, id);
  if (cached !== undefined) return cached;

  // 1. Thử BE trước (ưu tiên)
  if (!id.startsWith('mdx-')) {
    const token = await getAuthToken();
    if (token) {
      try {
        const detailResp = await apiGet<BeSeriesDetailResponse>(
          `/reader/series/${encodeURIComponent(id)}`,
          { token },
        );
        const series = detailResp.data;
        let chapters: BeChapterListItem[] = [];
        try {
          const chaptersResp = await apiGet<BeChapterListResponse>(
            `/reader/series/${encodeURIComponent(id)}/chapters`,
            { token },
          );
          chapters = Array.isArray(chaptersResp.data) ? chaptersResp.data : [];
        } catch {
          chapters = [];
        }

        const detail: StoryDetail = {
          id: series._id,
          title: series.name,
          altName: series.name,
          coverUrl: series.cover_image_url ?? '',
          latestChapter: series.latest_chapter_number ?? 0,
          updatedAt: relativeTimeFromIso(series.updatedAt ?? series.latest_chapter?.published_at),
          views: series.views_count ?? 0,
          genres: Array.isArray(series.genre) ? series.genre : [],
          author: pickAuthorName(series.author_id),
          status: 'Đang cập nhật',
          synopsis: series.synopsis ?? series.description ?? 'Chưa có mô tả.',
          rating: Number((series.average_score ?? 0).toFixed(1)),
          ratingCount: series.total_votes ?? 0,
          followers: series.total_votes ?? 0,
          chapters: chapters.map(mapBeChapterToChapterItem),
          comments: [],
        };
        setCached(detailCache, id, detail);
        return detail;
      } catch {
        // fallthrough sang MangaDex
      }
    }
  }

  // 2. Fallback MangaDex
  try {
    const detail = await fetchMangaDexStoryDetail(id);
    setCached(detailCache, id, detail);
    return detail;
  } catch {
    setCached(detailCache, id, null);
    return null;
  }
}

// Helper internal dùng cho các caller cần sort mà BE chưa hỗ trợ
export async function fetchSeriesByTab(
  tab: 'updates' | 'recommend',
  limit = 24,
): Promise<FeaturedStory[]> {
  if (tab === 'updates') {
    const list = await fetchSeriesList({ sort: 'updatedAt', limit });
    if (list.stories.length > 0) {
      return list.stories.map((story) => ({
        ...story,
        synopsis: '',
        rating: 0,
        followers: story.views,
      }));
    }
    try {
      return await searchMangaDexStories({ orderBy: 'latestUploadedChapter', limit });
    } catch {
      return [];
    }
  }

  // tab === 'recommend'
  const list = await fetchSeriesList({ sort: 'average_score', limit });
  if (list.stories.length > 0) {
    return list.stories.map((story) => ({
      ...story,
      synopsis: '',
      rating: 0,
      followers: story.views,
    }));
  }
  try {
    return await fetchFeaturedStoriesFromMangaDex(limit);
  } catch {
    return [];
  }
}

export interface SeriesSearchFilters {
  title?: string;
  genre?: string;
  limit?: number;
}

export async function fetchSeriesByFilter(
  filters: SeriesSearchFilters = {},
): Promise<FeaturedStory[]> {
  const limit = filters.limit ?? 24;
  const list = await fetchSeriesList({
    sort: 'average_score',
    genre: filters.genre,
    limit,
  });

  if (list.stories.length > 0) {
    let stories = list.stories;
    const trimmedTitle = filters.title?.trim();
    if (trimmedTitle) {
      const lower = trimmedTitle.toLowerCase();
      stories = stories.filter((s) => s.title.toLowerCase().includes(lower));
    }
    return stories.map((story) => ({
      ...story,
      synopsis: '',
      rating: 0,
      followers: story.views,
    }));
  }

  // Fallback MangaDex — không thể map genreName ↔ MangaDex tag, giữ nguyên filter hiện có
  try {
    return await searchMangaDexStories({ title: filters.title, limit });
  } catch {
    return [];
  }
}