import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { kind?: string }
        | undefined;
      if (data?.kind === 'morning') {
        router.push('/morning-report');
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );
    return () => sub.remove();
  }, [router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
