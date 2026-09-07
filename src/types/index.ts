/**
 * Core domain model for Pet Connect.
 *
 * These types are the contract between the UI and the service layer. Swapping the
 * mock services in `src/services` for a real backend should not require changes here.
 */

export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetGender = 'male' | 'female';
export type VaccinationStatus = 'vaccinated' | 'partial' | 'not_vaccinated';

/** Who may see a pet's breeding availability window. */
export type AvailabilityVisibility = 'private' | 'matches_only' | 'nearby_owners';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PetLocation extends Coordinates {
  /** Human-readable label, e.g. "Hauz Khas, Delhi". */
  label: string;
}

/**
 * A breeding availability window.
 *
 * Reproductive details are sensitive: `visibility` gates who can see this, and
 * defaults to `private`. The UI must never surface an owner's window to a viewer
 * that `canViewAvailability` rejects.
 */
export interface AvailabilityWindow {
  enabled: boolean;
  /** ISO date string (YYYY-MM-DD). */
  startDate: string | null;
  endDate: string | null;
  visibility: AvailabilityVisibility;
  notes?: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  photos: string[];
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  /** ISO date string (YYYY-MM-DD). Age is always derived from this, never stored. */
  dateOfBirth: string;
  location: PetLocation;
  bio: string;
  vaccination: VaccinationStatus;
  isSpayedOrNeutered: boolean;
  availableForBreeding: boolean;
  availability: AvailabilityWindow;
  createdAt: string;
}

export interface Owner {
  id: string;
  name: string;
  avatar: string | null;
  city: string;
  isVerified: boolean;
  bio: string;
  joinedAt: string;
}

/** A swipe decision recorded against a pet. */
export type InterestDecision = 'interested' | 'skipped';

export interface Interest {
  id: string;
  /** The pet doing the liking (always owned by the current user). */
  fromPetId: string;
  toPetId: string;
  decision: InterestDecision;
  createdAt: string;
}

export interface Match {
  id: string;
  petIds: [string, string];
  createdAt: string;
  /** Denormalised for cheap conversation list rendering. */
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export type MessageKind = 'text' | 'image' | 'location';

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  kind: MessageKind;
  /** Message body, image URI, or a "lat,lng" pair depending on `kind`. */
  body: string;
  createdAt: string;
}

export type ListingKind = 'adopt' | 'sell';

export interface Listing {
  id: string;
  ownerId: string;
  kind: ListingKind;
  title: string;
  photos: string[];
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  dateOfBirth: string;
  location: PetLocation;
  /** Null for adoption listings. Rupees for sales. */
  price: number | null;
  description: string;
  vaccination: VaccinationStatus;
  createdAt: string;
}

export type NotificationKind =
  | 'match'
  | 'message'
  | 'nearby_available'
  | 'availability_reminder'
  | 'listing_response';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** In-app route to open when tapped. */
  href?: string;
}

/** Home-feed filter state. */
export interface PetFilters {
  maxDistanceKm: number;
  species: PetSpecies | 'all';
  breed: string | null;
  gender: PetGender | 'all';
  minAgeYears: number;
  maxAgeYears: number;
  availableForBreedingOnly: boolean;
}

/** A pet decorated with values computed relative to the viewer. */
export interface PetWithContext {
  pet: Pet;
  owner: Owner;
  distanceKm: number;
  compatibility: CompatibilityResult;
}

export interface CompatibilityFactor {
  label: string;
  /** 0..1 score for this factor. */
  score: number;
  /** Relative importance used to weight the factor. */
  weight: number;
  detail: string;
}

export interface CompatibilityResult {
  /** Rounded 0..100 score. */
  score: number;
  factors: CompatibilityFactor[];
}
