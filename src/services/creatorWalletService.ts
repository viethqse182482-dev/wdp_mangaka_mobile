import { apiGet, apiPost } from './apiClient';
import { getAuthToken } from './authService';

export interface CreatorWallet {
  _id: string;
  pending_balance: number;
  available_balance: number;
  total_revenue: number;
  total_withdrawn: number;
  pending_balance_vnd?: number;
  available_balance_vnd?: number;
  current_balance_vnd?: number;
  config: {
    coin_to_vnd_rate: number;
    platform_fee_percent: number;
    revenue_pending_hours: number;
  };
}

export type RevenueStatus = 'pending' | 'available' | 'withdrawn';

export interface CreatorRevenue {
  _id: string;
  coin_amount: number;
  vnd_amount: number;
  status: RevenueStatus;
  share_percentage: number;
  available_at: string;
  createdAt: string;
  series_id?: { _id: string; name: string } | null;
  chapter_id?: { _id: string; chapter_number: number; title: string } | null;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';

export interface CreatorWithdrawal {
  _id: string;
  coin_amount: number;
  coin_unit_scale: number;
  vnd_amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  processed_at?: string | null;
  bank_snapshot?: {
    bank_name?: string;
    account_holder?: string;
    account_number_masked?: string;
  } | null;
}

async function requireToken() {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập để xem ví.');
  return token;
}

export async function fetchCreatorWallet(): Promise<CreatorWallet> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: CreatorWallet }>('/wallet', { token });
  return response.data;
}

export async function fetchCreatorRevenues(): Promise<CreatorRevenue[]> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: CreatorRevenue[] }>('/wallet/revenues', {
    token,
    params: { page: 1, limit: 50 },
  });
  return response.data;
}

export async function fetchCreatorWithdrawals(): Promise<CreatorWithdrawal[]> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: CreatorWithdrawal[] }>('/withdrawals/mine', { token });
  return response.data;
}

export async function requestCreatorWithdrawal(): Promise<CreatorWithdrawal> {
  const token = await requireToken();
  const response = await apiPost<{ success: boolean; data: CreatorWithdrawal }>(
    '/withdrawals',
    {},
    { token },
  );
  return response.data;
}
