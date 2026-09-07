import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListingCard } from '@/components/listing/ListingCard';
import { PetCard } from '@/components/pet/PetCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { calculateCompatibility } from '@/utils/compatibility';
import { formatRelativeTime } from '@/utils/date';
import { distanceBetween } from '@/utils/geo';

/** Public owner profile: identity, their pets, and their listings. */
export default function OwnerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ownerById, pets, listings, activePet, userLocation } = useApp();

  const owner = id ? ownerById(id) : undefined;

  const theirPets = useMemo(() => {
    if (!owner) return [];

    return pets
      .filter((pet) => pet.ownerId === owner.id)
      .map((pet) => {
        const distanceKm = distanceBetween(userLocation, pet.location);
        return {
          pet,
          owner,
          distanceKm,
          compatibility: calculateCompatibility(activePet, pet, distanceKm),
        };
      });
  }, [owner, pets, userLocation, activePet]);

  const theirListings = useMemo(
    () => (owner ? listings.filter((l) => l.ownerId === owner.id) : []),
    [owner, listings],
  );

  if (!owner) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>This owner could not be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.identity}>
        <Avatar uri={owner.avatar} name={owner.name} size={76} />

        <View style={styles.identityText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{owner.name}</Text>
            {owner.isVerified && <Badge label="⭐ Verified" tone="brand" />}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.inkMuted} />
            <Text style={styles.meta}>{owner.city}</Text>
          </View>

          <Text style={styles.meta}>
            🐾 {theirPets.length} {theirPets.length === 1 ? 'pet' : 'pets'} · joined{' '}
            {formatRelativeTime(owner.joinedAt)} ago
          </Text>
        </View>
      </View>

      {owner.bio ? <Text style={styles.bio}>{owner.bio}</Text> : null}

      <View style={styles.section}>
        <SectionHeader title={`${owner.name}'s pets`} />
        {theirPets.map((item) => (
          <PetCard
            key={item.pet.id}
            item={item}
            onPress={() => router.push(`/pet/${item.pet.id}`)}
          />
        ))}
      </View>

      {theirListings.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Listings" />
          {theirListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPress={() => router.push(`/listing/${listing.id}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missing: { fontSize: 14, color: colors.inkMuted },
  identity: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  identityText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: 21, fontWeight: '800', color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: colors.inkMuted },
  bio: {
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  section: { marginTop: spacing.xxl },
});
