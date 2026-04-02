import { useRouter, useLocalSearchParams } from 'expo-router';
import { RegisterScreen } from '@/screens/auth';

export default function RegisterRoute() {
  const router = useRouter();
  const { sponsorId, leg } = useLocalSearchParams<{ sponsorId?: string; leg?: 'left' | 'right' }>();

  return (
    <RegisterScreen
      onBack={() => router.back()}
      sponsorIdFromLink={sponsorId}
      legFromLink={leg}
    />
  );
}
