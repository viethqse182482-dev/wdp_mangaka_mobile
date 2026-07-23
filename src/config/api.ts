export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://wdp-be-a2qb.onrender.com';

export const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? '';

/**
 * URL của Socket.IO server. Mặc định lấy từ cùng host với REST API
 * nhưng có thể override bằng EXPO_PUBLIC_SOCKET_URL.
 */
export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? API_BASE_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

