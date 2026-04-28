import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';
import {
  ZONE_COLOR,
  ZONE_LABEL,
  formatDuration,
  totalZoneSeconds,
} from '../../lib/pace';
import type { HrZone, ZoneDistribution } from '../../types';

const ZONES: HrZone[] = [1, 2, 3, 4, 5];

export function ZoneDistributionBar({ zones }: { zones: ZoneDistribution }) {
  const total = totalZoneSeconds(zones);
  if (total === 0) {
    return <Text style={styles.empty}>심박 데이터가 없어 분포를 계산할 수 없습니다.</Text>;
  }
  return (
    <View>
      <View style={styles.bar}>
        {ZONES.map((z) => {
          const ratio = zones[z] / total;
          if (ratio === 0) return null;
          return (
            <View
              key={z}
              style={{ flex: ratio, backgroundColor: ZONE_COLOR[z] }}
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        {ZONES.map((z) => (
          <View key={z} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: ZONE_COLOR[z] }]} />
            <Text style={styles.label}>{ZONE_LABEL[z]}</Text>
            <Text style={styles.value}>{formatDuration(zones[z])}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.textDim,
    fontSize: 13,
  },
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  legend: {
    marginTop: spacing.md,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    color: colors.textDim,
    fontSize: 12,
  },
});
