import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { OrdersScreen } from '@/screens/shop';

export default function OrdersRoute() {
  const router = useRouter();
  return <OrdersScreen onBack={() => router.back()} hideHeader={Platform.OS === 'ios'} />;
}
