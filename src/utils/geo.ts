import type { Coordinates } from '@/types';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometres between two points. */
export function distanceBetween(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * Blurs a precise coordinate to roughly the given radius.
 *
 * Used when sharing location in chat so an owner never leaks their exact address.
 */
export function approximateLocation(point: Coordinates, radiusKm = 1): Coordinates {
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusKm;
  const latOffset = (distance / 111) * Math.cos(angle);
  const lonOffset =
    (distance / (111 * Math.cos(toRadians(point.latitude)) || 1)) * Math.sin(angle);

  return {
    latitude: Number((point.latitude + latOffset).toFixed(4)),
    longitude: Number((point.longitude + lonOffset).toFixed(4)),
  };
}

/**
 * Offsets a coordinate by a distance in kilometres.
 *
 * Longitude degrees shrink with latitude, so the east component is divided by
 * cos(lat) — without that, demo pets drift badly far from the equator.
 */
export function offsetByKm(
  origin: Coordinates,
  eastKm: number,
  northKm: number,
): Coordinates {
  const KM_PER_DEGREE = 111.32;
  const latitude = origin.latitude + northKm / KM_PER_DEGREE;
  const cosLat = Math.cos(toRadians(origin.latitude));
  const longitude =
    origin.longitude + eastKm / (KM_PER_DEGREE * (Math.abs(cosLat) < 0.01 ? 0.01 : cosLat));

  return { latitude, longitude };
}
