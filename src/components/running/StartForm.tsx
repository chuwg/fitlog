import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../Card';
import { DistancePicker, type DistanceChoice } from './DistancePicker';
import { PaceProBar } from './PaceProBar';
import { ShoePicker } from './ShoePicker';
import { buildPacePro, formatPace, paceFromTargetTime } from '../../lib/pace';
import {
  getLatestDailyScore,
  listShoes,
  loadUserProfile,
} from '../../services/db';
import { colors, radius, spacing } from '../../theme/colors';
import type { Shoe, UserProfile } from '../../types';

function parseGoalInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (!m) return null;
  return parseInt(m[1]!, 10) * 60 + parseInt(m[2]!, 10);
}

function formatGoalSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RunningStartForm({
  reload,
}: {
  reload: number;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [latestScore, setLatestScore] = useState<number | null>(null);

  const [choice, setChoice] = useState<DistanceChoice>(5000);
  const [customMeters, setCustomMeters] = useState<number>(0);
  const [goalInput, setGoalInput] = useState<string>('');
  const [paceGuide, setPaceGuide] = useState<boolean>(true);
  const [shoeId, setShoeId] = useState<number | null>(null);

  const targetDistanceM = choice === 'custom' ? customMeters : choice;

  const load = useCallback(async () => {
    const [prof, list, score] = await Promise.all([
      loadUserProfile(),
      listShoes(true),
      getLatestDailyScore().catch(() => null),
    ]);
    setProfile(prof);
    setShoes(list);
    setLatestScore(score?.total ?? null);
    if (shoeId === null && list.length > 0) {
      setShoeId(list[0]!.id);
    }
  }, [shoeId]);

  React.useEffect(() => {
    load();
  }, [load, reload]);

  const profileGoalSeconds = useMemo(() => {
    if (!profile) return null;
    if (targetDistanceM === 5000) return profile.runningGoal5kSeconds;
    if (targetDistanceM === 10000) return profile.runningGoal10kSeconds;
    return null;
  }, [profile, targetDistanceM]);

  const targetTimeS = useMemo(() => {
    const fromInput = parseGoalInput(goalInput);
    if (fromInput !== null) return fromInput;
    return profileGoalSeconds;
  }, [goalInput, profileGoalSeconds]);

  const targetPaceSPerKm = useMemo(() => {
    if (!targetTimeS || !targetDistanceM) return 0;
    return paceFromTargetTime(targetDistanceM, targetTimeS);
  }, [targetDistanceM, targetTimeS]);

  const segments = useMemo(() => {
    if (targetPaceSPerKm <= 0) return [];
    return buildPacePro(targetPaceSPerKm);
  }, [targetPaceSPerKm]);

  const startSession = () => {
    if (!targetDistanceM || targetDistanceM < 500) {
      Alert.alert('목표 거리 확인', '500m 이상의 거리를 입력해주세요.');
      return;
    }
    if (!targetTimeS) {
      Alert.alert('목표 시간 확인', '목표 시간을 입력하거나 프로필에 설정해주세요.');
      return;
    }
    router.push({
      pathname: '/running-session',
      params: {
        targetDistanceM: String(targetDistanceM),
        targetTimeS: String(targetTimeS),
        paceGuide: paceGuide ? '1' : '0',
        shoeId: shoeId ? String(shoeId) : '',
      },
    });
  };

  const goalPlaceholder = profileGoalSeconds
    ? formatGoalSeconds(profileGoalSeconds) + ' (프로필)'
    : '예: 25:30';

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

      <Card title="목표 거리">
        <DistancePicker
          choice={choice}
          customMeters={customMeters}
          onChoiceChange={setChoice}
          onCustomChange={setCustomMeters}
        />
      </Card>

      <Card title="목표 시간">
        <View style={styles.timeRow}>
          <TextInput
            value={goalInput}
            onChangeText={setGoalInput}
            placeholder={goalPlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />
          <Text style={styles.unit}>MM:SS</Text>
        </View>
        {targetPaceSPerKm > 0 && (
          <View style={styles.paceRow}>
            <Text style={styles.paceLabel}>권장 페이스</Text>
            <Text style={styles.paceValue}>{formatPace(targetPaceSPerKm)}/km</Text>
          </View>
        )}
      </Card>

      <Card title="페이스 가이드">
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>구간별 페이스 가이드</Text>
            <Text style={styles.hint}>
              워밍업/메인/유지/마무리 4구간으로 페이스 자동 분배
            </Text>
          </View>
          <Switch
            value={paceGuide}
            onValueChange={setPaceGuide}
            trackColor={{ false: colors.border, true: colors.mint + '77' }}
            thumbColor={paceGuide ? colors.mint : colors.textMuted}
            ios_backgroundColor={colors.border}
          />
        </View>
        {paceGuide && segments.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <PaceProBar segments={segments} />
          </View>
        )}
      </Card>

      <Card title="러닝화">
        <ShoePicker shoes={shoes} selectedId={shoeId} onSelect={setShoeId} />
      </Card>

      <Pressable onPress={startSession} style={styles.startBtn}>
        <Text style={styles.startBtnText}>러닝 시작</Text>
      </Pressable>
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  paceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paceLabel: {
    color: colors.textDim,
    fontSize: 13,
  },
  paceValue: {
    color: colors.mint,
    fontSize: 17,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
