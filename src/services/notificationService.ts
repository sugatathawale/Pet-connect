import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants/config';
import type { AppNotification, NotificationKind } from '@/types';
import { createId, storage } from './storage';

/**
 * In-app notification feed plus local device notifications.
 *
 * Deliberately local-only: remote push needs a development build and credentials,
 * so V1 uses local notifications, which run in Expo Go on both platforms. The
 * in-app feed is the source of truth the UI renders.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Required from SDK 53 onward; without these the banner never appears.
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  },

  /** Android needs an explicit channel or notifications arrive silently. */
  async configureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pet Connect',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  },

  async list(): Promise<AppNotification[]> {
    const items = await storage.get<AppNotification[]>(STORAGE_KEYS.notifications, []);
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async unreadCount(): Promise<number> {
    const items = await this.list();
    return items.filter((n) => !n.read).length;
  },

  /** Adds to the in-app feed and fires a device notification. */
  async push(
    kind: NotificationKind,
    title: string,
    body: string,
    href?: string,
  ): Promise<AppNotification> {
    const items = await storage.get<AppNotification[]>(STORAGE_KEYS.notifications, []);

    const notification: AppNotification = {
      id: createId('notif'),
      kind,
      title,
      body,
      href,
      createdAt: new Date().toISOString(),
      read: false,
    };
    await storage.set(STORAGE_KEYS.notifications, [notification, ...items]);

    // A denied permission must not break the in-app feed, so this is best-effort.
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: href ? { href } : undefined },
        trigger: null,
      });
    } catch (error) {
      console.warn('[notifications] could not present notification', error);
    }

    return notification;
  },

  /** Reminds the owner the day before an availability window opens. */
  async scheduleAvailabilityReminder(petName: string, startDate: string): Promise<void> {
    const reminderAt = new Date(startDate);
    reminderAt.setDate(reminderAt.getDate() - 1);
    reminderAt.setHours(9, 0, 0, 0);

    if (reminderAt.getTime() <= Date.now()) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${petName}'s availability starts tomorrow`,
          body: 'Review your settings so nearby owners can reach you.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderAt,
        },
      });
    } catch (error) {
      console.warn('[notifications] could not schedule reminder', error);
    }
  },

  async markAllRead(): Promise<void> {
    const items = await storage.get<AppNotification[]>(STORAGE_KEYS.notifications, []);
    await storage.set(
      STORAGE_KEYS.notifications,
      items.map((n) => ({ ...n, read: true })),
    );
  },

  async markRead(id: string): Promise<void> {
    const items = await storage.get<AppNotification[]>(STORAGE_KEYS.notifications, []);
    await storage.set(
      STORAGE_KEYS.notifications,
      items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  },

  async clear(): Promise<void> {
    await storage.set(STORAGE_KEYS.notifications, []);
  },
};
