import { useRouter } from 'expo-router';
import { DashboardScreen } from '@/screens/home';

export default function DashboardRoute() {
  const router = useRouter();
  return (
    <DashboardScreen
      onNotificationsPress={() => router.push('/(tabs)/(home)/notifications')}
      onTeamPress={() => router.push('/(tabs)/(home)/team')}
      onRankPress={() => router.push('/(tabs)/(home)/rank')}
      onStatisticsPress={() => router.push('/(tabs)/(home)/statistics')}
      onKonkursPress={() => router.push('/(tabs)/(home)/konkurs')}
    />
  );
}
