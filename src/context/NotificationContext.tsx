import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { subscribeAuthEvent } from '../services/authEvents';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
} from '../services/notificationService';

// Hiện notification ngay cả khi app đang foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;

  // Được SocketContext gọi khi có realtime push
  prependNotification: (n: NotificationItem) => void;

  // Helper local push (dùng cho cả socket-triggered lẫn manual)
  triggerLocalNotification: (n: NotificationItem) => Promise<void>;

  // Xóa toàn bộ state trong bộ nhớ + local system tray notification.
  // Được gọi khi user logout để tránh rò rỉ state.
  reset: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>(null as any);

export const useNotification = () => useContext(NotificationContext);

const PAGE_SIZE = 20;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const responseListener = useRef<any>(null);

  // ── Polling state — dùng cho cơ chế tự động check unread count ─────────
  // Track count cũ để so sánh → chỉ refresh full list khi thực sự thay đổi.
  // Lưu interval id để start/stop theo AppState foreground/background.
  const lastUnreadCountRef = useRef<number>(0);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Xin quyền notification 1 lần khi mount ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        if (!Device.isDevice) return;
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          setPermissionGranted(true);
          return;
        }
        const req = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowSound: true, allowBadge: true },
        });
        setPermissionGranted(req.status === 'granted');
      } catch {
        // ignore — không chặn UX nếu user từ chối
      }
    })();
  }, []);

  // ── Channel Android (cho Oreo+) ───────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        Notifications.setNotificationChannelAsync('mangaka-default', {
          name: 'Mangaka',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
          sound: 'default',
        });
      } catch {
        // ignore
      }
    }
  }, []);

  // ── Listener: user tap vào local notification → có thể navigate ─────
  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          series_id?: string;
        };
        // Navigation sẽ được handle ở NotificationBell / NotificationsScreen
        // khi user thực sự tap row. Listener này chỉ log.
        if (data?.series_id) {
          // optional: global event bus để route đến story
        }
      });

    return () => {
      try {
        Notifications.removeNotificationSubscription(responseListener.current);
      } catch {
        // ignore
      }
    };
  }, []);

  // ── Trigger local notification (Android tray + iOS banner) ───────────
  const triggerLocalNotification = useCallback(
    async (n: NotificationItem) => {
      if (!permissionGranted) return;
      if (!Device.isDevice) return;
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: n.title || 'Thông báo mới',
            body: n.message || '',
            data: {
              ...(n.meta ?? {}),
              notification_id: n._id,
            },
            sound: 'default',
          },
          trigger: null,
        });
      } catch {
        // ignore
      }
    },
    [permissionGranted],
  );

  // ── Prepend khi nhận realtime ────────────────────────────────────────
  const prependNotification = useCallback(
    (n: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((it) => it._id === n._id)) return prev;
        return [n, ...prev];
      });
      if (!n.is_read) {
        setUnreadCount((c) => c + 1);
      }
      // Auto push to system tray
      void triggerLocalNotification(n);
    },
    [triggerLocalNotification],
  );

  // ── Load list ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const listRes = await fetchNotifications(1, PAGE_SIZE);
      setNotifications(listRes.data ?? []);
      setPage(1);
      setHasMore((listRes.data ?? []).length >= PAGE_SIZE);
      const nextUnreadCount = listRes.unreadCount ?? 0;
      setUnreadCount(nextUnreadCount);
      lastUnreadCountRef.current = nextUnreadCount;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'UNAUTHENTICATED') {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = page + 1;
      const listRes = await fetchNotifications(next, PAGE_SIZE);
      const items = listRes.data ?? [];
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((item) => item._id));
        return [...prev, ...items.filter((item) => !existingIds.has(item._id))];
      });
      setPage(next);
      setHasMore(items.length >= PAGE_SIZE);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  // ── Mark as read ──────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id && !n.is_read ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationAsRead(id);
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch {
      // ignore
    }
  }, []);

  const removeNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      try {
        await deleteNotification(id);
      } catch {
        // ignore
      }
    },
    [notifications],
  );

  // Xóa sạch notification state — dùng khi logout. Các notification tray
  // local trên Android/iOS cũng được dismiss để user khác không còn thấy
  // chúng trên notification center sau khi đăng nhập tài khoản khác.
  const reset = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    setPage(1);
    setHasMore(true);
    setError(null);
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch {
      // ignore — không chặn UX khi dismiss fail
    }
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      hasMore,
      error,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
      removeNotification,
      prependNotification,
      triggerLocalNotification,
      reset,
    }),
    [
      notifications,
      unreadCount,
      loading,
      hasMore,
      error,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
      removeNotification,
      prependNotification,
      triggerLocalNotification,
      reset,
    ],
  );

  // Nghe auth events để reset khi logout và refresh khi login.
  useEffect(() => {
    const unsub = subscribeAuthEvent((ev) => {
      if (ev.type === 'logout') {
        void reset();
      } else if (ev.type === 'login') {
        // Kéo lại danh sách + unread count ngay sau khi có token mới,
        // tránh tình trạng badge = 0 cho tới khi user mở tab Thông báo.
        void refresh();
      }
    });
    return unsub;
  }, [reset, refresh]);

  // Cold start có session cũ sẽ không phát auth event "login". Luôn thử
  // hydrate inbox khi provider mount; refresh tự reset state nếu chưa authenticated.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Polling: tự động check unread count mỗi 30s khi app foreground ──────
  // Mục đích: bắt các notification bị miss do socket race condition / socket
  // disconnect khi background. So sánh unread count với lần trước — chỉ
  // refresh full list khi count thực sự đổi, tránh tốn request thừa.
  // Dừng polling khi app vào background (AppState khác 'active') để tiết
  // kiệm pin + không tốn request vô ích.
  useEffect(() => {
    const POLLING_INTERVAL_MS = 30_000;

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('[NOTIF] ⏸ Polling stopped (background)');
      }
    };

    const pollOnce = async () => {
      try {
        const listRes = await fetchNotifications(1, 1);
        const newCount = listRes.unreadCount ?? 0;
        const oldCount = lastUnreadCountRef.current;

        if (newCount !== oldCount) {
          console.log(`[NOTIF] 📊 Unread count changed: ${oldCount} → ${newCount}`);
          await refresh();
          lastUnreadCountRef.current = newCount;
        }
      } catch (err) {
        // UNAUTHENTICATED → user đã logout → dừng polling cho tới khi login lại
        const message = err instanceof Error ? err.message : String(err);
        if (message === 'UNAUTHENTICATED') {
          stopPolling();
        }
        // Lỗi khác (mạng, 500...) → im lặng, polling lần sau vẫn chạy
      }
    };

    const startPolling = () => {
      if (pollingIntervalRef.current) return;
      console.log('[NOTIF] ▶ Polling started (foreground, every 30s)');
      // Tick ngay 1 lần khi vào foreground để đồng bộ state
      void pollOnce();
      pollingIntervalRef.current = setInterval(() => {
        void pollOnce();
      }, POLLING_INTERVAL_MS);
    };

    // Lắng nghe foreground/background
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    });

    // Nếu app đã ở foreground ngay từ khi mount → start ngay
    if (AppState.currentState === 'active') {
      startPolling();
    }

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
