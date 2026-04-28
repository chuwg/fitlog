import * as SQLite from 'expo-sqlite';
import type {
  BasketballSession,
  BasketballThresholds,
  HrZone,
  MorningReportConfig,
  QuarterStats,
  Readiness,
  RunningSession,
  ShiftConfig,
  ShiftKind,
  Shoe,
  Supplement,
  SupplementBaseTimes,
  SupplementTiming,
  UserProfile,
  ZoneDistribution,
} from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync('fitlog.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS daily_scores (
      date TEXT PRIMARY KEY,
      total INTEGER NOT NULL,
      sleep_score INTEGER NOT NULL,
      hrv_score INTEGER NOT NULL,
      recovery_score INTEGER NOT NULL,
      load_score INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shift_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      cycle TEXT NOT NULL,
      start_date TEXT NOT NULL,
      day_start TEXT NOT NULL,
      day_end TEXT NOT NULL,
      night_start TEXT NOT NULL,
      night_end TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS supplements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dose TEXT NOT NULL,
      timing TEXT NOT NULL,
      shift_adjust INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS supplement_base_times (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      morning TEXT NOT NULL,
      preworkout TEXT NOT NULL,
      postworkout TEXT NOT NULL,
      bedtime TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      running_goal_5k INTEGER,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS morning_report_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      notification_time TEXT NOT NULL,
      skip_night INTEGER NOT NULL,
      adjust_post_night INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      current_km REAL NOT NULL DEFAULT 0,
      target_km REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS running_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL,
      distance_m REAL NOT NULL,
      duration_s INTEGER NOT NULL,
      avg_pace_s_per_km INTEGER NOT NULL,
      avg_hr INTEGER,
      max_hr INTEGER,
      zone_distribution TEXT,
      cadence INTEGER,
      gct INTEGER,
      vertical_oscillation REAL,
      shoe_id INTEGER,
      target_distance_m REAL,
      target_time_s INTEGER,
      achieved INTEGER,
      feedback TEXT
    );
    CREATE TABLE IF NOT EXISTS basketball_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL,
      duration_s INTEGER NOT NULL,
      quarters_json TEXT NOT NULL,
      total_jumps INTEGER NOT NULL,
      total_sprints INTEGER NOT NULL,
      avg_hr INTEGER,
      max_hr INTEGER,
      zone_distribution TEXT,
      calories_kcal INTEGER,
      aerobic_stars INTEGER NOT NULL,
      anaerobic_stars INTEGER NOT NULL,
      tomorrow_advice TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS basketball_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      jump_g REAL NOT NULL,
      sprint_g REAL NOT NULL,
      default_quarter_s INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await safeAddColumn(db, 'user_profile', 'max_heart_rate', 'INTEGER');
  await safeAddColumn(db, 'user_profile', 'running_goal_10k', 'INTEGER');
  dbInstance = db;
  return db;
}

async function safeAddColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  type: string,
): Promise<void> {
  try {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch {}
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function saveDailyScore(readiness: Readiness): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO daily_scores (date, total, sleep_score, hrv_score, recovery_score, load_score, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       total = excluded.total,
       sleep_score = excluded.sleep_score,
       hrv_score = excluded.hrv_score,
       recovery_score = excluded.recovery_score,
       load_score = excluded.load_score,
       status = excluded.status,
       created_at = excluded.created_at`,
    todayKey(),
    readiness.total,
    readiness.breakdown.sleep,
    readiness.breakdown.hrv,
    readiness.breakdown.recovery,
    readiness.breakdown.load,
    readiness.status,
    Date.now(),
  );
}

export interface DailyScoreRow {
  date: string;
  total: number;
  status: string;
}

export async function getRecentScores(days: number): Promise<DailyScoreRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DailyScoreRow>(
    `SELECT date, total, status FROM daily_scores ORDER BY date DESC LIMIT ?`,
    days,
  );
  return rows;
}

interface ShiftConfigRow {
  cycle: string;
  start_date: string;
  day_start: string;
  day_end: string;
  night_start: string;
  night_end: string;
}

export async function loadShiftConfig(): Promise<ShiftConfig | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ShiftConfigRow>(
    `SELECT cycle, start_date, day_start, day_end, night_start, night_end FROM shift_config WHERE id = 1`,
  );
  if (!row) return null;
  const cycle = JSON.parse(row.cycle) as ShiftKind[];
  return {
    cycle,
    startDate: row.start_date,
    dayStart: row.day_start,
    dayEnd: row.day_end,
    nightStart: row.night_start,
    nightEnd: row.night_end,
  };
}

export async function saveShiftConfig(cfg: ShiftConfig): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO shift_config (id, cycle, start_date, day_start, day_end, night_start, night_end, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       cycle = excluded.cycle,
       start_date = excluded.start_date,
       day_start = excluded.day_start,
       day_end = excluded.day_end,
       night_start = excluded.night_start,
       night_end = excluded.night_end,
       updated_at = excluded.updated_at`,
    JSON.stringify(cfg.cycle),
    cfg.startDate,
    cfg.dayStart,
    cfg.dayEnd,
    cfg.nightStart,
    cfg.nightEnd,
    Date.now(),
  );
}

interface SupplementRow {
  id: number;
  name: string;
  dose: string;
  timing: string;
  shift_adjust: number;
  enabled: number;
}

function rowToSupplement(r: SupplementRow): Supplement {
  return {
    id: r.id,
    name: r.name,
    dose: r.dose,
    timing: r.timing as SupplementTiming,
    shiftAdjust: r.shift_adjust === 1,
    enabled: r.enabled === 1,
  };
}

export async function listSupplements(): Promise<Supplement[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SupplementRow>(
    `SELECT id, name, dose, timing, shift_adjust, enabled
     FROM supplements
     ORDER BY CASE timing
       WHEN 'morning' THEN 1
       WHEN 'preworkout' THEN 2
       WHEN 'postworkout' THEN 3
       WHEN 'bedtime' THEN 4
     END, id`,
  );
  return rows.map(rowToSupplement);
}

export async function insertSupplement(
  input: Omit<Supplement, 'id'>,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO supplements (name, dose, timing, shift_adjust, enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.name,
    input.dose,
    input.timing,
    input.shiftAdjust ? 1 : 0,
    input.enabled ? 1 : 0,
    Date.now(),
  );
  return result.lastInsertRowId;
}

export async function updateSupplement(s: Supplement): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE supplements SET name = ?, dose = ?, timing = ?, shift_adjust = ?, enabled = ? WHERE id = ?`,
    s.name,
    s.dose,
    s.timing,
    s.shiftAdjust ? 1 : 0,
    s.enabled ? 1 : 0,
    s.id,
  );
}

export async function deleteSupplement(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM supplements WHERE id = ?`, id);
}

interface DefaultSupplement {
  name: string;
  dose: string;
  timing: SupplementTiming;
  shiftAdjust: boolean;
}

const DEFAULT_SUPPLEMENTS: DefaultSupplement[] = [
  { name: '크리에이틴', dose: '3.4g', timing: 'postworkout', shiftAdjust: false },
  { name: '유청 단백', dose: '2 스쿱 (운동 후 30분)', timing: 'postworkout', shiftAdjust: false },
  { name: '마그네슘 비스글리시네이트', dose: '1정', timing: 'bedtime', shiftAdjust: true },
  { name: '오메가3', dose: '1000mg', timing: 'morning', shiftAdjust: true },
  { name: '센트룸', dose: '1정', timing: 'morning', shiftAdjust: true },
];

export const DEFAULT_BASE_TIMES: SupplementBaseTimes = {
  morning: '08:00',
  preworkout: '17:00',
  postworkout: '18:00',
  bedtime: '23:00',
};

interface BaseTimesRow {
  morning: string;
  preworkout: string;
  postworkout: string;
  bedtime: string;
}

export async function loadSupplementBaseTimes(): Promise<SupplementBaseTimes> {
  const db = await getDb();
  const row = await db.getFirstAsync<BaseTimesRow>(
    `SELECT morning, preworkout, postworkout, bedtime FROM supplement_base_times WHERE id = 1`,
  );
  if (!row) return { ...DEFAULT_BASE_TIMES };
  return {
    morning: row.morning,
    preworkout: row.preworkout,
    postworkout: row.postworkout,
    bedtime: row.bedtime,
  };
}

export async function saveSupplementBaseTimes(
  times: SupplementBaseTimes,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO supplement_base_times (id, morning, preworkout, postworkout, bedtime, updated_at)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       morning = excluded.morning,
       preworkout = excluded.preworkout,
       postworkout = excluded.postworkout,
       bedtime = excluded.bedtime,
       updated_at = excluded.updated_at`,
    times.morning,
    times.preworkout,
    times.postworkout,
    times.bedtime,
    Date.now(),
  );
}

export async function ensureDefaultSupplements(): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM supplements`,
  );
  if ((row?.count ?? 0) > 0) return;
  for (const s of DEFAULT_SUPPLEMENTS) {
    await insertSupplement({ ...s, enabled: true });
  }
}

interface UserProfileRow {
  name: string | null;
  running_goal_5k: number | null;
  running_goal_10k: number | null;
  max_heart_rate: number | null;
}

export async function loadUserProfile(): Promise<UserProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserProfileRow>(
    `SELECT name, running_goal_5k, running_goal_10k, max_heart_rate FROM user_profile WHERE id = 1`,
  );
  return {
    name: row?.name ?? null,
    runningGoal5kSeconds: row?.running_goal_5k ?? null,
    runningGoal10kSeconds: row?.running_goal_10k ?? null,
    maxHeartRate: row?.max_heart_rate ?? null,
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO user_profile (id, name, running_goal_5k, running_goal_10k, max_heart_rate, updated_at)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       running_goal_5k = excluded.running_goal_5k,
       running_goal_10k = excluded.running_goal_10k,
       max_heart_rate = excluded.max_heart_rate,
       updated_at = excluded.updated_at`,
    profile.name,
    profile.runningGoal5kSeconds,
    profile.runningGoal10kSeconds,
    profile.maxHeartRate,
    Date.now(),
  );
}

export const DEFAULT_MORNING_REPORT_CONFIG: MorningReportConfig = {
  notificationTime: '07:00',
  skipNight: true,
  adjustPostNight: true,
};

interface MorningReportRow {
  notification_time: string;
  skip_night: number;
  adjust_post_night: number;
}

export async function loadMorningReportConfig(): Promise<MorningReportConfig> {
  const db = await getDb();
  const row = await db.getFirstAsync<MorningReportRow>(
    `SELECT notification_time, skip_night, adjust_post_night FROM morning_report_config WHERE id = 1`,
  );
  if (!row) return { ...DEFAULT_MORNING_REPORT_CONFIG };
  return {
    notificationTime: row.notification_time,
    skipNight: row.skip_night === 1,
    adjustPostNight: row.adjust_post_night === 1,
  };
}

export async function saveMorningReportConfig(
  cfg: MorningReportConfig,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO morning_report_config (id, notification_time, skip_night, adjust_post_night, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       notification_time = excluded.notification_time,
       skip_night = excluded.skip_night,
       adjust_post_night = excluded.adjust_post_night,
       updated_at = excluded.updated_at`,
    cfg.notificationTime,
    cfg.skipNight ? 1 : 0,
    cfg.adjustPostNight ? 1 : 0,
    Date.now(),
  );
}

export async function getLatestDailyScore(): Promise<DailyScoreRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DailyScoreRow>(
    `SELECT date, total, status FROM daily_scores ORDER BY date DESC LIMIT 1`,
  );
  return row ?? null;
}

interface ShoeRow {
  id: number;
  name: string;
  brand: string | null;
  current_km: number;
  target_km: number | null;
  is_active: number;
}

function rowToShoe(r: ShoeRow): Shoe {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    currentKm: r.current_km,
    targetKm: r.target_km,
    isActive: r.is_active === 1,
  };
}

export async function listShoes(activeOnly = false): Promise<Shoe[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ShoeRow>(
    activeOnly
      ? `SELECT * FROM shoes WHERE is_active = 1 ORDER BY id`
      : `SELECT * FROM shoes ORDER BY is_active DESC, id`,
  );
  return rows.map(rowToShoe);
}

export async function insertShoe(input: Omit<Shoe, 'id'>): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO shoes (name, brand, current_km, target_km, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.name,
    input.brand,
    input.currentKm,
    input.targetKm,
    input.isActive ? 1 : 0,
    Date.now(),
  );
  return result.lastInsertRowId;
}

export async function updateShoe(s: Shoe): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE shoes SET name = ?, brand = ?, current_km = ?, target_km = ?, is_active = ? WHERE id = ?`,
    s.name,
    s.brand,
    s.currentKm,
    s.targetKm,
    s.isActive ? 1 : 0,
    s.id,
  );
}

export async function deleteShoe(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM shoes WHERE id = ?`, id);
}

export async function incrementShoeKm(id: number, km: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE shoes SET current_km = current_km + ? WHERE id = ?`,
    km,
    id,
  );
}

interface RunningSessionRow {
  id: number;
  started_at: number;
  ended_at: number;
  distance_m: number;
  duration_s: number;
  avg_pace_s_per_km: number;
  avg_hr: number | null;
  max_hr: number | null;
  zone_distribution: string | null;
  cadence: number | null;
  gct: number | null;
  vertical_oscillation: number | null;
  shoe_id: number | null;
  target_distance_m: number | null;
  target_time_s: number | null;
  achieved: number | null;
  feedback: string | null;
}

function parseZones(s: string | null): ZoneDistribution | null {
  if (!s) return null;
  try {
    const obj = JSON.parse(s) as Record<string, number>;
    return {
      1: obj['1'] ?? 0,
      2: obj['2'] ?? 0,
      3: obj['3'] ?? 0,
      4: obj['4'] ?? 0,
      5: obj['5'] ?? 0,
    };
  } catch {
    return null;
  }
}

function rowToSession(r: RunningSessionRow): RunningSession {
  return {
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    distanceM: r.distance_m,
    durationS: r.duration_s,
    avgPaceSPerKm: r.avg_pace_s_per_km,
    avgHr: r.avg_hr,
    maxHr: r.max_hr,
    zoneDistribution: parseZones(r.zone_distribution),
    cadence: r.cadence,
    gct: r.gct,
    verticalOscillation: r.vertical_oscillation,
    shoeId: r.shoe_id,
    targetDistanceM: r.target_distance_m,
    targetTimeS: r.target_time_s,
    achieved: r.achieved === null ? null : r.achieved === 1,
    feedback: r.feedback,
  };
}

export async function insertRunningSession(
  input: Omit<RunningSession, 'id'>,
): Promise<number> {
  const db = await getDb();
  const zonesJson = input.zoneDistribution
    ? JSON.stringify(input.zoneDistribution)
    : null;
  const result = await db.runAsync(
    `INSERT INTO running_sessions (
      started_at, ended_at, distance_m, duration_s, avg_pace_s_per_km,
      avg_hr, max_hr, zone_distribution, cadence, gct, vertical_oscillation,
      shoe_id, target_distance_m, target_time_s, achieved, feedback
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.startedAt,
    input.endedAt,
    input.distanceM,
    input.durationS,
    input.avgPaceSPerKm,
    input.avgHr,
    input.maxHr,
    zonesJson,
    input.cadence,
    input.gct,
    input.verticalOscillation,
    input.shoeId,
    input.targetDistanceM,
    input.targetTimeS,
    input.achieved === null ? null : input.achieved ? 1 : 0,
    input.feedback,
  );
  return result.lastInsertRowId;
}

export async function getRunningSession(id: number): Promise<RunningSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<RunningSessionRow>(
    `SELECT * FROM running_sessions WHERE id = ?`,
    id,
  );
  return row ? rowToSession(row) : null;
}

export async function findPreviousSimilarSession(
  targetDistanceM: number,
  excludeId: number,
  tolerance = 0.1,
): Promise<RunningSession | null> {
  const db = await getDb();
  const min = targetDistanceM * (1 - tolerance);
  const max = targetDistanceM * (1 + tolerance);
  const row = await db.getFirstAsync<RunningSessionRow>(
    `SELECT * FROM running_sessions
     WHERE distance_m BETWEEN ? AND ? AND id != ?
     ORDER BY started_at DESC LIMIT 1`,
    min,
    max,
    excludeId,
  );
  return row ? rowToSession(row) : null;
}

export const DEFAULT_BASKETBALL_THRESHOLDS: BasketballThresholds = {
  jumpG: 2.5,
  sprintG: 1.8,
  defaultQuarterS: 600,
};

interface BasketballConfigRow {
  jump_g: number;
  sprint_g: number;
  default_quarter_s: number;
}

export async function loadBasketballThresholds(): Promise<BasketballThresholds> {
  const db = await getDb();
  const row = await db.getFirstAsync<BasketballConfigRow>(
    `SELECT jump_g, sprint_g, default_quarter_s FROM basketball_config WHERE id = 1`,
  );
  if (!row) return { ...DEFAULT_BASKETBALL_THRESHOLDS };
  return {
    jumpG: row.jump_g,
    sprintG: row.sprint_g,
    defaultQuarterS: row.default_quarter_s,
  };
}

export async function saveBasketballThresholds(
  t: BasketballThresholds,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO basketball_config (id, jump_g, sprint_g, default_quarter_s, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       jump_g = excluded.jump_g,
       sprint_g = excluded.sprint_g,
       default_quarter_s = excluded.default_quarter_s,
       updated_at = excluded.updated_at`,
    t.jumpG,
    t.sprintG,
    t.defaultQuarterS,
    Date.now(),
  );
}

interface BasketballSessionRow {
  id: number;
  started_at: number;
  ended_at: number;
  duration_s: number;
  quarters_json: string;
  total_jumps: number;
  total_sprints: number;
  avg_hr: number | null;
  max_hr: number | null;
  zone_distribution: string | null;
  calories_kcal: number | null;
  aerobic_stars: number;
  anaerobic_stars: number;
  tomorrow_advice: string;
}

function rowToBasketballSession(r: BasketballSessionRow): BasketballSession {
  let quarters: QuarterStats[] = [];
  try {
    quarters = JSON.parse(r.quarters_json) as QuarterStats[];
  } catch {}
  return {
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationS: r.duration_s,
    quarters,
    totalJumps: r.total_jumps,
    totalSprints: r.total_sprints,
    avgHr: r.avg_hr,
    maxHr: r.max_hr,
    zoneDistribution: parseZones(r.zone_distribution),
    caloriesKcal: r.calories_kcal,
    aerobicStars: r.aerobic_stars,
    anaerobicStars: r.anaerobic_stars,
    tomorrowAdvice: r.tomorrow_advice,
  };
}

export async function insertBasketballSession(
  input: Omit<BasketballSession, 'id'>,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO basketball_sessions (
      started_at, ended_at, duration_s, quarters_json,
      total_jumps, total_sprints, avg_hr, max_hr, zone_distribution,
      calories_kcal, aerobic_stars, anaerobic_stars, tomorrow_advice
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.startedAt,
    input.endedAt,
    input.durationS,
    JSON.stringify(input.quarters),
    input.totalJumps,
    input.totalSprints,
    input.avgHr,
    input.maxHr,
    input.zoneDistribution ? JSON.stringify(input.zoneDistribution) : null,
    input.caloriesKcal,
    input.aerobicStars,
    input.anaerobicStars,
    input.tomorrowAdvice,
  );
  return result.lastInsertRowId;
}

export async function getBasketballSession(
  id: number,
): Promise<BasketballSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BasketballSessionRow>(
    `SELECT * FROM basketball_sessions WHERE id = ?`,
    id,
  );
  return row ? rowToBasketballSession(row) : null;
}
