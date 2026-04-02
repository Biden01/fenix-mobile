/**
 * Push Notification Service
 * Registers device for Expo push notifications and syncs token with backend.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

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
 * Safe to call multiple times — silently skips if permissions denied or not a device.
 */
export async function registerForPushNotifications(): Promise<void> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    return;
  }

  // Check / request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    // Send token to backend — fire and forget
    await apiClient.post(ENDPOINTS.USERS.PUSH_TOKEN, { token });
  } catch {
    // Non-critical — app works fine without push tokens
  }
}
