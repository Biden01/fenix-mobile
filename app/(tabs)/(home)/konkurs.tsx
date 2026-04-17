import { useRouter } from 'expo-router';
import { KonkursScreen } from '@/screens/home';

export default function KonkursRoute() {
  const router = useRouter();
  return <KonkursScreen onBack={() => router.back()} />;
}
