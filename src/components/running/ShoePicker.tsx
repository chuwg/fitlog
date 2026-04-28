import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';
import type { Shoe } from '../../types';

interface Props {
  shoes: Shoe[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function ShoePicker({ shoes, selectedId, onSelect }: Props) {
  if (shoes.length === 0) {
    return (
      <Text style={styles.empty}>
        등록된 신발이 없습니다. 설정에서 먼저 추가해주세요.
      </Text>
    );
  }
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onSelect(null)}
        style={[styles.chip, selectedId === null && styles.chipActive]}
      >
        <Text
          style={[
            styles.chipText,
            selectedId === null && styles.chipTextActive,
          ]}
        >
          선택 안함
        </Text>
      </Pressable>
      {shoes.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => onSelect(s.id)}
          style={[styles.chip, selectedId === s.id && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              selectedId === s.id && styles.chipTextActive,
            ]}
          >
            {s.name}
          </Text>
          <Text
            style={[
              styles.chipMeta,
              selectedId === s.id && styles.chipMetaActive,
            ]}
          >
            {s.currentKm.toFixed(0)}km 누적
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mint + '22',
  },
  chipText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.mint,
  },
  chipMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  chipMetaActive: {
    color: colors.mint + 'CC',
  },
  empty: {
    color: colors.textDim,
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
});
