import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HrZoneIndicator } from '../src/components/running/HrZoneIndicator';
import { ZoneDistributionBar } from '../src/components/running/ZoneDistributionBar';
import {
  aggregateZones,
  effectStars,
  estimateCalories,
  quarterFeedback,
  tomorrowAdvice,
} from '../src/lib/basketball';
import { startMotionDetector, type MotionDetectorHandle } from '../src/lib/motion';
import {
  emptyZoneDistribution,
  formatDuration,
  hrZoneFor,
} from '../src/lib/pace';
import {
  getLatestInbody,
  insertBasketballSession,
  loadBasketballThresholds,
  loadUserProfile,
} from '../src/services/db';
import { fetchLatestHeartRate } from '../src/services/running';
import { colors, radius, spacing } from '../src/theme/colors';
import type { QuarterStats, ZoneDistribution } from '../src/types';

const HR_POLL_MS = 5000;

interface QuarterRunState {
  index: number;
  startedAt: number;
  jumps: number;
  sprints: number;
  hrSamples: number[];
  zones: ZoneDistribution;
  pausedAt: number | null;
  totalPausedMs: number;
}

function makeQuarter(index: number): QuarterRunState {
  return {
    index,
    startedAt: Date.now(),
    jumps: 0,
    sprints: 0,
    hrSamples: [],
    zones: emptyZoneDistribution(),
    pausedAt: null,
    totalPausedMs: 0,
  };
}

export default function BasketballSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    quarterS?: string;
    expectedQuarters?: string;
  }>();
  const quarterTargetS = Number(params.quarterS ?? 0);
  const expectedQuarters = params.expectedQuarters
    ? Number(params.expectedQuarters)
    : null;

  const sessionStartedAtRef = useRef<number>(Date.now());
  const finishedRef = useRef<boolean>(false);
  const motionRef = useRef<MotionDetectorHandle | null>(null);
  const lastHrAtRef = useRef<number>(0);
  const completedRef = useRef<QuarterStats[]>([]);
  const quarterRef = useRef<QuarterRunState>(makeQuarter(0));
  const sessionPausedAtRef = useRef<number | null>(null);
  const sessionPausedMsRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const [paused, setPausedState] = useState<boolean>(false);

  const togglePause = useCallback(() => {
    const now = Date.now();
    if (pausedRef.current) {
      const q = quarterRef.current;
      if (q.pausedAt) q.totalPausedMs += now - q.pausedAt;
      q.pausedAt = null;
      if (sessionPausedAtRef.current) {
        sessionPausedMsRef.current += now - sessionPausedAtRef.current;
      }
      sessionPausedAtRef.current = null;
      pausedRef.current = false;
      setPausedState(false);
    } else {
      quarterRef.current.pausedAt = now;
      sessionPausedAtRef.current = now;
      pausedRef.current = true;
      setPausedState(true);
    }
  }, []);

  const [maxHr, setMaxHr] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [, force] = useState<number>(0);
  const [currentHr, setCurrentHr] = useState<number | null>(null);
  const [endingQuarter, setEndingQuarter] = useState<QuarterStats | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const tick = useCallback(() => force((n) => n + 1), []);

  useEffect(() => {
    (async () => {
      const [profile, thresh, latestInbody] = await Promise.all([
        loadUserProfile(),
        loadBasketballThresholds(),
        getLatestInbody().catch(() => null),
      ]);
      setMaxHr(profile.maxHeartRate);
      setWeightKg(latestInbody?.weightKg ?? null);

      const handle = await startMotionDetector({
        jumpG: thresh.jumpG,
        sprintG: thresh.sprintG,
        onJump: () => {
          if (pausedRef.current) return;
          quarterRef.current.jumps += 1;
          tick();
        },
        onSprint: () => {
          if (pausedRef.current) return;
          quarterRef.current.sprints += 1;
          tick();
        },
      });
      if (!handle) setPermissionDenied(true);
      motionRef.current = handle;
    })();

    const id = setInterval(async () => {
      if (finishedRef.current) return;
      const t = Date.now();
      setNow(t);
      if (pausedRef.current) return;

      if (t - lastHrAtRef.current >= HR_POLL_MS) {
        lastHrAtRef.current = t;
        const bpm = await fetchLatestHeartRate();
        if (bpm) {
          setCurrentHr(bpm);
          quarterRef.current.hrSamples.push(bpm);
          const zone = hrZoneFor(bpm, maxHr);
          if (zone !== null) {
            quarterRef.current.zones[zone] += HR_POLL_MS / 1000;
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(id);
      motionRef.current?.stop?.();
      motionRef.current = null;
    };
  }, [maxHr, tick]);

  const quarter = quarterRef.current;
  const quarterPausedNow =
    quarter.totalPausedMs + (quarter.pausedAt ? now - quarter.pausedAt : 0);
  const sessionPausedNow =
    sessionPausedMsRef.current +
    (sessionPausedAtRef.current ? now - sessionPausedAtRef.current : 0);
  const elapsedQuarterS = Math.max(
    0,
    Math.floor((now - quarter.startedAt - quarterPausedNow) / 1000),
  );
  const elapsedTotalS = Math.max(
    0,
    Math.floor((now - sessionStartedAtRef.current - sessionPausedNow) / 1000),
  );
  const hrZone = hrZoneFor(currentHr ?? 0, maxHr);

  const finalizeQuarter = useCallback((): QuarterStats => {
    const q = quarter;
    const samples = q.hrSamples;
    const avg = samples.length
      ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
      : null;
    const max = samples.length ? Math.max(...samples) : null;
    const nowMs = Date.now();
    const totalPaused =
      q.totalPausedMs + (q.pausedAt ? nowMs - q.pausedAt : 0);
    return {
      index: q.index,
      durationS: Math.max(
        1,
        Math.floor((nowMs - q.startedAt - totalPaused) / 1000),
      ),
      avgHr: avg,
      maxHr: max,
      zoneDistribution: samples.length ? q.zones : null,
      jumps: q.jumps,
      sprints: q.sprints,
    };
  }, [quarter]);

  const endQuarter = useCallback(() => {
    if (finishedRef.current) return;
    const stats = finalizeQuarter();
    setEndingQuarter(stats);
  }, [finalizeQuarter]);

  const continueToNextQuarter = useCallback(() => {
    if (!endingQuarter) return;
    completedRef.current.push(endingQuarter);
    quarterRef.current = makeQuarter(endingQuarter.index + 1);
    setEndingQuarter(null);
    tick();
  }, [endingQuarter, tick]);

  const finishSession = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    motionRef.current?.stop?.();
    motionRef.current = null;

    const lastStats = endingQuarter ?? finalizeQuarter();
    const allQuarters = [...completedRef.current];
    if (
      lastStats &&
      (lastStats.durationS > 5 || lastStats.jumps > 0 || lastStats.sprints > 0)
    ) {
      allQuarters.push(lastStats);
    }

    if (sessionPausedAtRef.current) {
      sessionPausedMsRef.current += Date.now() - sessionPausedAtRef.current;
      sessionPausedAtRef.current = null;
    }
    const endedAt = Date.now();
    const durationS = Math.max(
      1,
      Math.floor(
        (endedAt - sessionStartedAtRef.current - sessionPausedMsRef.current) /
          1000,
      ),
    );

    const allHrSamples: number[] = [];
    for (const q of allQuarters) {
      if (q.avgHr) allHrSamples.push(q.avgHr);
    }
    const avgHrFromSamples =
      quarter.hrSamples.length === 0 && completedRef.current.length === 0
        ? null
        : (() => {
            const flat: number[] = [];
            for (const q of completedRef.current)
              if (q.avgHr) flat.push(q.avgHr);
            for (const s of quarter.hrSamples) flat.push(s);
            return flat.length
              ? Math.round(flat.reduce((a, b) => a + b, 0) / flat.length)
              : null;
          })();
    const maxHrSession = (() => {
      let m: number | null = null;
      for (const q of allQuarters) {
        if (q.maxHr !== null && (m === null || q.maxHr > m)) m = q.maxHr;
      }
      return m;
    })();

    const totalZones = aggregateZones(allQuarters);
    const hasZoneData = Object.values(totalZones).some((v) => v > 0);
    const stars = effectStars(totalZones);
    const advice = tomorrowAdvice(durationS, hasZoneData ? totalZones : null);
    const calories = estimateCalories(durationS, avgHrFromSamples, weightKg);

    const totalJumps =
      allQuarters.reduce((a, q) => a + q.jumps, 0);
    const totalSprints =
      allQuarters.reduce((a, q) => a + q.sprints, 0);

    const id = await insertBasketballSession({
      startedAt: sessionStartedAtRef.current,
      endedAt,
      durationS,
      quarters: allQuarters,
      totalJumps,
      totalSprints,
      avgHr: avgHrFromSamples,
      maxHr: maxHrSession,
      zoneDistribution: hasZoneData ? totalZones : null,
      caloriesKcal: calories,
      aerobicStars: stars.aerobic,
      anaerobicStars: stars.anaerobic,
      tomorrowAdvice: advice,
    });

    router.replace({
      pathname: '/basketball-report',
      params: { id: String(id) },
    });
  }, [endingQuarter, finalizeQuarter, quarter.hrSamples, router]);

  const confirmEnd = () => {
    Alert.alert('세션 종료', '농구를 마치고 리포트를 볼까요?', [
      { text: '계속', style: 'cancel' },
      { text: '종료', style: 'destructive', onPress: finishSession },
    ]);
  };

  const quarterRemaining =
    quarterTargetS > 0
      ? Math.max(0, quarterTargetS - elapsedQuarterS)
      : null;

  const quarterDisplay = useMemo(() => {
    if (quarterRemaining !== null) return formatDuration(quarterRemaining);
    return formatDuration(elapsedQuarterS);
  }, [elapsedQuarterS, quarterRemaining]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '농구 중',
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.text,
          headerBackVisible: false,
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          {permissionDenied && (
            <View style={styles.warn}>
              <Text style={styles.warnText}>
                동작 센서 권한이 거부되어 점프/스프린트가 카운트되지 않습니다.
              </Text>
            </View>
          )}

          <View style={styles.bigBlock}>
            <Text style={styles.label}>
              {expectedQuarters
                ? `${quarter.index + 1}/${expectedQuarters} 쿼터`
                : `${quarter.index + 1} 쿼터`}
              {quarterRemaining !== null ? ' · 남은 시간' : ' · 경과'}
            </Text>
            <Text style={styles.bigValue}>{quarterDisplay}</Text>
            <Text style={styles.sub}>
              총 {formatDuration(elapsedTotalS)}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>심박수</Text>
              <Text style={styles.cellValue}>
                {currentHr ? `${currentHr}` : '--'}
                <Text style={styles.cellUnit}> bpm</Text>
              </Text>
              <View style={{ marginTop: 6 }}>
                <HrZoneIndicator zone={hrZone} />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>점프</Text>
              <Text style={styles.cellValue}>{quarter.jumps}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>스프린트</Text>
              <Text style={styles.cellValue}>{quarter.sprints}</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <Pressable onPress={togglePause} style={styles.btnPause}>
              <Text style={styles.btnPauseText}>
                {paused ? '▶ 재개' : '⏸ 일시정지'}
              </Text>
            </Pressable>
            <Pressable onPress={endQuarter} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>쿼터 종료</Text>
            </Pressable>
            <Pressable onPress={confirmEnd} style={styles.btnDanger}>
              <Text style={styles.btnDangerText}>세션 종료</Text>
            </Pressable>
          </View>

          {paused && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.pauseOverlayText}>일시정지 중</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal
        transparent
        visible={endingQuarter !== null}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {endingQuarter && (
              <ScrollView contentContainerStyle={{ gap: spacing.md }}>
                <Text style={styles.modalTitle}>
                  {endingQuarter.index + 1} 쿼터 종료
                </Text>
                <View style={styles.kvRow}>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>경과</Text>
                    <Text style={styles.kvValue}>
                      {formatDuration(endingQuarter.durationS)}
                    </Text>
                  </View>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>평균 심박</Text>
                    <Text style={styles.kvValue}>
                      {endingQuarter.avgHr ?? '-'} bpm
                    </Text>
                  </View>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>최고 심박</Text>
                    <Text style={styles.kvValue}>
                      {endingQuarter.maxHr ?? '-'} bpm
                    </Text>
                  </View>
                </View>
                <View style={styles.kvRow}>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>점프</Text>
                    <Text style={styles.kvValue}>{endingQuarter.jumps}</Text>
                  </View>
                  <View style={styles.kvCell}>
                    <Text style={styles.kvLabel}>스프린트</Text>
                    <Text style={styles.kvValue}>{endingQuarter.sprints}</Text>
                  </View>
                </View>
                {endingQuarter.zoneDistribution && (
                  <ZoneDistributionBar zones={endingQuarter.zoneDistribution} />
                )}
                <Text style={styles.modalFeedback}>
                  {quarterFeedback(endingQuarter)}
                </Text>
                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      setEndingQuarter(null);
                      finishSession();
                    }}
                    style={styles.btnGhost}
                  >
                    <Text style={styles.btnGhostText}>세션 종료</Text>
                  </Pressable>
                  <Pressable
                    onPress={continueToNextQuarter}
                    style={styles.btnPrimary}
                  >
                    <Text style={styles.btnPrimaryText}>다음 쿼터</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  warn: {
    backgroundColor: colors.bad + '22',
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bad + '55',
  },
  warnText: {
    color: colors.bad,
    fontSize: 13,
    fontWeight: '600',
  },
  bigBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  label: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  bigValue: {
    color: colors.mint,
    fontSize: 64,
    fontWeight: '800',
    marginTop: 4,
  },
  sub: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  cellValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  cellUnit: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 'auto',
  },
  btnPause: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.warn,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPauseText: {
    color: colors.warn,
    fontSize: 14,
    fontWeight: '700',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: colors.warn + 'EE',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pauseOverlayText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '800',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.mint,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDanger: {
    flex: 1,
    backgroundColor: colors.bad,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDangerText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  modalFeedback: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '800',
  },
  btnGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    color: colors.textDim,
    fontSize: 15,
    fontWeight: '600',
  },
});
