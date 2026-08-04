import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost } from './apiClient';
import { getAuthToken } from './authService';

const PENDING_PAYMENT_KEY = '@mangaka/pending-payment';

export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed';

export interface CoinPackage {
  _id: string;
  name: string;
  description?: string;
  price_vnd: number;
  coin_amount: number;
  bonus_coin: number;
  total_coin: number;
  coin_amount_coin?: string;
  bonus_coin_display?: string;
  total_coin_display?: string;
}

export interface Wallet {
  _id: string;
  balance: number;
  total_deposited: number;
  total_spent: number;
  balance_coin?: string;
  total_deposited_coin?: string;
  total_spent_coin?: string;
}

export interface Payment {
  _id: string;
  order_code: number;
  amount_vnd: number;
  coin_amount: number;
  coin_amount_coin?: string;
  status: PaymentStatus;
  checkout_url?: string;
  createdAt: string;
  paid_at?: string | null;
  expires_at?: string | null;
  coin_package_id?: Pick<CoinPackage, 'name' | 'price_vnd' | 'coin_amount' | 'bonus_coin'>;
}

export interface CreatedPayment {
  payment_id: string;
  order_code: number;
  amount_vnd: number;
  coin_amount: number;
  coin_amount_coin?: string;
  checkout_url: string;
  expires_at?: string;
  mock: boolean;
}

export interface PendingPayment {
  paymentId: string;
  orderCode: number;
  coinAmount: number;
  coinAmountCoin?: string;
  checkoutUrl: string;
  createdAt: string;
  expiresAt: string;
}

async function requireToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập để sử dụng ví.');
  return token;
}

export async function fetchCoinPackages(): Promise<CoinPackage[]> {
  const response = await apiGet<{ success: boolean; data: CoinPackage[] }>('/payments/packages');
  return response.data;
}

export async function fetchWallet(): Promise<Wallet> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: Wallet }>('/wallet', { token });
  return response.data;
}

export async function fetchMyPayments(page = 1, limit = 20): Promise<Payment[]> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: Payment[] }>('/payments/mine', {
    token,
    params: { page, limit },
  });
  return response.data;
}

export async function fetchPayment(paymentId: string): Promise<Payment> {
  const token = await requireToken();
  const response = await apiGet<{ success: boolean; data: Payment }>(
    `/payments/${encodeURIComponent(paymentId)}`,
    { token },
  );
  return response.data;
}

export async function createPayment(packageId: string): Promise<CreatedPayment> {
  const token = await requireToken();
  const response = await apiPost<{ success: boolean; data: CreatedPayment }>(
    '/payments/create',
    { package_id: packageId },
    { token },
  );
  return response.data;
}

export async function savePendingPayment(payment: CreatedPayment): Promise<PendingPayment> {
  const pending: PendingPayment = {
    paymentId: payment.payment_id,
    orderCode: payment.order_code,
    coinAmount: payment.coin_amount,
    coinAmountCoin: payment.coin_amount_coin,
    checkoutUrl: payment.checkout_url,
    createdAt: new Date().toISOString(),
    expiresAt: payment.expires_at ?? new Date(Date.now() + 120_000).toISOString(),
  };
  await AsyncStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending));
  return pending;
}

export async function getPendingPayment(): Promise<PendingPayment | null> {
  try {
    const value = await AsyncStorage.getItem(PENDING_PAYMENT_KEY);
    return value ? (JSON.parse(value) as PendingPayment) : null;
  } catch {
    return null;
  }
}

export async function clearPendingPayment(paymentId?: string): Promise<void> {
  if (paymentId) {
    const pending = await getPendingPayment();
    if (pending && pending.paymentId !== paymentId) return;
  }
  await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
}
