import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  ratio: number;
  color?: string;
}

export function ProgressBar({ label, value, ratio, color = colors.mint }: Props) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clamped * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textDim,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.sm,
  },
});
