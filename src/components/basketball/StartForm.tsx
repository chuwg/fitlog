import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../Card';
import { RecentSessionsCard } from '../RecentSessionsCard';
import { colors, radius, spacing } from '../../theme/colors';
import {
  getLatestDailyScore,
  loadBasketballThresholds,
} from '../../services/db';

type QuarterChoice = 600 | 720 | 'unlimited' | 'custom';

const PRESETS: Array<{ value: QuarterChoice; label: string }> = [
  { value: 600, label: '10분' },
  { value: 720, label: '12분' },
  { value: 'unlimited', label: '무제한' },
  { value: 'custom', label: '직접 입력' },
];

export function BasketballStartForm({ reload }: { reload: number }) {
  const router = useRouter();
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [choice, setChoice] = useState<QuarterChoice>(600);
  const [customMin, setCustomMin] = useState<string>('');
  const [expectedQuarters, setExpectedQuarters] = useState<string>('4');

  const load = useCallback(async () => {
    const [score, thresh] = await Promise.all([
      getLatestDailyScore().catch(() => null),
      loadBasketballThresholds(),
    ]);
    setLatestScore(score?.total ?? null);
    if (thresh.defaultQuarterS === 600) setChoice(600);
    else if (thresh.defaultQuarterS === 720) setChoice(720);
    else {
      setChoice('custom');
      setCustomMin(String(Math.round(thresh.defaultQuarterS / 60)));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reload]);

  const startSession = () => {
    let quarterS: number;
    if (choice === 'unlimited') quarterS = 0;
    else if (choice === 'custom') {
      const min = parseFloat(customMin);
      if (isNaN(min) || min <= 0) {
        Alert.alert('쿼터 시간 확인', '0보다 큰 분 단위 시간을 입력해주세요.');
        return;
      }
      quarterS = Math.round(min * 60);
    } else {
      quarterS = choice;
    }

    const expected = parseInt(expectedQuarters, 10);
    router.push({
      pathname: '/basketball-session',
      params: {
        quarterS: String(quarterS),
        expectedQuarters: !isNaN(expected) && expected > 0 ? String(expected) : '',
      },
    });
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {latestScore !== null && (
        <Card>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>오늘 훈련 준비 점수</Text>
            <Text style={styles.scoreValue}>{latestScore}점</Text>
          </View>
        </Card>
      )}

      <Card title="쿼터 시간">
        <View style={styles.chipRow}>
          {PRESETS.map((p) => (
            <Pressable
              key={String(p.value)}
              onPress={() => setChoice(p.value)}
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
              value={customMin}
              onChangeText={setCustomMin}
              placeholder="시간"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.unit}>분</Text>
          </View>
        )}
        {choice === 'unlimited' && (
          <Text style={styles.hint}>
            쿼터 종료 버튼을 누를 때까지 쿼터가 진행됩니다.
          </Text>
        )}
      </Card>

      <Card title="예상 쿼터 수 (선택)">
        <View style={styles.customRow}>
          <TextInput
            value={expectedQuarters}
            onChangeText={setExpectedQuarters}
            placeholder="4"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={styles.input}
          />
          <Text style={styles.unit}>쿼터</Text>
        </View>
        <Text style={styles.hint}>
          진행 표시용입니다. 더 많이 또는 적게 진행해도 자유롭게 종료할 수 있어요.
        </Text>
      </Card>

      <Pressable onPress={startSession} style={styles.startBtn}>
        <Text style={styles.startBtnText}>농구 시작</Text>
      </Pressable>

      <RecentSessionsCard type="basketball" reload={reload} />
    </View>
  );
}

const styles = StyleSheet.create({
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    color: colors.textDim,
    fontSize: 13,
  },
  scoreValue: {
    color: colors.mint,
    fontSize: 18,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flex: 1,
    minWidth: 70,
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
    fontSize: 13,
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
  hint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  startBtn: {
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  startBtnText: {
    color: colors.bg,
    fontSize: 17,
    fontWeight: '800',
  },
});
