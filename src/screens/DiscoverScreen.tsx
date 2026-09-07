import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchCelebration } from '@/components/pet/MatchCelebration';
import { SwipeDeck } from '@/components/pet/SwipeDeck';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useNearbyPets } from '@/hooks/useNearbyPets';
import type { InterestDecision, Match, Pet } from '@/types';

/** Swipe-to-match screen. */
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activePet, myPets, decide } = useApp();
  const { undecided } = useNearbyPets();

  const [celebration, setCelebration] = useState<{ match: Match; pet: Pet } | null>(null);

  const handleDecide = useCallback(
    async (petId: string, decision: InterestDecision) => {
      const { match, matchedPet } = await decide(petId, decision);
      if (match && matchedPet) {
        setCelebration({ match, pet: matchedPet });
      }
    },
    [decide],
  );

  if (myPets.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header />
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
      <Header petName={activePet?.name} />

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
            message="You've seen every pet nearby. Widen your filters on the Nearby tab to find more."
            actionLabel="Adjust filters"
            onAction={() => router.push('/')}
          />
        )}
      </View>

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

function Header({ petName }: { petName?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Find a match</Text>
      <Text style={styles.subtitle}>
        {petName ? `Matching as ${petName}` : 'Swipe right to show interest'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: { fontSize: 25, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  deckArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
