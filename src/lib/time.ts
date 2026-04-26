export interface HM {
  hour: number;
  minute: number;
}

export function parseHM(s: string): HM {
  const [h, m] = s.split(':');
  const hour = Math.min(23, Math.max(0, parseInt(h ?? '0', 10) || 0));
  const minute = Math.min(59, Math.max(0, parseInt(m ?? '0', 10) || 0));
  return { hour, minute };
}

export function formatHM(h: HM): string {
  return `${String(h.hour).padStart(2, '0')}:${String(h.minute).padStart(2, '0')}`;
}

export function hmToDate(s: string, base?: Date): Date {
  const { hour, minute } = parseHM(s);
  const d = base ? new Date(base) : new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function dateToHM(d: Date): string {
  return formatHM({ hour: d.getHours(), minute: d.getMinutes() });
}

export function addHoursToHM(hm: string, hours: number): string {
  const { hour, minute } = parseHM(hm);
  const total = (hour * 60 + minute + hours * 60 + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return formatHM({ hour: h, minute: m });
}
