import type { CycleDay, ShiftConfig, ShiftDay, ShiftKind } from '../types';

export const DEFAULT_CYCLE: ShiftKind[] = [
  'day',
  'day',
  'off',
  'off',
  'night',
  'night',
  'off',
  'off',
];

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function defaultShiftConfig(): ShiftConfig {
  return {
    cycle: [...DEFAULT_CYCLE],
    startDate: todayISO(),
    dayStart: '07:00',
    dayEnd: '19:30',
    nightStart: '19:30',
    nightEnd: '08:00',
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function daysBetween(startISO: string, target: Date): number {
  const start = startOfDay(parseISODate(startISO)).getTime();
  const end = startOfDay(target).getTime();
  return Math.floor((end - start) / 86400000);
}

export function shiftKindForDate(cfg: ShiftConfig, date: Date): ShiftKind {
  const len = cfg.cycle.length;
  if (len === 0) return 'off';
  const diff = daysBetween(cfg.startDate, date);
  const idx = ((diff % len) + len) % len;
  return cfg.cycle[idx]!;
}

export function shiftDayForDate(cfg: ShiftConfig, date: Date): ShiftDay {
  const raw = shiftKindForDate(cfg, date);
  if (raw !== 'off') return raw;
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  if (shiftKindForDate(cfg, prev) === 'night') return 'post-night';
  return 'off';
}

export function shiftModifier(kind: ShiftDay): number {
  switch (kind) {
    case 'day':
      return 0;
    case 'night':
      return -15;
    case 'post-night':
      return -20;
    case 'off':
      return 5;
  }
}

export function shiftLabel(kind: ShiftDay, now?: Date): string {
  switch (kind) {
    case 'day':
      return '주간 근무';
    case 'night': {
      if (!now) return '야간 근무';
      const h = now.getHours();
      if (h >= 19 || h < 8) return '야간 근무 중';
      return '야간 전';
    }
    case 'post-night':
      return '야간 후 휴식';
    case 'off':
      return '휴무';
  }
}

export function shiftShortLabel(kind: ShiftDay): string {
  switch (kind) {
    case 'day':
      return '주';
    case 'night':
      return '야';
    case 'post-night':
      return '후';
    case 'off':
      return '휴';
  }
}

export function cycleDays(cfg: ShiftConfig, anchor: Date): CycleDay[] {
  const len = cfg.cycle.length;
  if (len === 0) return [];
  const today = startOfDay(anchor);
  const diff = daysBetween(cfg.startDate, today);
  const idx = ((diff % len) + len) % len;
  const start = new Date(today);
  start.setDate(today.getDate() - idx);
  const out: CycleDay[] = [];
  for (let i = 0; i < len; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push({
      date: d,
      kind: shiftDayForDate(cfg, d),
      isToday: d.getTime() === today.getTime(),
    });
  }
  return out;
}
