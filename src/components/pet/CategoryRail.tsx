import { Cat, Dog, HeartHandshake, PawPrint, Sparkles } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { PetFilters, PetSpecies } from '@/types';

/**
 * Circular category shortcuts.
 * Each applies a filter rather than navigating — feed updates in place.
 */

interface Category {
  key: string;
  label: string;
  Icon: typeof Dog;
  patch: Partial<PetFilters>;
}

const CATEGORIES: Category[] = [
  { key: 'all', label: 'All', Icon: PawPrint, patch: { species: 'all', availableForBreedingOnly: false } },
  { key: 'dogs', label: 'Dogs', Icon: Dog, patch: { species: 'dog' as PetSpecies } },
  { key: 'cats', label: 'Cats', Icon: Cat, patch: { species: 'cat' as PetSpecies } },
  { key: 'available', label: 'Available', Icon: Sparkles, patch: { availableForBreedingOnly: true } },
  { key: 'nearby', label: 'Under 5km', Icon: HeartHandshake, patch: { maxDistanceKm: 5 } },
];

const ITEM_WIDTH = 60 + spacing.md + 2;

export function CategoryRail({
  filters,
  onSelect,
}: {
  filters: PetFilters;
  onSelect: (patch: Partial<PetFilters>) => void;
}) {
  const isActive = useCallback(
    (category: Category): boolean => {
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
    },
    [filters],
  );

  const keyExtractor = useCallback((item: Category) => item.key, []);

  const renderItem = useCallback(
    ({ item }: { item: Category }) => {
      const active = isActive(item);
      const { Icon } = item;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          accessibilityLabel={item.label}
          onPress={() => onSelect(item.patch)}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={[styles.circle, active && styles.circleActive]}>
            <Icon
              size={22}
              color={active ? colors.surface : colors.primaryDark}
              strokeWidth={1.9}
            />
          </View>
          <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
            {item.label}
          </Text>
        </Pressable>
      );
    },
    [isActive, onSelect],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Category> | null | undefined, index: number) => ({
      length: ITEM_WIDTH,
      offset: ITEM_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <FlatList
      horizontal
      data={CATEGORIES}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={3}
    />
  );
}

const styles = StyleSheet.create({
  rail: {
    gap: spacing.md + 2,
    paddingRight: spacing.sm,
    paddingBottom: spacing.sm,
  },
  item: { alignItems: 'center', width: 60, gap: 6 },
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
