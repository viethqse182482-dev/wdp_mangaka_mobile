import { MANGADEX_API_BASE_URL, MANGADEX_UPLOADS_BASE_URL } from '../config/mangadex';
import { FeaturedStory } from '../types/story';
import { StoryDetail } from '../types/storyDetail';

interface MangaDexTitleMap {
  [key: string]: string | undefined;
}

interface MangaDexTag {
  attributes?: {
    name?: MangaDexTitleMap;
    group?: string;
  };
}

interface MangaDexCoverRelation {
  type: string;
  id: string;
  attributes?: {
    fileName?: string;
  };
}

interface MangaDexManga {
  id: string;
  attributes?: {
    title?: MangaDexTitleMap;
    description?: MangaDexTitleMap;
    lastChapter?: string;
    tags?: MangaDexTag[];
    updatedAt?: string;
  };
  relationships?: MangaDexCoverRelation[];
}

interface MangaDexMangaResponse {
  data: MangaDexManga[];
}

interface MangaDexSingleMangaResponse {
  data: MangaDexManga;
}

interface MangaDexChapter {
  id: string;
  attributes?: {
    chapter?: string;
    readableAt?: string;
    views?: number;
  };
}

interface MangaDexFeedResponse {
  data: MangaDexChapter[];
}

interface MangaDexStatistics {
  follows?: number;
  rating?: {
    bayesian?: number;
  };
}

interface MangaDexStatisticsResponse {
  statistics: Record<string, MangaDexStatistics>;
}

export interface MangaDexTagOption {
  id: string;
  name: string;
  group: string;
}

interface MangaDexTagResponse {
  data: Array<{
    id: string;
    attributes?: {
      name?: MangaDexTitleMap;
      group?: string;
    };
  }>;
}

type MangaDexOrderKey =
  | 'followedCount'
  | 'rating'
  | 'updatedAt'
  | 'latestUploadedChapter'
  | 'createdAt';

export interface MangaDexSearchFilters {
  title?: string;
  limit?: number;
  includedTagIds?: string[];
  statuses?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>;
  orderBy?: MangaDexOrderKey;
}

function pickLocalizedValue(values?: MangaDexTitleMap): string {
  if (!values) return '';
  return values.vi ?? values.en ?? Object.values(values).find(Boolean) ?? '';
}

function toCompactDate(isoDate?: string): string {
  if (!isoDate) return 'Mới cập nhật';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Mới cập nhật';
  return date.toLocaleDateString('vi-VN');
}

function toRelativeTimeLabel(isoDate?: string): string {
  if (!isoDate) return 'Mới cập nhật';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Mới cập nhật';

  const diff = Date.now() - date.getTime();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const days = Math.floor(diff / dayMs);
  if (days <= 0) {
    const hours = Math.max(1, Math.floor(diff / hourMs));
    return `${hours} giờ trước`;
  }
  if (days < 30) return `${days} ngày trước`;
  return toCompactDate(isoDate);
}

function getCoverUrl(manga: MangaDexManga): string {
  const cover = manga.relationships?.find((item) => item.type === 'cover_art');
  const fileName = cover?.attributes?.fileName;
  if (!fileName) return 'https://via.placeholder.com/300x420?text=Manga';
  return `${MANGADEX_UPLOADS_BASE_URL}/covers/${manga.id}/${fileName}.512.jpg`;
}

function getGenres(manga: MangaDexManga): string[] {
  const tags = manga.attributes?.tags ?? [];
  const genreNames = tags
    .filter((tag) => tag.attributes?.group === 'genre' || tag.attributes?.group === 'theme')
    .map((tag) => pickLocalizedValue(tag.attributes?.name))
    .filter(Boolean);

  return genreNames.slice(0, 2);
}

function mapMangaToFeaturedStory(
  manga: MangaDexManga,
  statistics: Record<string, MangaDexStatistics>,
): FeaturedStory {
  const stats = statistics[manga.id];
  const rating = Number((stats?.rating?.bayesian ?? 0).toFixed(1));
  const followers = stats?.follows ?? 0;
  const latestChapter = Number.parseFloat(manga.attributes?.lastChapter ?? '0');

  return {
    id: `mdx-${manga.id}`,
    title: pickLocalizedValue(manga.attributes?.title) || 'Untitled',
    synopsis: pickLocalizedValue(manga.attributes?.description) || 'Chưa có mô tả.',
    coverUrl: getCoverUrl(manga),
    latestChapter: Number.isFinite(latestChapter) ? latestChapter : 0,
    updatedAt: toCompactDate(manga.attributes?.updatedAt),
    views: followers,
    followers,
    rating,
    genres: getGenres(manga),
  };
}

async function fetchMangaStatistics(mangaIds: string[]): Promise<Record<string, MangaDexStatistics>> {
  if (mangaIds.length === 0) return {};

  const url = new URL('/statistics/manga', MANGADEX_API_BASE_URL);
  mangaIds.forEach((id) => url.searchParams.append('manga[]', id));

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`MangaDex statistics error: ${response.status}`);
  }

  const data = (await response.json()) as MangaDexStatisticsResponse;
  return data.statistics ?? {};
}

export async function fetchFeaturedStoriesFromMangaDex(limit = 8): Promise<FeaturedStory[]> {
  const url = new URL('/manga', MANGADEX_API_BASE_URL);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('order[followedCount]', 'desc');
  url.searchParams.set('includes[]', 'cover_art');
  url.searchParams.set('contentRating[]', 'safe');
  url.searchParams.append('contentRating[]', 'suggestive');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`MangaDex manga error: ${response.status}`);
  }

  const data = (await response.json()) as MangaDexMangaResponse;
  const mangas = data.data ?? [];
  const statistics = await fetchMangaStatistics(mangas.map((item) => item.id));

  return mangas.map((manga) => mapMangaToFeaturedStory(manga, statistics));
}

export async function fetchMangaDexTagOptions(): Promise<MangaDexTagOption[]> {
  const url = new URL('/manga/tag', MANGADEX_API_BASE_URL);
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`MangaDex tag error: ${response.status}`);
  }

  const data = (await response.json()) as MangaDexTagResponse;
  return (data.data ?? [])
    .map((tag) => ({
      id: tag.id,
      name: pickLocalizedValue(tag.attributes?.name) || '',
      group: tag.attributes?.group ?? 'theme',
    }))
    .filter((tag) => tag.name.length > 0);
}

export async function searchMangaDexStories(
  filters: MangaDexSearchFilters = {},
): Promise<FeaturedStory[]> {
  const url = new URL('/manga', MANGADEX_API_BASE_URL);
  const limit = filters.limit ?? 12;
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('includes[]', 'cover_art');
  url.searchParams.set('contentRating[]', 'safe');
  url.searchParams.append('contentRating[]', 'suggestive');
  url.searchParams.set(`order[${filters.orderBy ?? 'followedCount'}]`, 'desc');

  if (filters.title?.trim()) {
    url.searchParams.set('title', filters.title.trim());
  }

  filters.includedTagIds?.forEach((tagId) => {
    url.searchParams.append('includedTags[]', tagId);
  });

  filters.statuses?.forEach((status) => {
    url.searchParams.append('status[]', status);
  });

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`MangaDex search error: ${response.status}`);
  }

  const data = (await response.json()) as MangaDexMangaResponse;
  const mangas = data.data ?? [];
  const statistics = await fetchMangaStatistics(mangas.map((item) => item.id));
  return mangas.map((manga) => mapMangaToFeaturedStory(manga, statistics));
}

function mapMangaDexStatus(status?: string): string {
  switch (status) {
    case 'ongoing':
      return 'Đang thực hiện';
    case 'completed':
      return 'Hoàn thành';
    case 'hiatus':
      return 'Tạm dừng';
    case 'cancelled':
      return 'Đã dừng';
    default:
      return 'Đang cập nhật';
  }
}

function getAuthorName(manga: MangaDexManga): string {
  const author = manga.relationships?.find((item) => item.type === 'author');
  const name = (author as { attributes?: { name?: string } })?.attributes?.name;
  return name ?? 'Đang cập nhật';
}

export async function fetchMangaDexStoryDetail(storyId: string): Promise<StoryDetail> {
  const mangaId = storyId.startsWith('mdx-') ? storyId.replace('mdx-', '') : storyId;

  const mangaUrl = new URL(`/manga/${mangaId}`, MANGADEX_API_BASE_URL);
  mangaUrl.searchParams.append('includes[]', 'cover_art');
  mangaUrl.searchParams.append('includes[]', 'author');

  const [mangaResponse, feedResponse, statistics] = await Promise.all([
    fetch(mangaUrl.toString(), { headers: { Accept: 'application/json' } }),
    fetch(
      new URL(
        `/manga/${mangaId}/feed?limit=20&order[chapter]=desc&translatedLanguage[]=en`,
        MANGADEX_API_BASE_URL,
      ).toString(),
      { headers: { Accept: 'application/json' } },
    ),
    fetchMangaStatistics([mangaId]),
  ]);

  if (!mangaResponse.ok) {
    throw new Error(`MangaDex detail error: ${mangaResponse.status}`);
  }
  if (!feedResponse.ok) {
    throw new Error(`MangaDex feed error: ${feedResponse.status}`);
  }

  const mangaData = (await mangaResponse.json()) as MangaDexSingleMangaResponse;
  const feedData = (await feedResponse.json()) as MangaDexFeedResponse;

  const manga = mangaData.data;
  const stats = statistics[mangaId];

  const chapters = (feedData.data ?? [])
    .map((chapter) => {
      const chapterNumber = Number.parseFloat(chapter.attributes?.chapter ?? '0');
      if (!Number.isFinite(chapterNumber)) return null;
      return {
        id: chapter.id,
        number: chapterNumber,
        releasedAt: toRelativeTimeLabel(chapter.attributes?.readableAt),
        views: chapter.attributes?.views ?? 0,
      };
    })
    .filter((chapter): chapter is NonNullable<typeof chapter> => chapter !== null);

  const rating = Number((stats?.rating?.bayesian ?? 0).toFixed(1));
  const followers = stats?.follows ?? 0;
  const title = pickLocalizedValue(manga.attributes?.title) || 'Untitled';

  return {
    id: `mdx-${mangaId}`,
    title,
    altName: title,
    coverUrl: getCoverUrl(manga),
    latestChapter: Number.parseFloat(manga.attributes?.lastChapter ?? '0') || 0,
    updatedAt: toRelativeTimeLabel(manga.attributes?.updatedAt),
    views: followers,
    genres: getGenres(manga),
    author: getAuthorName(manga),
    status: mapMangaDexStatus((manga.attributes as { status?: string } | undefined)?.status),
    synopsis: pickLocalizedValue(manga.attributes?.description) || 'Chưa có mô tả.',
    rating,
    ratingCount: Math.max(1, Math.round(rating * 1000)),
    followers,
    chapters,
    comments: [],
  };
}
