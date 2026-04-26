import * as Notifications from 'expo-notifications';
import { addHoursToHM, parseHM } from '../lib/time';
import { DEFAULT_BASE_TIMES } from './db';
import { shiftDayForDate } from './shift';
import type {
  MorningReportConfig,
  ShiftConfig,
  ShiftDay,
  Supplement,
  SupplementBaseTimes,
  SupplementTiming,
} from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const TIMING_LABEL: Record<SupplementTiming, string> = {
  morning: '아침 식후',
  preworkout: '운동 전',
  postworkout: '운동 후',
  bedtime: '취침 전',
};

export const TIMING_ORDER: SupplementTiming[] = [
  'morning',
  'preworkout',
  'postworkout',
  'bedtime',
];

export type NotificationKind = 'supplement' | 'morning';

export const NOTIFICATION_ROUTES: Record<NotificationKind, string> = {
  supplement: '/(tabs)/settings',
  morning: '/morning-report',
};

export async function ensureNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

async function cancelByKind(kind: NotificationKind): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    const data = n.content.data as { kind?: NotificationKind } | undefined;
    if (data?.kind === kind) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

function adjustForShift(
  timing: SupplementTiming,
  shiftDay: ShiftDay,
  base: string,
  shiftConfig: ShiftConfig | null,
): string {
  if (shiftDay === 'day' || shiftDay === 'off') return base;
  if (shiftDay === 'night') {
    if (timing === 'bedtime') {
      const dayStart = shiftConfig?.dayStart ?? '07:00';
      return addHoursToHM(dayStart, 2);
    }
    return base;
  }
  return addHoursToHM(base, 2);
}

export function computeNotificationTime(
  supp: Supplement,
  shiftDay: ShiftDay | null,
  baseTimes: SupplementBaseTimes,
  shiftConfig: ShiftConfig | null,
): string {
  const base = baseTimes[supp.timing] ?? DEFAULT_BASE_TIMES[supp.timing];
  if (!supp.shiftAdjust || !shiftDay) return base;
  return adjustForShift(supp.timing, shiftDay, base, shiftConfig);
}

export async function rescheduleSupplementNotifications(
  supplements: Supplement[],
  shiftConfig: ShiftConfig | null,
  baseTimes: SupplementBaseTimes,
  days: number = 7,
): Promise<number> {
  await cancelByKind('supplement');
  const enabled = supplements.filter((s) => s.enabled);
  if (enabled.length === 0) return 0;

  const granted = await ensureNotificationPermission();
  if (!granted) return 0;

  const now = new Date();
  let scheduled = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const shiftDay = shiftConfig ? shiftDayForDate(shiftConfig, date) : null;
    for (const supp of enabled) {
      const timeStr = computeNotificationTime(supp, shiftDay, baseTimes, shiftConfig);
      const { hour, minute } = parseHM(timeStr);
      const trigger = new Date(date);
      trigger.setHours(hour, minute, 0, 0);
      if (trigger.getTime() <= Date.now() + 30_000) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${supp.name} 복용 시간`,
          body: `${supp.dose} · ${TIMING_LABEL[supp.timing]}`,
          sound: 'default',
          data: { kind: 'supplement', supplementId: supp.id },
        },
        trigger: { date: trigger },
      });
      scheduled += 1;
    }
  }
  return scheduled;
}

export interface MorningReportSnapshot {
  score: number | null;
  recommendationTitle: string | null;
  weatherSummary: string | null;
}

function buildMorningBody(snap: MorningReportSnapshot): string {
  const parts: string[] = [];
  if (snap.score !== null) parts.push(`훈련 준비 ${snap.score}점`);
  if (snap.recommendationTitle) parts.push(snap.recommendationTitle);
  if (snap.weatherSummary) parts.push(snap.weatherSummary);
  if (parts.length === 0) return '오늘의 컨디션을 확인해보세요.';
  return parts.join(' · ');
}

export async function rescheduleMorningReports(
  reportConfig: MorningReportConfig,
  shiftConfig: ShiftConfig | null,
  snapshot: MorningReportSnapshot,
  days: number = 7,
): Promise<number> {
  await cancelByKind('morning');

  const granted = await ensureNotificationPermission();
  if (!granted) return 0;

  const now = new Date();
  let scheduled = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const shiftDay = shiftConfig ? shiftDayForDate(shiftConfig, date) : null;

    if (reportConfig.skipNight && shiftDay === 'night') continue;

    let timeStr = reportConfig.notificationTime;
    if (reportConfig.adjustPostNight && shiftDay === 'post-night') {
      timeStr = addHoursToHM(timeStr, 2);
    }

    const { hour, minute } = parseHM(timeStr);
    const trigger = new Date(date);
    trigger.setHours(hour, minute, 0, 0);
    if (trigger.getTime() <= Date.now() + 30_000) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💪 모닝 리포트',
        body: buildMorningBody(snapshot),
        sound: 'default',
        data: { kind: 'morning' },
      },
      trigger: { date: trigger },
    });
    scheduled += 1;
  }
  return scheduled;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
