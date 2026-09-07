import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetMetaRow, speciesEmoji } from '@/components/pet/PetMetaRow';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatDateRange } from '@/utils/date';
import { primaryPhoto } from '@/utils/images';

/** Owner profile: identity, their pets, and availability controls. */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentOwnerId,
    ownerById,
    myPets,
    activePetId,
    setActivePetId,
    updatePet,
    removePet,
    userLocation,
    refreshLocation,
    isLocationPrecise,
  } = useApp();

  const owner = ownerById(currentOwnerId);

  const confirmDelete = (petId: string, petName: string) => {
    Alert.alert('Remove pet', `Remove ${petName}'s profile? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePet(petId) },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.identity}>
        <Avatar uri={owner?.avatar} name={owner?.name ?? 'You'} size={72} />

        <View style={styles.identityText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{owner?.name ?? 'You'}</Text>
            {owner?.isVerified && <Badge label="⭐ Verified" tone="brand" />}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.inkMuted} />
            <Text style={styles.meta}>{owner?.city ?? userLocation.label}</Text>
          </View>

          <Text style={styles.meta}>
            {speciesEmoji('dog')} {myPets.length} {myPets.length === 1 ? 'pet' : 'pets'}
          </Text>
        </View>
      </View>

      {owner?.bio ? <Text style={styles.bio}>{owner.bio}</Text> : null}

      <View style={styles.locationCard}>
        <View style={styles.locationText}>
          <Text style={styles.cardLabel}>Your location</Text>
          <Text style={styles.cardValue}>{userLocation.label}</Text>
          <Text style={styles.cardHint}>
            {isLocationPrecise
              ? 'Used to calculate distances to nearby pets.'
              : 'Using an approximate location. Enable permission for accurate distances.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh location"
          onPress={refreshLocation}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="My pets"
          subtitle="Pick which pet you're matching as"
          actionLabel="Add pet"
          onAction={() => router.push('/pet/new')}
        />

        {myPets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You haven't added a pet yet. Add one to start matching.
            </Text>
            <Button
              label="Add your first pet"
              onPress={() => router.push('/pet/new')}
              style={styles.emptyAction}
            />
          </View>
        ) : (
          myPets.map((pet) => {
            const isActive = pet.id === activePetId;

            return (
              <View key={pet.id} style={[styles.petCard, isActive && styles.petCardActive]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/pet/${pet.id}`)}
                  style={styles.petMain}
                >
                  <Image
                    source={{ uri: primaryPhoto(pet.photos) }}
                    style={styles.petPhoto}
                    contentFit="cover"
                  />
                  <View style={styles.petInfo}>
                    <View style={styles.petNameRow}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      {isActive && <Badge label="Matching as" tone="brand" />}
                    </View>
                    <PetMetaRow pet={pet} showBadges={false} />
                  </View>
                </Pressable>

                <View style={styles.availabilityRow}>
                  <View style={styles.availabilityText}>
                    <Text style={styles.availabilityLabel}>Available for breeding</Text>
                    <Text style={styles.availabilityValue}>
                      {pet.availability.enabled
                        ? formatDateRange(
                            pet.availability.startDate,
                            pet.availability.endDate,
                          )
                        : 'Off'}
                    </Text>
                  </View>

                  <Switch
                    value={pet.availableForBreeding}
                    onValueChange={(value) =>
                      updatePet(pet.id, {
                        availableForBreeding: value,
                        availability: { ...pet.availability, enabled: value },
                      })
                    }
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.petActions}>
                  {!isActive && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setActivePetId(pet.id)}
                      hitSlop={6}
                    >
                      <Text style={styles.linkAction}>Match as {pet.name}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/pet/availability',
                        params: { petId: pet.id },
                      })
                    }
                    hitSlop={6}
                  >
                    <Text style={styles.linkAction}>Edit availability</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => confirmDelete(pet.id, pet.name)}
                    hitSlop={6}
                  >
                    <Text style={styles.dangerAction}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Notifications" />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          style={styles.linkRow}
        >
          <Ionicons name="notifications-outline" size={19} color={colors.ink} />
          <Text style={styles.linkRowLabel}>View all notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl + 20 },
  identity: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  identityText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, color: colors.inkMuted },
  bio: {
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...shadow.card,
  },
  locationText: { flex: 1 },
  cardLabel: { fontSize: 12, fontWeight: '600', color: colors.inkMuted },
  cardValue: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 2 },
  cardHint: { fontSize: 12, color: colors.inkFaint, marginTop: 4, lineHeight: 17 },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: spacing.xxl },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  emptyText: { fontSize: 14, color: colors.inkMuted, lineHeight: 20 },
  emptyAction: { marginTop: spacing.lg },
  petCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.card,
  },
  petCardActive: { borderColor: colors.primary },
  petMain: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  petPhoto: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  petInfo: { flex: 1, gap: 3 },
  petNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  petName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  availabilityText: { flex: 1 },
  availabilityLabel: { fontSize: 13, fontWeight: '600', color: colors.ink },
  availabilityValue: { fontSize: 12, color: colors.inkFaint, marginTop: 1 },
  petActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  linkAction: { fontSize: 13, fontWeight: '600', color: colors.primary },
  dangerAction: { fontSize: 13, fontWeight: '600', color: colors.danger },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  linkRowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
});
