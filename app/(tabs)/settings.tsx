import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BasketballThresholdsSection } from '../../src/components/settings/BasketballThresholdsSection';
import { MorningReportSection } from '../../src/components/settings/MorningReportSection';
import { ShiftSection } from '../../src/components/settings/ShiftSection';
import { ShoesSection } from '../../src/components/settings/ShoesSection';
import { SupplementTimesSection } from '../../src/components/settings/SupplementTimesSection';
import { SupplementsSection } from '../../src/components/settings/SupplementsSection';
import { UserProfileSection } from '../../src/components/settings/UserProfileSection';
import { recommendWorkout } from '../../src/lib/readiness';
import {
  deleteShoe,
  deleteSupplement,
  ensureDefaultSupplements,
  getLatestDailyScore,
  insertShoe,
  insertSupplement,
  listShoes,
  listSupplements,
  loadBasketballThresholds,
  loadMorningReportConfig,
  loadShiftConfig,
  loadSupplementBaseTimes,
  loadUserProfile,
  saveBasketballThresholds,
  saveMorningReportConfig,
  saveShiftConfig,
  saveSupplementBaseTimes,
  saveUserProfile,
  updateShoe,
  updateSupplement,
} from '../../src/services/db';
import {
  ensureNotificationPermission,
  rescheduleMorningReports,
  rescheduleSupplementNotifications,
  type MorningReportSnapshot,
} from '../../src/services/notifications';
import { defaultShiftConfig, shiftKindForDate } from '../../src/services/shift';
import { fetchWeather } from '../../src/services/weather';
import { colors, spacing } from '../../src/theme/colors';
import type {
  BasketballThresholds,
  MorningReportConfig,
  ReadinessStatus,
  ShiftConfig,
  Shoe,
  Supplement,
  SupplementBaseTimes,
  UserProfile,
} from '../../src/types';

const STATUS_LABEL: Record<ReadinessStatus, string> = {
  peak: '최상',
  good: '양호',
  fair: '보통',
  fatigue: '피로',
};

async function buildMorningSnapshot(
  profile: UserProfile,
): Promise<MorningReportSnapshot> {
  const [latest, weather] = await Promise.all([
    getLatestDailyScore().catch(() => null),
    fetchWeather().catch(() => null),
  ]);

  let recommendationTitle: string | null = null;
  if (latest) {
    const status = latest.status as ReadinessStatus;
    const fakeReadiness = {
      total: latest.total,
      breakdown: { sleep: 0, hrv: 0, recovery: 0, load: 0 },
      status,
      label: STATUS_LABEL[status],
      emoji: '',
      advice: '',
    };
    recommendationTitle = recommendWorkout(
      fakeReadiness,
      profile.runningGoal5kSeconds,
    ).title;
  }

  return {
    score: latest?.total ?? null,
    recommendationTitle,
    weatherSummary: weather
      ? `${weather.tempC}°C ${weather.description}`
      : null,
  };
}

export default function SettingsScreen() {
  const [config, setConfig] = useState<ShiftConfig | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [baseTimes, setBaseTimes] = useState<SupplementBaseTimes | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reportConfig, setReportConfig] = useState<MorningReportConfig | null>(null);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [basketballThresh, setBasketballThresh] =
    useState<BasketballThresholds | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledSupp, setScheduledSupp] = useState<number | null>(null);
  const [scheduledMorning, setScheduledMorning] = useState<number | null>(null);

  const rescheduleAll = useCallback(
    async (
      list: Supplement[],
      cfg: ShiftConfig | null,
      times: SupplementBaseTimes,
      report: MorningReportConfig,
      currentProfile: UserProfile,
    ) => {
      const [supp, snapshot] = await Promise.all([
        rescheduleSupplementNotifications(list, cfg, times),
        buildMorningSnapshot(currentProfile),
      ]);
      const morning = await rescheduleMorningReports(report, cfg, snapshot);
      setScheduledSupp(supp);
      setScheduledMorning(morning);
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const [cfg, list, times, prof, report, shoeList, thresh] = await Promise.all([
        loadShiftConfig(),
        (async () => {
          await ensureDefaultSupplements();
          return listSupplements();
        })(),
        loadSupplementBaseTimes(),
        loadUserProfile(),
        loadMorningReportConfig(),
        listShoes(false),
        loadBasketballThresholds(),
      ]);
      const resolvedCfg = cfg ?? defaultShiftConfig();
      setConfig(resolvedCfg);
      setSupplements(list);
      setBaseTimes(times);
      setProfile(prof);
      setReportConfig(report);
      setShoes(shoeList);
      setBasketballThresh(thresh);
      setLoading(false);
      ensureNotificationPermission()
        .then(() => rescheduleAll(list, resolvedCfg, times, report, prof))
        .catch(() => {});
    })();
  }, [rescheduleAll]);

  const handleConfigChange = useCallback(
    async (next: ShiftConfig) => {
      setConfig(next);
      await saveShiftConfig(next);
      if (baseTimes && reportConfig && profile)
        await rescheduleAll(supplements, next, baseTimes, reportConfig, profile);
    },
    [baseTimes, profile, rescheduleAll, reportConfig, supplements],
  );

  const handleBaseTimesChange = useCallback(
    async (next: SupplementBaseTimes) => {
      setBaseTimes(next);
      await saveSupplementBaseTimes(next);
      if (reportConfig && profile)
        await rescheduleAll(supplements, config, next, reportConfig, profile);
    },
    [config, profile, rescheduleAll, reportConfig, supplements],
  );

  const handleProfileChange = useCallback(
    async (next: UserProfile) => {
      setProfile(next);
      await saveUserProfile(next);
      if (baseTimes && reportConfig)
        await rescheduleAll(supplements, config, baseTimes, reportConfig, next);
    },
    [baseTimes, config, rescheduleAll, reportConfig, supplements],
  );

  const handleReportChange = useCallback(
    async (next: MorningReportConfig) => {
      setReportConfig(next);
      await saveMorningReportConfig(next);
      if (baseTimes && profile)
        await rescheduleAll(supplements, config, baseTimes, next, profile);
    },
    [baseTimes, config, profile, rescheduleAll, supplements],
  );

  const handleCreate = useCallback(
    async (input: Omit<Supplement, 'id'>) => {
      const id = await insertSupplement(input);
      const next = [...supplements, { ...input, id }];
      setSupplements(next);
      if (baseTimes && reportConfig && profile)
        await rescheduleAll(next, config, baseTimes, reportConfig, profile);
    },
    [baseTimes, config, profile, rescheduleAll, reportConfig, supplements],
  );

  const handleUpdate = useCallback(
    async (s: Supplement) => {
      await updateSupplement(s);
      const next = supplements.map((x) => (x.id === s.id ? s : x));
      setSupplements(next);
      if (baseTimes && reportConfig && profile)
        await rescheduleAll(next, config, baseTimes, reportConfig, profile);
    },
    [baseTimes, config, profile, rescheduleAll, reportConfig, supplements],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteSupplement(id);
      const next = supplements.filter((x) => x.id !== id);
      setSupplements(next);
      if (baseTimes && reportConfig && profile)
        await rescheduleAll(next, config, baseTimes, reportConfig, profile);
    },
    [baseTimes, config, profile, rescheduleAll, reportConfig, supplements],
  );

  const handleShoeCreate = useCallback(
    async (input: Omit<Shoe, 'id'>) => {
      const id = await insertShoe(input);
      setShoes([...shoes, { ...input, id }]);
    },
    [shoes],
  );

  const handleShoeUpdate = useCallback(
    async (s: Shoe) => {
      await updateShoe(s);
      setShoes(shoes.map((x) => (x.id === s.id ? s : x)));
    },
    [shoes],
  );

  const handleShoeDelete = useCallback(
    async (id: number) => {
      await deleteShoe(id);
      setShoes(shoes.filter((x) => x.id !== id));
    },
    [shoes],
  );

  const handleBasketballThresh = useCallback(
    async (next: BasketballThresholds) => {
      setBasketballThresh(next);
      await saveBasketballThresholds(next);
    },
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>설정</Text>

        {loading || !config || !baseTimes || !profile || !reportConfig || !basketballThresh ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.mint} />
          </View>
        ) : (
          <>
            <UserProfileSection profile={profile} onChange={handleProfileChange} />
            <ShiftSection
              config={config}
              onChange={handleConfigChange}
              todayKind={shiftKindForDate(config, new Date())}
            />
            <MorningReportSection
              config={reportConfig}
              onChange={handleReportChange}
            />
            <SupplementTimesSection
              times={baseTimes}
              onChange={handleBaseTimesChange}
            />
            <SupplementsSection
              items={supplements}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
            <ShoesSection
              items={shoes}
              onCreate={handleShoeCreate}
              onUpdate={handleShoeUpdate}
              onDelete={handleShoeDelete}
            />
            <BasketballThresholdsSection
              value={basketballThresh}
              onChange={handleBasketballThresh}
            />
            <Text style={styles.footer}>
              {scheduledSupp !== null && `보충제 알림 ${scheduledSupp}개`}
              {scheduledSupp !== null && scheduledMorning !== null && '  ·  '}
              {scheduledMorning !== null && `모닝 리포트 ${scheduledMorning}개`}
            </Text>
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
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
