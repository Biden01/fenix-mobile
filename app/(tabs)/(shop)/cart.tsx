import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CartScreen } from '@/screens/shop';

export default function CartRoute() {
  const router = useRouter();
  return (
    <CartScreen
      onBack={() => router.back()}
      onSuccess={() => router.push('/(tabs)/(shop)/orders')}
      isModal={Platform.OS === 'ios'}
    />
  );
}
