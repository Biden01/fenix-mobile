import { useRouter } from 'expo-router';
import { PackagesScreen } from '@/screens/shop';

export default function PackagesRoute() {
  const router = useRouter();
  return (
    <PackagesScreen
      onBack={() => router.back()}
      onPurchaseSuccess={() => router.back()}
    />
  );
}
