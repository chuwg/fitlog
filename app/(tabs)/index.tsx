import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ConditionCard } from '../../src/components/ConditionCard';
import { CyclePlanCard } from '../../src/components/CyclePlanCard';
import { ReadinessCard } from '../../src/components/ReadinessCard';
import { ShiftBadge } from '../../src/components/ShiftBadge';
import { WeatherCard } from '../../src/components/WeatherCard';
import { WorkoutRecommendCard } from '../../src/components/WorkoutRecommendCard';
import { weekdayLabelSunFirst } from '../../src/lib/dates';
import { computeReadiness } from '../../src/lib/readiness';
import {
  getLatestInbody,
  loadShiftConfig,
  loadUserProfile,
  saveDailyScore,
} from '../../src/services/db';
import { fetchHealthSnapshot } from '../../src/services/health';
import {
  cycleDays,
  defaultShiftConfig,
  shiftDayForDate,
  shiftLabel,
} from '../../src/services/shift';
import { fetchWeather } from '../../src/services/weather';
import { colors, spacing } from '../../src/theme/colors';
import type {
  CycleDay,
  HealthSnapshot,
  Readiness,
  ShiftDay,
  WeatherInfo,
} from '../../src/types';

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdayLabelSunFirst(d)}요일`;
}

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 5) return '늦은 밤까지 수고 많으셨어요';
  if (h < 11) return '좋은 아침입니다';
  if (h < 14) return '점심은 드셨나요';
  if (h < 18) return '오후도 힘내세요';
  if (h < 22) return '저녁 컨디션 어떠세요';
  return '오늘도 고생하셨어요';
}

interface HomeData {
  snap: HealthSnapshot;
  readiness: Readiness;
  weather: WeatherInfo | null;
  weatherError?: string;
  shiftDay: ShiftDay;
  shiftLabelText: string;
  cycle: CycleDay[];
  goal5kSeconds: number | null;
  inbodyScore: number | null;
}

async function loadHome(): Promise<HomeData> {
  const now = new Date();
  const [snap, cfg, profile, latestInbody] = await Promise.all([
    fetchHealthSnapshot(),
    loadShiftConfig(),
    loadUserProfile(),
    getLatestInbody().catch(() => null),
  ]);
  const effectiveCfg = cfg ?? defaultShiftConfig();
  const shiftDay = shiftDayForDate(effectiveCfg, now);
  const readiness = computeReadiness(snap, shiftDay);
  await saveDailyScore(readiness).catch(() => {});
  const cycle = cycleDays(effectiveCfg, now);

  let weather: WeatherInfo | null = null;
  let weatherError: string | undefined;
  try {
    weather = await fetchWeather();
  } catch {
    weatherError = '날씨 정보를 불러오지 못했습니다';
  }

  return {
    snap,
    readiness,
    weather,
    weatherError,
    shiftDay,
    shiftLabelText: shiftLabel(shiftDay, now),
    cycle,
    goal5kSeconds: profile.runningGoal5kSeconds,
    inbodyScore: latestInbody?.score ?? null,
  };
}

export default function HomeScreen() {
  const [data, setData] = useState<HomeData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await loadHome();
    setData(result);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const now = new Date();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.mint}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(now)}</Text>
          <Text style={styles.greeting}>{greeting(now)}</Text>
          {data && (
            <ShiftBadge kind={data.shiftDay} label={data.shiftLabelText} />
          )}
        </View>

        {!data ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.mint} />
            <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
          </View>
        ) : (
          <>
            {data.snap.isMock && (
              <Card>
                <Text style={styles.mockText}>
                  건강 데이터 연결 전입니다. 샘플 데이터로 표시중이에요.
                </Text>
              </Card>
            )}
            <ReadinessCard readiness={data.readiness} />
            <CyclePlanCard days={data.cycle} />
            <ConditionCard snap={data.snap} />
            <WorkoutRecommendCard
              readiness={data.readiness}
              goal5kSeconds={data.goal5kSeconds}
              inbodyScore={data.inbodyScore}
            />
            {data.weather ? (
              <WeatherCard weather={data.weather} />
            ) : (
              <Card title="날씨">
                <Text style={styles.mockText}>
                  {data.weatherError ?? '날씨 정보를 불러올 수 없습니다.'}
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  header: {
    marginBottom: spacing.xs,
  },
  date: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
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
  mockText: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 20,
  },
});
