import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_FILTERS } from '@/constants/config';
import { CURRENT_OWNER_ID } from '@/data/seed';
import { chatService } from '@/services/chatService';
import { demoService } from '@/services/demoService';
import { listingService } from '@/services/listingService';
import { locationService } from '@/services/locationService';
import { matchService } from '@/services/matchService';
import { petService } from '@/services/petService';
import { prefetchCache } from '@/services/prefetchCache';
import type {
  InterestDecision,
  Listing,
  Match,
  Owner,
  Pet,
  PetFilters,
  PetLocation,
} from '@/types';

interface AppState {
  ready: boolean;
  currentOwnerId: string;
  owners: Owner[];
  pets: Pet[];
  myPets: Pet[];
  /** The pet whose perspective drives matching and scoring. */
  activePetId: string | null;
  activePet: Pet | null;
  matches: Match[];
  listings: Listing[];
  userLocation: PetLocation;
  isLocationPrecise: boolean;
  filters: PetFilters;
  blockedOwnerIds: string[];
}

interface AppActions {
  refresh: () => Promise<void>;
  setActivePetId: (id: string | null) => void;
  setFilters: (filters: PetFilters) => void;
  resetFilters: () => void;
  decide: (
    petId: string,
    decision: InterestDecision,
  ) => Promise<{ match: Match | null; matchedPet: Pet | null }>;
  addPet: (input: Omit<Pet, 'id' | 'createdAt'>) => Promise<Pet>;
  updatePet: (id: string, patch: Partial<Pet>) => Promise<void>;
  removePet: (id: string) => Promise<void>;
  addListing: (input: Omit<Listing, 'id' | 'createdAt'>) => Promise<Listing>;
  removeListing: (id: string) => Promise<void>;
  blockOwner: (ownerId: string) => Promise<void>;
  refreshLocation: () => Promise<void>;
  ownerById: (id: string) => Owner | undefined;
  petById: (id: string) => Pet | undefined;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [blockedOwnerIds, setBlockedOwnerIds] = useState<string[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PetFilters>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<PetLocation>({
    latitude: 28.6139,
    longitude: 77.209,
    label: 'New Delhi',
  });
  const [isLocationPrecise, setIsLocationPrecise] = useState(false);

  const loadAll = useCallback(async () => {
    const [nextOwners, nextPets, nextMatches, nextListings, nextBlocked] =
      await Promise.all([
        petService.listOwners(),
        petService.listPets(),
        matchService.listMatches(),
        listingService.listListings(),
        chatService.listBlockedOwners(),
      ]);

    setOwners(nextOwners);
    setPets(demoService.relocatePets(nextPets, userLocation));
    setMatches(nextMatches);
    setListings(demoService.relocateListings(nextListings, userLocation));
    setBlockedOwnerIds(nextBlocked);

    // Default the active pet to the owner's first pet.
    setActivePetId((current) => {
      if (current && nextPets.some((p) => p.id === current)) return current;
      return nextPets.find((p) => p.ownerId === CURRENT_OWNER_ID)?.id ?? null;
    });
  }, [userLocation]);

  /**
   * Reads pets from storage and applies demo relocation.
   *
   * Relocation is applied on every read rather than written back, so storage
   * keeps the original offsets and demo pets follow the user if the location
   * changes. Remove the demoService call when a backend supplies real data.
   */
  const reloadPets = useCallback(async (location: PetLocation) => {
    const stored = await petService.listPets();
    setPets(demoService.relocatePets(stored, location));
  }, []);

  const reloadListings = useCallback(async (location: PetLocation) => {
    const stored = await listingService.listListings();
    setListings(demoService.relocateListings(stored, location));
  }, []);

  const refreshLocation = useCallback(async () => {
    const { location, isPrecise } = await locationService.getCurrentLocation();
    setUserLocation(location);
    setIsLocationPrecise(isPrecise);

    // Demo-only: move seed pets/listings around the user's real position so
    // distances are believable wherever the app is being tested.
    await Promise.all([reloadPets(location), reloadListings(location)]);
  }, [reloadPets, reloadListings]);

  // Bootstrap: data first so the UI can paint, then the slower device calls.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadAll();
      if (cancelled) return;
      setReady(true);

      // ── Startup prefetch ───────────────────────────────────────────────────
      // While the user browses the home screen, warm the cache for likely next
      // screens (listings, nearby pets, matches) so any tap is instant.
      void prefetchCache.warm('pets', petService.listPets, 2 * 60 * 1000);
      void prefetchCache.warm('listings', listingService.listListings, 5 * 60 * 1000);
      void prefetchCache.warm('matches', matchService.listMatches, 2 * 60 * 1000);

      await refreshLocation();
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAll, refreshLocation]);

  const myPets = useMemo(
    () => pets.filter((p) => p.ownerId === CURRENT_OWNER_ID),
    [pets],
  );

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId) ?? null,
    [pets, activePetId],
  );

  const decide = useCallback(
    async (petId: string, decision: InterestDecision) => {
      if (!activePetId) return { match: null, matchedPet: null };

      const candidate = pets.find((p) => p.id === petId) ?? null;

      // Demo owners reciprocate here; a real backend would receive their tap instead.
      if (decision === 'interested' && candidate) {
        await matchService.simulateReciprocalInterest(candidate, activePetId);
      }

      const { match } = await matchService.recordInterest(activePetId, petId, decision);

      setMatches(await matchService.listMatches());

      return { match, matchedPet: match ? candidate : null };
    },
    [activePetId, pets],
  );

  const addPet = useCallback(
    async (input: Omit<Pet, 'id' | 'createdAt'>) => {
      const pet = await petService.createPet(input);
      await reloadPets(userLocation);
      setActivePetId((current) => current ?? pet.id);
      return pet;
    },
    [reloadPets, userLocation],
  );

  const updatePet = useCallback(async (id: string, patch: Partial<Pet>) => {
    await petService.updatePet(id, patch);
    await reloadPets(userLocation);
  }, [reloadPets, userLocation]);

  const removePet = useCallback(async (id: string) => {
    await petService.deletePet(id);
    const nextPets = demoService.relocatePets(await petService.listPets(), userLocation);
    setPets(nextPets);
    setActivePetId((current) =>
      current === id
        ? nextPets.find((p) => p.ownerId === CURRENT_OWNER_ID)?.id ?? null
        : current,
    );
  }, [userLocation]);

  const addListing = useCallback(async (input: Omit<Listing, 'id' | 'createdAt'>) => {
    const listing = await listingService.createListing(input);
    await reloadListings(userLocation);
    return listing;
  }, [reloadListings, userLocation]);

  const removeListing = useCallback(async (id: string) => {
    await listingService.deleteListing(id);
    await reloadListings(userLocation);
  }, [reloadListings, userLocation]);

  const blockOwner = useCallback(async (ownerId: string) => {
    await chatService.blockOwner(ownerId);
    setBlockedOwnerIds(await chatService.listBlockedOwners());
  }, []);

  const value = useMemo(
    () => ({
      ready,
      currentOwnerId: CURRENT_OWNER_ID,
      owners,
      pets,
      myPets,
      activePetId,
      activePet,
      matches,
      listings,
      userLocation,
      isLocationPrecise,
      filters,
      blockedOwnerIds,
      refresh: loadAll,
      setActivePetId,
      setFilters,
      resetFilters: () => setFilters(DEFAULT_FILTERS),
      decide,
      addPet,
      updatePet,
      removePet,
      addListing,
      removeListing,
      blockOwner,
      refreshLocation,
      ownerById: (id: string) => owners.find((o) => o.id === id),
      petById: (id: string) => pets.find((p) => p.id === id),
    }),
    [
      ready,
      owners,
      pets,
      myPets,
      activePetId,
      activePet,
      matches,
      listings,
      userLocation,
      isLocationPrecise,
      filters,
      blockedOwnerIds,
      loadAll,
      decide,
      addPet,
      updatePet,
      removePet,
      addListing,
      removeListing,
      blockOwner,
      refreshLocation,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
}
