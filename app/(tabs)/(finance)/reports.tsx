import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ReportsScreen } from '@/screens/finance';

export default function ReportsRoute() {
  const router = useRouter();
  return <ReportsScreen onBack={() => router.back()} isModal={Platform.OS === 'ios'} />;
}
