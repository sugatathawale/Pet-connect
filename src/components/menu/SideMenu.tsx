import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, overlay, radius, shadow, spacing } from '@/constants/theme';

type MenuIcon = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  key: string;
  label: string;
  subtitle: string;
  icon: MenuIcon;
  href: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'ai',
    label: 'AI Assistant',
    subtitle: 'Breeds, FAQ & app help',
    icon: 'sparkles-outline',
    href: '/assistant',
  },
  {
    key: 'settings',
    label: 'Settings',
    subtitle: 'Notifications & preferences',
    icon: 'settings-outline',
    href: '/settings',
  },
  {
    key: 'support',
    label: 'Support',
    subtitle: 'Help, safety & contact',
    icon: 'help-buoy-outline',
    href: '/support',
  },
  {
    key: 'profile',
    label: 'Your profile',
    subtitle: 'Pets, location & account',
    icon: 'person-outline',
    href: '/(tabs)/profile',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    subtitle: 'Matches & alerts',
    icon: 'notifications-outline',
    href: '/notifications',
  },
];

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

/** Left drawer opened from the Nearby header menu button. */
export function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, progress]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * -300 }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const open = (href: string) => {
    onClose();
    // Let the close animation start before navigating.
    requestAnimationFrame(() => router.push(href as never));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            panelStyle,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Ionicons name="paw" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandTitle}>Pet Connect</Text>
              <Text style={styles.brandSub}>Menu</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={colors.inkMuted} />
            </Pressable>
          </View>

          <View style={styles.list}>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => open(item.href)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.footer}>Answers stay on Pet Connect topics only.</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: {
    backgroundColor: overlay.backdrop,
  },
  panel: {
    width: 300,
    maxWidth: '86%',
    height: '100%',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...shadow.floating,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flex: 1 },
  brandTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  brandSub: { fontSize: 12, color: colors.inkFaint, marginTop: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  list: { gap: spacing.sm, flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  itemPressed: { opacity: 0.85 },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  itemSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  footer: {
    fontSize: 11,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
