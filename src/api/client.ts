/**
 * API Client
 * HTTP client for making API requests
 */
import { API_CONFIG } from './config';
import * as SecureStore from 'expo-secure-store';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private _token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Set token in memory (avoids race condition with SecureStore persistence)
   */
  setToken(token: string | null) {
    this._token = token;
  }

  /**
   * Get stored auth token.
   * Checks in-memory token first, then falls back to SecureStore.
   */
  private async getToken(): Promise<string | null> {
    if (this._token) {
      return this._token;
    }

    try {
      const authData = await SecureStore.getItemAsync('zharqyn-auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed.state?.token || null;
        if (token) {
          this._token = token;
        }
        return token;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Make an HTTP request
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = await this.getToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: null,
          error: responseData?.detail || `HTTP Error: ${response.status}`,
          status: response.status,
        };
      }

      return {
        data: responseData as T,
        error: null,
        status: response.status,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return {
          data: null,
          error: 'Превышено время ожидания запроса',
          status: 408,
        };
      }

      return {
        data: null,
        error: error.message || 'Ошибка сети',
        status: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requiresAuth });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, requiresAuth });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
