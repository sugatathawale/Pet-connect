import type { AvailabilityWindow, Pet } from '@/types';

/**
 * Decides whether a viewer may see a pet's breeding availability window.
 *
 * Reproductive information is private by default. This is the single gate for that
 * decision — screens must call it rather than reading `availability` directly, so
 * the rule can never drift between two surfaces.
 */
export function canViewAvailability(
  pet: Pet,
  viewer: { ownerId: string; isMatched: boolean; distanceKm: number },
): boolean {
  // An owner always sees their own pet's details.
  if (pet.ownerId === viewer.ownerId) return true;
  if (!pet.availability.enabled) return false;

  switch (pet.availability.visibility) {
    case 'private':
      return false;
    case 'matches_only':
      return viewer.isMatched;
    case 'nearby_owners':
      return true;
    default:
      return false;
  }
}

export const VISIBILITY_LABELS: Record<AvailabilityWindow['visibility'], string> = {
  private: 'Only me',
  matches_only: 'Owners I match with',
  nearby_owners: 'Nearby owners',
};

export const VISIBILITY_HINTS: Record<AvailabilityWindow['visibility'], string> = {
  private: 'Nobody else can see these dates.',
  matches_only: 'Shared only after you both show interest.',
  nearby_owners: 'Visible to verified owners close to you.',
};
