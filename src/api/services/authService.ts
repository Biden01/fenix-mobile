/**
 * Authentication Service
 * Handles login, register, and user profile API calls
 */
import { apiClient } from '../client';
import { ENDPOINTS } from '../config';

// Types
export interface LoginRequest {
  user_id: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  password: string;
  fio: string;
  email?: string;
  phone: string;
  sponsor: number;
  city?: string;
  country?: string; // KZ/KG/UZ/RU
  type?: number; // 0=Клиент, 1=Лидер
}

export interface UserProfile {
  id: number;
  user_id: string;
  fio: string;
  email: string | null;
  address: string | null;
  phone: string;
  city: string | null;
  sponsor: number;
  sponsor_login: string;
  status: number | null;
  status2: number;
  rang: number;
  type: number;
  active: number;
  akwa: string;
  deposit: string;
  leftsum: string;
  rightsum: string;
  totalsum: string;
  ref_bon: string;
  binarybonus: string;
  matching?: string;
  totalbonus: string;
  cashback: number;
  cashback_new: number;
  rank_prize?: number | string;
  repeat_purchase_bonus?: number | string;
  topups_total?: number | string;
  reg_time: string;
  paid_time: string | null;
  plan_expire: string | null;
  rang_time: string;
  avatar?: string | null;
  verified: number;
  country?: string; // KZ/KG/UZ/RU
}

export interface UserResponse {
  id: number;
  user_id: string;
  fio: string;
  email: string | null;
  phone: string;
  status: number | null;
  rang: number;
  reg_time: string;
}

export interface KonkursInfo {
  has_code: boolean;
  code: string | null;
  status: number | null;
  post_time: string | null;
}

class AuthService {
  /**
   * Login user
   */
  async login(user_id: string, password: string): Promise<{ token: string } | { error: string }> {
    const response = await apiClient.post<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      { user_id, password },
      false // No auth required for login
    );

    if (response.error) {
      return { error: response.error };
    }

    if (!response.data?.access_token) {
      return { error: 'Неверный ответ сервера' };
    }

    return { token: response.data.access_token };
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<{ user: UserResponse } | { error: string }> {
    const response = await apiClient.post<UserResponse>(
      ENDPOINTS.AUTH.REGISTER,
      data,
      false // No auth required for registration
    );

    if (response.error) {
      return { error: response.error };
    }

    return { user: response.data! };
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ profile: UserProfile } | { error: string }> {
    const response = await apiClient.get<UserProfile>(ENDPOINTS.USERS.ME);

    if (response.error) {
      return { error: response.error };
    }

    return { profile: response.data! };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<{ user: UserResponse } | { error: string }> {
    const response = await apiClient.get<UserResponse>(ENDPOINTS.USERS.BY_ID(id));

    if (response.error) {
      return { error: response.error };
    }

    return { user: response.data! };
  }

  /**
   * Get user by login
   */
  async getUserByLogin(login: string): Promise<{ user: UserResponse } | { error: string }> {
    const response = await apiClient.get<UserResponse>(ENDPOINTS.USERS.BY_LOGIN(login));

    if (response.error) {
      return { error: response.error };
    }

    return { user: response.data! };
  }

  /**
   * Forgot password — sends reset email
   */
  async forgotPassword(login: string): Promise<{ success: boolean; message: string } | { error: string }> {
    const response = await apiClient.post<{ message: string }>(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { login },
      false
    );

    if (response.error) {
      return { error: response.error };
    }

    return { success: true, message: response.data!.message };
  }

  /**
   * Refresh access token using current token (sliding window)
   */
  async refreshToken(): Promise<{ token: string } | { error: string }> {
    const response = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.REFRESH, {});

    if (response.error) {
      return { error: response.error };
    }

    if (!response.data?.access_token) {
      return { error: 'Неверный ответ сервера' };
    }

    return { token: response.data.access_token };
  }

  /**
   * Check if user exists by login or ID
   * Used for sponsor lookup during registration (public endpoint, no auth needed)
   */
  async checkUser(loginOrId: string): Promise<{ exists: boolean; user?: UserResponse } | { error: string }> {
    const response = await apiClient.get<{ exists: boolean; id: number; user_id: string; fio: string }>(
      ENDPOINTS.AUTH.CHECK_USER(loginOrId),
      false // No auth required
    );

    if (response.error) {
      return { exists: false };
    }

    return {
      exists: true,
      user: {
        id: response.data!.id,
        user_id: response.data!.user_id,
        fio: response.data!.fio,
        email: null,
        phone: '',
        status: null,
        rang: 0,
        reg_time: '',
      },
    };
  }

  async getMyKonkurs(): Promise<KonkursInfo | { error: string }> {
    const response = await apiClient.get<KonkursInfo>(ENDPOINTS.USERS.KONKURS);
    if (response.error || !response.data) {
      return { error: response.error || 'Ошибка загрузки' };
    }
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: true } | { error: string }> {
    const response = await apiClient.post<{ message: string }>(
      ENDPOINTS.USERS.CHANGE_PASSWORD,
      { old_password: oldPassword, new_password: newPassword }
    );
    if (response.error || !response.data) {
      return { error: response.error || 'Ошибка смены пароля' };
    }
    return { success: true };
  }
}

export const authService = new AuthService();
export default authService;
