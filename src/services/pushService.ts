/**
 * Push Notification Service
 * Registers device for Expo push notifications and syncs token with backend.
 */
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

const STORED_PUSH_TOKEN_KEY = 'zharqyn_expo_push_token';
const PENDING_PUSH_TOKEN_KEY = 'zharqyn_expo_push_token_pending';
const DEFAULT_NOTIFICATION_ROUTE = '/(tabs)/(home)/notifications';

const NOTIFICATION_ROUTE_MAP: Record<string, string> = {
  notifications: '/(tabs)/(home)/notifications',
  home: '/(tabs)/(home)',
  dashboard: '/(tabs)/(home)',
  team: '/(tabs)/(home)/team',
  rank: '/(tabs)/(home)/rank',
  statistics: '/(tabs)/(home)/statistics',
  konkurs: '/(tabs)/(home)/konkurs',
  structure: '/(tabs)/structure',
  shop: '/(tabs)/(shop)',
  cart: '/(tabs)/(shop)/cart',
  orders: '/(tabs)/(shop)/orders',
  packages: '/(tabs)/(shop)/packages',
  finance: '/(tabs)/(finance)',
  reports: '/(tabs)/(finance)/reports',
  transfer: '/(tabs)/(finance)/transfer',
  withdrawal: '/(tabs)/(finance)/withdrawal',
  profile: '/(tabs)/profile',
};

export type PushRegistrationStatus =
  | 'registered'
  | 'permission_denied'
  | 'device_required'
  | 'config_error'
  | 'sync_failed';

export interface PushRegistrationResult {
  status: PushRegistrationStatus;
  token: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  error: string | null;
}

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and register Expo push token with the backend.
 * Safe to call multiple times.
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  await ensureAndroidNotificationChannel();

  if (!Device.isDevice) {
    const error = 'Push notifications require a physical device.';
    console.warn(`[Push] ${error}`);
    return {
      status: 'device_required',
      token: null,
      permissionStatus: null,
      error,
    };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    const error = `Push notification permission not granted: ${finalStatus}`;
    console.warn(`[Push] ${error}`);
    return {
      status: 'permission_denied',
      token: null,
      permissionStatus: finalStatus,
      error,
    };
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    const error = 'Expo projectId not found for push registration.';
    console.warn(`[Push] ${error}`);
    return {
      status: 'config_error',
      token: null,
      permissionStatus: finalStatus,
      error,
    };
  }

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    const storedToken = await SecureStore.getItemAsync(STORED_PUSH_TOKEN_KEY);
    const pendingToken = await SecureStore.getItemAsync(PENDING_PUSH_TOKEN_KEY);
    const needsSync = token !== storedToken || pendingToken === token;

    if (needsSync) {
      const synced = await syncPushTokenWithBackend(token);
      if (!synced) {
        return {
          status: 'sync_failed',
          token,
          permissionStatus: finalStatus,
          error: 'Failed to sync Expo push token with backend.',
        };
      }
    } else {
      await SecureStore.setItemAsync(STORED_PUSH_TOKEN_KEY, token);
    }

    return {
      status: 'registered',
      token,
      permissionStatus: finalStatus,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown push registration error';
    console.warn('[Push] Failed to register Expo push token:', message);
    return {
      status: 'config_error',
      token: null,
      permissionStatus: finalStatus,
      error: message,
    };
  }
}

export async function retryPendingPushTokenSync(): Promise<boolean> {
  const pendingToken = await SecureStore.getItemAsync(PENDING_PUSH_TOKEN_KEY);
  if (!pendingToken) {
    return true;
  }

  return syncPushTokenWithBackend(pendingToken);
}

export async function syncPushTokenWithBackend(token: string): Promise<boolean> {
  const response = await apiClient.post<{ success?: boolean }>(
    ENDPOINTS.USERS.PUSH_TOKEN,
    { token }
  );

  if (response.error) {
    console.warn('[Push] Backend rejected Expo push token sync:', response.error);
    await SecureStore.setItemAsync(PENDING_PUSH_TOKEN_KEY, token);
    return false;
  }

  await SecureStore.setItemAsync(STORED_PUSH_TOKEN_KEY, token);
  await SecureStore.deleteItemAsync(PENDING_PUSH_TOKEN_KEY);
  return true;
}

export async function unregisterPushToken(authToken?: string | null): Promise<boolean> {
  const headers =
    authToken
      ? { Authorization: `Bearer ${authToken}` }
      : undefined;

  const deleteResponse = await apiClient.request<{ success?: boolean }>(
    ENDPOINTS.USERS.PUSH_TOKEN,
    {
      method: 'DELETE',
      requiresAuth: !authToken,
      headers,
    }
  );

  if (!deleteResponse.error) {
    await clearStoredPushTokenState();
    return true;
  }

  const fallbackResponse = await apiClient.request<{ success?: boolean }>(
    ENDPOINTS.USERS.PUSH_TOKEN,
    {
      method: 'POST',
      body: { token: null, disabled: true },
      requiresAuth: !authToken,
      headers,
    }
  );

  if (!fallbackResponse.error) {
    await clearStoredPushTokenState();
    return true;
  }

  console.warn(
    '[Push] Failed to unregister Expo push token from backend:',
    deleteResponse.error,
    fallbackResponse.error
  );
  return false;
}

export function resolveNotificationHref(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return DEFAULT_NOTIFICATION_ROUTE;
  }

  const payload = data as Record<string, unknown>;
  const nestedPayload =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : null;
  const candidates = [
    payload.url,
    payload.href,
    payload.route,
    payload.path,
    payload.screen,
    payload.target,
    payload.targetScreen,
    payload.category,
    nestedPayload?.url,
    nestedPayload?.href,
    nestedPayload?.route,
    nestedPayload?.path,
    nestedPayload?.screen,
    nestedPayload?.target,
    nestedPayload?.targetScreen,
    nestedPayload?.category,
  ];

  for (const candidate of candidates) {
    const href = normalizeNotificationRoute(candidate);
    if (href) {
      return href;
    }
  }

  return DEFAULT_NOTIFICATION_ROUTE;
}

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFD700',
  });
}

function getExpoProjectId(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

function normalizeNotificationRoute(candidate: unknown): string | null {
  if (typeof candidate !== 'string') {
    return null;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  const normalizedKey = trimmed
    .toLowerCase()
    .replace(/^\(tabs\)\//, '')
    .replace(/^\//, '');

  return NOTIFICATION_ROUTE_MAP[normalizedKey] ?? null;
}

async function clearStoredPushTokenState(): Promise<void> {
  await SecureStore.deleteItemAsync(STORED_PUSH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(PENDING_PUSH_TOKEN_KEY);
}
