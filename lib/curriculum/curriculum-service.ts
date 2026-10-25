import type {
  CurriculumLevelSummary,
  CurriculumUnit,
  LevelId,
  UserUnitProgress,
} from '@/types/curriculum';
import {
  cacheUnitPayload,
  getAllProgressForLevel,
  getCachedUnit,
  getUnitProgress,
  isUnitUnlocked,
} from './db';
import { validateUnitAccess, type UnitAccessCheckResult } from './security-guard';

const R2_CDN_URL =
  process.env.EXPO_PUBLIC_CDN_BASE_URL ||
  'https://pub-09392b74223c430486bb0bde1d6cddbb.r2.dev';

// Bundled starter units for instant zero-latency start
const BUNDLED_UNITS: Record<string, () => any> = {
  a1_unit_01: () => require('@/assets/data/curriculum/a1/unit_01.json'),
  a1_unit_02: () => require('@/assets/data/curriculum/a1/unit_02.json'),
  a1_unit_03: () => require('@/assets/data/curriculum/a1/unit_03.json'),
};

export const CEFR_LEVELS: CurriculumLevelSummary[] = [
  {
    id: 'A1',
    title: { az: 'A1: Başlanğıc Səviyyə', en: 'A1: Beginner', tr: 'A1: Başlangıç', ru: 'A1: Начальный' },
    description: {
      az: "Təməl qrammatika, 'To Be', gündəlik tanışlıq və baza cümlələr",
      en: "Basic grammar, 'To Be', introductions, and essential daily phrases",
      tr: "Temel gramer, 'To Be', günlük tanışma ve temel ifadeler",
      ru: "Базовая грамматика, глагол 'To Be', знакомство и простые фразы",
    },
    totalUnits: 15,
    completedUnits: 0,
    unlockedUnits: 1,
    accentColor: '#10B981', // Emerald green
  },
  {
    id: 'A2',
    title: { az: 'A2: Təməl Səviyyə', en: 'A2: Elementary', tr: 'A2: Temel', ru: 'A2: Базовый' },
    description: {
      az: "Keçmiş və gələcək zamanlar, səyahət, alış-veriş və sadə dialoqlar",
      en: "Past & future tenses, travel, shopping, and everyday dialogues",
      tr: "Geçmiş ve gelecek zaman, seyahat, alışveriş ve basit diyaloglar",
      ru: "Прошедшее и будущее время, путешествия, покупки и простые диалоги",
    },
    totalUnits: 18,
    completedUnits: 0,
    unlockedUnits: 0,
    accentColor: '#3B82F6', // Blue
  },
  {
    id: 'B1',
    title: { az: 'B1: Orta Səviyyə', en: 'B1: Intermediate', tr: 'B1: Orta Düzey', ru: 'B1: Средний' },
    description: {
      az: "İş müsahibəsi, feli frazalar (Phrasal Verbs) və mürəkkəb hekayələr",
      en: "Job interviews, phrasal verbs, idioms, and connected stories",
      tr: "İş mülakatları, phrasal verbs ve bağlantılı hikayeler",
      ru: "Собеседования, фразовые глаголы, идиомы и связные истории",
    },
    totalUnits: 20,
    completedUnits: 0,
    unlockedUnits: 0,
    accentColor: '#8B5CF6', // Purple
  },
  {
    id: 'B2',
    title: { az: 'B2: İrəli Səviyyə', en: 'B2: Upper-Intermediate', tr: 'B2: İleri Düzey', ru: 'B2: Продвинутый' },
    description: {
      az: "Fəlsəfi debatlar, orijinal məqalələr, peşəkar müzakirə və klassika",
      en: "Abstract debates, authentic articles, professional fluency, and classics",
      tr: "Soyut tartışmalar, özgün makaleler ve akıcı İngilizce",
      ru: "Дискуссии, оригинальные статьи и свободное общение",
    },
    totalUnits: 20,
    completedUnits: 0,
    unlockedUnits: 0,
    accentColor: '#F59E0B', // Amber
  },
];

/**
 * Loads a unit either from local cache, bundled assets, or fetches from Cloudflare R2
 */
export async function getUnitData(unitId: string, levelId: LevelId): Promise<CurriculumUnit | null> {
  // 1. Check local SQLite cache first (instant)
  const cached = await getCachedUnit(unitId);
  if (cached) return cached;

  // 2. Check bundled local assets
  if (BUNDLED_UNITS[unitId]) {
    try {
      const data = BUNDLED_UNITS[unitId]();
      await cacheUnitPayload(data);
      return data;
    } catch (err) {
      console.warn('[Curriculum] Error loading bundled unit:', err);
    }
  }

  // 3. Fallback: Fetch from Cloudflare R2 CDN on-demand
  try {
    const url = `${R2_CDN_URL}/curriculum/${levelId.toLowerCase()}/${unitId}.json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as CurriculumUnit;
      await cacheUnitPayload(data);
      return data;
    }
  } catch (err) {
    console.warn('[Curriculum] Failed to fetch unit from R2 CDN:', err);
  }

  return null;
}

export interface UnitDisplayItem {
  id: string;
  order: number;
  level: LevelId;
  title: string;
  description: string;
  iconName: string;
  estimatedMinutes: number;
  status: 'locked' | 'unlocked' | 'completed';
  stars: number;
  score: number;
}

/**
 * Lists all units for a given level with their live user progress states
 */
export async function listUnitsWithProgress(
  levelId: LevelId,
  uiLang: string = 'az'
): Promise<UnitDisplayItem[]> {
  const progressList = await getAllProgressForLevel(levelId);
  const progressMap = new Map<string, UserUnitProgress>();
  for (const p of progressList) {
    progressMap.set(p.unitId, p);
  }

  const items: UnitDisplayItem[] = [];

  // Known units for Level A1 (Expandable dynamically)
  const unitIds = levelId === 'A1' ? ['a1_unit_01', 'a1_unit_02', 'a1_unit_03'] : [];

  for (let i = 0; i < unitIds.length; i++) {
    const unitId = unitIds[i];
    const unit = await getUnitData(unitId, levelId);
    if (!unit) continue;

    const prog = progressMap.get(unitId);
    const isUnlocked = prog?.status === 'unlocked' || prog?.status === 'completed' || unit.order === 1;

    items.push({
      id: unit.id,
      order: unit.order,
      level: unit.level,
      title: unit.title[uiLang] || unit.title.en,
      description: unit.description[uiLang] || unit.description.en,
      iconName: unit.iconName,
      estimatedMinutes: unit.estimatedMinutes,
      status: prog?.status || (isUnlocked ? 'unlocked' : 'locked'),
      stars: prog?.stars || 0,
      score: prog?.score || 0,
    });
  }

  return items;
}

/**
 * Verifies access before entering a lesson
 */
export async function checkUnitAccessBeforeStart(
  unitId: string,
  levelId: LevelId,
  unitOrder: number,
  isPremium: boolean,
  isOnline: boolean = true
): Promise<UnitAccessCheckResult> {
  return validateUnitAccess(unitId, levelId, unitOrder, isPremium, isOnline);
}
