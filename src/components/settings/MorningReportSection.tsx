import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Card } from '../Card';
import { TimePickerRow } from '../TimePickerRow';
import { colors, spacing } from '../../theme/colors';
import type { MorningReportConfig } from '../../types';

interface Props {
  config: MorningReportConfig;
  onChange: (next: MorningReportConfig) => void;
}

export function MorningReportSection({ config, onChange }: Props) {
  return (
    <Card title="모닝 리포트">
      <TimePickerRow
        label="알림 시간"
        value={config.notificationTime}
        onChange={(v) => onChange({ ...config, notificationTime: v })}
      />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>야간 근무일 스킵</Text>
          <Text style={styles.hint}>야간 근무 당일은 알림을 건너뜁니다</Text>
        </View>
        <Switch
          value={config.skipNight}
          onValueChange={(v) => onChange({ ...config, skipNight: v })}
          trackColor={{ false: colors.border, true: colors.mint + '77' }}
          thumbColor={config.skipNight ? colors.mint : colors.textMuted}
          ios_backgroundColor={colors.border}
        />
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>야간 후 휴무일 2시간 늦게</Text>
          <Text style={styles.hint}>수면 패턴을 고려해 알림을 미룹니다</Text>
        </View>
        <Switch
          value={config.adjustPostNight}
          onValueChange={(v) => onChange({ ...config, adjustPostNight: v })}
          trackColor={{ false: colors.border, true: colors.mint + '77' }}
          thumbColor={config.adjustPostNight ? colors.mint : colors.textMuted}
          ios_backgroundColor={colors.border}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
});
