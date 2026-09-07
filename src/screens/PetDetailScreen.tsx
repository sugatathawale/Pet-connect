import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityCard } from '@/components/pet/AvailabilityCard';
import { CompatibilityBreakdown } from '@/components/pet/CompatibilityBreakdown';
import { PetMetaRow, speciesEmoji } from '@/components/pet/PetMetaRow';
import { MatchCelebration } from '@/components/pet/MatchCelebration';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { matchService } from '@/services/matchService';
import type { Match, Pet } from '@/types';
import { calculateCompatibility } from '@/utils/compatibility';
import { formatAge } from '@/utils/date';
import { distanceBetween, formatDistance } from '@/utils/geo';
import { primaryPhoto } from '@/utils/images';
import { canViewAvailability } from '@/utils/privacy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Full pet profile with score explanation and interest actions. */
export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { petById, ownerById, activePet, userLocation, currentOwnerId, decide, matches } =
    useApp();

  const pet = id ? petById(id) : undefined;
  const [isMatched, setIsMatched] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [celebration, setCelebration] = useState<{ match: Match; pet: Pet } | null>(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!pet) return;

    (async () => {
      const result = await matchService.isMatchedWith(pet.id, currentOwnerId);
      if (!cancelled) setIsMatched(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [pet, currentOwnerId, matches]);

  const owner = pet ? ownerById(pet.ownerId) : undefined;
  const isOwnPet = pet?.ownerId === currentOwnerId;

  const distanceKm = useMemo(
    () => (pet ? distanceBetween(userLocation, pet.location) : 0),
    [pet, userLocation],
  );

  const compatibility = useMemo(
    () => (pet ? calculateCompatibility(activePet, pet, distanceKm) : null),
    [pet, activePet, distanceKm],
  );

  if (!pet || !owner || !compatibility) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const canSeeAvailability = canViewAvailability(pet, {
    ownerId: currentOwnerId,
    isMatched,
    distanceKm,
  });

  // Always render at least one image so the gallery never collapses.
  const gallery = pet.photos.length > 0 ? pet.photos : [primaryPhoto(pet.photos)];

  const existingMatch = matches.find((m) => m.petIds.includes(pet.id));

  const handleInterested = async () => {
    setDeciding(true);
    const { match, matchedPet } = await decide(pet.id, 'interested');
    setDeciding(false);

    if (match && matchedPet) {
      setCelebration({ match, pet: matchedPet });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) =>
              setPhotoIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
          >
            {gallery.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />
            ))}
          </ScrollView>

          {gallery.length > 1 && (
            <View style={styles.dots}>
              {gallery.map((uri, index) => (
                <View
                  key={uri}
                  style={[styles.dot, index === photoIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + spacing.sm }]}
          >
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text style={styles.name}>
                {speciesEmoji(pet.species)} {pet.name}
              </Text>
              <PetMetaRow pet={pet} />
            </View>
            <ScoreRing score={compatibility.score} size="lg" />
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={styles.locationText}>
              {formatDistance(distanceKm)} · {pet.location.label}
            </Text>
          </View>

          {pet.bio ? <Text style={styles.bio}>{pet.bio}</Text> : null}

          <View style={styles.statRow}>
            <Stat label="Age" value={formatAge(pet.dateOfBirth)} />
            <Stat label="Gender" value={pet.gender === 'male' ? 'Male' : 'Female'} />
            <Stat
              label="Neutered"
              value={pet.isSpayedOrNeutered ? 'Yes' : 'No'}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Pet Connect Score"
              subtitle={
                activePet
                  ? `How ${pet.name} matches with ${activePet.name}`
                  : 'Add your pet for a personalised score'
              }
            />
            <View style={styles.card}>
              <CompatibilityBreakdown result={compatibility} />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Availability" />
            <AvailabilityCard
              pet={pet}
              canView={canSeeAvailability}
              isOwner={!!isOwnPet}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Owner" />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/owner/${owner.id}`)}
              style={styles.ownerCard}
            >
              <Avatar uri={owner.avatar} name={owner.name} size={48} />
              <View style={styles.ownerText}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>{owner.name}</Text>
                  {owner.isVerified && <Badge label="⭐ Verified" tone="brand" />}
                </View>
                <Text style={styles.ownerCity}>{owner.city}</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.inkFaint} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {!isOwnPet && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.md }]}>
          {isMatched && existingMatch ? (
            <Button
              label="Open chat"
              onPress={() => router.push(`/chat/${existingMatch.id}`)}
              style={styles.fullAction}
            />
          ) : (
            <>
              <Button
                label="Skip"
                variant="secondary"
                onPress={async () => {
                  await decide(pet.id, 'skipped');
                  router.back();
                }}
                style={styles.action}
              />
              <Button
                label="❤️ Interested"
                onPress={handleInterested}
                loading={deciding}
                style={styles.action}
              />
            </>
          )}
        </View>
      )}

      <MatchCelebration
        visible={celebration !== null}
        myPet={activePet}
        theirPet={celebration?.pet ?? null}
        onChat={() => {
          const matchId = celebration?.match.id;
          setCelebration(null);
          if (matchId) router.push(`/chat/${matchId}`);
        }}
        onKeepBrowsing={() => setCelebration(null)}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scroll: { paddingBottom: spacing.xxl },
  gallery: { height: 380, backgroundColor: colors.surfaceAlt },
  photo: { width: SCREEN_WIDTH, height: 380 },
  dots: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: '#FFFFFF', width: 20 },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleText: { flex: 1 },
  name: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  locationText: { fontSize: 13, color: colors.inkMuted, fontWeight: '500' },
  bio: {
    fontSize: 15,
    color: colors.inkMuted,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  section: { marginTop: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  ownerText: { flex: 1, gap: 2 },
  ownerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  ownerCity: { fontSize: 12, color: colors.inkMuted },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: { flex: 1 },
  fullAction: { flex: 1 },
});
