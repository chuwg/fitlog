import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';
import { ZONE_COLOR, ZONE_DESCRIPTION, ZONE_LABEL } from '../../lib/pace';
import type { HrZone } from '../../types';

export function HrZoneIndicator({ zone }: { zone: HrZone | null }) {
  if (zone === null) {
    return (
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
        <Text style={styles.label}>심박 측정 대기 중</Text>
      </View>
    );
  }
  const color = ZONE_COLOR[zone];
  return (
    <View style={[styles.row, { backgroundColor: color + '22' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{ZONE_LABEL[zone]}</Text>
      <Text style={styles.desc}>{ZONE_DESCRIPTION[zone]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  desc: {
    color: colors.textDim,
    fontSize: 12,
  },
});
