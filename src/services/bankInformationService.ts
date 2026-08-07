import { apiGet, apiPatch } from './apiClient';
import { getAuthToken } from './authService';

export interface BankInformation {
  bank_name: string;
  account_holder: string;
  account_number_masked: string;
  has_account_number: boolean;
  has_bank_info: boolean;
}

async function requireToken() {
  const token = await getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập.');
  return token;
}

export async function fetchBankInformation(): Promise<BankInformation> {
  const token = await requireToken();
  const response = await apiGet<{
    success: boolean;
    data: { bank_info: BankInformation };
  }>('/profile', { token });
  return response.data.bank_info;
}

export async function updateBankInformation(payload: {
  bank_name: string;
  account_holder: string;
  bank_account_number: string;
  current_password: string;
}): Promise<BankInformation> {
  const token = await requireToken();
  const response = await apiPatch<{
    success: boolean;
    data: { bank_info: BankInformation };
  }>('/profile/bank-information', payload, { token });
  return response.data.bank_info;
}
