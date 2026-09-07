import type { PetFilters } from '@/types';

/** Weights for the Pet Connect compatibility score. Must sum to 1. */
export const COMPATIBILITY_WEIGHTS = {
  breed: 0.25,
  age: 0.2,
  gender: 0.25,
  distance: 0.2,
  health: 0.1,
} as const;

export const DEFAULT_FILTERS: PetFilters = {
  maxDistanceKm: 25,
  species: 'all',
  breed: null,
  gender: 'all',
  minAgeYears: 0,
  maxAgeYears: 15,
  availableForBreedingOnly: false,
};

export const DISTANCE_OPTIONS = [2, 5, 10, 25, 50] as const;

/** Radius within which owners get "nearby compatible pet" alerts. */
export const NEARBY_ALERT_RADIUS_KM = 10;

/** Fallback map centre (New Delhi) used when location permission is denied. */
export const FALLBACK_LOCATION = {
  latitude: 28.6139,
  longitude: 77.209,
  label: 'New Delhi',
} as const;

export const STORAGE_KEYS = {
  pets: 'petconnect:pets',
  interests: 'petconnect:interests',
  matches: 'petconnect:matches',
  messages: 'petconnect:messages',
  listings: 'petconnect:listings',
  notifications: 'petconnect:notifications',
  blocked: 'petconnect:blocked',
  seeded: 'petconnect:seeded:v1',
} as const;
