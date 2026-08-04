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

export interface ChapterAccess {
  accessType: 'FREE' | 'PAID';
  isUnlocked: boolean;
  needsPurchase: boolean;
  /** Giá theo CoinUnit (100 CoinUnit = 1 Coin). */
  coinPrice: number;
  purchasedAt?: string | null;
}

interface ChapterAccessResponse {
  success: boolean;
  data: {
    access_type: 'FREE' | 'PAID';
    is_unlocked: boolean;
    needs_purchase: boolean;
    coin_price: number;
    purchased_at?: string | null;
  };
}

interface PurchaseChapterResponse {
  success: boolean;
  message?: string;
  data: {
    already_owned: boolean;
  };
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

// Timeout cho việc fetch chapter pages: 30s để khớp với default timeout
// của `apiClient` (30s cho cold-start Render HTTPS). Sau 30s mà chưa có
// response thì ném lỗi → ReaderScreen sẽ hiện ErrorState với nút "Thử lại".
const FETCH_CHAPTER_PAGES_TIMEOUT_MS = 30_000;

async function fetchChapterPagesFromBe(chapterId: string): Promise<ChapterPage[]> {
  const token = await getAuthToken();

  const response = await apiGet<BeChapterPagesResponse>(
    `/reader/chapters/${encodeURIComponent(chapterId)}/pages`,
    {
      token: token || undefined,
      // Timeout tường minh để document ý đồ: nếu BE / network chậm hơn
      // 30s, ReaderScreen sẽ tự dừng và hiện "Không tải được nội dung
      // chương" + nút "Thử lại" (retry) thay vì xoay spinner vô hạn.
      timeoutMs: FETCH_CHAPTER_PAGES_TIMEOUT_MS,
    },
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

export async function fetchChapterAccess(chapterId: string): Promise<ChapterAccess> {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập để đọc chapter này.');

  const response = await apiGet<ChapterAccessResponse>(
    `/chapters/${encodeURIComponent(chapterId)}/access`,
    { token },
  );

  return {
    accessType: response.data.access_type,
    isUnlocked: response.data.is_unlocked,
    needsPurchase: response.data.needs_purchase,
    coinPrice: response.data.coin_price ?? 0,
    purchasedAt: response.data.purchased_at,
  };
}

export async function purchaseChapter(
  chapterId: string,
): Promise<{ alreadyOwned: boolean; message: string }> {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập để mua chapter này.');

  const response = await apiPost<PurchaseChapterResponse>(
    `/chapters/${encodeURIComponent(chapterId)}/purchase`,
    {},
    { token },
  );

  return {
    alreadyOwned: response.data.already_owned,
    message: response.message ?? 'Mua chapter thành công.',
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
