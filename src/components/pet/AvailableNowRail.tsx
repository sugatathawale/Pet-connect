import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { PetWithContext } from '@/types';
import { formatDistance } from '@/utils/geo';
import { primaryPhoto } from '@/utils/images';

const CARD_WIDTH = 118;
const CARD_GAP = spacing.md;
const SNAP = CARD_WIDTH + CARD_GAP;

const AvailableCard = memo(function AvailableCard({
  item,
  onSelect,
}: {
  item: PetWithContext;
  onSelect: (petId: string) => void;
}) {
  const handlePress = useCallback(() => {
    onSelect(item.pet.id);
  }, [onSelect, item.pet.id]);

  const distanceLabel =
    item.distanceKm < 1
      ? `${Math.round(item.distanceKm * 1000)} m`
      : `${item.distanceKm.toFixed(1)} km`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.pet.name}, ${formatDistance(item.distanceKm)}`}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: primaryPhoto(item.pet.photos) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={item.pet.id}
        transition={120}
      />

      <LinearGradient
        colors={['rgba(10,40,40,0.15)', 'transparent', 'rgba(10,30,30,0.88)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.scorePill}>
        <Text style={styles.scoreText}>{item.compatibility.score}%</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.pet.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="navigate" size={10} color="rgba(255,255,255,0.85)" />
          <Text style={styles.distance} numberOfLines={1}>
            {distanceLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

/**
 * Horizontal FlatList of pets currently open to matches.
 * Availability *dates* stay private — only the public flag is implied here.
 */
export function AvailableNowRail({
  items,
  onSelect,
}: {
  items: PetWithContext[];
  onSelect: (petId: string) => void;
}) {
  const keyExtractor = useCallback((item: PetWithContext) => item.pet.id, []);

  const renderItem = useCallback(
    ({ item }: { item: PetWithContext }) => (
      <AvailableCard item={item} onSelect={onSelect} />
    ),
    [onSelect],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<PetWithContext> | null | undefined, index: number) => ({
      length: SNAP,
      offset: SNAP * index,
      index,
    }),
    [],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.livePulse} />
          <Text style={styles.title}>Available now</Text>
        </View>
        <Text style={styles.count}>{items.length}</Text>
      </View>

      <FlatList
        horizontal
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        decelerationRate="fast"
        snapToInterval={SNAP}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  rail: {
    gap: CARD_GAP,
    paddingRight: spacing.lg,
    paddingVertical: 2,
  },
  card: {
    width: CARD_WIDTH,
    height: 156,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    ...shadow.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.97 }] },
  scorePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 11,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  distance: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
  },
});
