import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '../services/authService';
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getAuthToken();
      if (cancelled) return;

      if (!token) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setConnected(false);
        }
        return;
      }

      const newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        reconnectionDelayMax: 8000,
      });

      newSocket.on('connect', () => setConnected(true));
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

  const value = useMemo<SocketContextValue>(
    () => ({ socket: socketRef.current, connected }),
    [connected],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};