import { useRouter } from 'expo-router';
import { RankScreen } from '@/screens/home';

export default function RankRoute() {
  const router = useRouter();
  return <RankScreen onBack={() => router.back()} />;
}
