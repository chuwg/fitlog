import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import type { Readiness } from '../types';

const STATUS_COLOR: Record<Readiness['status'], string> = {
  peak: colors.good,
  good: colors.ok,
  fair: colors.warn,
  fatigue: colors.bad,
};

export function ReadinessCard({ readiness }: { readiness: Readiness }) {
  const accent = STATUS_COLOR[readiness.status];
  return (
    <View style={[styles.card, { borderColor: accent + '55' }]}>
      <View style={styles.top}>
        <Text style={styles.caption}>오늘의 훈련 준비 점수</Text>
        <View style={[styles.badge, { backgroundColor: accent + '22' }]}>
          <Text style={[styles.badgeText, { color: accent }]}>
            {readiness.emoji} {readiness.label}
          </Text>
        </View>
      </View>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: accent }]}>{readiness.total}</Text>
        <Text style={styles.scoreMax}>/ 100</Text>
      </View>
      <Text style={styles.advice}>{readiness.advice}</Text>
      <View style={styles.breakdown}>
        <BreakdownItem label="수면" value={readiness.breakdown.sleep} max={30} />
        <BreakdownItem label="HRV" value={readiness.breakdown.hrv} max={25} />
        <BreakdownItem label="회복" value={readiness.breakdown.recovery} max={25} />
        <BreakdownItem label="부하" value={readiness.breakdown.load} max={20} />
      </View>
    </View>
  );
}

function BreakdownItem({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <View style={styles.bItem}>
      <Text style={styles.bLabel}>{label}</Text>
      <Text style={styles.bValue}>
        {value}
        <Text style={styles.bMax}>/{max}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caption: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.md,
  },
  score: {
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 76,
  },
  scoreMax: {
    color: colors.textMuted,
    fontSize: 20,
    marginLeft: spacing.sm,
    marginBottom: 10,
    fontWeight: '600',
  },
  advice: {
    color: colors.text,
    fontSize: 15,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bItem: {
    alignItems: 'center',
    flex: 1,
  },
  bLabel: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: 4,
  },
  bValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  bMax: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
