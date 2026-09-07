import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { colors, spacing } from '@/constants/theme';
import type { Pet } from '@/types';
import { formatAge } from '@/utils/date';

const SPECIES_EMOJI: Record<Pet['species'], string> = {
  dog: '🐕',
  cat: '🐈',
  other: '🐾',
};

export const speciesEmoji = (species: Pet['species']) => SPECIES_EMOJI[species];

/** "Golden Retriever · Male · 2 years" plus health badges. */
export function PetMetaRow({ pet, showBadges = true }: { pet: Pet; showBadges?: boolean }) {
  return (
    <View>
      <Text style={styles.meta} numberOfLines={1}>
        {pet.breed} · {pet.gender === 'male' ? 'Male' : 'Female'} · {formatAge(pet.dateOfBirth)}
      </Text>

      {showBadges && (
        <View style={styles.badges}>
          {pet.vaccination === 'vaccinated' && <Badge label="✅ Vaccinated" tone="success" />}
          {pet.vaccination === 'partial' && <Badge label="Partly vaccinated" tone="warning" />}
          {pet.vaccination === 'not_vaccinated' && (
            <Badge label="Not vaccinated" tone="danger" />
          )}
          {pet.availableForBreeding && <Badge label="Open to breeding" tone="brand" />}
          {pet.isSpayedOrNeutered && <Badge label="Neutered" tone="neutral" />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: 13, color: colors.inkMuted, fontWeight: '500' },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm - 2,
    marginTop: spacing.sm,
  },
});
