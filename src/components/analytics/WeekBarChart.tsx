import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';
import type { DayActivity } from '../../lib/analytics';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

export function WeekBarChart({ data }: { data: DayActivity[] }) {
  const max = Math.max(
    1,
    ...data.map((d) => d.runningMinutes + d.basketballMinutes),
  );
  return (
    <View>
      <View style={styles.row}>
        {data.map((d, i) => {
          const total = d.runningMinutes + d.basketballMinutes;
          const ratio = total / max;
          const runRatio = total > 0 ? d.runningMinutes / total : 0;
          return (
            <View key={i} style={styles.col}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { height: `${Math.max(2, ratio * 100)}%` },
                  ]}
                >
                  <View
                    style={[styles.runFill, { flex: runRatio }]}
                  />
                  <View
                    style={[styles.bbFill, { flex: 1 - runRatio }]}
                  />
                </View>
              </View>
              <Text style={styles.label}>{WEEKDAYS[i]}</Text>
              <Text style={styles.value}>{total > 0 ? `${total}분` : '-'}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <LegendDot color={colors.mint} label="러닝" />
        <LegendDot color={colors.ok} label="농구" />
      </View>
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
    height: 140,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  track: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    flexDirection: 'column-reverse',
    overflow: 'hidden',
  },
  runFill: {
    backgroundColor: colors.mint,
    width: '100%',
  },
  bbFill: {
    backgroundColor: colors.ok,
    width: '100%',
  },
  label: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
  },
  value: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    justifyContent: 'center',
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
