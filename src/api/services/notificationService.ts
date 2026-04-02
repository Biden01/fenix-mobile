/**
 * Notification Service
 * Handles notification API calls
 */
import { apiClient } from '../client';
import { ENDPOINTS } from '../config';

// Types
export interface NotificationItem {
  id: number;
  title: string;
  user_id: number;
  category: string;
  post_time: string;
  is_read: number;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface CategoriesResponse {
  categories: string[];
}

class NotificationService {
  /**
   * Get notifications list
   */
  async getNotifications(page = 1, perPage = 20, category?: string): Promise<{ data: NotificationListResponse } | { error: string }> {
    let url = `${ENDPOINTS.NOTIFICATIONS.LIST}?page=${page}&per_page=${perPage}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await apiClient.get<NotificationListResponse>(url);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  /**
   * Get single notification
   */
  async getNotification(id: number): Promise<{ notification: NotificationItem } | { error: string }> {
    const response = await apiClient.get<NotificationItem>(ENDPOINTS.NOTIFICATIONS.BY_ID(id));

    if (response.error) {
      return { error: response.error };
    }

    return { notification: response.data! };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ count: number } | { error: string }> {
    const response = await apiClient.get<UnreadCountResponse>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);

    if (response.error) {
      return { error: response.error };
    }

    return { count: response.data!.count };
  }

  /**
   * Get notification categories
   */
  async getCategories(): Promise<{ categories: string[] } | { error: string }> {
    const response = await apiClient.get<CategoriesResponse>(ENDPOINTS.NOTIFICATIONS.CATEGORIES);

    if (response.error) {
      return { error: response.error };
    }

    return { categories: response.data!.categories };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: number): Promise<{ success: boolean } | { error: string }> {
    const response = await apiClient.post<{ message: string }>(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {});

    if (response.error) {
      return { error: response.error };
    }

    return { success: true };
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(): Promise<{ success: boolean } | { error: string }> {
    const response = await apiClient.post<{ message: string }>(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {});

    if (response.error) {
      return { error: response.error };
    }

    return { success: true };
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: number): Promise<{ success: boolean } | { error: string }> {
    const response = await apiClient.delete<{ message: string }>(ENDPOINTS.NOTIFICATIONS.BY_ID(id));

    if (response.error) {
      return { error: response.error };
    }

    return { success: true };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
