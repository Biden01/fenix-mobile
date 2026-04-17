import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { LoginScreen } from '@/screens/auth';
import { authService } from '@/api';
import { useT } from '@/i18n';

export default function LoginRoute() {
  const router = useRouter();
  const t = useT();

  const handleForgotPassword = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        t.auth.forgotPasswordTitle,
        t.auth.forgotPasswordDesc,
        async (login) => {
          if (!login?.trim()) return;
          const result = await authService.forgotPassword(login.trim());
          if ('error' in result) {
            Alert.alert(t.common.error, result.error);
          } else {
            Alert.alert(t.common.ok, result.message || t.auth.instructionsSent);
          }
        },
        'plain-text'
      );
    } else {
      Alert.alert(
        t.auth.forgotPasswordTitle,
        t.auth.forgotPasswordAndroid,
        [{ text: t.common.ok }]
      );
    }
  };

  return (
    <LoginScreen
      onForgotPassword={handleForgotPassword}
    />
  );
}
