import { useRouter } from 'expo-router';
import { TeamScreen } from '@/screens/home';

export default function TeamRoute() {
  const router = useRouter();
  return <TeamScreen onBack={() => router.back()} />;
}
