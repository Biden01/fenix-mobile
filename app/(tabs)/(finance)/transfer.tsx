import { useRouter } from 'expo-router';
import { TransferScreen } from '@/screens/finance';

export default function TransferRoute() {
  const router = useRouter();
  return <TransferScreen onBack={() => router.back()} />;
}
