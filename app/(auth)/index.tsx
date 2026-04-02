import { useRouter } from 'expo-router';
import { SplashScreen } from '@/screens/auth';

export default function SplashRoute() {
  const router = useRouter();
  return (
    <SplashScreen
      onAnimationComplete={() => router.replace('/(auth)/login')}
    />
  );
}
