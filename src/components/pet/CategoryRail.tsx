import { Cat, Dog, HeartHandshake, PawPrint, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/constants/theme';
import type { PetFilters, PetSpecies } from '@/types';

/**
 * Circular category shortcuts, modelled on the Valura asset-class row.
 *
 * Each one applies a filter rather than navigating, so the feed below updates
 * in place — the row doubles as the fastest way to narrow results.
 */

interface Category {
  key: string;
  label: string;
  Icon: typeof Dog;
  /** Filter patch applied when tapped. */
  patch: Partial<PetFilters>;
}

const CATEGORIES: Category[] = [
  { key: 'all', label: 'All', Icon: PawPrint, patch: { species: 'all', availableForBreedingOnly: false } },
  { key: 'dogs', label: 'Dogs', Icon: Dog, patch: { species: 'dog' as PetSpecies } },
  { key: 'cats', label: 'Cats', Icon: Cat, patch: { species: 'cat' as PetSpecies } },
  { key: 'available', label: 'Available', Icon: Sparkles, patch: { availableForBreedingOnly: true } },
  { key: 'nearby', label: 'Under 5km', Icon: HeartHandshake, patch: { maxDistanceKm: 5 } },
];

export function CategoryRail({
  filters,
  onSelect,
}: {
  filters: PetFilters;
  onSelect: (patch: Partial<PetFilters>) => void;
}) {
  /** A category reads as active when the feed already reflects its filter. */
  const isActive = (category: Category): boolean => {
    switch (category.key) {
      case 'all':
        return filters.species === 'all' && !filters.availableForBreedingOnly;
      case 'dogs':
        return filters.species === 'dog';
      case 'cats':
        return filters.species === 'cat';
      case 'available':
        return filters.availableForBreedingOnly;
      case 'nearby':
        return filters.maxDistanceKm <= 5;
      default:
        return false;
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {CATEGORIES.map((category, index) => {
        const active = isActive(category);
        const { Icon } = category;

        return (
          <Animated.View
            key={category.key}
            entering={FadeInDown.delay(index * 60).springify().damping(15)}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={category.label}
              onPress={() => onSelect(category.patch)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.circle, active && styles.circleActive]}>
                <Icon
                  size={22}
                  color={active ? colors.surface : colors.primaryDark}
                  strokeWidth={1.9}
                />
              </View>
              <Text
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}
              >
                {category.label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: { gap: spacing.lg, paddingRight: spacing.lg, paddingBottom: spacing.sm },
  item: { alignItems: 'center', width: 66, gap: 6 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkMuted,
    textAlign: 'center',
  },
  labelActive: { color: colors.primaryDark, fontWeight: '800' },
});
