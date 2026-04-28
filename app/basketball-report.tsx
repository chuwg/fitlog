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
import { StarRating } from '../src/components/basketball/StarRating';
import { ZoneDistributionBar } from '../src/components/running/ZoneDistributionBar';
import { formatDuration } from '../src/lib/pace';
import { getBasketballSession } from '../src/services/db';
import { colors, radius, spacing } from '../src/theme/colors';
import type { BasketballSession } from '../src/types';

export default function BasketballReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : 0;
  const [session, setSession] = useState<BasketballSession | null | 'missing'>(
    null,
  );

  const load = useCallback(async () => {
    if (!id) {
      setSession('missing');
      return;
    }
    const s = await getBasketballSession(id);
    setSession(s ?? 'missing');
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '농구 리포트',
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.mint,
          headerBackTitle: '닫기',
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {session === null ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.mint} />
            </View>
          ) : session === 'missing' ? (
            <Text style={styles.dim}>세션을 찾을 수 없습니다.</Text>
          ) : (
            <>
              <View style={styles.heroBlock}>
                <Text style={styles.heroLabel}>총 시간 · 칼로리</Text>
                <Text style={styles.heroDuration}>
                  {formatDuration(session.durationS)}
                </Text>
                <Text style={styles.heroSub}>
                  {session.caloriesKcal !== null
                    ? `${session.caloriesKcal}kcal · `
                    : ''}
                  {session.quarters.length}쿼터
                </Text>
              </View>

              <Card title="활동량">
                <View style={styles.kvRow}>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>점프</Text>
                    <Text style={styles.kvValue}>{session.totalJumps}</Text>
                  </View>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>스프린트</Text>
                    <Text style={styles.kvValue}>{session.totalSprints}</Text>
                  </View>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>평균 심박</Text>
                    <Text style={styles.kvValue}>
                      {session.avgHr ?? '-'} bpm
                    </Text>
                  </View>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>최고 심박</Text>
                    <Text style={styles.kvValue}>
                      {session.maxHr ?? '-'} bpm
                    </Text>
                  </View>
                </View>
              </Card>

              {session.zoneDistribution && (
                <Card title="심박 Zone 분포">
                  <ZoneDistributionBar zones={session.zoneDistribution} />
                </Card>
              )}

              <Card title="운동 효과">
                <StarRating
                  label="유산소 효과"
                  value={session.aerobicStars}
                />
                <StarRating
                  label="무산소 효과"
                  value={session.anaerobicStars}
                />
                <Text style={styles.note}>
                  Zone 2~3 비중이 유산소, Zone 4~5 비중이 무산소 효과로 환산됩니다.
                </Text>
              </Card>

              {session.quarters.length > 0 && (
                <Card title="쿼터별 심박 추이">
                  <QuarterChart quarters={session.quarters} />
                </Card>
              )}

              <Card title="내일 훈련 권장">
                <Text style={styles.advice}>{session.tomorrowAdvice}</Text>
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

function QuarterChart({
  quarters,
}: {
  quarters: BasketballSession['quarters'];
}) {
  const max = quarters.reduce(
    (m, q) => (q.maxHr && q.maxHr > m ? q.maxHr : m),
    0,
  );
  const display = max > 0 ? max : 200;
  return (
    <View style={chartStyles.row}>
      {quarters.map((q) => {
        const h = q.avgHr ? Math.round((q.avgHr / display) * 100) : 0;
        return (
          <View key={q.index} style={chartStyles.col}>
            <View style={chartStyles.barTrack}>
              <View
                style={[
                  chartStyles.barFill,
                  { height: `${Math.min(100, h)}%` },
                ]}
              />
            </View>
            <Text style={chartStyles.label}>{q.index + 1}Q</Text>
            <Text style={chartStyles.value}>
              {q.avgHr ? `${q.avgHr}` : '-'}
            </Text>
            <Text style={chartStyles.sub}>
              {q.jumps}점프 · {q.sprints}스프린트
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    height: 80,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.mint,
  },
  label: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  sub: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
});

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
    alignItems: 'center',
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  heroDuration: {
    color: colors.mint,
    fontSize: 56,
    fontWeight: '800',
    marginTop: 4,
  },
  heroSub: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 4,
  },
  kvRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kvCell: {
    flex: 1,
    minWidth: '40%',
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
  note: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  advice: {
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
