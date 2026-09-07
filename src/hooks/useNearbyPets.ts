import { useEffect, useMemo, useState } from 'react';

import { useApp } from '@/context/AppContext';
import { matchService } from '@/services/matchService';
import type { PetWithContext } from '@/types';
import { calculateCompatibility } from '@/utils/compatibility';
import { ageInYears } from '@/utils/date';
import { distanceBetween } from '@/utils/geo';

/**
 * The nearby-pets feed: everyone else's pets, filtered, measured, and scored
 * relative to the viewer's active pet, sorted best-match first.
 */
export function useNearbyPets() {
  const { pets, currentOwnerId, activePet, userLocation, filters, blockedOwnerIds } = useApp();
  const [decidedIds, setDecidedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!activePet) {
      setDecidedIds([]);
      return;
    }

    (async () => {
      const ids = await matchService.decidedPetIds(activePet.id);
      if (!cancelled) setDecidedIds(ids);
    })();

    return () => {
      cancelled = true;
    };
  }, [activePet, pets]);

  const decorated = useMemo<PetWithContext[]>(() => {
    return pets
      .filter((pet) => pet.ownerId !== currentOwnerId)
      .filter((pet) => !blockedOwnerIds.includes(pet.ownerId))
      .map((pet) => {
        const distanceKm = distanceBetween(userLocation, pet.location);
        return {
          pet,
          owner: { id: pet.ownerId } as PetWithContext['owner'],
          distanceKm,
          compatibility: calculateCompatibility(activePet, pet, distanceKm),
        };
      });
  }, [pets, currentOwnerId, blockedOwnerIds, userLocation, activePet]);

  const filtered = useMemo(() => {
    return decorated
      .filter((item) => item.distanceKm <= filters.maxDistanceKm)
      .filter((item) => filters.species === 'all' || item.pet.species === filters.species)
      .filter((item) => filters.gender === 'all' || item.pet.gender === filters.gender)
      .filter(
        (item) =>
          !filters.breed ||
          item.pet.breed.toLowerCase().includes(filters.breed.toLowerCase()),
      )
      .filter((item) => {
        const years = ageInYears(item.pet.dateOfBirth);
        return years >= filters.minAgeYears && years <= filters.maxAgeYears;
      })
      .filter((item) => !filters.availableForBreedingOnly || item.pet.availableForBreeding)
      .sort((a, b) => b.compatibility.score - a.compatibility.score);
  }, [decorated, filters]);

  /** The swipe deck excludes pets already judged; the browse list keeps them. */
  const undecided = useMemo(
    () => filtered.filter((item) => !decidedIds.includes(item.pet.id)),
    [filtered, decidedIds],
  );

  const availableBreeds = useMemo(
    () => Array.from(new Set(pets.map((p) => p.breed))).sort(),
    [pets],
  );

  return { all: filtered, undecided, availableBreeds, totalNearby: decorated.length };
}
