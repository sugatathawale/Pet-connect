import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreRing } from '@/components/ui/ScoreRing';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { PetWithContext } from '@/types';
import { formatDistance } from '@/utils/geo';
import { PetMetaRow, speciesEmoji } from './PetMetaRow';
import { primaryPhoto } from '@/utils/images';

interface PetCardProps {
  item: PetWithContext;
  onPress: () => void;
}

/** Horizontal card used in the nearby-pets list. */
export function PetCard({ item, onPress }: PetCardProps) {
  const { pet, distanceKm, compatibility } = item;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${pet.breed}, ${formatDistance(distanceKm)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: primaryPhoto(pet.photos) }}
        style={styles.photo}
        contentFit="cover"
        transition={180}
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
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
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
