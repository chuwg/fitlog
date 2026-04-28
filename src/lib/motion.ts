import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';

const G = 9.81;
const COOLDOWN_MS = 800;
const UPDATE_INTERVAL_MS = 50;

export interface MotionDetectorOptions {
  jumpG: number;
  sprintG: number;
  onJump: () => void;
  onSprint: () => void;
}

export interface MotionDetectorHandle {
  stop: () => void;
}

export async function startMotionDetector(
  opts: MotionDetectorOptions,
): Promise<MotionDetectorHandle | null> {
  const available = await DeviceMotion.isAvailableAsync().catch(() => false);
  if (!available) return null;

  const perm = await DeviceMotion.requestPermissionsAsync().catch(() => null);
  if (perm && perm.status !== 'granted') return null;

  DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);

  let lastJumpAt = 0;
  let lastSprintAt = 0;
  let inJumpPeak = false;
  let prevMag = 0;

  const sub = DeviceMotion.addListener((m: DeviceMotionMeasurement) => {
    const a = m.accelerationIncludingGravity;
    if (!a) return;
    const x = a.x ?? 0;
    const y = a.y ?? 0;
    const z = a.z ?? 0;
    const magG = Math.sqrt(x * x + y * y + z * z) / G;
    const horizG = Math.sqrt(x * x + y * y) / G;
    const now = Date.now();

    if (magG > opts.jumpG && !inJumpPeak) {
      inJumpPeak = true;
    } else if (
      inJumpPeak &&
      magG < prevMag &&
      magG < opts.jumpG * 0.7
    ) {
      if (now - lastJumpAt > COOLDOWN_MS) {
        opts.onJump();
        lastJumpAt = now;
      }
      inJumpPeak = false;
    }

    if (horizG > opts.sprintG && now - lastSprintAt > COOLDOWN_MS) {
      opts.onSprint();
      lastSprintAt = now;
    }

    prevMag = magG;
  });

  return {
    stop: () => sub.remove(),
  };
}
