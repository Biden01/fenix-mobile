import { useRouter } from 'expo-router';
import { StatisticsScreen } from '@/screens/home';

export default function StatisticsRoute() {
  const router = useRouter();
  return <StatisticsScreen onBack={() => router.back()} />;
}
