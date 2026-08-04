import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken, getAuthUser } from '../services/authService';
import { subscribeAuthEvent } from '../services/authEvents';
import { SOCKET_URL } from '../config/api';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
  /**
   * Callback được gọi khi server emit "notification" tới user hiện tại.
   * NotificationContext sẽ inject callback này để prepend vào state và
   * trigger local notification trên Android.
   */
  onNotification?: (notif: any) => void;
  /** Called after the server confirms that this socket joined the user's room. */
  onUserRoomJoined?: () => void;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  onNotification,
  onUserRoomJoined,
}) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Join user room để nhận notification cá nhân từ server.
  // Được gọi khi socket vừa connect và khi user login lại.
  const joinUserRoom = async (socket: Socket) => {
    const user = await getAuthUser();
    console.log('[SOCKET] joinUserRoom called, userId:', user?.userId, 'socket.connected:', socket.connected);
    if (user?.userId && socket.connected) {
      socket.timeout(5000).emit(
        'join_user_room',
        user.userId,
        (error: Error | null, response?: { success?: boolean; message?: string }) => {
          if (error) {
            console.log('[SOCKET] join_user_room acknowledgement timeout:', error.message);
            return;
          }
          if (response?.success) {
            console.log('[SOCKET] ✅ user room joined and acknowledged');
            onUserRoomJoined?.();
          }
        },
      );
      console.log('[SOCKET] ✅ join_user_room emitted with userId:', user.userId);
    }
  };

  // Tạo socket mới với token hiện tại. Idempotent: nếu đã có socket
  // connected thì không tạo lại.
  const connectSocket = async () => {
    const token = await getAuthToken();
    console.log('[SOCKET] connectSocket called, hasToken:', !!token);
    if (!token) {
      // Không có token → đảm bảo socket cũ (nếu còn) bị đóng.
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Tránh tạo mới khi socket hiện tại đang connected với cùng token.
    if (socketRef.current?.connected) {
      console.log('[SOCKET] Already connected, skipping');
      return;
    }

    // Nếu đã có socket cũ nhưng chưa connected, đóng đi trước khi tạo mới.
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }

    console.log('[SOCKET] 🔧 Creating new socket connection to:', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
    });

    newSocket.on('connect', () => {
      console.log('[SOCKET] ✅ Connected successfully');
      console.log('[SOCKET] Socket ID:', newSocket.id);
      console.log('[SOCKET] Transport:', newSocket.io.engine.transport.name);
      setConnected(true);
      void joinUserRoom(newSocket);
    });
    newSocket.on('disconnect', (reason) => {
      console.log('[SOCKET] 🔌 Disconnected:', reason);
      setConnected(false);
    });
    newSocket.on('connect_error', (error) => {
      console.log('[SOCKET] ❌ Connection error:', error.message);
      if ('code' in error) {
        console.log('[SOCKET] Error code:', error.code);
      }
      setConnected(false);
    });

    // Server BE phát: sendToUser(req.user.nameid, "notification", notif)
    newSocket.on('notification', (notif: any) => {
      console.log('[SOCKET] 📩 Received notification:', JSON.stringify(notif));
      try {
        onNotification?.(notif);
      } catch (err) {
        console.log('[SOCKET] ❌ Notification handler error:', err);
      }
    });

    socketRef.current = newSocket;
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await connectSocket();
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNotification]);

  // Nghe auth events để disconnect khi logout và reconnect khi login.
  // Trước đây effect chỉ chạy một lần theo onNotification, nên sau khi
  // đăng nhập lại mà socket đã đóng thì không tự kết nối trở lại.
  useEffect(() => {
    const unsub = subscribeAuthEvent((ev) => {
      if (ev.type === 'logout') {
        console.log('[SOCKET] 🔓 Logout event received, disconnecting socket');
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setConnected(false);
      } else if (ev.type === 'login') {
        console.log('[SOCKET] 🔐 Login event received, connecting socket');
        void connectSocket();
        // Nếu socket đã connected (không tạo mới), vẫn cần join room
        if (socketRef.current?.connected) {
          void joinUserRoom(socketRef.current);
        }
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNotification]);

  const value = useMemo<SocketContextValue>(
    () => ({ socket: socketRef.current, connected }),
    [connected],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
