import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="reports"
        options={{ presentation: Platform.OS === 'ios' ? 'modal' : 'card' }}
      />
      <Stack.Screen
        name="transfer"
        options={{ presentation: Platform.OS === 'ios' ? 'modal' : 'card' }}
      />
    </Stack>
  );
}
