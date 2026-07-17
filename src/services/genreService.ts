import { BASE_GENRES } from '../data/baseGenres';
import { Genre } from '../types/genre';
import { apiGet } from './apiClient';
import { getAuthToken } from './authService';

interface BEStringListResponse {
  success: boolean;
  data: string[];
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

async function fetchBackendGenreNames(): Promise<string[]> {
  const token = await getAuthToken();
  if (!token) return [];

  try {
    const response = await apiGet<BEStringListResponse>('/reader/genres', { token });
    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }
    return response.data;
  } catch {
    return [];
  }
}

async function fetchBackendTagNames(): Promise<string[]> {
  const token = await getAuthToken();
  if (!token) return [];

  try {
    const response = await apiGet<BEStringListResponse>('/reader/tags', { token });
    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }
    return response.data;
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách thể loại để render bộ lọc.
 *  - Ưu tiên dữ liệu từ BE (`/reader/genres`).
 *  - Nếu BE không trả được (không token / lỗi / rỗng), fallback về BASE_GENRES phía client.
 *  - Mỗi mục được gắn `id` là slug để dùng làm key React ổn định và `fromBackend`
 *    để UI có thể phân biệt nguồn nếu cần.
 */
export async function fetchGenres(): Promise<Genre[]> {
  const backendNames = await fetchBackendGenreNames();
  const baseSet = new Set<string>(BASE_GENRES);

  // Union ưu tiên backend trước, rồi tới BASE_GENRES (fallback/extension).
  const seen = new Set<string>();
  const ordered: string[] = [];

  [...backendNames, ...BASE_GENRES].forEach((name) => {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(trimmed);
  });

  return ordered.map((name) => ({
    id: slugify(name),
    name,
    fromBackend: !baseSet.has(name),
  }));
}

/**
 * Lấy danh sách tag đang được dùng bởi series public/published (BE `/reader/tags`).
 *  - Trả [] nếu không có token hoặc lỗi mạng.
 *  - BE đã sort locale 'vi', không cần sort lại.
 */
export async function fetchTags(): Promise<string[]> {
  const names = await fetchBackendTagNames();
  return names.filter(Boolean);
}
