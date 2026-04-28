import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HrZoneIndicator } from '../src/components/running/HrZoneIndicator';
import { PaceProBar } from '../src/components/running/PaceProBar';
import {
  buildPacePro,
  emptyZoneDistribution,
  formatDistance,
  formatDuration,
  formatPace,
  haversineMeters,
  hrZoneFor,
  paceFromTargetTime,
  pickSegmentForProgress,
  predictedFinishSeconds,
  buildSessionFeedback,
} from '../src/lib/pace';
import {
  incrementShoeKm,
  insertRunningSession,
  loadUserProfile,
} from '../src/services/db';
import {
  fetchLatestHeartRate,
  fetchLatestWorkoutMetrics,
  startLocationWatcher,
  type HrSample,
  type TrackPoint,
} from '../src/services/running';
import { colors, radius, spacing } from '../src/theme/colors';
import type { ZoneDistribution } from '../src/types';

const PACE_WINDOW_MS = 30_000;
const HR_POLL_MS = 5_000;

interface LiveStats {
  distanceM: number;
  durationS: number;
  currentPace: number;
  currentHr: number | null;
}

export default function RunningSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetDistanceM?: string;
    targetTimeS?: string;
    paceGuide?: string;
    shoeId?: string;
  }>();

  const targetDistanceM = Number(params.targetDistanceM ?? 0);
  const targetTimeS = Number(params.targetTimeS ?? 0);
  const paceGuide = params.paceGuide === '1';
  const shoeId = params.shoeId ? Number(params.shoeId) : null;
  const targetPace = useMemo(
    () => paceFromTargetTime(targetDistanceM, targetTimeS),
    [targetDistanceM, targetTimeS],
  );
  const segments = useMemo(
    () => (targetPace > 0 ? buildPacePro(targetPace) : []),
    [targetPace],
  );

  const startedAtRef = useRef<number>(Date.now());
  const pointsRef = useRef<TrackPoint[]>([]);
  const distanceRef = useRef<number>(0);
  const hrSamplesRef = useRef<HrSample[]>([]);
  const zonesRef = useRef<ZoneDistribution>(emptyZoneDistribution());
  const lastHrTickRef = useRef<number>(Date.now());
  const watcherRef = useRef<{ remove: () => void } | null>(null);
  const finishedRef = useRef<boolean>(false);
  const [maxHrProfile, setMaxHrProfile] = useState<number | null>(null);

  const [stats, setStats] = useState<LiveStats>({
    distanceM: 0,
    durationS: 0,
    currentPace: 0,
    currentHr: null,
  });
  const [permissionDenied, setPermissionDenied] = useState(false);

  const computeCurrentPace = useCallback((): number => {
    const points = pointsRef.current;
    if (points.length < 2) return 0;
    const cutoff = Date.now() - PACE_WINDOW_MS;
    const window = points.filter((p) => p.ts >= cutoff);
    if (window.length < 2) return 0;
    let dist = 0;
    for (let i = 1; i < window.length; i++) {
      dist += haversineMeters(
        window[i - 1]!.lat,
        window[i - 1]!.lon,
        window[i]!.lat,
        window[i]!.lon,
      );
    }
    if (dist <= 0) return 0;
    const elapsed = (window[window.length - 1]!.ts - window[0]!.ts) / 1000;
    if (elapsed <= 0) return 0;
    return (elapsed / dist) * 1000;
  }, []);

  useEffect(() => {
    loadUserProfile().then((p) => setMaxHrProfile(p.maxHeartRate));

    (async () => {
      const sub = await startLocationWatcher((p) => {
        const points = pointsRef.current;
        const last = points[points.length - 1];
        if (last) {
          const seg = haversineMeters(last.lat, last.lon, p.lat, p.lon);
          if (seg < 100) distanceRef.current += seg;
        }
        points.push(p);
      });
      if (!sub) {
        setPermissionDenied(true);
        return;
      }
      watcherRef.current = sub;
    })();

    const tick = setInterval(async () => {
      if (finishedRef.current) return;
      const now = Date.now();
      const durationS = Math.floor((now - startedAtRef.current) / 1000);

      let currentHr: number | null = stats.currentHr;
      if (now - lastHrTickRef.current >= HR_POLL_MS) {
        lastHrTickRef.current = now;
        const bpm = await fetchLatestHeartRate();
        if (bpm) {
          currentHr = bpm;
          hrSamplesRef.current.push({ ts: now, bpm });
          const zone = hrZoneFor(bpm, maxHrProfile);
          if (zone !== null) {
            zonesRef.current[zone] += HR_POLL_MS / 1000;
          }
        }
      }

      setStats({
        distanceM: distanceRef.current,
        durationS,
        currentPace: computeCurrentPace(),
        currentHr,
      });
    }, 1000);

    return () => {
      clearInterval(tick);
      watcherRef.current?.remove?.();
      watcherRef.current = null;
    };
  }, [computeCurrentPace, maxHrProfile, stats.currentHr]);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    watcherRef.current?.remove?.();
    watcherRef.current = null;

    const endedAt = Date.now();
    const durationS = Math.max(1, Math.floor((endedAt - startedAtRef.current) / 1000));
    const distanceM = distanceRef.current;
    const avgPace = distanceM > 0 ? (durationS / distanceM) * 1000 : 0;

    const samples = hrSamplesRef.current;
    const avgHr =
      samples.length > 0
        ? Math.round(samples.reduce((a, s) => a + s.bpm, 0) / samples.length)
        : null;
    const maxHrSession =
      samples.length > 0 ? Math.max(...samples.map((s) => s.bpm)) : null;

    const metrics = await fetchLatestWorkoutMetrics(startedAtRef.current, endedAt);

    const feedback = buildSessionFeedback({
      avgPace,
      targetPace: targetPace > 0 ? targetPace : null,
      zoneDist: samples.length > 0 ? zonesRef.current : null,
      gctMs: metrics.groundContactMs,
    });

    const achieved =
      targetTimeS > 0 && targetDistanceM > 0
        ? distanceM >= targetDistanceM && durationS <= targetTimeS
        : null;

    const id = await insertRunningSession({
      startedAt: startedAtRef.current,
      endedAt,
      distanceM,
      durationS,
      avgPaceSPerKm: Math.round(avgPace),
      avgHr,
      maxHr: maxHrSession,
      zoneDistribution: samples.length > 0 ? zonesRef.current : null,
      cadence: metrics.cadence,
      gct: metrics.groundContactMs,
      verticalOscillation: metrics.verticalOscillation,
      shoeId,
      targetDistanceM: targetDistanceM > 0 ? targetDistanceM : null,
      targetTimeS: targetTimeS > 0 ? targetTimeS : null,
      achieved,
      feedback,
    });

    if (shoeId && distanceM > 0) {
      await incrementShoeKm(shoeId, distanceM / 1000).catch(() => {});
    }

    router.replace({ pathname: '/running-report', params: { id: String(id) } });
  }, [router, shoeId, targetDistanceM, targetPace, targetTimeS]);

  const confirmFinish = () => {
    Alert.alert('세션 종료', '러닝을 마치고 리포트를 볼까요?', [
      { text: '계속 달리기', style: 'cancel' },
      { text: '종료', style: 'destructive', onPress: finish },
    ]);
  };

  const progressRatio =
    targetDistanceM > 0 ? stats.distanceM / targetDistanceM : 0;
  const paceDiff = targetPace > 0 && stats.currentPace > 0
    ? Math.round(stats.currentPace - targetPace)
    : 0;
  const predicted =
    targetDistanceM > 0
      ? predictedFinishSeconds(stats.distanceM, targetDistanceM, stats.durationS)
      : 0;
  const hrZone = hrZoneFor(stats.currentHr ?? 0, maxHrProfile);
  const segmentNow =
    paceGuide && segments.length > 0
      ? pickSegmentForProgress(segments, progressRatio)
      : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: '러닝 중',
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
                위치 권한이 거부되어 거리/페이스를 측정할 수 없습니다.
              </Text>
            </View>
          )}

          <View style={styles.bigBlock}>
            <Text style={styles.label}>현재 거리</Text>
            <Text style={styles.bigValue}>
              {formatDistance(stats.distanceM)}
              <Text style={styles.bigUnit}> km</Text>
            </Text>
            <Text style={styles.sub}>
              목표 {(targetDistanceM / 1000).toFixed(1)}km · 예상 완주{' '}
              {predicted > 0 ? formatDuration(predicted) : '--:--'}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>현재 페이스</Text>
              <Text style={styles.cellValue}>{formatPace(stats.currentPace)}</Text>
              {targetPace > 0 && stats.currentPace > 0 && (
                <Text
                  style={[
                    styles.cellDiff,
                    { color: paceDiff <= 0 ? colors.good : colors.warn },
                  ]}
                >
                  {paceDiff <= 0 ? '' : '+'}
                  {paceDiff}초/km
                </Text>
              )}
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>경과 시간</Text>
              <Text style={styles.cellValue}>{formatDuration(stats.durationS)}</Text>
              {targetTimeS > 0 && (
                <Text style={styles.cellDiff}>
                  목표 {formatDuration(targetTimeS)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>심박수</Text>
              <Text style={styles.cellValue}>
                {stats.currentHr ? `${stats.currentHr}` : '--'}
                <Text style={styles.cellUnit}> bpm</Text>
              </Text>
              <View style={{ marginTop: 6 }}>
                <HrZoneIndicator zone={hrZone} />
              </View>
            </View>
          </View>

          {segmentNow && segments.length > 0 && (
            <View style={styles.segmentBlock}>
              <Text style={styles.label}>
                현재 구간: {segmentNow.label} · 목표 {formatPace(segmentNow.paceSPerKm)}
              </Text>
              <View style={{ marginTop: 6 }}>
                <PaceProBar segments={segments} progressRatio={progressRatio} />
              </View>
            </View>
          )}

          <Pressable onPress={confirmFinish} style={styles.stopBtn}>
            <Text style={styles.stopText}>종료</Text>
          </Pressable>
        </View>
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
  bigUnit: {
    color: colors.textDim,
    fontSize: 22,
    fontWeight: '700',
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
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  cellUnit: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  cellDiff: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  segmentBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stopBtn: {
    marginTop: 'auto',
    backgroundColor: colors.bad,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  stopText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
});
