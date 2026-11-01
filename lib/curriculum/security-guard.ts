import { getUnitProgress, isUnitUnlocked, saveUnitProgress, unlockUnit } from './db';
import type { LevelId, UserUnitProgress } from '@/types/curriculum';
import { getHearts, MAX_HEARTS } from '@/lib/vocabulary/game-service';

export type AccessDenialReason =
  | 'PREREQUISITE_LOCKED'
  | 'OFFLINE_FREE_RESTRICTED'
  | 'OUT_OF_HEARTS'
  | 'OUT_OF_ENERGY';

export interface UnitAccessCheckResult {
  allowed: boolean;
  reason?: AccessDenialReason;
  message?: string;
  messageKey?: string;
}

/**
 * Robust anti-exploit verification for curriculum unit entry
 */
export async function validateUnitAccess(
  unitId: string,
  levelId: LevelId,
  unitOrder: number,
  isPremium: boolean,
  isOnline: boolean,
  isBundled: boolean = false
): Promise<UnitAccessCheckResult> {
  // 1. Starter unit (Unit 1 of A0) is always accessible to everyone
  if (unitId === 'a0_unit_01' || (unitOrder === 1 && levelId === 'A0')) {
    const hearts = isPremium ? MAX_HEARTS : await getHearts();
    if (!isPremium && hearts <= 0) {
      return {
        allowed: false,
        reason: 'OUT_OF_HEARTS',
        messageKey: 'out_of_hearts_msg',
      };
    }
    return { allowed: true };
  }

  // 2. Offline check for non-premium users
  // Free users must be online to fetch unbundled/uncached lessons
  if (!isPremium && !isOnline && !isBundled) {
    const currentProgress = await getUnitProgress(unitId);
    if (!currentProgress || currentProgress.status === 'locked') {
      return {
        allowed: false,
        reason: 'OFFLINE_FREE_RESTRICTED',
        messageKey: 'need_internet_msg',
      };
    }
  }

  // 3. Prerequisite lock check: Is this unit unlocked in local database?
  const unlocked = await isUnitUnlocked(unitId);
  if (!unlocked) {
    return {
      allowed: false,
      reason: 'PREREQUISITE_LOCKED',
      messageKey: 'lesson_locked_prev_unit',
    };
  }

  // 4. Hearts verification for Free users
  const hearts = isPremium ? MAX_HEARTS : await getHearts();
  if (!isPremium && hearts <= 0) {
    return {
      allowed: false,
      reason: 'OUT_OF_HEARTS',
      messageKey: 'out_of_hearts_msg',
    };
  }

  return { allowed: true };
}

/**
 * Evaluates lesson completion, awards stars, and unlocks the next unit automatically
 */
export async function handleLessonCompletion(
  unitId: string,
  levelId: LevelId,
  unitOrder: number,
  score: number, // 0 - 100
  nextUnitId?: string
): Promise<{
  passed: boolean;
  stars: number;
  nextUnlockedId?: string;
}> {
  const passed = score >= 70;
  let stars = 0;
  if (score >= 95) stars = 3;
  else if (score >= 80) stars = 2;
  else if (score >= 70) stars = 1;

  if (passed) {
    const progress: UserUnitProgress = {
      unitId,
      levelId,
      status: 'completed',
      score,
      stars,
      completedAt: Date.now(),
      unlockedAt: Date.now(),
    };
    await saveUnitProgress(progress);

    // Auto-unlock next unit in sequence
    let targetNextUnitId = nextUnitId;
    if (!targetNextUnitId) {
      targetNextUnitId = `${levelId.toLowerCase()}_unit_${String(unitOrder + 1).padStart(2, '0')}`;
    }
    if (targetNextUnitId) {
      // Derive target level from id prefix (e.g. 'a2_unit_01' -> 'A2')
      const targetLevel = (targetNextUnitId.split('_')[0].toUpperCase() as LevelId) || levelId;
      await unlockUnit(targetNextUnitId, targetLevel);
      return { passed: true, stars, nextUnlockedId: targetNextUnitId };
    }
    return { passed: true, stars };
  } else {
    // If failed, save attempt score but keep unlocked
    const current = await getUnitProgress(unitId);
    await saveUnitProgress({
      unitId,
      levelId,
      status: current?.status === 'completed' ? 'completed' : 'unlocked',
      score: Math.max(score, current?.score || 0),
      stars: Math.max(stars, current?.stars || 0),
      unlockedAt: current?.unlockedAt || Date.now(),
    });
    return { passed: false, stars: 0 };
  }
}
