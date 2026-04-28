import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface TrackPoint {
  ts: number;
  lat: number;
  lon: number;
}

export interface HrSample {
  ts: number;
  bpm: number;
}

export async function startLocationWatcher(
  onPoint: (p: TrackPoint) => void,
): Promise<Location.LocationSubscription | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5,
      timeInterval: 1000,
    },
    (loc) => {
      onPoint({
        ts: Date.now(),
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      });
    },
  );
}

export async function fetchLatestHeartRate(): Promise<number | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    const mod = await import('@kingstinct/react-native-healthkit');
    const HealthKit: any = (mod as any).default ?? mod;
    if (!HealthKit) return null;
    const isAvailable = await HealthKit.isHealthDataAvailable?.();
    if (!isAvailable) return null;
    const now = new Date();
    const since = new Date(now.getTime() - 60_000);
    const samples: any[] = (await HealthKit.queryQuantitySamples?.(
      'HKQuantityTypeIdentifierHeartRate',
      { from: since, to: now, unit: 'count/min' },
    )) ?? [];
    if (samples.length === 0) return null;
    const sorted = [...samples].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    );
    const bpm = sorted[0]?.quantity;
    if (typeof bpm !== 'number' || bpm <= 0) return null;
    return Math.round(bpm);
  } catch {
    return null;
  }
}

export interface WorkoutMetrics {
  cadence: number | null;
  groundContactMs: number | null;
  verticalOscillation: number | null;
}

export async function fetchLatestWorkoutMetrics(
  startedAt: number,
  endedAt: number,
): Promise<WorkoutMetrics> {
  const empty: WorkoutMetrics = {
    cadence: null,
    groundContactMs: null,
    verticalOscillation: null,
  };
  if (Platform.OS !== 'ios') return empty;
  try {
    const mod = await import('@kingstinct/react-native-healthkit');
    const HealthKit: any = (mod as any).default ?? mod;
    if (!HealthKit) return empty;
    const range = { from: new Date(startedAt), to: new Date(endedAt) };
    const tryQuery = async (id: string, unit?: string): Promise<number | null> => {
      try {
        const samples: any[] = (await HealthKit.queryQuantitySamples?.(
          id,
          unit ? { ...range, unit } : range,
        )) ?? [];
        if (samples.length === 0) return null;
        const sum = samples.reduce(
          (acc: number, s: any) => acc + (s.quantity ?? 0),
          0,
        );
        return sum / samples.length;
      } catch {
        return null;
      }
    };
    const [cadence, gct, vo] = await Promise.all([
      tryQuery('HKQuantityTypeIdentifierRunningStrideLength').then((v) =>
        v ? Math.round(v * 100) : null,
      ),
      tryQuery('HKQuantityTypeIdentifierRunningGroundContactTime').then((v) =>
        v ? Math.round(v * 1000) : null,
      ),
      tryQuery('HKQuantityTypeIdentifierRunningVerticalOscillation'),
    ]);
    return {
      cadence,
      groundContactMs: gct,
      verticalOscillation: vo ? Number(vo.toFixed(1)) : null,
    };
  } catch {
    return empty;
  }
}
