import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '../Card';
import { TimePickerRow } from '../TimePickerRow';
import { TIMING_LABEL, TIMING_ORDER } from '../../services/notifications';
import { colors, spacing } from '../../theme/colors';
import type { SupplementBaseTimes } from '../../types';

interface Props {
  times: SupplementBaseTimes;
  onChange: (next: SupplementBaseTimes) => void;
}

export function SupplementTimesSection({ times, onChange }: Props) {
  return (
    <Card title="보충제 기본 시간">
      <Text style={styles.hint}>
        각 타이밍별 기본 알림 시간입니다. 교대 연동이 켜진 보충제는 근무 유형에 따라 자동 조정됩니다.
      </Text>
      {TIMING_ORDER.map((t) => (
        <TimePickerRow
          key={t}
          label={TIMING_LABEL[t]}
          value={times[t]}
          onChange={(v) => onChange({ ...times, [t]: v })}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
});
