import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../Card';
import { TimePickerRow } from '../TimePickerRow';
import { colors, radius, spacing } from '../../theme/colors';
import { shiftLabel, shiftShortLabel } from '../../services/shift';
import type { ShiftConfig, ShiftKind } from '../../types';

const NEXT_KIND: Record<ShiftKind, ShiftKind> = {
  day: 'night',
  night: 'off',
  off: 'day',
};

const KIND_COLOR: Record<ShiftKind, string> = {
  day: colors.good,
  night: colors.ok,
  off: colors.textMuted,
};

interface Props {
  config: ShiftConfig;
  onChange: (next: ShiftConfig) => void;
  todayKind: ShiftKind;
}

export function ShiftSection({ config, onChange, todayKind }: Props) {
  const todayLabel = useMemo(
    () =>
      shiftLabel(
        config.cycle.length === 0 ? 'off' : todayKind,
        new Date(),
      ),
    [config.cycle.length, todayKind],
  );

  const toggleCell = (index: number) => {
    const next = [...config.cycle];
    next[index] = NEXT_KIND[next[index]!];
    onChange({ ...config, cycle: next });
  };

  const setStartToday = () => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange({ ...config, startDate: iso });
  };

  const resetCycle = () => {
    Alert.alert('사이클 초기화', '기본 사이클(주주휴휴야야휴휴)로 되돌릴까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '초기화',
        style: 'destructive',
        onPress: () =>
          onChange({
            ...config,
            cycle: ['day', 'day', 'off', 'off', 'night', 'night', 'off', 'off'],
          }),
      },
    ]);
  };

  return (
    <Card title="교대 근무">
      <View style={styles.todayRow}>
        <Text style={styles.todayLabel}>오늘</Text>
        <Text style={styles.todayValue}>{todayLabel}</Text>
      </View>

      <Text style={styles.sectionLabel}>근무 사이클 (탭해서 변경)</Text>
      <View style={styles.cycleRow}>
        {config.cycle.map((kind, i) => (
          <Pressable
            key={i}
            onPress={() => toggleCell(i)}
            style={[
              styles.cell,
              { borderColor: KIND_COLOR[kind] + '77' },
              { backgroundColor: KIND_COLOR[kind] + '1E' },
            ]}
          >
            <Text style={[styles.cellText, { color: KIND_COLOR[kind] }]}>
              {shiftShortLabel(kind)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>시작일</Text>
        <Text style={styles.infoValue}>{config.startDate}</Text>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>근무 시간</Text>
      <TimePickerRow
        label="주간 시작"
        value={config.dayStart}
        onChange={(v) => onChange({ ...config, dayStart: v })}
      />
      <TimePickerRow
        label="주간 끝"
        value={config.dayEnd}
        onChange={(v) => onChange({ ...config, dayEnd: v })}
      />
      <TimePickerRow
        label="야간 시작"
        value={config.nightStart}
        onChange={(v) => onChange({ ...config, nightStart: v })}
      />
      <TimePickerRow
        label="야간 끝"
        value={config.nightEnd}
        onChange={(v) => onChange({ ...config, nightEnd: v })}
      />

      <View style={styles.actions}>
        <Pressable onPress={setStartToday} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>오늘부터 시작</Text>
        </Pressable>
        <Pressable onPress={resetCycle} style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>사이클 초기화</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  todayLabel: {
    color: colors.textDim,
    fontSize: 13,
  },
  todayValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  cellText: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    color: colors.textDim,
    fontSize: 13,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '700',
  },
  btnGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnGhostText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
});
