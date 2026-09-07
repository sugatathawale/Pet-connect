import { STORAGE_KEYS } from '@/constants/config';
import { seedListings } from '@/data/seed';
import type { Listing } from '@/types';
import { createId, storage } from './storage';

export const listingService = {
  async listListings(): Promise<Listing[]> {
    const stored = await storage.get<Listing[]>(STORAGE_KEYS.listings, seedListings);
    return [...stored].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getListing(id: string): Promise<Listing | null> {
    const listings = await this.listListings();
    return listings.find((l) => l.id === id) ?? null;
  },

  async createListing(input: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing> {
    const listings = await this.listListings();
    const listing: Listing = {
      ...input,
      id: createId('listing'),
      createdAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.listings, [listing, ...listings]);
    return listing;
  },

  async deleteListing(id: string): Promise<void> {
    const listings = await this.listListings();
    await storage.set(
      STORAGE_KEYS.listings,
      listings.filter((l) => l.id !== id),
    );
  },
};
