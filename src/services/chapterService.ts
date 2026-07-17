import { apiGet, apiPost } from './apiClient';
import { getAuthToken } from './authService';

export interface ChapterPage {
  index: number;
  url: string;
}

export interface ChapterDetail {
  id: string;
  storyId: string;
  chapterNumber: number;
  pages: ChapterPage[];
}

interface MangaDexChapterResponse {
  result: string;
  baseUrl?: string;
  chapter?: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

interface BeChapterPagesResponse {
  success: boolean;
  data?: Array<{
    page_number: number;
    final_image_url?: string;
    result_image_url?: string;
    original_image_url?: string;
    width?: number;
    height?: number;
  }>;
  chapter?: {
    _id: string;
    chapter_number: number;
    title?: string;
  };
  series?: {
    _id: string;
    name?: string;
  };
}

async function fetchChapterPagesFromBe(chapterId: string): Promise<ChapterPage[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để đọc chapter này.');
  }

  const response = await apiGet<BeChapterPagesResponse>(
    `/reader/chapters/${encodeURIComponent(chapterId)}/pages`,
    { token },
  );

  if (!response.success || !Array.isArray(response.data)) {
    throw new Error('BE không trả về danh sách trang cho chapter này.');
  }

  const pages = response.data
    .slice()
    .sort((a, b) => (a.page_number ?? 0) - (b.page_number ?? 0))
    .map((page, index) => ({
      index,
      url:
        page.final_image_url ||
        page.result_image_url ||
        page.original_image_url ||
        '',
    }))
    .filter((page) => page.url.length > 0);

  if (pages.length === 0) {
    throw new Error('Chapter này chưa có trang nào được publish.');
  }

  return pages;
}

export async function fetchChapterPages(
  storyId: string,
  chapterNumber: number,
  chapterId?: string,
): Promise<ChapterDetail> {
  if (!chapterId || chapterId.trim().length === 0) {
    throw new Error('Chapter ID not provided.');
  }

  const pages = await fetchChapterPagesFromBe(chapterId);

  return {
    id: chapterId,
    storyId,
    chapterNumber,
    pages,
  };
}

interface TrackChapterViewResponse {
  success: boolean;
  data?: {
    chapter_id: string;
    series_id: string;
    views_count: number;
  };
}

/**
 * Gửi 1 lượt đọc cho chapter.
 * - Chỉ gọi khi user đã đọc chapter đủ lâu (mặc định ≥ 15s).
 * - Trả về `views_count` mới để mobile cập nhật cache / UI ngay.
 * - Lỗi thì silent fail vì view tracking không phải chức năng cốt lõi.
 */
export async function trackChapterView(
  chapterId: string,
): Promise<{ views_count: number } | null> {
  if (!chapterId || chapterId.trim().length === 0) return null;

  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await apiPost<TrackChapterViewResponse>(
      `/reader/chapters/${encodeURIComponent(chapterId)}/view`,
      {},
      { token },
    );
    if (response.success && response.data) {
      return { views_count: response.data.views_count };
    }
    return null;
  } catch {
    return null;
  }
}
