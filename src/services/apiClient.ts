import { API_BASE_URL, API_TOKEN, ApiError } from '../config/api';

export { ApiError };

interface ApiRequestOptions {
  token?: string;
  params?: Record<string, string | number | undefined>;
  /** Không gửi Authorization header (dùng cho /auth/login, /auth/register) */
  skipAuth?: boolean;
}

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

export async function apiGet<T>(
  path: string,
  { token = API_TOKEN, params, skipAuth = false }: ApiRequestOptions = {},
): Promise<T> {
  const url = new URL(path, API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      headers: buildHeaders(token, false, skipAuth),
    });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.', 0);
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  { token, skipAuth = false }: { token?: string; skipAuth?: boolean } = {},
): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers: buildHeaders(token, true, skipAuth),
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.', 0);
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}
