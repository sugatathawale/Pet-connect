import { CURRENT_OWNER_ID } from '@/data/seed';
import type { Listing, Pet, PetLocation } from '@/types';
import { offsetByKm } from '@/utils/geo';

/**
 * Demo-only: places seed pets and listings around the user's real location.
 *
 * Seed records carry an `offsetKm` (east/north from the user). On launch we
 * convert those into real coordinates near wherever the device actually is, so
 * "2.4 km away" is true in Delhi, Mumbai, Berlin, or a simulator in California.
 *
 * Records the user created themselves have no `offsetKm` and are left untouched —
 * their location is real and must not be moved.
 *
 * Delete this file when a backend supplies real nearby data.
 */

/** Neighbourhood-ish label so relocated pets don't all read as one place. */
function areaLabel(base: string, index: number): string {
  const AREAS = [
    'Nearby',
    'North side',
    'East side',
    'South side',
    'West side',
    'Uptown',
    'Downtown',
    'Riverside',
  ];
  return `${AREAS[index % AREAS.length]}, ${base}`;
}

function relocate<T extends { id: string; offsetKm?: { east: number; north: number }; location: PetLocation }>(
  records: T[],
  userLocation: PetLocation,
): T[] {
  // Strip the city off a "District, City" label so we can rebuild it.
  const cityName = userLocation.label.includes(',')
    ? userLocation.label.split(',').pop()!.trim()
    : userLocation.label;

  return records.map((record, index) => {
    if (!record.offsetKm) return record;

    const { east, north } = record.offsetKm;
    const coords = offsetByKm(userLocation, east, north);

    return {
      ...record,
      location: {
        ...coords,
        label: east === 0 && north === 0 ? userLocation.label : areaLabel(cityName, index),
      },
    };
  });
}

export const demoService = {
  /**
   * Repositions demo pets around the user. The user's own pets keep their
   * location, except the seed pet (offset 0,0) which moves to the user exactly.
   */
  relocatePets(pets: Pet[], userLocation: PetLocation): Pet[] {
    return relocate(pets, userLocation).map((pet) =>
      // Keep the demo owner's own pet co-located with them.
      pet.ownerId === CURRENT_OWNER_ID && pet.offsetKm
        ? { ...pet, location: { ...userLocation } }
        : pet,
    );
  },

  relocateListings(listings: Listing[], userLocation: PetLocation): Listing[] {
    return relocate(listings, userLocation);
  },
};
