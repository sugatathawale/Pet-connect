import { STORAGE_KEYS } from '@/constants/config';
import { seedOwners, seedPets } from '@/data/seed';
import type { Owner, Pet } from '@/types';
import { createId, storage } from './storage';

/**
 * Pet and owner reads/writes.
 *
 * Owners are read-only demo data; pets are persisted so anything the user creates
 * survives a reload. Swap the bodies here for API calls to move to a real backend.
 */
export const petService = {
  async listPets(): Promise<Pet[]> {
    return storage.get<Pet[]>(STORAGE_KEYS.pets, seedPets);
  },

  async getPet(id: string): Promise<Pet | null> {
    const pets = await this.listPets();
    return pets.find((p) => p.id === id) ?? null;
  },

  async listPetsByOwner(ownerId: string): Promise<Pet[]> {
    const pets = await this.listPets();
    return pets.filter((p) => p.ownerId === ownerId);
  },

  async createPet(input: Omit<Pet, 'id' | 'createdAt'>): Promise<Pet> {
    const pets = await this.listPets();
    const pet: Pet = { ...input, id: createId('pet'), createdAt: new Date().toISOString() };
    await storage.set(STORAGE_KEYS.pets, [pet, ...pets]);
    return pet;
  },

  async updatePet(id: string, patch: Partial<Pet>): Promise<Pet | null> {
    const pets = await this.listPets();
    const index = pets.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updated = { ...pets[index], ...patch, id };
    pets[index] = updated;
    await storage.set(STORAGE_KEYS.pets, pets);
    return updated;
  },

  async deletePet(id: string): Promise<void> {
    const pets = await this.listPets();
    await storage.set(
      STORAGE_KEYS.pets,
      pets.filter((p) => p.id !== id),
    );
  },

  async listOwners(): Promise<Owner[]> {
    return seedOwners;
  },

  async getOwner(id: string): Promise<Owner | null> {
    return seedOwners.find((o) => o.id === id) ?? null;
  },
};
