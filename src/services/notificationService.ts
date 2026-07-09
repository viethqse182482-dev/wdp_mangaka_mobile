import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost, apiDelete } from './apiClient';
import { getAuthToken } from './authService';

const NOTIFICATION_STORAGE_KEY = '@mangaka/notification-subscriptions';

interface NotificationSubscription {
  seriesId: string;
  seriesTitle: string;
  subscribedAt: string;
}

interface NotificationStatusResponse {
  success: boolean;
  isSubscribed: boolean;
}

interface NotificationSubscribeResponse {
  success: boolean;
  message: string;
}

interface NotificationCheckResponse {
  success: boolean;
  isSubscribed: boolean;
}

/** Local cache for fast UI updates without API calls */
export async function getLocalSubscriptions(): Promise<NotificationSubscription[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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

async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw 'UNAUTHENTICATED';
  return token;
}

/** Check server-side subscription status */
export async function checkNotificationStatus(seriesId: string): Promise<boolean> {
  try {
    const token = await requireToken();
    const response = await apiGet<NotificationCheckResponse>(
      `/notifications/${encodeURIComponent(seriesId)}/status`,
      { token },
    );
    return response.isSubscribed;
  } catch {
    return false;
  }
}

/** Subscribe to notifications for new chapters */
export async function subscribeNotification(
  seriesId: string,
  seriesTitle: string,
): Promise<void> {
  const token = await requireToken();

  const response = await apiPost<NotificationSubscribeResponse>(
    `/notifications/${encodeURIComponent(seriesId)}/subscribe`,
    {},
    { token },
  );

  if (!response.success) {
    throw new Error(response.message || 'Đăng ký thông báo thất bại.');
  }

  await saveLocalSubscription(seriesId, seriesTitle);
}

/** Unsubscribe from notifications */
export async function unsubscribeNotification(seriesId: string): Promise<void> {
  const token = await requireToken();

  const response = await apiDelete<{ success: boolean; message: string }>(
    `/notifications/${encodeURIComponent(seriesId)}/subscribe`,
    { token },
  );

  if (!response.success) {
    throw new Error(response.message || 'Hủy thông báo thất bại.');
  }

  await removeLocalSubscription(seriesId);
}

/** Check local cache first, then fall back to server */
export async function isSubscribedToNotification(seriesId: string): Promise<boolean> {
  const localSubs = await getLocalSubscriptions();
  const localMatch = localSubs.find((s) => s.seriesId === seriesId);
  if (localMatch !== undefined) {
    return true;
  }

  return checkNotificationStatus(seriesId);
}
