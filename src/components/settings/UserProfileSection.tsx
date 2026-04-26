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
  const match = trimmed.match(/^(\d{1,2}):([0-5]?\d)$/);
  if (!match) return null;
  const m = parseInt(match[1]!, 10);
  const s = parseInt(match[2]!, 10);
  if (isNaN(m) || isNaN(s)) return null;
  return m * 60 + s;
}

export function UserProfileSection({ profile, onChange }: Props) {
  const [name, setName] = useState(profile.name ?? '');
  const [goal, setGoal] = useState(formatGoal(profile.runningGoal5kSeconds));

  const commitName = () => {
    const trimmed = name.trim();
    onChange({ ...profile, name: trimmed.length > 0 ? trimmed : null });
  };

  const commitGoal = () => {
    if (goal.trim() === '') {
      onChange({ ...profile, runningGoal5kSeconds: null });
      return;
    }
    const parsed = parseGoal(goal);
    if (parsed === null) {
      Alert.alert('형식 확인', 'MM:SS 형식으로 입력해주세요. 예: 25:30');
      setGoal(formatGoal(profile.runningGoal5kSeconds));
      return;
    }
    onChange({ ...profile, runningGoal5kSeconds: parsed });
    setGoal(formatGoal(parsed));
  };

  const clearGoal = () => {
    setGoal('');
    onChange({ ...profile, runningGoal5kSeconds: null });
  };

  return (
    <Card title="사용자 프로필">
      <View style={styles.row}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={commitName}
          placeholder="이름"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="done"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>5km 목표 시간</Text>
        <View style={styles.inlineRow}>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            onBlur={commitGoal}
            placeholder="25:30"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.inputSmall]}
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
          />
          {profile.runningGoal5kSeconds !== null && (
            <Pressable onPress={clearGoal} style={styles.clearBtn}>
              <Text style={styles.clearText}>지우기</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text style={styles.hint}>
        목표 시간 설정 시 페이스 기반 추천이, 미설정 시 Zone 2 기준 추천이 제공됩니다.
      </Text>
    </Card>
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
    minWidth: 90,
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
