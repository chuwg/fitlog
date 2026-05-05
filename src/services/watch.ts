import {
  isAvailable as bridgeAvailable,
  isWatchAppInstalled,
  isWatchPaired,
  isWatchReachable,
  sendMessage,
  updateApplicationContext,
} from 'fitlog-watch-bridge';

export interface WatchPayload {
  score?: number;
  status?: string;
  advice?: string;
  sleepHours?: number;
  updatedAt?: number;
}

export function isWatchSyncAvailable(): boolean {
  return bridgeAvailable() && isWatchPaired() && isWatchAppInstalled();
}

export async function syncToWatch(payload: WatchPayload): Promise<void> {
  if (!bridgeAvailable()) return;
  if (!isWatchPaired() || !isWatchAppInstalled()) return;
  const data: Record<string, unknown> = { ...payload, updatedAt: Date.now() };

  if (isWatchReachable()) {
    try {
      await sendMessage(data);
    } catch {}
  }
  try {
    await updateApplicationContext(data);
  } catch {}
}
