import { STORAGE_KEYS } from '@/constants/config';
import { CURRENT_OWNER_ID } from '@/data/seed';
import type { Interest, InterestDecision, Match, Pet } from '@/types';
import { petService } from './petService';
import { createId, storage } from './storage';

/**
 * Interest and match logic.
 *
 * A match exists only when interest is mutual. Because the other owners are demo
 * data with no real device to tap "interested" on, `simulateReciprocalInterest`
 * stands in for their side of the handshake — that is the one piece of this file
 * a real backend would delete outright.
 */
export const matchService = {
  async listInterests(): Promise<Interest[]> {
    return storage.get<Interest[]>(STORAGE_KEYS.interests, []);
  },

  async listMatches(): Promise<Match[]> {
    return storage.get<Match[]>(STORAGE_KEYS.matches, []);
  },

  /** Pet ids the viewer's pet has already judged, so the feed can skip them. */
  async decidedPetIds(fromPetId: string): Promise<string[]> {
    const interests = await this.listInterests();
    return interests.filter((i) => i.fromPetId === fromPetId).map((i) => i.toPetId);
  },

  /**
   * Records a decision and returns the new match when interest turns out mutual.
   */
  async recordInterest(
    fromPetId: string,
    toPetId: string,
    decision: InterestDecision,
  ): Promise<{ match: Match | null }> {
    const interests = await this.listInterests();

    const interest: Interest = {
      id: createId('interest'),
      fromPetId,
      toPetId,
      decision,
      createdAt: new Date().toISOString(),
    };

    // Replace any previous decision for this pair so re-deciding is idempotent.
    const next = [
      ...interests.filter((i) => !(i.fromPetId === fromPetId && i.toPetId === toPetId)),
      interest,
    ];
    await storage.set(STORAGE_KEYS.interests, next);

    if (decision === 'skipped') return { match: null };

    const isMutual = next.some(
      (i) => i.fromPetId === toPetId && i.toPetId === fromPetId && i.decision === 'interested',
    );
    if (!isMutual) return { match: null };

    return { match: await this.createMatch(fromPetId, toPetId) };
  },

  async createMatch(petA: string, petB: string): Promise<Match> {
    const matches = await this.listMatches();

    const existing = matches.find(
      (m) => m.petIds.includes(petA) && m.petIds.includes(petB),
    );
    if (existing) return existing;

    const match: Match = {
      id: createId('match'),
      petIds: [petA, petB],
      createdAt: new Date().toISOString(),
      lastMessagePreview: null,
      lastMessageAt: null,
      unreadCount: 0,
    };
    await storage.set(STORAGE_KEYS.matches, [match, ...matches]);
    return match;
  },

  async getMatch(id: string): Promise<Match | null> {
    const matches = await this.listMatches();
    return matches.find((m) => m.id === id) ?? null;
  },

  async isMatchedWith(petId: string, ownerId = CURRENT_OWNER_ID): Promise<boolean> {
    const [matches, myPets] = await Promise.all([
      this.listMatches(),
      petService.listPetsByOwner(ownerId),
    ]);
    const myPetIds = new Set(myPets.map((p) => p.id));

    return matches.some(
      (m) => m.petIds.includes(petId) && m.petIds.some((id) => myPetIds.has(id)),
    );
  },

  /**
   * Demo stand-in for the other owner tapping "interested".
   *
   * Pets that are open to breeding reciprocate; the rest do not, so matches still
   * feel earned rather than guaranteed.
   */
  async simulateReciprocalInterest(candidate: Pet, viewerPetId: string): Promise<void> {
    if (!candidate.availableForBreeding) return;

    const interests = await this.listInterests();
    const alreadyResponded = interests.some(
      (i) => i.fromPetId === candidate.id && i.toPetId === viewerPetId,
    );
    if (alreadyResponded) return;

    await storage.set(STORAGE_KEYS.interests, [
      ...interests,
      {
        id: createId('interest'),
        fromPetId: candidate.id,
        toPetId: viewerPetId,
        decision: 'interested' as InterestDecision,
        createdAt: new Date().toISOString(),
      },
    ]);
  },

  async updateMatchPreview(matchId: string, preview: string): Promise<void> {
    const matches = await this.listMatches();
    const index = matches.findIndex((m) => m.id === matchId);
    if (index === -1) return;

    matches[index] = {
      ...matches[index],
      lastMessagePreview: preview,
      lastMessageAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.matches, matches);
  },
};
