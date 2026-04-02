import { useAuthStore } from '@/store';
import { ProfileScreen } from '@/screens/profile';

export default function ProfileRoute() {
  const { logout } = useAuthStore();
  return <ProfileScreen onLogout={logout} />;
}
