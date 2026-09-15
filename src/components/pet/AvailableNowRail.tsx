import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { PetWithContext } from '@/types';
import { formatDistance } from '@/utils/geo';
import { primaryPhoto } from '@/utils/images';

/**
 * Horizontal rail of pets currently open to matches.
 *
 * Availability *dates* stay private — this only surfaces the public
 * `availableForBreeding` flag, never the window itself.
 */
export function AvailableNowRail({
  items,
  onSelect,
}: {
  items: PetWithContext[];
  onSelect: (petId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.title}>Available now</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {items.map((item, index) => (
          <Animated.View
            key={item.pet.id}
            entering={FadeInRight.delay(index * 70).springify().damping(14)}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.pet.name}, ${formatDistance(item.distanceKm)}`}
              onPress={() => onSelect(item.pet.id)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: primaryPhoto(item.pet.photos) }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={160}
                />
                <View style={styles.liveDot} />
              </View>

              <Text style={styles.name} numberOfLines={1}>
                {item.pet.name}
              </Text>
              <Text style={styles.distance} numberOfLines={1}>
                {item.distanceKm.toFixed(1)} km
              </Text>

              <View style={styles.scoreTag}>
                <Ionicons name="flash" size={8} color={colors.primaryDark} />
                <Text style={styles.scoreText}>{item.compatibility.score}%</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  title: { fontSize: 14, fontWeight: '700', color: colors.ink },
  count: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  rail: { gap: spacing.md, paddingRight: spacing.lg, paddingVertical: 2 },
  chip: {
    width: 92,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    alignItems: 'center',
    ...shadow.card,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
  avatarWrap: { width: 56, height: 56 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: colors.surface,
  },
  name: { fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 6 },
  distance: { fontSize: 10, color: colors.inkFaint, marginTop: 1 },
  scoreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 5,
  },
  scoreText: { fontSize: 9, fontWeight: '800', color: colors.primaryDark },
});
