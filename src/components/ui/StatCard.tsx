import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { AnimatedCounter } from './AnimatedCounter';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  suffix?: string;
  tint: string;
  tintSoft: string;
  /** Stagger index — each card enters slightly after the previous one. */
  index: number;
  onPress?: () => void;
}

/** Compact dashboard tile with a counting value. */
export function StatCard({
  icon,
  label,
  value,
  suffix,
  tint,
  tintSoft,
  index,
  onPress,
}: StatCardProps) {
  return (
    <AnimatedPressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}${suffix ?? ''}`}
      onPress={onPress}
      entering={FadeInDown.delay(index * 90).springify().damping(15)}
      style={({ pressed }: { pressed: boolean }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tintSoft }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>

      <AnimatedCounter value={value} suffix={suffix} style={styles.value} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
    ...shadow.card,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { fontSize: 21, fontWeight: '800', color: colors.ink },
  label: { fontSize: 11, color: colors.inkMuted, fontWeight: '600' },
});
