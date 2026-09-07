import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterSheet } from '@/components/pet/FilterSheet';
import { PetCard } from '@/components/pet/PetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DEFAULT_FILTERS } from '@/constants/config';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useNearbyPets } from '@/hooks/useNearbyPets';

/** Home: pets around the user, sorted by compatibility. */
export default function NearbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    ready,
    filters,
    setFilters,
    userLocation,
    isLocationPrecise,
    refresh,
    unreadNotifications,
    myPets,
  } = useApp();
  const { all, availableBreeds, totalNearby } = useNearbyPets();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const activeFilterCount = countActiveFilters(filters);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Nearby pets</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile')}
            style={styles.locationRow}
          >
            <Ionicons name="location" size={13} color={colors.primary} />
            <Text style={styles.location} numberOfLines={1}>
              {userLocation.label}
            </Text>
            {!isLocationPrecise && <Text style={styles.approx}>· approximate</Text>}
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
        >
          <Ionicons name="notifications-outline" size={21} color={colors.ink} />
          {unreadNotifications > 0 && <View style={styles.dot} />}
        </Pressable>
      </View>

      <View style={styles.filterBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setFiltersOpen(true)}
          style={styles.filterButton}
        >
          <Ionicons name="options-outline" size={17} color={colors.ink} />
          <Text style={styles.filterLabel}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.resultCount}>
          {all.length} of {totalNearby} nearby
        </Text>
      </View>

      <FlatList
        data={all}
        keyExtractor={(item) => item.pet.id}
        renderItem={({ item }) => (
          <PetCard item={item} onPress={() => router.push(`/pet/${item.pet.id}`)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          myPets.length === 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/pet/new')}
              style={styles.banner}
            >
              <Text style={styles.bannerEmoji}>🐾</Text>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Add your pet</Text>
                <Text style={styles.bannerBody}>
                  Create a profile to start matching and get accurate scores.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.primary} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="paw-outline"
            title="No pets match your filters"
            message="Try widening the distance or clearing a filter to see more pets around you."
            actionLabel="Reset filters"
            onAction={() => setFilters(DEFAULT_FILTERS)}
          />
        }
      />

      <FilterSheet
        visible={filtersOpen}
        filters={filters}
        breeds={availableBreeds}
        onApply={(next) => {
          setFilters(next);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </View>
  );
}

function countActiveFilters(filters: typeof DEFAULT_FILTERS): number {
  let count = 0;
  if (filters.maxDistanceKm !== DEFAULT_FILTERS.maxDistanceKm) count += 1;
  if (filters.species !== 'all') count += 1;
  if (filters.gender !== 'all') count += 1;
  if (filters.breed !== null) count += 1;
  if (filters.availableForBreedingOnly) count += 1;
  if (
    filters.minAgeYears !== DEFAULT_FILTERS.minAgeYears ||
    filters.maxAgeYears !== DEFAULT_FILTERS.maxAgeYears
  ) {
    count += 1;
  }
  return count;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 25, fontWeight: '800', color: colors.ink },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: { fontSize: 13, color: colors.inkMuted, fontWeight: '500' },
  approx: { fontSize: 11, color: colors.inkFaint },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.ink },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  resultCount: { fontSize: 12, color: colors.inkFaint, fontWeight: '500' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerEmoji: { fontSize: 26 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  bannerBody: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
    lineHeight: 17,
  },
});
