/**
 * Finance Service
 * Handles balance and read-only history API calls
 */
import { apiClient } from '../client';
import { ENDPOINTS } from '../config';

// Types
export interface BalanceResponse {
  user_id: number;
  login: string;
  akwa: string;
  deposit: string;
  totalbonus: string;
  ref_bon: string;
  binarybonus: string;
  matching?: string;
  cashback: number;
  cashback_new: number;
  total_earned: number;
  rank_prize: number;
  repeat_purchase_bonus: number;
  topups_total: number;
  weekly_bonus_can_withdraw: boolean;
}

export interface VerificationStatus {
  verified: number; // 0=unverified, 1=verified, 2=rejected
  verification: {
    id: number;
    status: string; // pending | approved | rejected
    admin_comment: string | null;
    created_at: string | null;
    reviewed_at: string | null;
  } | null;
}

export interface PassiveHistoryItem {
  id: number;
  user_id: number;
  amount: number;
  month_no: number;
  paid_at: string;
}

export interface TransferHistoryItem {
  id: number;
  login_id: number;
  amount: string;
  line: number;
  status: number;
  user_login: string;
  user_id: number;
  product: string;
  sent_time: string;
}

export interface TransferHistoryResponse {
  items: TransferHistoryItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface InternalTransferItem {
  id: number;
  sender: string;
  receiver: string;
  amount: number;
  sent_time: string;
  direction: 'in' | 'out';
}

export interface InternalTransferResponse {
  items: InternalTransferItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface TransferRequest {
  receiver_login: string;
  amount: number;
}

export interface WithdrawRequest {
  amount: number;
  method: string;
  account_details?: string;
}

export interface TransferResponse {
  id: number;
  sender: string;
  receiver: string;
  amount: number;
  sent_time: string;
}

export interface WithdrawResponse {
  success: boolean;
  message: string;
  withdraw_id: number | null;
  amount: string;
  new_balance: string | null;
}

export interface WithdrawHistoryItem {
  id: number;
  amount: number;
  fio: string | null;
  phone: string | null;
  iban: string | null;
  iin: string | null;
  status: number;
  post_time: string;
}

export interface WithdrawHistoryResponse {
  items: WithdrawHistoryItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface BinaryBonusItem {
  id: number;
  amount: number;
  left_vol: number;
  right_vol: number;
  total_vol: number;
  post_date: string;
}

export interface BinaryHistoryResponse {
  items: BinaryBonusItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface BbsItem {
  id: number;
  amount: number;
  partners: number;
  post_time: string;
}

export interface BbsHistoryResponse {
  items: BbsItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface UplineItem {
  id: number;
  amount: number;
  sender_id: number;
  sender_login: string;
  sender_fio: string;
  post_time: string;
}

export interface UplineHistoryResponse {
  items: UplineItem[];
  total: number;
  page: number;
  per_page: number;
}

class FinanceService {
  async getBalance(): Promise<{ balance: BalanceResponse } | { error: string }> {
    const response = await apiClient.get<BalanceResponse>(ENDPOINTS.FINANCE.BALANCE);

    if (response.error) {
      return { error: response.error };
    }

    return { balance: response.data! };
  }

  async getTransferHistory(page = 1, perPage = 20): Promise<{ data: TransferHistoryResponse } | { error: string }> {
    const response = await apiClient.get<TransferHistoryResponse>(
      `${ENDPOINTS.FINANCE.TRANSFERS}?page=${page}&per_page=${perPage}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  async getInternalTransfers(page = 1, perPage = 20): Promise<{ data: InternalTransferResponse } | { error: string }> {
    const response = await apiClient.get<InternalTransferResponse>(
      `${ENDPOINTS.FINANCE.INTERNAL_TRANSFERS}?page=${page}&per_page=${perPage}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  async getBinaryHistory(page = 1, perPage = 20): Promise<{ data: BinaryHistoryResponse } | { error: string }> {
    const response = await apiClient.get<BinaryHistoryResponse>(
      `${ENDPOINTS.FINANCE.BINARY_HISTORY}?page=${page}&per_page=${perPage}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  async getBbsHistory(page = 1, perPage = 20): Promise<{ data: BbsHistoryResponse } | { error: string }> {
    const response = await apiClient.get<BbsHistoryResponse>(
      `${ENDPOINTS.FINANCE.BBS_HISTORY}?page=${page}&per_page=${perPage}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  async getPassiveHistory(page = 1, perPage = 20): Promise<{ data: { items: PassiveHistoryItem[]; total: number } } | { error: string }> {
    const response = await apiClient.get<{ items: PassiveHistoryItem[]; total: number }>(
      `${ENDPOINTS.FINANCE.PASSIVE_HISTORY}?page=${page}&per_page=${perPage}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  async transfer(receiverLogin: string, amount: number): Promise<{ transfer: TransferResponse } | { error: string }> {
    const response = await apiClient.post<TransferResponse>(ENDPOINTS.FINANCE.TRANSFER, { receiver_login: receiverLogin, amount });
    if (response.error) return { error: response.error };
    return { transfer: response.data! };
  }

  async withdraw(amount: number, method: string, accountDetails?: string): Promise<{ data: WithdrawResponse } | { error: string }> {
    const response = await apiClient.post<WithdrawResponse>(ENDPOINTS.FINANCE.WITHDRAW, { amount, method, account_details: accountDetails });
    if (response.error) return { error: response.error };
    return { data: response.data! };
  }

  async withdrawBonus(amount: number, method: string, accountDetails?: string): Promise<{ data: WithdrawResponse } | { error: string }> {
    const response = await apiClient.post<WithdrawResponse>(ENDPOINTS.FINANCE.WITHDRAW_BONUS, { amount, method, account_details: accountDetails });
    if (response.error) return { error: response.error };
    return { data: response.data! };
  }

  async withdrawCashback(amount: number, method: string, accountDetails?: string): Promise<{ data: WithdrawResponse } | { error: string }> {
    const response = await apiClient.post<WithdrawResponse>(ENDPOINTS.FINANCE.WITHDRAW_CASHBACK, { amount, method, account_details: accountDetails });
    if (response.error) return { error: response.error };
    return { data: response.data! };
  }

  async getWithdrawHistory(page = 1, perPage = 20): Promise<{ data: WithdrawHistoryResponse } | { error: string }> {
    const response = await apiClient.get<WithdrawHistoryResponse>(`${ENDPOINTS.FINANCE.WITHDRAW_HISTORY}?page=${page}&per_page=${perPage}`);
    if (response.error) return { error: response.error };
    return { data: response.data! };
  }

  async getWithdrawBonusHistory(page = 1, perPage = 20): Promise<{ data: WithdrawHistoryResponse } | { error: string }> {
    const response = await apiClient.get<WithdrawHistoryResponse>(`${ENDPOINTS.FINANCE.WITHDRAW_BONUS_HISTORY}?page=${page}&per_page=${perPage}`);
    if (response.error) return { error: response.error };
    return { data: response.data! };
  }

  async getWithdrawCashbackHistory(page = 1, perPage = 20): Promise<{ data: WithdrawHistoryResponse } | { error: string }> {
    const response = await apiClient.get<WithdrawHistoryResponse>(`${ENDPOINTS.FINANCE.WITHDRAW_CASHBACK_HISTORY}?page=${page}&per_page=${perPage}`);
    if (response.error) return { error: response.error };
    return { data: response.data! };
  }

  async cancelWithdraw(id: number): Promise<{ success: boolean } | { error: string }> {
    const response = await apiClient.post<{ success: boolean; refunded: number }>(ENDPOINTS.FINANCE.CANCEL_WITHDRAW(id), {});
    if (response.error) return { error: response.error };
    return { success: true };
  }

  async cancelWithdrawBonus(id: number): Promise<{ success: boolean } | { error: string }> {
    const response = await apiClient.post<{ success: boolean; refunded: number }>(ENDPOINTS.FINANCE.CANCEL_WITHDRAW_BONUS(id), {});
    if (response.error) return { error: response.error };
    return { success: true };
  }

  async cancelWithdrawCashback(id: number): Promise<{ success: boolean } | { error: string }> {
    const response = await apiClient.post<{ success: boolean; refunded: number }>(ENDPOINTS.FINANCE.CANCEL_WITHDRAW_CASHBACK(id), {});
    if (response.error) return { error: response.error };
    return { success: true };
  }

  async getUplineHistory(page = 1, perPage = 50): Promise<{ data: UplineHistoryResponse } | { error: string }> {
    const response = await apiClient.get<UplineHistoryResponse>(
      `${ENDPOINTS.FINANCE.UPLINE_HISTORY}?page=${page}&per_page=${perPage}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  async getVerificationStatus(): Promise<{ data: VerificationStatus } | { error: string }> {
    const response = await apiClient.get<VerificationStatus>(ENDPOINTS.USERS.VERIFICATION);
    if (response.error) return { error: response.error };
    return { data: response.data! };
  }
}

export const financeService = new FinanceService();
export default financeService;
