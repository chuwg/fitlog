import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export type DistanceChoice = 5000 | 10000 | 'custom';

interface Props {
  choice: DistanceChoice;
  customMeters: number;
  onChoiceChange: (choice: DistanceChoice) => void;
  onCustomChange: (meters: number) => void;
}

const PRESETS: Array<{ value: DistanceChoice; label: string }> = [
  { value: 5000, label: '5km' },
  { value: 10000, label: '10km' },
  { value: 'custom', label: '직접 입력' },
];

export function DistancePicker({
  choice,
  customMeters,
  onChoiceChange,
  onCustomChange,
}: Props) {
  const customKm = customMeters > 0 ? (customMeters / 1000).toString() : '';

  return (
    <View>
      <View style={styles.row}>
        {PRESETS.map((p) => (
          <Pressable
            key={String(p.value)}
            onPress={() => onChoiceChange(p.value)}
            style={[styles.chip, choice === p.value && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                choice === p.value && styles.chipTextActive,
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {choice === 'custom' && (
        <View style={styles.customRow}>
          <TextInput
            value={customKm}
            onChangeText={(v) => {
              const num = parseFloat(v);
              if (isNaN(num)) onCustomChange(0);
              else onCustomChange(Math.round(num * 1000));
            }}
            keyboardType="decimal-pad"
            placeholder="거리"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <Text style={styles.unit}>km</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.mint,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
  },
  unit: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
});
