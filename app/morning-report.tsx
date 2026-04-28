import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { ConditionCard } from '../src/components/ConditionCard';
import { ShiftBadge } from '../src/components/ShiftBadge';
import { WeatherCard } from '../src/components/WeatherCard';
import { computeReadiness, recommendWorkout } from '../src/lib/readiness';
import {
  getLatestInbody,
  loadShiftConfig,
  loadSupplementBaseTimes,
  loadUserProfile,
  listSupplements,
  saveDailyScore,
} from '../src/services/db';
import { fetchHealthSnapshot } from '../src/services/health';
import {
  TIMING_LABEL,
  computeNotificationTime,
} from '../src/services/notifications';
import {
  cycleDays,
  defaultShiftConfig,
  shiftDayForDate,
  shiftLabel,
} from '../src/services/shift';
import { fetchWeather } from '../src/services/weather';
import { colors, radius, spacing } from '../src/theme/colors';
import type {
  CycleDay,
  HealthSnapshot,
  Readiness,
  ShiftDay,
  Supplement,
  WeatherInfo,
} from '../src/types';

interface ReportData {
  name: string | null;
  snap: HealthSnapshot;
  readiness: Readiness;
  weather: WeatherInfo | null;
  shiftDay: ShiftDay;
  shiftLabelText: string;
  cycle: CycleDay[];
  recommendation: { title: string; detail: string };
  todaySupplements: Array<{ supp: Supplement; time: string }>;
}

const STATUS_COLOR = {
  peak: colors.good,
  good: colors.ok,
  fair: colors.warn,
  fatigue: colors.bad,
} as const;

async function loadReport(): Promise<ReportData> {
  const now = new Date();
  const [snap, cfg, profile, supplements, baseTimes, latestInbody] = await Promise.all([
    fetchHealthSnapshot(),
    loadShiftConfig(),
    loadUserProfile(),
    listSupplements(),
    loadSupplementBaseTimes(),
    getLatestInbody().catch(() => null),
  ]);
  const effectiveCfg = cfg ?? defaultShiftConfig();
  const shiftDay = shiftDayForDate(effectiveCfg, now);
  const readiness = computeReadiness(snap, shiftDay);
  await saveDailyScore(readiness).catch(() => {});
  const cycle = cycleDays(effectiveCfg, now);
  const recommendation = recommendWorkout(readiness, {
    goal5kSeconds: profile.runningGoal5kSeconds,
    inbodyScore: latestInbody?.score ?? null,
  });

  let weather: WeatherInfo | null = null;
  try {
    weather = await fetchWeather();
  } catch {}

  const todaySupplements = supplements
    .filter((s) => s.enabled)
    .map((supp) => ({
      supp,
      time: computeNotificationTime(supp, shiftDay, baseTimes, effectiveCfg),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return {
    name: profile.name,
    snap,
    readiness,
    weather,
    shiftDay,
    shiftLabelText: shiftLabel(shiftDay, now),
    cycle,
    recommendation,
    todaySupplements,
  };
}

const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KR[d.getDay()]}요일`;
}

export default function MorningReportScreen() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);

  const load = useCallback(async () => {
    const next = await loadReport();
    setData(next);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '모닝 리포트',
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.mint,
          headerBackTitle: '닫기',
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {!data ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.mint} />
              <Text style={styles.loadingText}>오늘 리포트를 준비 중...</Text>
            </View>
          ) : (
            <>
              <View>
                <Text style={styles.greet}>
                  {data.name ? `${data.name}님, ` : ''}좋은 아침이에요!
                </Text>
                <Text style={styles.date}>{formatDate(new Date())}</Text>
                <ShiftBadge kind={data.shiftDay} label={data.shiftLabelText} />
              </View>

              <Card title="훈련 준비 점수">
                <View style={styles.scoreRow}>
                  <Text
                    style={[
                      styles.score,
                      { color: STATUS_COLOR[data.readiness.status] },
                    ]}
                  >
                    {data.readiness.total}
                  </Text>
                  <Text style={styles.scoreMax}>/ 100</Text>
                </View>
                <Text style={styles.scoreStatus}>
                  {data.readiness.emoji} {data.readiness.label} · {data.readiness.advice}
                </Text>
              </Card>

              <ConditionCard snap={data.snap} />

              <Card title="추천 훈련">
                <Text style={styles.recoTitle}>{data.recommendation.title}</Text>
                <Text style={styles.recoDetail}>{data.recommendation.detail}</Text>
              </Card>

              {data.weather ? (
                <WeatherCard weather={data.weather} />
              ) : (
                <Card title="날씨">
                  <Text style={styles.dim}>날씨 정보를 불러올 수 없습니다.</Text>
                </Card>
              )}

              <Card title="오늘 보충제">
                {data.todaySupplements.length === 0 ? (
                  <Text style={styles.dim}>예정된 보충제가 없습니다.</Text>
                ) : (
                  data.todaySupplements.map(({ supp, time }) => (
                    <View key={supp.id} style={styles.suppRow}>
                      <Text style={styles.suppTime}>{time}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suppName}>{supp.name}</Text>
                        <Text style={styles.suppMeta}>
                          {supp.dose} · {TIMING_LABEL[supp.timing]}
                          {supp.shiftAdjust ? ' · 교대 연동' : ''}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </Card>

              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>홈으로</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greet: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  date: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textDim,
    fontSize: 13,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 68,
  },
  scoreMax: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.sm,
    marginBottom: 8,
  },
  scoreStatus: {
    color: colors.text,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  recoTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  recoDetail: {
    color: colors.textDim,
    fontSize: 14,
    lineHeight: 20,
  },
  dim: {
    color: colors.textDim,
    fontSize: 13,
  },
  suppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  suppTime: {
    color: colors.mint,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 56,
  },
  suppName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  suppMeta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
});
