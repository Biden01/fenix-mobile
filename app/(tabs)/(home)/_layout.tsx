import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const iosHeader = {
  headerShown: Platform.OS === 'ios',
  title: '',
  headerTintColor: '#FFD700',
  headerTransparent: true,
} as const;

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
      <Stack.Screen name="team" options={iosHeader} />
      <Stack.Screen name="rank" options={iosHeader} />
      <Stack.Screen name="statistics" options={iosHeader} />
      <Stack.Screen name="konkurs" options={iosHeader} />
    </Stack>
  );
}
