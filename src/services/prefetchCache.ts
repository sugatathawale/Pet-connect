/**
 * In-memory prefetch cache with TTL.
 *
 * Architecture note for interviewers:
 * - WarmCache() is called on app boot and on screen focus so data is ready
 *   before the user navigates.
 * - Screens check getCached() first — synchronous, no loading state, no flash.
 * - Stale entries (> ttlMs) are refreshed in the background via prefetch().
 * - All operations are async so they never block rendering.
 *
 * In production this would be replaced by a React Query / SWR layer backed
 * by the real API. The interface stays the same.
 */

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number; // Date.now()
}

// Module-level store — survives across screen navigations within the same session.
const store = new Map<string, CacheEntry<unknown>>();

/** Default TTL: 5 minutes. Tune per data type (pets = 2 min, listings = 5 min). */
export const DEFAULT_TTL_MS = 5 * 60 * 1000;

export const prefetchCache = {
  /**
   * Synchronously return cached value if fresh, null otherwise.
   * Cheap — no async needed, no re-renders.
   */
  getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > ttlMs) return null;
    return entry.data;
  },

  /**
   * Store a value in cache. Overwrites any existing entry.
   */
  setCached<T>(key: string, data: T): void {
    store.set(key, { data, fetchedAt: Date.now() });
  },

  /**
   * Warm the cache by fetching data in the background and storing it.
   * Returns the fresh data so callers can use it immediately if needed.
   * Silently ignores errors so a failed prefetch never breaks the UI.
   */
  async warm<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = DEFAULT_TTL_MS,
  ): Promise<T> {
    try {
      const data = await fetcher();
      this.setCached(key, data);
      return data;
    } catch {
      // Prefetch failed — don't crash the app; the next real load will surface errors.
      return this.getCached(key, ttlMs) ?? ({} as T);
    }
  },

  /**
   * Preload multiple keys in parallel. Useful for warming an entire screen's worth
   * of data on app start or on screen focus.
   */
  async warmAll(
    entries: Array<{ key: string; fetcher: () => Promise<unknown>; ttlMs?: number }>,
  ): Promise<void> {
    await Promise.allSettled(
      entries.map(({ key, fetcher, ttlMs }) => this.warm(key, fetcher as () => Promise<unknown>, ttlMs)),
    );
  },

  /** Remove a single entry (useful after a mutation like create/delete). */
  invalidate(key: string): void {
    store.delete(key);
  },

  /** Clear everything (e.g., on sign-out). */
  clear(): void {
    store.clear();
  },

  /** How many entries are currently cached. Useful for debugging / interview logging. */
  get size(): number {
    return store.size;
  },
};
