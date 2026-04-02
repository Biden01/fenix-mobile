import { useEffect, useRef } from 'react';
import { notificationService } from '@/api';
import { useNotificationStore } from '@/store';

export function NotificationPoller() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      const res = await notificationService.getUnreadCount();
      if ('count' in res) setUnreadCount(res.count);
    };
    poll();
    intervalRef.current = setInterval(poll, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setUnreadCount]);

  return null;
}
