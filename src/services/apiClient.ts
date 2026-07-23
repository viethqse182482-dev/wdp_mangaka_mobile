import { API_BASE_URL, API_TOKEN, ApiError } from '../config/api';

export { ApiError };

interface ApiRequestOptions {
  token?: string;
  params?: Record<string, string | number | undefined>;
  /** Không gửi Authorization header (dùng cho /auth/login, /auth/register) */
  skipAuth?: boolean;
  /** Override timeout (ms). Mặc định 30s; an toàn cho cold-start của Render free tier. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

const NETWORK_ERROR_MESSAGE =
  'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.';
const TIMEOUT_ERROR_MESSAGE =
  'Máy chủ phản hồi quá lâu, vui lòng thử lại.';

const ERROR_MESSAGES_VI: Record<string, string> = {
  'Invalid username or password': 'Sai tên đăng nhập hoặc mật khẩu.',
  'Username and password are required': 'Vui lòng nhập tên đăng nhập và mật khẩu.',
  'Username or email already exists': 'Tên đăng nhập hoặc email đã tồn tại.',
  'Invalid email format': 'Email không hợp lệ.',
  'Password must be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự.',
  'All fields are required: username, password, full_name, email, phoneNumber, role':
    'Vui lòng điền đầy đủ thông tin đăng ký.',
};

function translateApiMessage(message: string): string {
  if (ERROR_MESSAGES_VI[message]) {
    return ERROR_MESSAGES_VI[message];
  }

  if (message.startsWith('Role must be one of:')) {
    return 'Vai trò tài khoản không hợp lệ.';
  }

  return message;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; error?: string };
    const raw = data.message ?? data.error ?? `Lỗi ${response.status}`;
    return translateApiMessage(raw);
  } catch {
    return `Lỗi ${response.status}`;
  }
}

function buildHeaders(token?: string, hasBody = false, skipAuth = false): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const authToken = token ?? API_TOKEN;
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
  }

  return headers;
}

async function doFetch(
  path: string,
  init: RequestInit,
  options: ApiRequestOptions,
): Promise<Response> {
  const url = new URL(path, API_BASE_URL);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const hasBody = init.body !== undefined && init.body !== null;
  const headers = {
    ...buildHeaders(options.token, hasBody, options.skipAuth),
    ...(init.headers as Record<string, string> | undefined),
  };

  // AbortController để fetch không bao giờ "treo vĩnh viễn" trên app.
  // Lần đầu kết nối tới Render HTTPS có thể mất >30s (DNS/TLS/IPv6),
  // nếu không có timeout thì spinner "Đang xử lý…" xoay mãi không dừng
  // và người dùng phải đợi native fetch timeout (mặc định ~60s trên Android).
  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    return await fetch(url.toString(), { ...init, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(TIMEOUT_ERROR_MESSAGE, 0);
    }
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function apiGet<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await doFetch(path, { method: 'GET' }, options);

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await doFetch(
    path,
    { method: 'POST', body: JSON.stringify(body) },
    options,
  );

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiDelete<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await doFetch(path, { method: 'DELETE' }, options);

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await doFetch(
    path,
    { method: 'PATCH', body: JSON.stringify(body) },
    options,
  );

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}
