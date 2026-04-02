import { useRouter } from 'expo-router';
import { WithdrawalScreen } from '@/screens/finance';

export default function WithdrawalRoute() {
  const router = useRouter();
  return <WithdrawalScreen onBack={() => router.back()} />;
}
