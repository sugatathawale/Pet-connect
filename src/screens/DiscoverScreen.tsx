import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeDeck } from '@/components/pet/SwipeDeck';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useNearbyPets } from '@/hooks/useNearbyPets';
import { usePrefetch } from '@/hooks/usePrefetch';
import { prefetchCache } from '@/services/prefetchCache';
import { petService } from '@/services/petService';
import type { InterestDecision, Match, Pet } from '@/types';

/** Swipe-to-match screen. */
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activePet, myPets, decide, resetDemoDecisions } = useApp();
  const { undecided, totalNearby } = useNearbyPets();

  const [celebration, setCelebration] = useState<{ match: Match; pet: Pet } | null>(null);

  // ── Prefetching ──────────────────────────────────────────────────────────
  // Warm pet detail data for the top 3 cards so navigating to pet/[id] is instant.
  const topPetIds = useMemo(() => undecided.slice(0, 3).map((u) => u.pet.id), [undecided]);

  usePrefetch({
    entries: topPetIds.map((id) => ({
      key: `pet:${id}`,
      fetcher: () => petService.getPet(id),
      ttlMs: 2 * 60 * 1000,
    })),
    // PetWithContext stores the Pet at .pet; extract photos from there.
    petPhotos: undecided.slice(0, 6).map((item) => ({ photos: item.pet.photos })),
    revalidate: false,
  });

  // Also prefetch all nearby pets for the feed.
  useEffect(() => {
    void prefetchCache.warm('pets', petService.listPets, 2 * 60 * 1000);
  }, []);

  const handleDecide = useCallback(
    async (petId: string, decision: InterestDecision) => {
      const { match, matchedPet } = await decide(petId, decision);
      if (match && matchedPet) {
        setCelebration({ match, pet: matchedPet });
      }
    },
    [decide],
  );

  const handleRefreshDeck = useCallback(() => {
    if (undecided.length === 0 && totalNearby === 0) {
      Alert.alert(
        'No demo pets nearby',
        'Widen your filters on the Nearby tab or pull them closer.',
        [{ text: 'Open Nearby', onPress: () => router.push('/') }],
      );
      return;
    }
    Alert.alert(
      'Browse the demo deck again?',
      'Reopens the same pets so you can swipe through them a second time. Your existing matches are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset deck', style: 'destructive', onPress: () => void resetDemoDecisions() },
      ],
    );
  }, [undecided.length, totalNearby, resetDemoDecisions, router]);

  if (myPets.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header onRefreshDeck={handleRefreshDeck} />
        <EmptyState
          icon="add-circle-outline"
          title="Add your pet first"
          message="Matching works pet-to-pet, so create a profile for your pet to start finding companions."
          actionLabel="Add a pet"
          onAction={() => router.push('/pet/new')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header petName={activePet?.name} onRefreshDeck={handleRefreshDeck} />

      <View style={styles.deckArea}>
        {undecided.length > 0 ? (
          <SwipeDeck
            items={undecided}
            onDecide={handleDecide}
            onOpenPet={(petId) => router.push(`/pet/${petId}`)}
          />
        ) : (
          <EmptyState
            icon="checkmark-done-outline"
            title="You're all caught up"
            message="You've seen every pet nearby. Reset the deck to swipe through the same demos again, or widen your filters on the Nearby tab."
            actionLabel="Reset deck"
            secondaryActionLabel="Adjust filters"
            onAction={() => void resetDemoDecisions()}
            onSecondaryAction={() => router.push('/')}
          />
        )}
      </View>

      {/* MatchCelebration is lazily imported — it's only shown on a match event. */}
      {celebration !== null && (
        <LazyMatchCelebration
          visible={true}
          myPet={activePet}
          theirPet={celebration.pet}
          onChat={() => {
            const matchId = celebration?.match.id;
            setCelebration(null);
            if (matchId) router.push(`/chat/${matchId}`);
          }}
          onKeepBrowsing={() => setCelebration(null)}
        />
      )}
    </View>
  );
}

/** Lazy-load wrapper — shows nothing while the Modal loads (~3 KB). */
function LazyMatchCelebration(props: React.ComponentProps<typeof import('@/components/pet/MatchCelebration').MatchCelebration>) {
  const [Comp, setComp] = useState<React.ComponentType<typeof props> | null>(null);
  React.useEffect(() => {
    import('@/components/pet/MatchCelebration').then((m) => setComp(() => m.MatchCelebration));
  }, []);
  if (!Comp) return null;
  return <Comp {...props} />;
}

function Header({
  petName,
  onRefreshDeck,
}: {
  petName?: string;
  onRefreshDeck?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>Find a match</Text>
        <Text style={styles.subtitle}>
          {petName ? `Matching as ${petName}` : 'Swipe right to show interest'}
        </Text>
      </View>
      {onRefreshDeck ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset demo deck"
          onPress={onRefreshDeck}
          hitSlop={10}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerText: { flex: 1 },
  title: { fontSize: 25, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  deckArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    // Clears the floating tab bar and its raised centre button.
    paddingBottom: 108,
  },
});
