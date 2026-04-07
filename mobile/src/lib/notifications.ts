import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ExpandedOccurrence } from './rrule';

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Critical',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'bell',
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
    });
  }
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowProvisional: true,
    },
  });

  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function getDevicePushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data as string;
  } catch {
    return null;
  }
}

export async function scheduleServiceReminders(occurrences: ExpandedOccurrence[]): Promise<void> {
  // Cancel all existing service reminders
  // Cancel all scheduled notifications and re-schedule
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule new reminders (max 64 to stay within iOS limits)
  const toSchedule = occurrences
    .filter(o => o.event.reminder_minutes_before > 0 && o.event.duration_minutes > 0)
    .slice(0, 64);

  for (const occ of toSchedule) {
    const triggerDate = new Date(occ.date.getTime() - occ.event.reminder_minutes_before * 60 * 1000);

    if (triggerDate <= new Date()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: occ.event.title_ar,
        body: occ.event.description_ar || undefined,
        categoryIdentifier: 'service-reminder',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'الكنيسة القبطية بموسكو',
      body: 'هذا إشعار تجريبي — Test notification — Тестовое уведомление',
      sound: 'default',
    },
    trigger: null,
  });
}
