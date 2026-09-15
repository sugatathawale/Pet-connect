

import { useCallback, useEffect, useRef, useState } from 'react';

import { prefetchCache } from '@/services/prefetchCache';
import { prefetchPetPhotos, prefetchListingPhotos } from '@/utils/imagePreloader';

export interface PrefetchEntry {
  key: string;
  fetcher: () => Promise<unknown>;
  ttlMs?: number;
}

export interface UsePrefetchOptions {
  entries: PrefetchEntry[];
  petPhotos?: Array<{ photos: string[] }>;
  listingPhotos?: Array<{ photo: string }>;
  revalidate?: boolean;
  revalidateMs?: number;
}

/**
 * Fires background prefetch on mount.
 *
 * On first call returns immediately (empty). On subsequent calls within
 * TTL returns cached data and refreshes in the background.
 */
export function usePrefetch(options: UsePrefetchOptions) {
  const { entries, petPhotos, listingPhotos, revalidate = false, revalidateMs = 60_000 } = options;

  const [loading, setLoading] = useState(false);

  const warmRef = useRef<() => void>(() => {});

  const warm = useCallback(() => {
    warmRef.current();
  }, []);

  useEffect(() => {
    const run = async () => {
      // Kick off image prefetch in parallel with data.
      const imageTask =
        petPhotos && petPhotos.length > 0
          ? prefetchPetPhotos(petPhotos, 8)
          : listingPhotos && listingPhotos.length > 0
          ? prefetchListingPhotos(listingPhotos, 8)
          : Promise.resolve();

      setLoading(true);
      try {
        await Promise.allSettled(
          entries.map(({ key, fetcher, ttlMs }) =>
            prefetchCache.warm(key, fetcher, ttlMs),
          ),
        );
      } finally {
        setLoading(false);
      }
      await imageTask;
    };

    warmRef.current = run;
    run();

    if (revalidate) {
      const id = setInterval(run, revalidateMs);
      return () => clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, warm };
}
