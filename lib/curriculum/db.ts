import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import type { CurriculumUnit, LevelId, UnitStatus, UserUnitProgress } from '@/types/curriculum';

const CURRICULUM_DB_NAME = 'kitab-oxu-curriculum.db';

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export function resetCurriculumDatabaseHandle(): void {
  dbInstance = null;
  initPromise = null;
}

function getDb(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = openDatabaseSync(CURRICULUM_DB_NAME);
  }
  return dbInstance;
}

export async function initCurriculumDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = getDb();
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS curriculum_progress (
          unit_id TEXT PRIMARY KEY NOT NULL,
          level_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'locked',
          score INTEGER NOT NULL DEFAULT 0,
          stars INTEGER NOT NULL DEFAULT 0,
          completed_at INTEGER,
          unlocked_at INTEGER NOT NULL
        );`
      );

      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS cached_units (
          unit_id TEXT PRIMARY KEY NOT NULL,
          level_id TEXT NOT NULL,
          unit_order INTEGER NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );`
      );

      // By default, only Unit 1 of A0 starts unlocked for everyone.
      // Level A1 and subsequent levels unlock sequentially after completing the previous level.
      const unitA0 = await db.getFirstAsync<{ unit_id: string }>(
        'SELECT unit_id FROM curriculum_progress WHERE unit_id = ?',
        ['a0_unit_01']
      );

      if (!unitA0) {
        await db.runAsync(
          `INSERT OR IGNORE INTO curriculum_progress (unit_id, level_id, status, score, stars, unlocked_at)
           VALUES ('a0_unit_01', 'A0', 'unlocked', 0, 0, ?);`,
          [Date.now()]
        );
      }

      // Ensure A1 is locked if A0 final checkpoint has not been completed yet
      const a0Boss = await db.getFirstAsync<{ status: string }>(
        "SELECT status FROM curriculum_progress WHERE unit_id = 'a0_boss_01'"
      );
      if (!a0Boss || a0Boss.status !== 'completed') {
        await db.runAsync(
          "DELETE FROM curriculum_progress WHERE unit_id = 'a1_unit_01' AND status = 'unlocked' AND score = 0"
        );
      }

      // Clear any stale cached unit payloads so 13-language curriculum updates take effect immediately
      await db.runAsync('DELETE FROM cached_units;');
    } catch (err) {
      resetCurriculumDatabaseHandle();
      throw err;
    }
  })();

  return initPromise;
}

export async function ensureCurriculumReady(): Promise<SQLiteDatabase> {
  await initCurriculumDatabase();
  return getDb();
}

export async function getUnitProgress(unitId: string): Promise<UserUnitProgress | null> {
  try {
    const db = await ensureCurriculumReady();
    const row = await db.getFirstAsync<{
      unit_id: string;
      level_id: string;
      status: string;
      score: number;
      stars: number;
      completed_at: number | null;
      unlocked_at: number;
    }>('SELECT * FROM curriculum_progress WHERE unit_id = ?', [unitId]);

    if (!row) return null;
    return {
      unitId: row.unit_id,
      levelId: row.level_id as LevelId,
      status: row.status as UnitStatus,
      score: row.score,
      stars: row.stars,
      completedAt: row.completed_at ?? undefined,
      unlockedAt: row.unlocked_at,
    };
  } catch {
    return null;
  }
}

export async function getAllProgressForLevel(levelId: LevelId): Promise<UserUnitProgress[]> {
  try {
    const db = await ensureCurriculumReady();
    const rows = await db.getAllAsync<{
      unit_id: string;
      level_id: string;
      status: string;
      score: number;
      stars: number;
      completed_at: number | null;
      unlocked_at: number;
    }>('SELECT * FROM curriculum_progress WHERE level_id = ?', [levelId]);

    return rows.map((r) => ({
      unitId: r.unit_id,
      levelId: r.level_id as LevelId,
      status: r.status as UnitStatus,
      score: r.score,
      stars: r.stars,
      completedAt: r.completed_at ?? undefined,
      unlockedAt: r.unlocked_at,
    }));
  } catch {
    return [];
  }
}

export async function getAllUserProgress(): Promise<UserUnitProgress[]> {
  try {
    const db = await ensureCurriculumReady();
    const rows = await db.getAllAsync<{
      unit_id: string;
      level_id: string;
      status: string;
      score: number;
      stars: number;
      completed_at: number | null;
      unlocked_at: number;
    }>('SELECT * FROM curriculum_progress');

    return rows.map((r) => ({
      unitId: r.unit_id,
      levelId: r.level_id as LevelId,
      status: r.status as UnitStatus,
      score: r.score,
      stars: r.stars,
      completedAt: r.completed_at ?? undefined,
      unlockedAt: r.unlocked_at,
    }));
  } catch {
    return [];
  }
}

export async function saveUnitProgress(progress: UserUnitProgress): Promise<void> {
  const db = await ensureCurriculumReady();
  await db.runAsync(
    `INSERT INTO curriculum_progress (unit_id, level_id, status, score, stars, completed_at, unlocked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(unit_id) DO UPDATE SET
       status = excluded.status,
       score = MAX(curriculum_progress.score, excluded.score),
       stars = MAX(curriculum_progress.stars, excluded.stars),
       completed_at = COALESCE(excluded.completed_at, curriculum_progress.completed_at);`,
    [
      progress.unitId,
      progress.levelId,
      progress.status,
      progress.score,
      progress.stars,
      progress.completedAt ?? null,
      progress.unlockedAt,
    ]
  );
}

export async function unlockUnit(unitId: string, levelId: LevelId): Promise<void> {
  const db = await ensureCurriculumReady();
  await db.runAsync(
    `INSERT INTO curriculum_progress (unit_id, level_id, status, score, stars, unlocked_at)
     VALUES (?, ?, 'unlocked', 0, 0, ?)
     ON CONFLICT(unit_id) DO UPDATE SET
       status = CASE WHEN status = 'completed' THEN 'completed' ELSE 'unlocked' END;`,
    [unitId, levelId, Date.now()]
  );
}

export async function isUnitUnlocked(unitId: string): Promise<boolean> {
  // First unit of A0 is always unlocked
  if (unitId === 'a0_unit_01') return true;

  try {
    const db = await ensureCurriculumReady();
    const row = await db.getFirstAsync<{ status: string }>(
      'SELECT status FROM curriculum_progress WHERE unit_id = ?',
      [unitId]
    );
    return row?.status === 'unlocked' || row?.status === 'completed';
  } catch {
    return false;
  }
}

export async function cacheUnitPayload(unit: CurriculumUnit): Promise<void> {
  const db = await ensureCurriculumReady();
  await db.runAsync(
    `INSERT INTO cached_units (unit_id, level_id, unit_order, payload, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(unit_id) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at;`,
    [unit.id, unit.level, unit.order, JSON.stringify(unit), Date.now()]
  );
}

export async function getCachedUnit(unitId: string): Promise<CurriculumUnit | null> {
  try {
    const db = await ensureCurriculumReady();
    const row = await db.getFirstAsync<{ payload: string }>(
      'SELECT payload FROM cached_units WHERE unit_id = ?',
      [unitId]
    );
    if (!row) return null;
    return JSON.parse(row.payload) as CurriculumUnit;
  } catch {
    return null;
  }
}
