import * as Location from 'expo-location';

import { FALLBACK_LOCATION } from '@/constants/config';
import type { PetLocation } from '@/types';

/**
 * Device location with a graceful fallback.
 *
 * Location is a convenience here, not a gate: if permission is denied the app
 * still works from a default city centre rather than blocking the feed.
 */
export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<{ location: PetLocation; isPrecise: boolean }> {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        return { location: { ...FALLBACK_LOCATION }, isPrecise: false };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const label = await this.reverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
      );

      return {
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label,
        },
        isPrecise: true,
      };
    } catch (error) {
      console.warn('[location] falling back to default city', error);
      return { location: { ...FALLBACK_LOCATION }, isPrecise: false };
    }
  },

  /**
   * Best-effort place name for a coordinate.
   *
   * Reverse geocoding needs native support and is unavailable on web (and can
   * fail on device), so the fallback is the coordinate itself rather than a
   * meaningless "Unknown area" — the user still learns where they are.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const coordinateLabel = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (!place) return coordinateLabel;

      // Try progressively broader fields: a specific area is nicer, but any
      // recognisable place name beats showing raw coordinates.
      const area = place.district ?? place.subregion ?? place.name ?? place.street;
      const city = place.city ?? place.region ?? place.country;

      const label = [area, city]
        .filter((part): part is string => Boolean(part))
        // Avoid "Delhi, Delhi" when the area and city resolve to the same name.
        .filter((part, index, parts) => parts.indexOf(part) === index)
        .join(', ');

      return label || coordinateLabel;
    } catch {
      return coordinateLabel;
    }
  },
};
