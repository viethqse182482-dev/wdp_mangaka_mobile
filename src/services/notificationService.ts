import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient';
import { getAuthToken } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ────────────────────────────────────────────────────────────────────────────
//   LOCAL CACHE — cache nhanh để UI render trước khi gọi API server
// ────────────────────────────────────────────────────────────────────────────
const NOTIFICATION_STORAGE_KEY = '@mangaka/notification-subscriptions';

export interface LocalSubscription {
  seriesId: string;
  seriesTitle: string;
  subscribedAt: string;
}

async function getLocalSubscriptions(): Promise<LocalSubscription[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalSubscription[]) : [];
  } catch {
    return [];
  }
}

async function saveLocalSubscription(seriesId: string, seriesTitle: string): Promise<void> {
  const subs = await getLocalSubscriptions();
  const exists = subs.some((s) => s.seriesId === seriesId);
  if (!exists) {
    subs.push({ seriesId, seriesTitle, subscribedAt: new Date().toISOString() });
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(subs));
  }
}

async function removeLocalSubscription(seriesId: string): Promise<void> {
  const subs = await getLocalSubscriptions();
  const filtered = subs.filter((s) => s.seriesId !== seriesId);
  await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(filtered));
}

// ────────────────────────────────────────────────────────────────────────────
//   TYPES — mirror BE response shape
// ────────────────────────────────────────────────────────────────────────────
export interface NotificationItem {
  _id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read?: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  meta?: {
    series_id?: string;
    series_name?: string;
    chapter_id?: string;
    chapter_number?: number;
    author_id?: string;
  };
  /**
   * Thời điểm tạo (BE Mongo timestamps).
   * BE trả field `createdAt` (camelCase) ở cả REST `/notifications` lẫn socket emit.
   * Một số payload cũ có thể gửi `created_at` — giữ fallback trong helper.
   */
  createdAt?: string;
  created_at?: string;
}

/**
 * Lấy thời gian tạo notification từ payload, fallback giữa createdAt (BE hiện tại)
 * và created_at (payload cũ hoặc nguồn snake_case khác). Trả về "" nếu không có.
 */
export function getNotificationTime(item: NotificationItem): string {
  return item.createdAt || item.created_at || '';
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface SubscribeStatusResponse {
  success: boolean;
  isSubscribed: boolean;
  data: unknown | null;
}

export interface GenericResponse {
  success: boolean;
  message?: string;
}

// ────────────────────────────────────────────────────────────────────────────
//   HELPERS
// ────────────────────────────────────────────────────────────────────────────
async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw 'UNAUTHENTICATED';
  return token;
}

// ────────────────────────────────────────────────────────────────────────────
//   SUBSCRIBE / UNSUBSCRIBE
// ────────────────────────────────────────────────────────────────────────────
export async function checkNotificationStatus(seriesId: string): Promise<boolean> {
  try {
    const token = await requireToken();
    const response = await apiGet<SubscribeStatusResponse>(
      `/notifications/${encodeURIComponent(seriesId)}/status`,
      { token },
    );
    return response.isSubscribed;
  } catch {
    return false;
  }
}

export async function subscribeNotification(
  seriesId: string,
  seriesTitle: string,
): Promise<void> {
  const token = await requireToken();
  const response = await apiPost<GenericResponse>(
    `/notifications/${encodeURIComponent(seriesId)}/subscribe`,
    {},
    { token },
  );

  if (!response.success) {
    throw new Error(response.message || 'Đăng ký thông báo thất bại.');
  }

  await saveLocalSubscription(seriesId, seriesTitle);
}

export async function unsubscribeNotification(seriesId: string): Promise<void> {
  const token = await requireToken();
  const response = await apiDelete<GenericResponse>(
    `/notifications/${encodeURIComponent(seriesId)}/subscribe`,
    { token },
  );

  if (!response.success) {
    throw new Error(response.message || 'Hủy thông báo thất bại.');
  }

  await removeLocalSubscription(seriesId);
}

export async function isSubscribedToNotification(seriesId: string): Promise<boolean> {
  const localSubs = await getLocalSubscriptions();
  const localMatch = localSubs.find((s) => s.seriesId === seriesId);
  if (localMatch !== undefined) {
    return true;
  }
  return checkNotificationStatus(seriesId);
}

// ────────────────────────────────────────────────────────────────────────────
//   NOTIFICATION INBOX
// ────────────────────────────────────────────────────────────────────────────
export async function fetchNotifications(
  page = 1,
  limit = 20,
  opts: { unreadOnly?: boolean; type?: string } = {},
): Promise<NotificationListResponse> {
  const token = await requireToken();
  return apiGet<NotificationListResponse>('/notifications', {
    token,
    params: {
      page,
      limit,
      is_read: opts.unreadOnly ? 'false' : undefined,
      type: opts.type,
    },
  });
}

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const token = await requireToken();
  return apiGet<UnreadCountResponse>('/notifications/unread-count', { token });
}

export async function markNotificationAsRead(id: string): Promise<GenericResponse> {
  const token = await requireToken();
  return apiPatch<GenericResponse>(`/notifications/${encodeURIComponent(id)}/read`, {}, { token });
}

export async function markAllNotificationsAsRead(): Promise<GenericResponse> {
  const token = await requireToken();
  return apiPatch<GenericResponse>('/notifications/read-all', {}, { token });
}

export async function deleteNotification(id: string): Promise<GenericResponse> {
  const token = await requireToken();
  return apiDelete<GenericResponse>(`/notifications/${encodeURIComponent(id)}`, { token });
}
