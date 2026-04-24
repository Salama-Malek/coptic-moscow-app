/**
 * Notification layer.
 *
 * - Incoming FCM messages: received via @react-native-firebase/messaging.
 * - Display: built via @notifee/react-native, which supports BubbleMetadata
 *   (Android 11+ floating-bubble UX).
 * - Local service reminders: still scheduled via expo-notifications — it's
 *   simpler for recurring local alarms, no remote push involved.
 */

import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  AuthorizationStatus,
  type Notification,
} from '@notifee/react-native';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ExpandedOccurrence } from './rrule';

const CHANNEL_DEFAULT = 'default';
const CHANNEL_CRITICAL = 'critical';

// The "person" the bubble represents. MessagingStyle requires this; Android
// uses it to promote the notification to the Conversations section on Android 12+.
const PARISH_PERSON = {
  name: 'الكنيسة القبطية بموسكو',
  id: 'parish',
  important: true,
};

// =========================================================================
// Channel setup (Android only)
// =========================================================================

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id: CHANNEL_DEFAULT,
    name: 'Announcements',
    description: 'Parish announcements and service reminders',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    vibration: true,
  });

  await notifee.createChannel({
    id: CHANNEL_CRITICAL,
    name: 'Critical',
    description: 'Urgent announcements — overrides Do Not Disturb',
    importance: AndroidImportance.HIGH,
    sound: 'bell',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    bypassDnd: true,
  });
}

// =========================================================================
// Permission (covers Android 13+ POST_NOTIFICATIONS + iOS)
// =========================================================================

export async function requestPermissions(): Promise<boolean> {
  const result = await notifee.requestPermission();
  return (
    result.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    result.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

// =========================================================================
// FCM device token
// =========================================================================

export async function getDevicePushToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch (err) {
    console.warn('[notifications] messaging().getToken failed:', err);
    return null;
  }
}

// =========================================================================
// Display an announcement — MessagingStyle + BubbleMetadata
// =========================================================================

type AnnouncementPayload = {
  id: string;
  title: string;
  body: string;
  priority?: 'normal' | 'high' | 'critical';
};

export async function displayAnnouncement(p: AnnouncementPayload): Promise<void> {
  const priority = p.priority || 'normal';
  const channelId = priority === 'critical' ? CHANNEL_CRITICAL : CHANNEL_DEFAULT;

  const notification: Notification = {
    id: p.id,
    title: p.title,
    body: p.body,
    data: {
      type: 'announcement',
      announcementId: p.id,
    },
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      importance:
        priority === 'critical'
          ? AndroidImportance.HIGH
          : AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PUBLIC,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      // MessagingStyle with a Person → eligible for Conversation section on
      // Android 12+. Users can long-press and pick "Show in floating bubble"
      // to pop out subsequent messages from this conversation as a bubble.
      style: {
        type: AndroidStyle.MESSAGING,
        person: PARISH_PERSON,
        messages: [
          {
            text: p.body,
            timestamp: Date.now(),
          },
        ],
      },
    },
  };

  await notifee.displayNotification(notification);
}

// =========================================================================
// Handle incoming FCM message (foreground + background)
// =========================================================================

export async function handleIncomingFcm(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const data = remoteMessage?.data;
  if (!data) return;

  // We only know how to render announcements right now. Anything else is ignored.
  if (data.type !== 'announcement') return;

  const priority = (data.priority || 'normal') as 'normal' | 'high' | 'critical';
  await displayAnnouncement({
    id: String(data.id || data.announcementId || Date.now()),
    title: String(data.title || ''),
    body: String(data.body || ''),
    priority,
  });
}

// =========================================================================
// Test notification (used from Settings screen)
// =========================================================================

export async function sendTestNotification(): Promise<void> {
  await displayAnnouncement({
    id: `test-${Date.now()}`,
    title: 'Test notification',
    body: 'If you can see this, notifications are working.',
    priority: 'normal',
  });
}

// =========================================================================
// Local service reminders — still expo-notifications (local only, no FCM)
// =========================================================================

export async function scheduleServiceReminders(
  occurrences: ExpandedOccurrence[],
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const occ of occurrences) {
    const reminderMinsBefore = occ.event.reminder_minutes_before;
    if (reminderMinsBefore <= 0) continue;

    const reminderTime = new Date(
      occ.date.getTime() - reminderMinsBefore * 60000,
    );
    if (reminderTime <= new Date()) continue;

    const title =
      occ.event.title_ar || occ.event.title_ru || occ.event.title_en || 'Service';
    const body = `Starting in ${reminderMinsBefore} minutes`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
  }
}
