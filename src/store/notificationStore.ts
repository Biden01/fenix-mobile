import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  decrement: (by?: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrement: (by = 1) => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - by) })),
}));
