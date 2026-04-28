import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../Card';
import { colors, radius, spacing } from '../../theme/colors';
import type { BasketballThresholds } from '../../types';

interface Props {
  value: BasketballThresholds;
  onChange: (next: BasketballThresholds) => void;
}

export function BasketballThresholdsSection({ value, onChange }: Props) {
  const [jump, setJump] = useState(value.jumpG.toFixed(2));
  const [sprint, setSprint] = useState(value.sprintG.toFixed(2));

  const commitJump = () => {
    const v = parseFloat(jump);
    if (isNaN(v) || v < 1.0 || v > 5.0) {
      Alert.alert('값 확인', '점프 임계값은 1.0~5.0g 범위로 입력해주세요.');
      setJump(value.jumpG.toFixed(2));
      return;
    }
    onChange({ ...value, jumpG: v });
    setJump(v.toFixed(2));
  };

  const commitSprint = () => {
    const v = parseFloat(sprint);
    if (isNaN(v) || v < 1.0 || v > 5.0) {
      Alert.alert('값 확인', '스프린트 임계값은 1.0~5.0g 범위로 입력해주세요.');
      setSprint(value.sprintG.toFixed(2));
      return;
    }
    onChange({ ...value, sprintG: v });
    setSprint(v.toFixed(2));
  };

  const reset = () => {
    onChange({ ...value, jumpG: 2.5, sprintG: 1.8 });
    setJump('2.50');
    setSprint('1.80');
  };

  return (
    <Card title="농구 동작 감지">
      <Row label="점프 임계값">
        <TextInput
          value={jump}
          onChangeText={setJump}
          onBlur={commitJump}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <Text style={styles.unit}>g</Text>
      </Row>
      <Row label="스프린트 임계값">
        <TextInput
          value={sprint}
          onChangeText={setSprint}
          onBlur={commitSprint}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <Text style={styles.unit}>g</Text>
      </Row>
      <Text style={styles.hint}>
        값이 낮을수록 더 민감하게 카운트됩니다. 기본값: 점프 2.5g · 스프린트 1.8g
      </Text>
      <Pressable onPress={reset} style={styles.resetBtn}>
        <Text style={styles.resetText}>기본값으로</Text>
      </Pressable>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inlineRow}>{children}</View>
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
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
    textAlign: 'right',
  },
  unit: {
    color: colors.textDim,
    fontSize: 13,
  },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  resetBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  resetText: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: '600',
  },
});
