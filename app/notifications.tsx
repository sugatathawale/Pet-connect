import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { notificationService } from '@/services/notificationService';
import type { NotificationKind } from '@/types';
import { formatRelativeTime } from '@/utils/date';

const ICONS: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  match: 'heart',
  message: 'chatbubble',
  nearby_available: 'location',
  availability_reminder: 'alarm',
  listing_response: 'home',
};

const TINTS: Record<NotificationKind, string> = {
  match: colors.primary,
  message: colors.accent,
  nearby_available: colors.success,
  availability_reminder: colors.warning,
  listing_response: colors.male,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationsRead, clearNotifications, refresh } = useApp();

  // Mark everything read on open so the badge clears.
  useEffect(() => {
    markNotificationsRead();
  }, [markNotificationsRead]);

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await notificationService.markRead(item.id);
              await refresh();
              if (item.href) router.push(item.href as never);
            }}
            style={({ pressed }) => [
              styles.row,
              !item.read && styles.unread,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${TINTS[item.kind]}1A` }]}>
              <Ionicons name={ICONS[item.kind]} size={18} color={TINTS[item.kind]} />
            </View>

            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          notifications.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={clearNotifications}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Nothing yet"
            message="Matches, messages, and nearby availability alerts will show up here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  clearButton: { alignSelf: 'flex-end', marginBottom: spacing.md },
  clearText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  unread: { borderLeftColor: colors.primary },
  pressed: { opacity: 0.9 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink },
  time: { fontSize: 11, color: colors.inkFaint },
  body: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
    lineHeight: 18,
  },
});
