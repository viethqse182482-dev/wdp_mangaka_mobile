import React from 'react';
import { NotificationProvider, useNotification } from './NotificationContext';
import { SocketProvider } from './SocketContext';

/**
 * Bridge giữa NotificationContext và SocketContext: SocketProvider cần callback
 * prependNotification từ NotificationContext, nhưng NotificationContext không thể
 * bọc SocketProvider vì SocketProvider phải nằm ngoài. Đây là component trung gian
 * — nó nằm trong NotificationProvider (để dùng useNotification) và bọc SocketProvider,
 * truyền callback xuống.
 */
const SocketBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { prependNotification } = useNotification();
  return (
    <SocketProvider onNotification={prependNotification}>{children}</SocketProvider>
  );
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      <SocketBridge>{children}</SocketBridge>
    </NotificationProvider>
  );
};