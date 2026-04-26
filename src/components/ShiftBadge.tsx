import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import type { ShiftDay } from '../types';

const COLOR: Record<ShiftDay, string> = {
  day: colors.good,
  off: colors.mint,
  night: colors.ok,
  'post-night': colors.bad,
};

interface Props {
  kind: ShiftDay;
  label: string;
}

export function ShiftBadge({ kind, label }: Props) {
  const c = COLOR[kind];
  return (
    <View style={[styles.badge, { backgroundColor: c + '22', borderColor: c + '55' }]}>
      <View style={[styles.dot, { backgroundColor: c }]} />
      <Text style={[styles.text, { color: c }]}>오늘: {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing.sm,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
