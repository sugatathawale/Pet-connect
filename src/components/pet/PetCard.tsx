import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreRing } from '@/components/ui/ScoreRing';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { PetWithContext } from '@/types';
import { formatDistance } from '@/utils/geo';
import { PetMetaRow, speciesEmoji } from './PetMetaRow';
import { primaryPhoto } from '@/utils/images';

interface PetCardProps {
  item: PetWithContext;
  onPress: (petId: string) => void;
}

/** List row for nearby pets — memoised for FlatList recycling. */
export const PetCard = memo(function PetCard({ item, onPress }: PetCardProps) {
  const { pet, distanceKm, compatibility } = item;

  const handlePress = useCallback(() => {
    onPress(pet.id);
  }, [onPress, pet.id]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${pet.breed}, ${formatDistance(distanceKm)}`}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: primaryPhoto(pet.photos) }}
        style={styles.photo}
        contentFit="cover"
        recyclingKey={pet.id}
        transition={120}
      />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {speciesEmoji(pet.species)} {pet.name}
          </Text>
          <ScoreRing score={compatibility.score} />
        </View>

        <PetMetaRow pet={pet} />

        <View style={styles.distanceRow}>
          <Ionicons name="location-outline" size={13} color={colors.inkFaint} />
          <Text style={styles.distance}>{formatDistance(distanceKm)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.distance} numberOfLines={1}>
            {pet.location.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

/** Approximate row height for FlatList getItemLayout (photo + padding + margin). */
export const PET_CARD_HEIGHT = 96 + spacing.md * 2 + spacing.md;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
    height: PET_CARD_HEIGHT - spacing.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  photo: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  body: { flex: 1, justifyContent: 'space-between' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.ink },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: spacing.sm,
  },
  distance: { fontSize: 12, color: colors.inkFaint, flexShrink: 1 },
  dot: { fontSize: 12, color: colors.inkFaint },
});
