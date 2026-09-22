import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, shadow, spacing } from '@/constants/theme';
import { AnimatedCounter } from './AnimatedCounter';

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  onPress?: () => void;
}

/**
 * Single metrics strip for the Nearby dashboard.
 * Four values share one surface — no tall mini-cards.
 */
export function StatsStrip({ items }: { items: StatItem[] }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.wrap}>
      <View style={styles.strip}>
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              accessibilityRole={item.onPress ? 'button' : undefined}
              accessibilityLabel={`${item.label}: ${item.value}${item.suffix ?? ''}`}
              onPress={item.onPress}
              disabled={!item.onPress}
              style={({ pressed }) => [
                styles.cell,
                pressed && item.onPress && styles.pressed,
              ]}
            >
              <AnimatedCounter
                value={item.value}
                suffix={item.suffix}
                style={styles.value}
              />
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

/** @deprecated Prefer StatsStrip — kept so older imports don't break. */
export function StatCard({
  label,
  value,
  suffix,
  onPress,
}: {
  icon?: string;
  label: string;
  value: number;
  suffix?: string;
  tint?: string;
  tintSoft?: string;
  index?: number;
  onPress?: () => void;
}) {
  return (
    <StatsStrip items={[{ label, value, suffix, onPress }]} />
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md + 2,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    ...shadow.card,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkFaint,
    textAlign: 'center',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
