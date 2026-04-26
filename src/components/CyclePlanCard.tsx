import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, radius, spacing } from '../theme/colors';
import { shiftShortLabel } from '../services/shift';
import type { CycleDay, ShiftDay } from '../types';

const DOT_COLOR: Record<ShiftDay, string> = {
  day: colors.good,
  off: colors.good,
  night: colors.ok,
  'post-night': colors.bad,
};

const TRAINING_LABEL: Record<ShiftDay, string> = {
  day: '훈련 적합',
  off: '훈련 적합',
  night: '가벼운 훈련',
  'post-night': '휴식 권고',
};

export function CyclePlanCard({ days }: { days: CycleDay[] }) {
  if (days.length === 0) return null;
  return (
    <Card title="이번 사이클 훈련 플랜">
      <View style={styles.row}>
        {days.map((d, i) => (
          <Cell key={i} day={d} />
        ))}
      </View>
      <View style={styles.legend}>
        <LegendDot color={colors.good} label="훈련 적합" />
        <LegendDot color={colors.ok} label="가벼운 훈련" />
        <LegendDot color={colors.bad} label="휴식 권고" />
      </View>
    </Card>
  );
}

function Cell({ day }: { day: CycleDay }) {
  const dot = DOT_COLOR[day.kind];
  return (
    <View
      style={[
        styles.cell,
        day.isToday && { borderColor: colors.mint, backgroundColor: colors.mint + '14' },
      ]}
    >
      <Text style={styles.dateText}>{day.date.getDate()}</Text>
      <Text style={styles.kindText}>{shiftShortLabel(day.kind)}</Text>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.trainText}>{TRAINING_LABEL[day.kind]}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  dateText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  kindText: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  trainText: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textDim,
    fontSize: 11,
  },
});
