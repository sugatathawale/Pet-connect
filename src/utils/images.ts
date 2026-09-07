/** Neutral paw-print placeholder shown when a pet has no photo. */
const PLACEHOLDER =
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=600&q=70';

/**
 * First photo of a pet or listing, falling back to a placeholder.
 *
 * Every image source goes through this so a photo-less profile renders as a real
 * image rather than an empty grey box.
 */
export function primaryPhoto(photos: string[]): string {
  return photos[0] ?? PLACEHOLDER;
}
