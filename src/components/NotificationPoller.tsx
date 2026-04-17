import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { usePathname, useRouter, type Href } from 'expo-router';
import { notificationService } from '@/api';
import { useNotificationStore } from '@/store';
import {
  registerForPushNotifications,
  resolveNotificationHref,
  retryPendingPushTokenSync,
} from '@/services/pushService';

function getNotificationResponseKey(response: Notifications.NotificationResponse): string {
  return `${response.notification.request.identifier}:${response.actionIdentifier}`;
}

export function NotificationPoller() {
  const router = useRouter();
  const pathname = usePathname();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathnameRef = useRef(pathname);
  const lastHandledResponseRef = useRef<string | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const refreshUnreadCount = async () => {
      const res = await notificationService.getUnreadCount();
      if (isMounted && 'count' in res) {
        setUnreadCount(res.count);
      }
    };

    const handleNotificationResponse = async (
      response: Notifications.NotificationResponse
    ) => {
      const responseKey = getNotificationResponseKey(response);
      if (lastHandledResponseRef.current === responseKey) {
        return;
      }

      lastHandledResponseRef.current = responseKey;

      await refreshUnreadCount();

      const href = resolveNotificationHref(response.notification.request.content.data);
      if (pathnameRef.current !== href) {
        router.push(href as Href);
      }

      await Notifications.clearLastNotificationResponseAsync();
    };

    void refreshUnreadCount();
    intervalRef.current = setInterval(() => {
      void refreshUnreadCount();
    }, 60_000);

    void retryPendingPushTokenSync().then((synced) => {
      if (!synced) {
        console.warn('[Push] Pending Expo push token sync is still failing.');
      }
    });

    void registerForPushNotifications().then((result) => {
      if (result.status !== 'registered') {
        console.warn('[Push] Registration status:', result.status, result.error);
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      void refreshUnreadCount();
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void handleNotificationResponse(response);
      }
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        void handleNotificationResponse(response);
      }
    });

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [router, setUnreadCount]);

  return null;
}
