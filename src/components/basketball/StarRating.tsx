import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  value: number;
  max?: number;
  label?: string;
}

export function StarRating({ value, max = 5, label }: Props) {
  return (
    <View style={styles.row}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.stars}>
        {Array.from({ length: max }).map((_, i) => (
          <Text
            key={i}
            style={[
              styles.star,
              { color: i < value ? colors.ok : colors.surfaceAlt },
            ]}
          >
            ★
          </Text>
        ))}
        <Text style={styles.count}>
          {value}
          <Text style={styles.countMax}>/{max}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    color: colors.textDim,
    fontSize: 13,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontSize: 18,
  },
  count: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  countMax: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 12,
  },
});
