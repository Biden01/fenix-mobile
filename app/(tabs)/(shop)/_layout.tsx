import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const iosHeader = {
  headerShown: Platform.OS === 'ios',
  title: '',
  headerTintColor: '#FFD700',
  headerTransparent: true,
} as const;

export default function ShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="cart"
        options={{
          headerShown: false,
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
        }}
      />
      <Stack.Screen name="orders" options={iosHeader} />
    </Stack>
  );
}
