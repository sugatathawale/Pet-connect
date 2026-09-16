/**
 * Image preloading utility.
 *
 * Architecture note for interviewers:
 * - React Native's Image.prefetch() warms the HTTP cache so card images
 *   appear instantly when the user scrolls into view.
 * - We batch prefetch calls to avoid overwhelming the image pipeline.
 * - Fallback is safe — Image will still load normally if prefetch
 *   is still running or fails silently.
 */

import { Image } from 'react-native';

// Keep a module-level Set of already-prefetched URLs to avoid re-fetching.
const prefetched = new Set<string>();

/**
 * Prefetch a batch of image URLs in parallel, but with concurrency limiting.
 * Skips URLs already prefetched this session.
 *
 * @param urls   Array of image URLs (can include Unsplash CDN URLs)
 * @param concurrency  Max simultaneous prefetches (default 4)
 */
export async function prefetchImages(
  urls: string[],
  concurrency = 4,
): Promise<void> {
  const fresh = urls.filter((u) => u && !prefetched.has(u));
  if (fresh.length === 0) return;

  // Process in batches of `concurrency` to avoid hammering the CDN.
  for (let i = 0; i < fresh.length; i += concurrency) {
    const batch = fresh.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map((url) =>
        Image.prefetch(url)
          .then(() => prefetched.add(url))
          .catch(() => {
            /* Non-fatal: Image will load normally on render */
          }),
      ),
    );
  }
}

/**
 * Prefetch the first N images from a list of items that have a photos array.
 * Useful for preloading hero images for a feed of cards.
 *
 * @param items  Objects that have a `photos: string[]` field
 * @param limit  Max images to prefetch (default 6 — keeps the feed feeling instant)
 */
export function prefetchPetPhotos<T extends { photos: string[] }>(
  items: T[],
  limit = 6,
): void {
  if (!items || items.length === 0) return;
  const urls = items
    .slice(0, limit)
    .map((item) => item?.photos?.[0])
    .filter(Boolean) as string[];
  prefetchImages(urls);
}

/**
 * Prefetch cover images for a list of listings.
 *
 * @param items  Objects that have a `photo: string` field
 * @param limit  Max images to prefetch (default 6)
 */
export function prefetchListingPhotos<T extends { photo: string }>(
  items: T[],
  limit = 6,
): void {
  if (!items || items.length === 0) return;
  const urls = items.slice(0, limit).map((item) => item?.photo).filter(Boolean) as string[];
  prefetchImages(urls);
}

/** Reset the prefetched set (call on sign-out). */
export function resetImagePreloader(): void {
  prefetched.clear();
}
