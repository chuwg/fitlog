export const WEEKDAY_KR_SUN_FIRST = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const WEEKDAY_KR_MON_FIRST = ['월', '화', '수', '목', '금', '토', '일'] as const;

export function weekdayLabelSunFirst(d: Date): string {
  return WEEKDAY_KR_SUN_FIRST[d.getDay()]!;
}
