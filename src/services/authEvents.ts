/**
 * AuthEventBus — kênh phát tín hiệu login/logout trong cùng app session.
 *
 * Vì sao cần: app không có global state management (Redux/Zustand) cho auth,
 * nhưng NotificationContext, SocketContext và các nơi khác cần biết
 * user vừa login hoặc logout để reset / reconnect.
 *
 * Đảm bảo:
 *  - Cùng instance cho toàn bộ app (module-level singleton).
 *  - subscribe trả về hàm unsubscribe.
 */

import { AuthUser } from '../types/auth';

export type AuthEvent =
  | { type: 'login'; token: string; user?: AuthUser }
  | { type: 'logout' };

type Listener = (event: AuthEvent) => void;

const listeners = new Set<Listener>();

export function emitAuthEvent(event: AuthEvent): void {
  listeners.forEach((cb) => {
    try {
      cb(event);
    } catch {
      // Không để một listener lỗi chặn các listener còn lại.
    }
  });
}

export function subscribeAuthEvent(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
