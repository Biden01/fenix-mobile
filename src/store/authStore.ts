import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authService, apiClient, UserProfile } from '../api';
import { ENDPOINTS } from '../api/config';

// Custom storage for Expo SecureStore
const secureStorage = {
  getItem: async (name: string) => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

// User interface matching API response
export interface User {
  id: number;
  user_id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  rank: number;
  type: number;         // 0=client, 1=leader
  sponsorId: number;
  sponsorLogin: string;
  status: number | null;
  active: number;
  balance: number;      // akwa
  deposit: number;
  referralBonus: number; // ref_bon
  binaryBonus: number;
  matchingBonus: number;
  totalBonus: number;
  cashback: number;
  cashback_new: number;
  rankPrize: number;
  repeatPurchaseBonus: number;
  topupsTotal: number;
  leftSum: number;
  rightSum: number;
  totalSum: number;
  leftLegLink: string;
  rightLegLink: string;
  registeredAt: string;
  paidTime: string | null;
  planExpire: string | null;
  rankTime: string;
  avatar: string | null;
  verified: number;     // 0=unverified, 1=verified, 2=rejected
  country: string;      // KZ/KG/UZ/RU
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (userId: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  deleteAccount: () => Promise<boolean>;
  refreshProfile: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

interface RegisterData {
  password: string;
  fio: string;
  phone: string;
  type: number;
  email?: string;
  sponsor: number;
  city?: string;
  country?: string;
}

// Convert API response to User object
const mapProfileToUser = (profile: UserProfile): User => ({
  id: profile.id,
  user_id: profile.user_id,
  name: profile.fio,
  email: profile.email,
  phone: profile.phone,
  address: profile.address,
  city: profile.city,
  rank: profile.rang,
  type: profile.type ?? 0,
  sponsorId: profile.sponsor,
  sponsorLogin: profile.sponsor_login,
  status: profile.status,
  active: profile.active,
  balance: parseFloat(profile.akwa) || 0,
  deposit: parseFloat(profile.deposit) || 0,
  referralBonus: parseFloat(profile.ref_bon || '0') || 0,
  binaryBonus: parseFloat(profile.binarybonus) || 0,
  matchingBonus: parseFloat(profile.matching || '0') || 0,
  totalBonus: parseFloat(profile.totalbonus) || 0,
  cashback: profile.cashback || 0,
  cashback_new: profile.cashback_new || 0,
  rankPrize: parseFloat(String(profile.rank_prize || '0')) || 0,
  repeatPurchaseBonus: parseFloat(String(profile.repeat_purchase_bonus || '0')) || 0,
  topupsTotal: parseFloat(String(profile.topups_total || '0')) || 0,
  leftSum: parseFloat(profile.leftsum) || 0,
  rightSum: parseFloat(profile.rightsum) || 0,
  totalSum: parseFloat(profile.totalsum) || 0,
  leftLegLink: `https://fenixapp.kz/ref/${profile.user_id}/left`,
  rightLegLink: `https://fenixapp.kz/ref/${profile.user_id}/right`,
  registeredAt: profile.reg_time,
  paidTime: profile.paid_time,
  planExpire: profile.plan_expire,
  rankTime: profile.rang_time,
  avatar: profile.avatar || null,
  verified: profile.verified ?? 0,
  country: profile.country || 'KZ',
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (userId: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Call login API
          const loginResult = await authService.login(userId, password);

          if ('error' in loginResult) {
            set({ isLoading: false, error: loginResult.error });
            return false;
          }

          // Store token in memory immediately so apiClient can use it
          apiClient.setToken(loginResult.token);
          set({ token: loginResult.token });

          // Fetch user profile
          const profileResult = await authService.getProfile();

          if ('error' in profileResult) {
            set({ isLoading: false, error: profileResult.error, token: null });
            return false;
          }

          const user = mapProfileToUser(profileResult.profile);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Ошибка входа',
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          // Call register API
          const registerResult = await authService.register({
            password: data.password,
            fio: data.fio,
            phone: data.phone,
            email: data.email,
            sponsor: data.sponsor,
            city: data.city,
            country: data.country,
            type: data.type,
          });

          if ('error' in registerResult) {
            set({ isLoading: false, error: registerResult.error });
            return false;
          }

          // Account created with active=0 — requires admin activation
          // Cannot auto-login, just signal success
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Ошибка регистрации',
          });
          return false;
        }
      },

      logout: () => {
        apiClient.setToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      deleteAccount: async () => {
        try {
          const response = await apiClient.delete<{ success: boolean }>(ENDPOINTS.USERS.DELETE_ACCOUNT);
          if (response.error) return false;
          apiClient.setToken(null);
          set({ user: null, token: null, isAuthenticated: false, error: null });
          return true;
        } catch {
          return false;
        }
      },

      refreshProfile: async () => {
        const { token } = get();
        if (!token) return false;

        try {
          const profileResult = await authService.getProfile();

          if ('error' in profileResult) {
            return false;
          }

          const user = mapProfileToUser(profileResult.profile);
          set({ user });

          return true;
        } catch {
          return false;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'fenix-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState: any, currentState: AuthState) => {
        const merged = { ...currentState, ...persistedState };
        // Ensure user object has all required numeric fields with defaults
        if (merged.user) {
          merged.user = {
            ...merged.user,
            id: merged.user.id ?? 0,
            user_id: merged.user.user_id ?? '',
            name: merged.user.name ?? '',
            email: merged.user.email ?? null,
            phone: merged.user.phone ?? '',
            address: merged.user.address ?? null,
            city: merged.user.city ?? null,
            rank: merged.user.rank ?? 0,
            type: merged.user.type ?? 0,
            sponsorId: merged.user.sponsorId ?? 0,
            sponsorLogin: merged.user.sponsorLogin ?? '',
            status: merged.user.status ?? null,
            active: merged.user.active ?? 0,
            balance: merged.user.balance ?? 0,
            deposit: merged.user.deposit ?? 0,
            referralBonus: merged.user.referralBonus ?? 0,
            binaryBonus: merged.user.binaryBonus ?? 0,
            matchingBonus: merged.user.matchingBonus ?? 0,
            totalBonus: merged.user.totalBonus ?? 0,
            cashback: merged.user.cashback ?? 0,
            cashback_new: merged.user.cashback_new ?? 0,
            rankPrize: merged.user.rankPrize ?? 0,
            repeatPurchaseBonus: merged.user.repeatPurchaseBonus ?? 0,
            topupsTotal: merged.user.topupsTotal ?? 0,
            leftSum: merged.user.leftSum ?? 0,
            rightSum: merged.user.rightSum ?? 0,
            totalSum: merged.user.totalSum ?? 0,
            leftLegLink: merged.user.leftLegLink ?? '',
            rightLegLink: merged.user.rightLegLink ?? '',
            registeredAt: merged.user.registeredAt ?? '',
            paidTime: merged.user.paidTime ?? null,
            planExpire: merged.user.planExpire ?? null,
            rankTime: merged.user.rankTime ?? '',
            verified: merged.user.verified ?? 0,
            country: merged.user.country ?? 'KZ',
          };
        }
        return merged;
      },
    }
  )
);
