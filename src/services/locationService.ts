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

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (!place) return 'Unknown area';

      return [place.district ?? place.subregion, place.city ?? place.region]
        .filter(Boolean)
        .join(', ') || 'Unknown area';
    } catch {
      return 'Unknown area';
    }
  },
};
