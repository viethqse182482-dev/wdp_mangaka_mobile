import { API_BASE_URL, API_TOKEN } from '../config/api';

interface ApiRequestOptions {
  token?: string;
  params?: Record<string, string | number | undefined>;
}

export async function apiGet<T>(
  path: string,
  { token = API_TOKEN, params }: ApiRequestOptions = {},
): Promise<T> {
  const url = new URL(path, API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }

  return response.json() as Promise<T>;
}
