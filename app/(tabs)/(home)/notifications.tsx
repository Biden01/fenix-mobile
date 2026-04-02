import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationsScreen } from '@/screens/profile';

export default function NotificationsRoute() {
  const router = useRouter();
  return <NotificationsScreen onBack={() => router.back()} isModal={Platform.OS === 'ios'} />;
}
