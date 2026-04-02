import { useRouter } from 'expo-router';
import { ShopScreen } from '@/screens/shop';

export default function ShopRoute() {
  const router = useRouter();
  return (
    <ShopScreen
      onViewCart={() => router.push('/(tabs)/(shop)/cart')}
    />
  );
}
