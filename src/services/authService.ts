import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, LoginResponse, RegisterPayload, RegisterResponse } from '../types/auth';
import { apiGet, apiPost } from './apiClient';

const TOKEN_KEY = '@mangaka/auth-token';
const USER_KEY = '@mangaka/auth-user';

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    ...user,
    userId: String(user.userId),
    accountId: String(user.accountId),
    fullName: user.fullName ?? (user as AuthUser & { full_name?: string }).full_name ?? '',
  };
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return normalizeAuthUser(JSON.parse(raw) as AuthUser);
  } catch {
    return null;
  }
}

export async function saveAuthSession(token: string, user: AuthUser): Promise<void> {
  const normalizedUser = normalizeAuthUser(user);
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(normalizedUser)],
  ]);
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await apiPost<LoginResponse>(
    '/auth/login',
    { username, password },
    { skipAuth: true },
  );

  const user = normalizeAuthUser(response.user);
  await saveAuthSession(response.token, user);

  return { ...response, user };
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>('/auth/register', payload, { skipAuth: true });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await apiGet<{ success: boolean; user: AuthUser }>('/auth/me', { token });
  const user = normalizeAuthUser(response.user);
  await saveAuthSession(token, user);
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return Boolean(token);
}
