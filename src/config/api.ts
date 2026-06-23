export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://wdp-be-a2qb.onrender.com';

export const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

