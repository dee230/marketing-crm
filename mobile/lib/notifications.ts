// Push notification registration and handling
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from './api';

/**
 * Request notification permissions and get the Expo push token.
 * Returns the token string, or null if unavailable.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Android: create a notification channel (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E07A5F',
    });
  }

  // Check if running on a physical device (push tokens don't work on emulators)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error('Project ID not found in app config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenData.data;
    console.log('Expo push token:', token);
  } catch (e) {
    console.error('Failed to get push token:', e);
  }

  return token;
}

/**
 * Call this after successful login to register the device for push notifications.
 * Silently skips on failure — push is a nice-to-have, not a requirement.
 */
export async function setupPushNotificationsAfterLogin() {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      // Send the token to our server
      await registerPushToken(pushToken);
    }
  } catch (e) {
    console.error('Failed to setup push notifications:', e);
  }
}

/**
 * Call on logout to clear the push token on the server.
 */
export async function teardownPushNotifications() {
  try {
    await unregisterPushToken();
  } catch (e) {
    console.error('Failed to teardown push notifications:', e);
  }
}
