import { useRouter } from 'expo-router';
import { FinanceScreen } from '@/screens/finance';

export default function FinanceRoute() {
  const router = useRouter();
  return (
    <FinanceScreen
      onViewReports={() => router.push('/(tabs)/(finance)/reports')}
      onTransfer={() => router.push('/(tabs)/(finance)/transfer')}
    />
  );
}
