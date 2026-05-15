import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import {
  startHealthCheck,
  stopHealthCheck,
  onChange,
  isOnline,
  countPendingOps,
} from '../lib/offline-state';

// Configure how notifications are shown when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    startHealthCheck();

    // Initial state
    setOnline(isOnline());
    countPendingOps().then(setPendingCount);

    // Subscribe to online/offline transitions
    // The callback runs twice during online transition:
    //   1st notify: state changed (count still reflects pre-flush queue)
    //   2nd notify: flush completed (count is now 0 or reduced)
    const unsub = onChange(async (onlineNow) => {
      setOnline(onlineNow);
      const count = await countPendingOps();
      setPendingCount(count);
    });

    return () => {
      unsub();
      stopHealthCheck();
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />

      {/* Offline — amber banner */}
      {!online && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠ You're offline — showing cached data
            {pendingCount > 0
              ? ` (${pendingCount} pending change${pendingCount !== 1 ? 's' : ''})`
              : ''}
          </Text>
        </View>
      )}

      {/* Online with pending writes — blue sync banner */}
      {online && pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            🔄 Syncing {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}...
          </Text>
        </View>
      )}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="client/[id]"
          options={{
            headerShown: true,
            title: 'Client',
            headerTintColor: '#E07A5F',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#F59E0B',
    paddingVertical: Platform.OS === 'android' ? 10 : 8,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
  },
  offlineText: {
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncBanner: {
    backgroundColor: '#3B82F6',
    paddingVertical: Platform.OS === 'android' ? 10 : 8,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
  },
  syncText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
