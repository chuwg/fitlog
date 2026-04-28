import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
import { ZoneDistributionBar } from '../src/components/running/ZoneDistributionBar';
import { formatDistance, formatDuration, formatPace } from '../src/lib/pace';
import {
  findPreviousSimilarSession,
  getRunningSession,
} from '../src/services/db';
import { colors, radius, spacing } from '../src/theme/colors';
import type { RunningSession } from '../src/types';

interface ReportData {
  session: RunningSession;
  previous: RunningSession | null;
}

async function loadReport(id: number): Promise<ReportData | null> {
  const session = await getRunningSession(id);
  if (!session) return null;
  const previous = session.targetDistanceM
    ? await findPreviousSimilarSession(session.targetDistanceM, session.id)
    : null;
  return { session, previous };
}

function formatDiff(secondsDiff: number): string {
  const abs = Math.abs(secondsDiff);
  const m = Math.floor(abs / 60);
  const s = Math.round(abs % 60);
  const sign = secondsDiff > 0 ? '+' : secondsDiff < 0 ? '-' : '±';
  if (m > 0) return `${sign}${m}:${String(s).padStart(2, '0')}`;
  return `${sign}${s}s`;
}

export default function RunningReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : 0;
  const [data, setData] = useState<ReportData | null | 'missing'>(null);

  const load = useCallback(async () => {
    if (!id) {
      setData('missing');
      return;
    }
    const next = await loadReport(id);
    setData(next ?? 'missing');
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const session = data && data !== 'missing' ? data.session : null;
  const previous = data && data !== 'missing' ? data.previous : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: '러닝 리포트',
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.mint,
          headerBackTitle: '닫기',
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {data === null ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.mint} />
            </View>
          ) : data === 'missing' ? (
            <Text style={styles.dim}>세션을 찾을 수 없습니다.</Text>
          ) : session ? (
            <>
              <View style={styles.heroBlock}>
                <Text style={styles.heroLabel}>거리 · 시간 · 평균 페이스</Text>
                <Text style={styles.heroDistance}>
                  {formatDistance(session.distanceM)}
                  <Text style={styles.heroUnit}> km</Text>
                </Text>
                <View style={styles.heroRow}>
                  <Text style={styles.heroValue}>
                    {formatDuration(session.durationS)}
                  </Text>
                  <Text style={styles.heroValue}>
                    {formatPace(session.avgPaceSPerKm)}
                    <Text style={styles.heroUnitSmall}>/km</Text>
                  </Text>
                </View>
                {session.achieved !== null && (
                  <View
                    style={[
                      styles.achievedBadge,
                      {
                        backgroundColor: session.achieved
                          ? colors.good + '22'
                          : colors.warn + '22',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.achievedText,
                        { color: session.achieved ? colors.good : colors.warn },
                      ]}
                    >
                      {session.achieved ? '목표 달성' : '목표 미달'}
                      {session.targetTimeS &&
                        ` · 목표 ${formatDuration(session.targetTimeS)}`}
                    </Text>
                  </View>
                )}
              </View>

              <Card title="심박수">
                {session.avgHr === null ? (
                  <Text style={styles.dim}>심박 데이터가 없습니다.</Text>
                ) : (
                  <View style={styles.kvRow}>
                    <View style={styles.kvCell}>
                      <Text style={styles.kvLabel}>평균</Text>
                      <Text style={styles.kvValue}>{session.avgHr} bpm</Text>
                    </View>
                    <View style={styles.kvCell}>
                      <Text style={styles.kvLabel}>최고</Text>
                      <Text style={styles.kvValue}>{session.maxHr ?? '-'} bpm</Text>
                    </View>
                  </View>
                )}
              </Card>

              {session.zoneDistribution && (
                <Card title="심박 Zone 분포">
                  <ZoneDistributionBar zones={session.zoneDistribution} />
                </Card>
              )}

              <Card title="러닝 다이내믹스">
                <View style={styles.dynRow}>
                  <DynItem
                    label="케이던스"
                    value={
                      session.cadence !== null
                        ? `${session.cadence} spm`
                        : '미측정'
                    }
                  />
                  <DynItem
                    label="GCT"
                    value={
                      session.gct !== null ? `${session.gct} ms` : '미측정'
                    }
                  />
                  <DynItem
                    label="수직 진폭"
                    value={
                      session.verticalOscillation !== null
                        ? `${session.verticalOscillation} cm`
                        : '미측정'
                    }
                  />
                </View>
                <Text style={styles.note}>
                  Apple Watch + 워크아웃 기록이 있을 때만 표시됩니다.
                </Text>
              </Card>

              {previous && (
                <Card title="이전 동일 거리 세션 비교">
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>이전 평균 페이스</Text>
                    <Text style={styles.compareValue}>
                      {formatPace(previous.avgPaceSPerKm)}
                    </Text>
                  </View>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareLabel}>차이</Text>
                    <Text
                      style={[
                        styles.compareValue,
                        {
                          color:
                            session.avgPaceSPerKm < previous.avgPaceSPerKm
                              ? colors.good
                              : session.avgPaceSPerKm > previous.avgPaceSPerKm
                                ? colors.warn
                                : colors.text,
                        },
                      ]}
                    >
                      {formatDiff(
                        session.avgPaceSPerKm - previous.avgPaceSPerKm,
                      )}
                      /km
                    </Text>
                  </View>
                </Card>
              )}

              {session.feedback && (
                <Card title="한줄 피드백">
                  <Text style={styles.feedback}>{session.feedback}</Text>
                </Card>
              )}

              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>홈으로</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function DynItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dynItem}>
      <Text style={styles.dynLabel}>{label}</Text>
      <Text style={styles.dynValue}>{value}</Text>
    </View>
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
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  heroBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  heroDistance: {
    color: colors.mint,
    fontSize: 56,
    fontWeight: '800',
    marginTop: 4,
  },
  heroUnit: {
    color: colors.textDim,
    fontSize: 22,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  heroValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  heroUnitSmall: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  achievedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: spacing.md,
  },
  achievedText: {
    fontSize: 13,
    fontWeight: '700',
  },
  kvRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  kvCell: {
    flex: 1,
  },
  kvLabel: {
    color: colors.textDim,
    fontSize: 12,
  },
  kvValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  dynRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dynItem: {
    flex: 1,
  },
  dynLabel: {
    color: colors.textDim,
    fontSize: 12,
  },
  dynValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  note: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  compareLabel: {
    color: colors.textDim,
    fontSize: 13,
  },
  compareValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  feedback: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  dim: {
    color: colors.textDim,
    fontSize: 13,
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
