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
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, onNotification }) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Join user room để nhận notification cá nhân từ server.
  // Được gọi khi socket vừa connect và khi user login lại.
  const joinUserRoom = async (socket: Socket) => {
    const user = await getAuthUser();
    if (user?.userId && socket.connected) {
      socket.emit('join_user_room', user.userId);
    }
  };

  // Tạo socket mới với token hiện tại. Idempotent: nếu đã có socket
  // connected thì không tạo lại.
  const connectSocket = async () => {
    const token = await getAuthToken();
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
      return;
    }

    // Nếu đã có socket cũ nhưng chưa connected, đóng đi trước khi tạo mới.
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      // Join user room sau khi connect thành công để nhận notification cá nhân
      void joinUserRoom(newSocket);
    });
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', () => setConnected(false));

    // Server BE phát: sendToUser(req.user.nameid, "notification", notif)
    newSocket.on('notification', (notif: any) => {
      try {
        onNotification?.(notif);
      } catch {
        // never break the socket
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
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setConnected(false);
      } else if (ev.type === 'login') {
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