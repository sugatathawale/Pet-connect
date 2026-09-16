/**
 * Demo auth service backed by the typed AsyncStorage wrapper.
 *
 * There is no real backend in this build — `signInDemo` just persists a tiny
 * `StoredSession` record so the app can survive an app relaunch and remember
 * that the user is signed in. Replace this module with a real API once one
 * exists; the call sites (AppContext actions, login/signup screens) would
 * stay the same.
 */

import { storage } from '@/services/storage';

const SESSION_KEY = '@pet-connect/session';

export interface StoredSession {
  /** Backend owner id. Demo-only: always `CURRENT_OWNER_ID`. */
  ownerId: string;
  /** Lowercased email used as the sign-in identifier. */
  email: string;
  /** Optional display name collected at signup. */
  name: string | null;
}

export const authService = {
  /** Returns the stored session, or null when nobody is signed in. */
  async getSession(): Promise<StoredSession | null> {
    return storage.get<StoredSession | null>(SESSION_KEY, null);
  },

  /** Convenience: are we signed in right now? */
  async isSignedIn(): Promise<boolean> {
    return (await this.getSession()) !== null;
  },

  /**
   * Persist a demo session for the given email/name.
   * Returns the session that was stored so callers can echo it back into React state.
   */
  async signInDemo({ email, name = null }: { email: string; name?: string | null }): Promise<StoredSession> {
    const session: StoredSession = {
      ownerId: 'owner-me',
      email,
      name,
    };
    await storage.set(SESSION_KEY, session);
    return session;
  },

  /** Wipe the local session record. */
  async signOut(): Promise<void> {
    await storage.remove(SESSION_KEY);
  },
};
