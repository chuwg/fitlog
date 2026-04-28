import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../Card';
import { colors, radius, spacing } from '../../theme/colors';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onChange: (next: UserProfile) => void;
}

function formatGoal(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseGoal(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (!match) return null;
  const m = parseInt(match[1]!, 10);
  const s = parseInt(match[2]!, 10);
  if (isNaN(m) || isNaN(s)) return null;
  return m * 60 + s;
}

export function UserProfileSection({ profile, onChange }: Props) {
  const [name, setName] = useState(profile.name ?? '');
  const [goal5, setGoal5] = useState(formatGoal(profile.runningGoal5kSeconds));
  const [goal10, setGoal10] = useState(formatGoal(profile.runningGoal10kSeconds));
  const [maxHr, setMaxHr] = useState(
    profile.maxHeartRate ? String(profile.maxHeartRate) : '',
  );

  const commitName = () => {
    const trimmed = name.trim();
    onChange({ ...profile, name: trimmed.length > 0 ? trimmed : null });
  };

  const commitGoal = (
    input: string,
    setter: (v: string) => void,
    field: 'runningGoal5kSeconds' | 'runningGoal10kSeconds',
    currentValue: number | null,
  ) => {
    if (input.trim() === '') {
      onChange({ ...profile, [field]: null });
      return;
    }
    const parsed = parseGoal(input);
    if (parsed === null) {
      Alert.alert('형식 확인', 'MM:SS 형식으로 입력해주세요. 예: 25:30');
      setter(formatGoal(currentValue));
      return;
    }
    onChange({ ...profile, [field]: parsed });
    setter(formatGoal(parsed));
  };

  const commitMaxHr = () => {
    if (maxHr.trim() === '') {
      onChange({ ...profile, maxHeartRate: null });
      return;
    }
    const v = parseInt(maxHr, 10);
    if (isNaN(v) || v < 100 || v > 230) {
      Alert.alert('값 확인', '100~230 사이의 값을 입력해주세요.');
      setMaxHr(profile.maxHeartRate ? String(profile.maxHeartRate) : '');
      return;
    }
    onChange({ ...profile, maxHeartRate: v });
  };

  return (
    <Card title="사용자 프로필">
      <Field label="이름">
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={commitName}
          placeholder="이름"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="done"
        />
      </Field>
      <Field label="5km 목표">
        <TextInput
          value={goal5}
          onChangeText={setGoal5}
          onBlur={() =>
            commitGoal(goal5, setGoal5, 'runningGoal5kSeconds', profile.runningGoal5kSeconds)
          }
          placeholder="25:30"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
        />
      </Field>
      <Field label="10km 목표">
        <TextInput
          value={goal10}
          onChangeText={setGoal10}
          onBlur={() =>
            commitGoal(goal10, setGoal10, 'runningGoal10kSeconds', profile.runningGoal10kSeconds)
          }
          placeholder="55:00"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
        />
      </Field>
      <Field label="최대 심박수">
        <View style={styles.inlineRow}>
          <TextInput
            value={maxHr}
            onChangeText={setMaxHr}
            onBlur={commitMaxHr}
            placeholder="190"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.inputSmall]}
            keyboardType="number-pad"
            returnKeyType="done"
          />
          <Text style={styles.unit}>bpm</Text>
        </View>
      </Field>
      <Text style={styles.hint}>
        목표 시간은 페이스 추천에, 최대 심박수는 러닝 중 Zone 표시에 사용됩니다.
      </Text>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
    minWidth: 120,
    textAlign: 'right',
  },
  inputSmall: {
    minWidth: 80,
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
});
