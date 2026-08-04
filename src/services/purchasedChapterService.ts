import { apiGet } from './apiClient';
import { getAuthToken } from './authService';
import { PurchasedChapterEntry, PurchasedChapterListResponse } from '../types/storyDetail';

/**
 * Raw response shape từ `GET /wallet/purchases`.
 * BE trả snake_case, mình chuẩn hoá sang camelCase ở `mapBePurchase`.
 */
interface BePurchasedChapterRef {
  _id?: string;
  chapter_number?: number;
  title?: string;
}

interface BePurchasedSeriesRef {
  _id?: string;
  name?: string;
  cover_image_url?: string;
}

interface BePurchasedEntry {
  _id?: string;
  price?: number;
  purchased_at?: string;
  chapter_id?: BePurchasedChapterRef | null;
}

interface BePurchasedListResponse {
  success?: boolean;
  data?: BePurchasedEntry[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw 'UNAUTHENTICATED';
  return token;
}

function mapBePurchase(entry: BePurchasedEntry): PurchasedChapterEntry | null {
  const id = entry._id;
  const chapter = entry.chapter_id;
  const chapterId = chapter?._id;
  const chapterNumber = chapter?.chapter_number;

  // BE chỉ trả các field `_id`, `chapter_id._id` và `chapter_id.chapter_number`
  // mới đủ điều kiện hiển thị; các record thiếu sẽ được bỏ qua để tránh crash UI.
  if (!id || !chapterId || typeof chapterNumber !== 'number') {
    return null;
  }

  const seriesRef = chapter as BePurchasedChapterRef & {
    series_id?: BePurchasedSeriesRef | null;
  };
  const seriesRaw = seriesRef.series_id;
  const series =
    seriesRaw && typeof seriesRaw === 'object'
      ? {
          id: String(seriesRaw._id ?? ''),
          name: String(seriesRaw.name ?? ''),
          coverImageUrl: seriesRaw.cover_image_url ?? undefined,
        }
      : undefined;

  return {
    id,
    chapterId,
    chapterNumber,
    chapterTitle: chapter?.title ?? undefined,
    series,
    priceCoinUnit: typeof entry.price === 'number' ? entry.price : 0,
    purchasedAt: entry.purchased_at ?? new Date(0).toISOString(),
  };
}

/**
 * Gọi `GET /wallet/purchases`. Bearer access token lấy từ AsyncStorage (qua
 * `getAuthToken`) — không dùng AsyncStorage làm nguồn dữ liệu chính.
 *
 * Trả về list + pagination đã chuẩn hoá; record thiếu trường bắt buộc sẽ bị bỏ.
 */
export async function fetchPurchasedChapters(
  page = 1,
  limit = 20,
): Promise<PurchasedChapterListResponse> {
  const token = await requireToken();
  const response = await apiGet<BePurchasedListResponse>('/wallet/purchases', {
    token,
    params: { page, limit },
  });

  const rawData = Array.isArray(response.data) ? response.data : [];
  const mapped = rawData
    .map(mapBePurchase)
    .filter((entry): entry is PurchasedChapterEntry => entry !== null);

  const pagination = response.pagination;

  return {
    success: Boolean(response.success),
    data: mapped,
    pagination: pagination
      ? {
          page: Number(pagination.page ?? page),
          limit: Number(pagination.limit ?? limit),
          total: Number(pagination.total ?? mapped.length),
          totalPages: Number(pagination.totalPages ?? page),
        }
      : undefined,
  };
}