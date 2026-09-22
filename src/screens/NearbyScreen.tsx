import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SideMenu } from '@/components/menu/SideMenu';
import { FilterSheet } from '@/components/pet/FilterSheet';
import { AvailableNowRail } from '@/components/pet/AvailableNowRail';
import { CategoryRail } from '@/components/pet/CategoryRail';
import { PET_CARD_HEIGHT, PetCard } from '@/components/pet/PetCard';
import { TopMatchCard } from '@/components/pet/TopMatchCard';
import { AssistantPromo } from '@/components/ui/AssistantPromo';
import { StatsStrip } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DEFAULT_FILTERS } from '@/constants/config';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useNearbyPets } from '@/hooks/useNearbyPets';
import type { PetWithContext } from '@/types';

const PAGE_SIZE = 5;

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
    myPets,
    matches,
  } = useApp();
  const { all, availableBreeds, totalNearby } = useNearbyPets();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPageSize(PAGE_SIZE);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Reset pagination whenever filters change.
  useEffect(() => {
    setPageSize(PAGE_SIZE);
  }, [filters]);

  const activeFilterCount = countActiveFilters(filters);

  const topMatch = all[0] ?? null;
  const bestScore = topMatch?.compatibility.score ?? 0;
  const availableNow = useMemo(
    () => all.filter((item) => item.pet.availableForBreeding),
    [all],
  );

  const visiblePets = useMemo(() => all.slice(0, pageSize), [all, pageSize]);
  const hasMore = pageSize < all.length;

  const openPet = useCallback(
    (petId: string) => {
      router.push(`/pet/${petId}`);
    },
    [router],
  );

  const onCategorySelect = useCallback(
    (patch: Partial<typeof filters>) => {
      setFilters({ ...filters, ...patch });
    },
    [filters, setFilters],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPageSize((n) => Math.min(n + PAGE_SIZE, all.length));
      setLoadingMore(false);
    }, 280);
  }, [hasMore, loadingMore, all.length]);

  const keyExtractor = useCallback((item: PetWithContext) => item.pet.id, []);

  const renderPet = useCallback(
    ({ item }: ListRenderItemInfo<PetWithContext>) => (
      <PetCard item={item} onPress={openPet} />
    ),
    [openPet],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<PetWithContext> | null | undefined, index: number) => ({
      length: PET_CARD_HEIGHT,
      offset: PET_CARD_HEIGHT * index,
      index,
    }),
    [],
  );

  const listFooter = useMemo(() => {
    if (all.length === 0) return null;

    if (hasMore) {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Load more pets"
          onPress={loadMore}
          disabled={loadingMore}
          style={({ pressed }) => [styles.loadMore, pressed && styles.loadMorePressed]}
        >
          {loadingMore ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={styles.loadMoreText}>Load more</Text>
              <Text style={styles.loadMoreMeta}>
                {visiblePets.length} of {all.length}
              </Text>
            </>
          )}
        </Pressable>
      );
    }

    return (
      <Text style={styles.endLabel}>
        Showing all {all.length} pets
      </Text>
    );
  }, [all.length, hasMore, loadMore, loadingMore, visiblePets.length]);

  const listHeader = useMemo(
    () => (
      <View>
        {myPets.length === 0 && (
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
        )}

        <View style={styles.categoryRow}>
          <View style={styles.categoryRail}>
            <CategoryRail filters={filters} onSelect={onCategorySelect} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filters"
            onPress={() => setFiltersOpen(true)}
            style={styles.filterFab}
          >
            <Ionicons name="options-outline" size={18} color={colors.ink} />
            {activeFilterCount > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {topMatch && (
          <TopMatchCard
            item={topMatch}
            onPress={() => openPet(topMatch.pet.id)}
          />
        )}

        <AssistantPromo />

        <AvailableNowRail items={availableNow} onSelect={openPet} />

        <StatsStrip
          items={[
            { label: 'Nearby', value: totalNearby },
            {
              label: 'Matches',
              value: matches.length,
              onPress: () => router.push('/chats'),
            },
            { label: 'Available', value: availableNow.length },
            { label: 'Best', value: bestScore, suffix: '%' },
          ]}
        />

        {all.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All pets nearby</Text>
            <Text style={styles.resultCount}>
              {visiblePets.length} of {all.length}
            </Text>
          </View>
        )}
      </View>
    ),
    [
      myPets.length,
      router,
      filters,
      onCategorySelect,
      activeFilterCount,
      topMatch,
      openPet,
      availableNow,
      totalNearby,
      matches.length,
      bestScore,
      all.length,
      visiblePets.length,
    ],
  );

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={() => setMenuOpen(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={22} color={colors.ink} />
        </Pressable>

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
        </Pressable>
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <FlatList
        data={visiblePets}
        keyExtractor={keyExtractor}
        renderItem={renderPet}
        getItemLayout={getItemLayout}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <EmptyState
            icon="paw-outline"
            title="No pets match your filters"
            message="Try widening the distance or clearing a filter to see more pets around you."
            actionLabel="Reset filters"
            onAction={() => setFilters(DEFAULT_FILTERS)}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews
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
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  filterCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surfaceAlt,
  },
  filterCountText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  categoryRail: { flex: 1, minWidth: 0 },
  filterFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  resultCount: { fontSize: 12, color: colors.inkFaint, fontWeight: '500' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 118, flexGrow: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  loadMore: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMorePressed: { opacity: 0.85 },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  loadMoreMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkFaint,
  },
  endLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkFaint,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
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
