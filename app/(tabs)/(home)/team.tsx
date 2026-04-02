import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { TeamScreen } from '@/screens/home';

export default function TeamRoute() {
  const router = useRouter();
  return <TeamScreen onBack={() => router.back()} hideHeader={Platform.OS === 'ios'} />;
}
