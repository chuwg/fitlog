import * as Location from 'expo-location';

export const DEFAULT_LOCATION_NAME = '제주 애월';

export const DEFAULT_LOCATION = {
  latitude: 33.4637,
  longitude: 126.3379,
  name: DEFAULT_LOCATION_NAME,
  isDefault: true as const,
};

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export async function resolveLocation(): Promise<ResolvedLocation> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
        isDefault: true,
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      isDefault: false,
    };
  } catch {
    return {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      isDefault: true,
    };
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const r = results[0];
    if (!r) return null;
    return r.district ?? r.city ?? r.region ?? r.name ?? null;
  } catch {
    return null;
  }
}
