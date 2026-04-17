import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
        }}
      />
      <Stack.Screen name="team" />
      <Stack.Screen name="rank" />
      <Stack.Screen name="statistics" />
      <Stack.Screen name="konkurs" />
    </Stack>
  );
}
