import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="client/[id]" options={{ headerShown: true, title: 'Client', headerTintColor: '#E07A5F' }} />
      </Stack>
    </>
  );
}
