import type {
  CurriculumLevelSummary,
  CurriculumUnit,
  LevelId,
  LocalizedString,
  UserUnitProgress,
} from '@/types/curriculum';
import {
  cacheUnitPayload,
  getAllProgressForLevel,
  getAllUserProgress,
  getCachedUnit,
  getUnitProgress,
  isUnitUnlocked,
} from './db';
import { validateUnitAccess, type UnitAccessCheckResult } from './security-guard';
import { getLocalizedContent } from './curriculum-i18n';

const R2_CDN_URL =
  process.env.EXPO_PUBLIC_CDN_BASE_URL ||
  'https://pub-09392b74223c430486bb0bde1d6cddbb.r2.dev';

// Bundled starter units for instant zero-latency start
const BUNDLED_UNITS: Record<string, () => any> = {
  a1_unit_01: () => require('@/assets/data/curriculum/a1/unit_01.json'),
  a1_unit_02: () => require('@/assets/data/curriculum/a1/unit_02.json'),
  a1_unit_03: () => require('@/assets/data/curriculum/a1/unit_03.json'),
};

export function isUnitBundled(unitId: string): boolean {
  return Boolean(BUNDLED_UNITS[unitId]);
}

export const CEFR_LEVELS: CurriculumLevelSummary[] = [
  {
    id: 'A1',
    title: { az: 'A1: Başlanğıc Səviyyə', en: 'A1: Beginner', tr: 'A1: Başlangıç Seviyesi', ru: 'A1: Начальный' },
    description: {
      az: "Təməl qrammatika, 'To Be', gündəlik tanışlıq və baza cümlələr",
      en: "Basic grammar, 'To Be', introductions, and essential daily phrases",
      tr: "Temel gramer, 'To Be', günlük tanışma ve temel ifadeler",
      ru: "Базовая грамматика, глагол 'To Be', знакомство и простые фразы",
    },
    totalUnits: 16,
    completedUnits: 0,
    unlockedUnits: 1,
    accentColor: '#10B981', // Emerald green
  },
  {
    id: 'A2',
    title: { az: 'A2: Təməl Səviyyə', en: 'A2: Elementary', tr: 'A2: Temel Seviye', ru: 'A2: Базовый' },
    description: {
      az: "Keçmiş və gələcək zamanlar, səyahət, alış-veriş və sadə dialoqlar",
      en: "Past & future tenses, travel, shopping, and everyday dialogues",
      tr: "Geçmiş ve gelecek zaman, seyahat, alışveriş ve temel diyaloglar",
      ru: "Прошедшее и будущее время, путешествия, покупки и простые диалоги",
    },
    totalUnits: 16,
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
      tr: "İş mülakatları, phrasal verbs, deyimler ve akıcı diyaloglar",
      ru: "Собеседования, фразовые глаголы, идиомы и связные истории",
    },
    totalUnits: 16,
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
      tr: "Soyut tartışmalar, özgün makaleler ve profesyonel akıcı İngilizce",
      ru: "Дискуссии, оригинальные статьи и свободное общение",
    },
    totalUnits: 16,
    completedUnits: 0,
    unlockedUnits: 0,
    accentColor: '#F59E0B', // Amber
  },
];

/**
 * Dynamically builds a rich, fully-functional starter unit if not found on CDN
 * to ensure offline resilience and prevent any error popups.
 */
function buildStarterUnitFallback(unitId: string, levelId: LevelId): CurriculumUnit | null {
  const syllabus = SYLLABUS_MAP[levelId] || [];
  const node = syllabus.find((n) => n.id === unitId);
  if (!node) return null;

  const titleAz = node.title.az || node.title.en;
  const titleTr = node.title.tr || titleAz;
  const shortTitle = node.shortTitle.tr || node.shortTitle.az || node.shortTitle.en;

  return {
    id: node.id,
    level: levelId,
    order: node.order,
    title: node.title,
    description: node.description,
    estimatedMinutes: node.estimatedMinutes,
    iconName: node.iconName,
    grammarRule: {
      id: `${node.id}_gr`,
      title: node.title,
      subtitle: node.description,
      explanation: {
        az: `${titleAz} üzrə əsas cümlə strukturları, praktik nümunələr və danışıq qaydaları.`,
        tr: `${titleTr} ile ilgili temel cümle kalıpları, pratik örnekler ve konuşma kuralları.`,
        en: `Core sentence structures, practical examples and conversational patterns for ${node.title.en}.`,
        ru: `Основные грамматические конструкции и практические примеры по теме ${node.title.ru || titleAz}.`,
      },
      formula: `${shortTitle} • Practical Daily English`,
      examples: [
        {
          english: `This is an essential expression in English.`,
          translation: {
            az: `Bu, ingilis dilində ən vacib ifadələrdən biridir.`,
            tr: `Bu, İngilizcede çok önemli ve yaygın bir ifadedir.`,
            en: `This is an essential expression in English.`,
            ru: `Это важное выражение на английском языке.`,
          },
        },
        {
          english: `Practice every single day to speak naturally.`,
          translation: {
            az: `Təbii danışmaq üçün hər gün məşq edin.`,
            tr: `Doğal konuşmak için her gün pratik yapın.`,
            en: `Practice every single day to speak naturally.`,
            ru: `Практикуйтесь каждый день, чтобы говорить естественно.`,
          },
        },
      ],
      commonMistake: {
        incorrect: `I am agree with you.`,
        correct: `I agree with you.`,
        explanation: {
          az: `'Agree' artıq feldir, 'am' ilə işlənməz. 'I agree' deyilir.`,
          tr: `'Agree' zaten bir fiildir, başına 'am' gelmez. 'I agree' denir.`,
          en: `'Agree' is already a verb, do not say 'am agree'.`,
        },
      },
    },
    vocabulary: [
      {
        id: 'v_f1',
        word: 'Learn',
        phonetic: '/lɜːn/',
        audioText: 'Learn',
        translations: { az: 'Öyrənmək', tr: 'Öğrenmek', en: 'Learn', ru: 'Учить' },
        exampleSentence: 'I learn English every day.',
        exampleTranslation: {
          az: 'Mən hər gün ingilis dili öyrənirəm.',
          tr: 'Her gün İngilizce öğreniyorum.',
          en: 'I learn English every day.',
        },
      },
      {
        id: 'v_f2',
        word: 'Speak',
        phonetic: '/spiːk/',
        audioText: 'Speak',
        translations: { az: 'Danışmaq', tr: 'Konuşmak', en: 'Speak', ru: 'Говорить' },
        exampleSentence: 'Can you speak English?',
        exampleTranslation: {
          az: 'İngiliscə danışa bilirsiniz?',
          tr: 'İngilizce konuşabiliyor musunuz?',
          en: 'Can you speak English?',
        },
      },
      {
        id: 'v_f3',
        word: 'Practice',
        phonetic: '/ˈpræktɪs/',
        audioText: 'Practice',
        translations: { az: 'Məşq / Təcrübə', tr: 'Pratik yapmak', en: 'Practice', ru: 'Практика' },
        exampleSentence: 'Practice makes perfect.',
        exampleTranslation: {
          az: 'Təcrübə mükəmməllik yaradır.',
          tr: 'Pratik mükemmelleştirir.',
          en: 'Practice makes perfect.',
        },
      },
      {
        id: 'v_f4',
        word: 'Understand',
        phonetic: '/ˌʌndəˈstænd/',
        audioText: 'Understand',
        translations: { az: 'Başa düşmək', tr: 'Anlamak', en: 'Understand', ru: 'Понимать' },
        exampleSentence: 'I understand this rule.',
        exampleTranslation: {
          az: 'Mən bu qaydanı başa düşürəm.',
          tr: 'Bu kuralı anlıyorum.',
          en: 'I understand this rule.',
        },
      },
      {
        id: 'v_f5',
        word: 'Important',
        phonetic: '/ɪmˈpɔːtnt/',
        audioText: 'Important',
        translations: { az: 'Vacib', tr: 'Önemli', en: 'Important', ru: 'Важный' },
        exampleSentence: 'This lesson is very important.',
        exampleTranslation: {
          az: 'Bu dərs çox vacibdir.',
          tr: 'Bu ders çok önemli.',
          en: 'This lesson is very important.',
        },
      },
      {
        id: 'v_f6',
        word: 'Fluently',
        phonetic: '/ˈfluːəntli/',
        audioText: 'Fluently',
        translations: { az: 'Sərbəst / Axıcı', tr: 'Akıcı bir şekilde', en: 'Fluently', ru: 'Бегло' },
        exampleSentence: 'She speaks English fluently.',
        exampleTranslation: {
          az: 'O, ingiliscə sərbəst danışır.',
          tr: 'O, akıcı bir şekilde İngilizce konuşuyor.',
          en: 'She speaks English fluently.',
        },
      },
      {
        id: 'v_f7',
        word: 'Success',
        phonetic: '/səkˈses/',
        audioText: 'Success',
        translations: { az: 'Uğur / Nailiyyət', tr: 'Başarı', en: 'Success', ru: 'Успех' },
        exampleSentence: 'You will achieve great success.',
        exampleTranslation: {
          az: 'Böyük uğur qazanacaqsınız.',
          tr: 'Büyük başarı elde edeceksiniz.',
          en: 'You will achieve great success.',
        },
      },
    ],
    story: {
      id: `${node.id}_story`,
      title: node.title.en || 'A Journey to Fluency',
      titleTranslation: node.title,
      cefr: levelId,
      wordCount: 110,
      content: `Every step you take on this learning path brings you closer to your goal. Practice speaking, listen carefully, and stay consistent. Success is built day by day!`,
      vocabularyHighlights: ['Learn', 'Speak', 'Practice', 'Success'],
    },
    exercises: [
      {
        id: `${node.id}_ex1`,
        type: 'multiple_choice',
        prompt: {
          az: 'Düzgün variantı seçin:',
          tr: 'Doğru seçeneği seçin:',
          en: 'Choose the correct option:',
          ru: 'Выберите правильный вариант:',
        },
        instruction: {
          az: 'I want to ___ English fluently.',
          tr: 'I want to ___ English fluently.',
          en: 'I want to ___ English fluently.',
        },
        options: [
          { id: 'o1', text: 'speak', isCorrect: true },
          { id: 'o2', text: 'speaks', isCorrect: false },
          { id: 'o3', text: 'speaking', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: `${node.id}_ex2`,
        type: 'fill_in_the_blank',
        prompt: {
          az: 'Boşluğa uyğun gələn variantı seçin:',
          tr: 'Boşluğa uygun seçeneği işaretleyin:',
          en: 'Fill in the blank with the correct form:',
          ru: 'Выберите правильную форму:',
        },
        instruction: {
          az: 'Practice ___ perfect.',
          tr: 'Practice ___ perfect.',
          en: 'Practice ___ perfect.',
        },
        options: [
          { id: 'fb1', text: 'makes', isCorrect: true },
          { id: 'fb2', text: 'make', isCorrect: false },
          { id: 'fb3', text: 'making', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: `${node.id}_ex3`,
        type: 'word_scramble',
        prompt: {
          az: 'Cümləni yığın: "I can speak English"',
          tr: 'Cümleyi kurun: "I can speak English"',
          en: 'Build sentence: "I can speak English"',
          ru: 'Соберите: "I can speak English"',
        },
        sentenceToBuild: ['I', 'can', 'speak', 'English'],
        distractorWords: ['is', 'you'],
        correctSentence: 'I can speak English',
        xpReward: 10,
      },
    ],
    bossQuiz: [
      {
        id: `${node.id}_bq1`,
        type: 'multiple_choice',
        prompt: {
          az: 'Cümləni tamamlayın:',
          tr: 'Cümleyi tamamlayın:',
          en: 'Complete the sentence:',
          ru: 'Заполните пропуск:',
        },
        instruction: {
          az: 'She ___ English very well.',
          tr: 'She ___ English very well.',
          en: 'She ___ English very well.',
        },
        options: [
          { id: 'bq_o1', text: 'speaks', isCorrect: true },
          { id: 'bq_o2', text: 'speak', isCorrect: false },
          { id: 'bq_o3', text: 'speaking', isCorrect: false },
        ],
        xpReward: 15,
      },
    ],
    xpReward: 50,
  };
}

/**
 * Loads a unit either from bundled assets, local SQLite cache, fetches from CDN,
 * or safely generates a starter fallback so it NEVER fails.
 */
export async function getUnitData(unitId: string, levelId: LevelId): Promise<CurriculumUnit | null> {
  // 1. Check bundled local assets first (always priority & synced with code updates)
  if (BUNDLED_UNITS[unitId]) {
    try {
      const data = BUNDLED_UNITS[unitId]();
      // Keep SQLite cache updated with the latest bundled payload
      await cacheUnitPayload(data).catch(() => {});
      return data;
    } catch (err) {
      console.warn('[Curriculum] Error loading bundled unit:', err);
    }
  }

  // 2. Check local SQLite cache for downloaded units
  const cached = await getCachedUnit(unitId);
  if (cached) return cached;

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

  // 4. Safe starter fallback to guarantee 100% crash/error resilience
  const fallback = buildStarterUnitFallback(unitId, levelId);
  if (fallback) {
    await cacheUnitPayload(fallback).catch(() => {});
    return fallback;
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
  nodeType?: 'lesson' | 'chest' | 'checkpoint';
  shortTitle?: string;
}

interface SyllabusNode {
  id: string;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  iconName: string;
  estimatedMinutes: number;
  nodeType?: 'lesson' | 'chest' | 'checkpoint';
  shortTitle: LocalizedString;
}

export const SYLLABUS_MAP: Record<LevelId, SyllabusNode[]> = {
  A1: [
    {
      id: 'a1_unit_01',
      order: 1,
      title: { az: 'İlk Tanışma və Salamlaşma', tr: 'İlk Tanışma ve Selamlaşma', en: 'Introductions & Greetings', ru: 'Знакомство и приветствие' },
      description: { az: "Mörfi metodologiyası ilə 'am / is / are' və tanışlıq", tr: "Murphy metodu ile 'am / is / are' ve tanışma", en: "Verb 'To Be', greetings, and introducing yourself", ru: "Глагол 'To Be' и знакомство" },
      iconName: 'smile',
      estimatedMinutes: 4,
      nodeType: 'lesson',
      shortTitle: { az: 'Tanışlıq', tr: 'Tanışma', en: 'Greetings', ru: 'Привет' },
    },
    {
      id: 'a1_unit_02',
      order: 2,
      title: { az: 'Kafedə Sifariş və Qiymətlər', tr: 'Kafede Sipariş ve Fiyatlar', en: 'Ordering at a Cafe', ru: 'Заказ в кафе и цены' },
      description: { az: "'Would like', 'How much' və nəzakətli sifarişlər", tr: "'Would like', 'How much' ve kibar sipariş kalıpları", en: "Polite ordering with 'would like' and asking prices", ru: "Вежливый заказ с 'would like'" },
      iconName: 'coffee',
      estimatedMinutes: 5,
      nodeType: 'lesson',
      shortTitle: { az: 'Kafedə', tr: 'Kafede', en: 'At Cafe', ru: 'В кафе' },
    },
    {
      id: 'a1_chest_01',
      order: 3,
      title: { az: 'Xəzinə Sandığı: +25 XP', tr: 'Hazine Sandığı: +25 XP', en: 'Bonus Chest: +25 XP', ru: 'Сундук бонуса: +25 XP' },
      description: { az: 'Səylərinizə görə əlavə XP və Can hədiyyəsi!', tr: 'Tebrikler, ekstra XP ve Can hediyesi!', en: 'Extra XP & Hearts reward for consistency!', ru: 'Награда опытом за старания!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Sandıq', tr: 'Sandık', en: 'Chest', ru: 'Сундук' },
    },
    {
      id: 'a1_unit_03',
      order: 4,
      title: { az: 'Gündəlik Rejim və Zaman', tr: 'Günlük Alışkanlıklar ve Zaman', en: 'Daily Routines & Time', ru: 'Распорядок дня и время' },
      description: { az: 'Present Simple zamanı və gündəlik vərdişlər', tr: 'Geniş Zaman ve günlük alışkanlıklar', en: 'Present Simple habits and daily routine', ru: 'Настоящее простое время и привычки' },
      iconName: 'sun',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Rejim', tr: 'Zaman', en: 'Routine', ru: 'Режим' },
    },
    {
      id: 'a1_unit_04',
      order: 5,
      title: { az: 'Ailə və Münasibətlər', tr: 'Aile ve İlişkiler', en: 'Family & Relations', ru: 'Семья и отношения' },
      description: { az: "Ailə üzvləri və 'have / has got' qəlibi", tr: "Aile üyeleri ve 'have/has got' kalıbı", en: "Family members and 'have / has got'", ru: "Члены семьи и оборот 'have/has got'" },
      iconName: 'users',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Ailə', tr: 'Aile', en: 'Family', ru: 'Семья' },
    },
    {
      id: 'a1_chest_02',
      order: 6,
      title: { az: 'Qızıl Sandıq: +50 XP', tr: 'Altın Sandık: +50 XP', en: 'Golden Chest: +50 XP', ru: 'Золотой сундук: +50 XP' },
      description: { az: 'Səviyyə ortası böyük nailiyyət mükafatı!', tr: 'Büyük aşama ödülü!', en: 'Mid-level major milestone reward!', ru: 'Награда за середину уровня!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Qızıl', tr: 'Altın', en: 'Gold', ru: 'Золото' },
    },
    {
      id: 'a1_unit_05',
      order: 7,
      title: { az: 'Şəhər və İstiqamətlər', tr: 'Şehir ve Yönler', en: 'City & Directions', ru: 'Город и направления' },
      description: { az: 'Yer önlükləri və harada yerləşdiyini soruşmaq', tr: 'Yer edatları ve yol tarifi sorma', en: 'Prepositions of place and asking directions', ru: 'Предлоги места и ориентирование' },
      iconName: 'map-pin',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Şəhər', tr: 'Şehir', en: 'City', ru: 'Город' },
    },
    {
      id: 'a1_unit_06',
      order: 8,
      title: { az: 'Geyim və Alış-veriş', tr: 'Kıyafetler ve Alışveriş', en: 'Clothes & Shopping', ru: 'Одежда и покупки' },
      description: { az: "Geyimlər, rənglər və 'this / that' demonstrativləri", tr: "Giysiler, renkler ve 'this/that'", en: "Clothes, colors, and demonstratives", ru: "Одежда, цвета и указательные слова" },
      iconName: 'shopping-bag',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Geyim', tr: 'Giyim', en: 'Shopping', ru: 'Одежда' },
    },
    {
      id: 'a1_unit_07',
      order: 9,
      title: { az: 'Hobbilər və Bacarıqlar', tr: 'Hobiler ve Yetenekler', en: 'Hobbies & Abilities', ru: 'Хобби и способности' },
      description: { az: "'Can / Can't' modalları və asudə vaxt", tr: "'Can/Can't' ve boş zaman aktiviteleri", en: "'Can / Can't' modal verbs and leisure", ru: "Модальный глагол 'Can/Can't'" },
      iconName: 'activity',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Bacarıq', tr: 'Yetenek', en: 'Hobbies', ru: 'Хобби' },
    },
    {
      id: 'a1_unit_08',
      order: 10,
      title: { az: 'Ev və Əşyalar', tr: 'Ev ve Eşyalar', en: 'Home & Rooms', ru: 'Дом и мебель' },
      description: { az: "'There is / There are' ilə məkan təsviri", tr: "'There is / There are' ile oda tasviri", en: "Describing rooms with 'there is / are'", ru: "Конструкция 'there is / are'" },
      iconName: 'home',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Ev', tr: 'Ev', en: 'Home', ru: 'Дом' },
    },
    {
      id: 'a1_chest_03',
      order: 11,
      title: { az: 'Gümüş Sandıq: +35 XP', tr: 'Gümüş Sandık: +35 XP', en: 'Silver Chest: +35 XP', ru: 'Серебряный сундук' },
      description: { az: 'Davamlı məşqlər üçün bonus hədiyyə!', tr: 'Düzenli pratik ödülü!', en: 'Consistency reward chest!', ru: 'Награда за регулярность!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Gümüş', tr: 'Gümüş', en: 'Silver', ru: 'Серебро' },
    },
    {
      id: 'a1_unit_09',
      order: 12,
      title: { az: 'Yemək və Ərzaqlar', tr: 'Yiyecekler ve Mutfak', en: 'Food & Groceries', ru: 'Еда и продукты' },
      description: { az: "Sayılabilən və sayılmayanlar: 'some / any'", tr: "Sayılan ve sayılamayan isimler: 'some / any'", en: "Countable & uncountable nouns with some/any", ru: "Исчисляемые и неисчисляемые с some/any" },
      iconName: 'tag',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Yemək', tr: 'Yemek', en: 'Food', ru: 'Еда' },
    },
    {
      id: 'a1_unit_10',
      order: 13,
      title: { az: 'İndi Baş Verənlər', tr: 'Şimdiki Zaman', en: 'Right Now: Continuous', ru: 'Настоящее длительное' },
      description: { az: "Hazırda edilən hərəkətlər: 'am/is/are + -ing'", tr: "Şu an yapılan eylemler: 'am/is/are + -ing'", en: "Present Continuous for actions happening now", ru: "Present Continuous: действия сейчас" },
      iconName: 'play-circle',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Davam', tr: 'Şimdi', en: 'Now', ru: 'Сейчас' },
    },
    {
      id: 'a1_unit_11',
      order: 14,
      title: { az: 'Hisslər və Əhval-ruhiyyə', tr: 'Duygular ve Ruh Hali', en: 'Feelings & Emotions', ru: 'Чувства и эмоции' },
      description: { az: 'Özünü necə hiss etdiyini ifadə etmək', tr: 'Nasıl hissettiğini ifade etme kalıpları', en: 'Expressing how you feel and mood', ru: 'Выражение эмоций и настроения' },
      iconName: 'heart',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Hisslər', tr: 'Duygu', en: 'Mood', ru: 'Эмоции' },
    },
    {
      id: 'a1_unit_12',
      order: 15,
      title: { az: 'Hava və Fəsillər', tr: 'Hava Durumu ve Mevsimler', en: 'Weather & Seasons', ru: 'Погода и времена года' },
      description: { az: 'Havanın necə olduğunu soruşmaq və təsvir etmək', tr: 'Hava durumunu sorma ve anlatma', en: 'Asking and describing the weather', ru: 'Погода и времена года' },
      iconName: 'cloud',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Hava', tr: 'Hava', en: 'Weather', ru: 'Погода' },
    },
    {
      id: 'a1_boss_01',
      order: 16,
      title: { az: 'A1 Səviyyə Sonu İmtahanı', tr: 'A1 Seviye Sonu Sınavı', en: 'A1 Checkpoint Exam', ru: 'Финальный тест A1' },
      description: { az: 'A1 səviyyəsini təsdiqləyən böyük sınaq və +100 XP!', tr: 'A1 Seviyesini tamamla ve +100 XP kazan!', en: 'Comprehensive test to master A1 Level and earn +100 XP!', ru: 'Финальный тест уровня A1 и +100 XP!' },
      iconName: 'award',
      estimatedMinutes: 10,
      nodeType: 'checkpoint',
      shortTitle: { az: 'A1 İmtahan', tr: 'A1 Sınav', en: 'A1 Exam', ru: 'A1 Экзамен' },
    },
  ],
  A2: [
    {
      id: 'a2_unit_01',
      order: 1,
      title: { az: 'Keçmiş Zaman: Was və Were', tr: 'Geçmiş Zaman: Was / Were', en: 'Past of To Be: Was & Were', ru: 'Прошедшее время: Was/Were' },
      description: { az: "Keçmişdə harada və necə olduğunu demək", tr: "Geçmişte nerede ve nasıl olduğunu anlatma", en: "Talking about past states and places", ru: "Прошедшие состояния и глагол to be" },
      iconName: 'calendar',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Was/Were', tr: 'Was/Were', en: 'Was/Were', ru: 'Was/Were' },
    },
    {
      id: 'a2_unit_02',
      order: 2,
      title: { az: 'Keçmiş Hadisələr: Past Simple', tr: 'Geçmiş Olaylar: Past Simple', en: 'Past Actions & Stories', ru: 'Прошедшее простое: Past Simple' },
      description: { az: "Qaydalı fellər və keçmiş hadisələri danışmaq", tr: "Düzenli fiiller (-ed) ve geçmiş olaylar", en: "Regular verbs and recounting past events", ru: "Правильные глаголы (-ed)" },
      iconName: 'clock',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Keçmiş', tr: 'Geçmiş', en: 'Past', ru: 'Прошлое' },
    },
    {
      id: 'a2_chest_01',
      order: 3,
      title: { az: 'Gəzgin Sandığı: +30 XP', tr: 'Gezgin Sandığı: +30 XP', en: 'Traveler Chest: +30 XP', ru: 'Сундук путешественника' },
      description: { az: 'Səyahət və keçmiş zaman dərsləri üçün bonus mükafat', tr: 'Seyahat ve geçmiş zaman ünitesi için ödül', en: 'Bonus reward for past & travel units', ru: 'Бонусная награда за раздел путешествий' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Sandıq', tr: 'Sandık', en: 'Chest', ru: 'Сундук' },
    },
    {
      id: 'a2_unit_03',
      order: 4,
      title: { az: 'Əsas Qaydasız Fellər', tr: 'En Önemli Düzensiz Fiiller', en: 'Top Irregular Verbs', ru: 'Неправильные глаголы' },
      description: { az: "Went, saw, had, bought: Ən vacib 30 qaydasız fel", tr: "Went, saw, bought: En sık kullanılan düzensiz fiiller", en: "Went, saw, had, bought: Top 30 essential irregulars", ru: "Went, saw, bought: частые глаголы" },
      iconName: 'zap',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Qaydasız', tr: 'Düzensiz', en: 'Irregulars', ru: 'Глаголы' },
    },
    {
      id: 'a2_unit_04',
      order: 5,
      title: { az: 'Gələcək Planlar: Going to', tr: 'Gelecek Planları: Going to', en: 'Future Plans: Going to', ru: 'Планы на будущее: Going to' },
      description: { az: 'Qabaqcadan planlaşdırılmış gələcək niyyətlər', tr: 'Önceden planlanmış gelecek eylemler', en: 'Pre-planned intentions and decisions', ru: 'Планы и намерения на будущее' },
      iconName: 'flag',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Going to', tr: 'Going to', en: 'Going to', ru: 'Going to' },
    },
    {
      id: 'a2_chest_02',
      order: 6,
      title: { az: 'Qızıl Sandıq: +50 XP', tr: 'Altın Sandık: +50 XP', en: 'Golden Chest: +50 XP', ru: 'Золотой сундук' },
      description: { az: 'A2 səviyyəsinin ortasına çatmaq mükafatı!', tr: 'A2 seviyesinin yarısını tamamlama ödülü!', en: 'Reward for reaching mid-A2!', ru: 'Награда за экватор уровня A2!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Qızıl', tr: 'Altın', en: 'Gold', ru: 'Золото' },
    },
    {
      id: 'a2_unit_05',
      order: 7,
      title: { az: 'Qərar və Proqnoz: Will', tr: 'Anlık Kararlar: Will', en: 'Decisions & Predictions: Will', ru: 'Решения и прогнозы: Will' },
      description: { az: "Həmin an verilən qərarlar və 'I will help you'", tr: "Konuşma anında verilen kararlar ve 'will'", en: "Spontaneous decisions and predictions with 'will'", ru: "Спонтанные решения и будущее с will" },
      iconName: 'arrow-right-circle',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Will', tr: 'Will', en: 'Will', ru: 'Will' },
    },
    {
      id: 'a2_unit_06',
      order: 8,
      title: { az: 'Səyahət və Hava Limanı', tr: 'Seyahat ve Havalimanı', en: 'Travel & Airport', ru: 'Путешествие и аэропорт' },
      description: { az: 'Qeydiyyat, baqaj və təyyarəyə minik ifadələri', tr: 'Check-in, bagaj ve uçağa biniş kalıpları', en: 'Airport check-in, baggage, and boarding phrases', ru: 'Регистрация, багаж и посадка' },
      iconName: 'send',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Havalimanı', tr: 'Havalimanı', en: 'Airport', ru: 'Аэропорт' },
    },
    {
      id: 'a2_unit_07',
      order: 9,
      title: { az: 'Otel və Yerləşmə', tr: 'Otel ve Konaklama', en: 'Hotel & Accommodation', ru: 'Отель и проживание' },
      description: { az: 'Otaq bronu, açar tələb etmək və xidmətlər', tr: 'Oda rezervasyonu, giriş ve otel hizmetleri', en: 'Booking rooms, checking in, and room service', ru: 'Бронирование, заселение в отель' },
      iconName: 'key',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Otel', tr: 'Otel', en: 'Hotel', ru: 'Отель' },
    },
    {
      id: 'a2_unit_08',
      order: 10,
      title: { az: 'Müqayisələr: Daha yaxşı', tr: 'Kıyaslamalar: Daha iyi', en: 'Comparatives: Better, Faster', ru: 'Сравнительная степень' },
      description: { az: "Sifətlərin müqayisəsi: '-er' və 'more ... than'", tr: "Sıfatlarda kıyaslama: '-er' ve 'more ... than'", en: "Comparing things with '-er' and 'more'", ru: "Сравнение: '-er' и 'more than'" },
      iconName: 'bar-chart',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Müqayisə', tr: 'Kıyas', en: 'Compare', ru: 'Сравнение' },
    },
    {
      id: 'a2_chest_03',
      order: 11,
      title: { az: 'Ulduz Sandığı: +40 XP', tr: 'Yıldız Sandığı: +40 XP', en: 'Star Chest: +40 XP', ru: 'Звездный сундук' },
      description: { az: 'Sərbəst danışıq istiqamətində addım mükafatı!', tr: 'Akıcı konuşma yolunda ekstra ödül!', en: 'Fluency step reward chest!', ru: 'Награда на пути к беглости!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Ulduz', tr: 'Yıldız', en: 'Star', ru: 'Звезда' },
    },
    {
      id: 'a2_unit_09',
      order: 12,
      title: { az: 'Ən Yaxşı: Üstünlük Dərəcəsi', tr: 'En İyisi: Süperlatif Derece', en: 'Superlatives: The Best', ru: 'Превосходная степень' },
      description: { az: "Ən böyük, ən yaxşı: 'the -est' və 'the most'", tr: "En büyük, en güzel: 'the -est' ve 'the most'", en: "Superlative adjectives: the best, the most", ru: "Превосходная степень: the best, most" },
      iconName: 'trending-up',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Ən Yaxşı', tr: 'En İyisi', en: 'Best', ru: 'Лучший' },
    },
    {
      id: 'a2_unit_10',
      order: 13,
      title: { az: 'Həkimdə və Sağlamlıq', tr: 'Doktorda ve Sağlık', en: 'Health & At the Doctor', ru: 'Здоровье и у врача' },
      description: { az: "Simptomlar, şikayət və məsləhət: 'should'", tr: "Hastalıklar, şikayetler ve tavsiye: 'should'", en: "Symptoms and advice with 'should / shouldn't'", ru: "Симптомы и советы с 'should'" },
      iconName: 'shield',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Sağlamlıq', tr: 'Sağlık', en: 'Health', ru: 'Здоровье' },
    },
    {
      id: 'a2_unit_11',
      order: 14,
      title: { az: 'Qaydalar: Must və Have to', tr: 'Zorunluluk: Must / Have to', en: 'Rules & Obligation: Must', ru: 'Обязанности: Must / Have to' },
      description: { az: 'Vacib öhdəliklər və qadağalar', tr: 'Zorunluluklar ve yasaklar', en: 'Obligations and prohibitions with must/have to', ru: 'Обязанности и запреты' },
      iconName: 'alert-circle',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Must', tr: 'Must', en: 'Must', ru: 'Must' },
    },
    {
      id: 'a2_unit_12',
      order: 15,
      title: { az: 'Təkliflər və Dəvətlər', tr: 'Öneriler ve Davetler', en: 'Suggestions & Invites', ru: 'Предложения и приглашения' },
      description: { az: "'Shall we?', 'Why don't we?' ilə plan qurmaq", tr: "'Shall we?', 'Why don't we?' ile teklif yapma", en: "Making plans with 'Shall we?' and 'Let's'", ru: "Планы и фразы 'Shall we?'" },
      iconName: 'message-circle',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Təklif', tr: 'Teklif', en: 'Offers', ru: 'Планы' },
    },
    {
      id: 'a2_boss_01',
      order: 16,
      title: { az: 'A2 Təməl Qələbə İmtahanı', tr: 'A2 Seviye Sonu Sınavı', en: 'A2 Mastery Checkpoint', ru: 'Финальный тест A2' },
      description: { az: 'A2 səviyyəsini fəth edin və sertifikat nişanı qazanın!', tr: 'A2 seviyesini tamamlayın ve sertifika rozeti kazanın!', en: 'Conquer A2 level and earn your badge!', ru: 'Покорите уровень A2 и получите бейдж!' },
      iconName: 'award',
      estimatedMinutes: 10,
      nodeType: 'checkpoint',
      shortTitle: { az: 'A2 İmtahan', tr: 'A2 Sınav', en: 'A2 Exam', ru: 'A2 Экзамен' },
    },
  ],
  B1: [
    {
      id: 'b1_unit_01',
      order: 1,
      title: { az: 'Təcrübələr: Present Perfect', tr: 'Deneyimler: Present Perfect', en: 'Life Experiences: Have you ever?', ru: 'Жизненный опыт: Present Perfect' },
      description: { az: "'Have you ever been to...?' ilə həyat təcrübələri", tr: "'Have you ever...?' ile tecrübeleri paylaşma", en: "Talking about experiences with Present Perfect", ru: "Опыт с Present Perfect: Have you ever?" },
      iconName: 'compass',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Perfect', tr: 'Perfect', en: 'Perfect', ru: 'Perfect' },
    },
    {
      id: 'b1_unit_02',
      order: 2,
      title: { az: 'Just, Already və Yet', tr: 'Zaman Zarfları: Just, Yet', en: 'Just, Already, and Yet', ru: 'Just, Already, Yet' },
      description: { az: 'Yenicə tamamlanmış və gözlənilən hadisələr', tr: 'Henüz olmuş ve beklenen olaylar', en: "Perfect tense markers: just, already, yet", ru: "Маркеры времени: just, already, yet" },
      iconName: 'check-square',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Already/Yet', tr: 'Already/Yet', en: 'Already/Yet', ru: 'Already/Yet' },
    },
    {
      id: 'b1_chest_01',
      order: 3,
      title: { az: 'Orta Səviyyə Sandığı: +40 XP', tr: 'Orta Seviye Sandığı: +40 XP', en: 'Intermediate Chest: +40 XP', ru: 'Сундук среднего уровня' },
      description: { az: 'B1 qrammatika nailiyyətləriniz üçün mükafat', tr: 'B1 gramer başarınız için ekstra ödül', en: 'Reward for mastering B1 basics', ru: 'Награда за освоение уровня B1' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Sandıq', tr: 'Sandık', en: 'Chest', ru: 'Сундук' },
    },
    {
      id: 'b1_unit_03',
      order: 4,
      title: { az: 'For və Since ilə Müddət', tr: 'Süreç: For ve Since', en: 'Duration: For and Since', ru: 'Продолжительность: For и Since' },
      description: { az: 'Nə qədər vaxtdır davam edən vəziyyətlər', tr: 'Ne zamandır devam eden durumları anlatma', en: "Expressing duration with 'for' and 'since'", ru: "Указание длительности: for и since" },
      iconName: 'clock',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'For/Since', tr: 'For/Since', en: 'For/Since', ru: 'For/Since' },
    },
    {
      id: 'b1_unit_04',
      order: 5,
      title: { az: 'Feli Frazalar: Hərəkət', tr: 'Phrasal Verbs: Günlük Hayat', en: 'Phrasal Verbs in Action', ru: 'Фразовые глаголы: Движение' },
      description: { az: 'Turn on, give up, look for, pick up', tr: 'Turn on, give up, look for gibi temel deyimler', en: 'Essential phrasal verbs: turn on, give up, look for', ru: 'Turn on, give up, look for' },
      iconName: 'layers',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Frazalar 1', tr: 'Phrasals 1', en: 'Phrasals 1', ru: 'Глаголы 1' },
    },
    {
      id: 'b1_chest_02',
      order: 6,
      title: { az: 'Qızıl Sandıq: +60 XP', tr: 'Altın Sandık: +60 XP', en: 'Golden Chest: +60 XP', ru: 'Золотой сундук' },
      description: { az: 'B1 səviyyəsinin ortasına çatmaq mükafatı!', tr: 'B1 aşama ödülü!', en: 'Reward for mid-B1 progress!', ru: 'Награда за экватор B1!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Qızıl', tr: 'Altın', en: 'Gold', ru: 'Золото' },
    },
    {
      id: 'b1_unit_05',
      order: 7,
      title: { az: 'Real Şərtlər: First Conditional', tr: 'Gerçek Şartlar: First Conditional', en: 'Real Conditions: Type 1', ru: 'Реальные условия: Тип 1' },
      description: { az: "'If it rains, we will stay at home'", tr: "'If it rains, we will...' kalıbı", en: "First Conditional: If + present, will + verb", ru: "Первый тип условных предложений" },
      iconName: 'git-branch',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Şərt 1', tr: 'Şart 1', en: 'Cond 1', ru: 'Условие 1' },
    },
    {
      id: 'b1_unit_06',
      order: 8,
      title: { az: 'Xəyali Hallar: Second Conditional', tr: 'Hayali Durumlar: Second Conditional', en: 'Hypothetical: Type 2', ru: 'Нереальные условия: Тип 2' },
      description: { az: "'If I won the lottery, I would travel'", tr: "'If I had money, I would...' hayali durumlar", en: "Second Conditional: If + past, would + verb", ru: "Второй тип: If I were you" },
      iconName: 'cloud-lightning',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Şərt 2', tr: 'Şart 2', en: 'Cond 2', ru: 'Условие 2' },
    },
    {
      id: 'b1_unit_07',
      order: 9,
      title: { az: 'Məchul Növ: Passive Voice', tr: 'Edilgen Çatı: Passive Voice', en: 'Passive Voice: Is made / Was done', ru: 'Пассивный залог' },
      description: { az: 'Hərəkəti edən yox, hərəkətin özü vacib olanda', tr: 'Eylemi yapan değil eylem önemli olduğunda', en: "Using passive voice in daily contexts", ru: "Пассивный залог в повседневной речи" },
      iconName: 'cpu',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Passive', tr: 'Edilgen', en: 'Passive', ru: 'Пассив' },
    },
    {
      id: 'b1_unit_08',
      order: 10,
      title: { az: 'İş Müsahibəsi və Karyera', tr: 'İş Mülakatı ve Kariyer', en: 'Job Interviews & Career', ru: 'Собеседование и карьера' },
      description: { az: 'Təcrübə, güclü tərəflər və peşəkar danışıq', tr: 'Güçlü yönler, deneyim ve mülakat kalıpları', en: 'Discussing strengths, experience, and career goals', ru: 'Опыт работы, сильные стороны' },
      iconName: 'briefcase',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Karyera', tr: 'Kariyer', en: 'Career', ru: 'Карьера' },
    },
    {
      id: 'b1_chest_03',
      order: 11,
      title: { az: 'Karyera Sandığı: +50 XP', tr: 'Kariyer Sandığı: +50 XP', en: 'Career Chest: +50 XP', ru: 'Карьерный сундук' },
      description: { az: 'Peşəkar ingilis dili nailiyyəti mükafatı!', tr: 'Profesyonel İngilizce adımı ödülü!', en: 'Reward for career English mastery!', ru: 'Награда за деловой английский!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Karyera', tr: 'Kariyer', en: 'Career', ru: 'Карьера' },
    },
    {
      id: 'b1_unit_09',
      order: 12,
      title: { az: 'Feli Frazalar: Ünsiyyət', tr: 'Phrasal Verbs: İletişim', en: 'Phrasals: Communication', ru: 'Фразовые глаголы: Общение' },
      description: { az: 'Get along, run out of, call off, figure out', tr: 'Get along, call off gibi ileri düzey deyimler', en: 'Get along with, run out of, call off', ru: 'Get along, run out of, call off' },
      iconName: 'layers',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Frazalar 2', tr: 'Phrasals 2', en: 'Phrasals 2', ru: 'Глаголы 2' },
    },
    {
      id: 'b1_unit_10',
      order: 13,
      title: { az: 'Fikir Bildirmək və Müzakirə', tr: 'Fikir Beyanı ve Tartışma', en: 'Expressing Opinions', ru: 'Выражение мнений' },
      description: { az: "'In my opinion', 'I strongly believe that...'", tr: "'Bana göre', 'Kesinlikle katılıyorum' kalıpları", en: "Agreeing, disagreeing, and polite debate", ru: "Согласие, несогласие, вежливый спор" },
      iconName: 'message-square',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Müzakirə', tr: 'Fikir', en: 'Opinions', ru: 'Мнение' },
    },
    {
      id: 'b1_unit_11',
      order: 14,
      title: { az: 'Dolayı Nitq: Reported Speech', tr: 'Dolaylı Anlatım: Reported Speech', en: 'Reported Speech', ru: 'Косвенная речь' },
      description: { az: "'She said that she was happy'", tr: "'O mutlu olduğunu söyledi' aktarma cümleleri", en: "Reporting what someone else said", ru: "Передача чужой речи" },
      iconName: 'corner-down-right',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Dolayı Nitq', tr: 'Aktarma', en: 'Reported', ru: 'Косвенная' },
    },
    {
      id: 'b1_unit_12',
      order: 15,
      title: { az: 'Nisbi Əvəzliklər: Who, Which', tr: 'İlgi Zamirleri: Who, Which, That', en: 'Relative Clauses: Who, Which', ru: 'Относительные придаточные' },
      description: { az: 'Cümlələri bir-birinə bağlamaq və zənginləşdirmək', tr: 'Cümleleri bağlama ve zenginleştirme', en: "Connecting sentences with who, which, that", ru: "Связка предложений с who, which, that" },
      iconName: 'link',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Bağlayıcı', tr: 'İlgi', en: 'Clauses', ru: 'Связки' },
    },
    {
      id: 'b1_boss_01',
      order: 16,
      title: { az: 'B1 Orta Səviyyə Sınağı', tr: 'B1 Seviye Sonu Sınavı', en: 'B1 Intermediate Exam', ru: 'Финальный тест B1' },
      description: { az: 'B1 səviyyəsini fəth edin və sərbəst danışığa keçin!', tr: 'B1 seviyesini tamamlayın ve akıcı İngilizceye adım atın!', en: 'Conquer Intermediate B1 level and step into fluency!', ru: 'Покорите уровень B1!' },
      iconName: 'award',
      estimatedMinutes: 10,
      nodeType: 'checkpoint',
      shortTitle: { az: 'B1 İmtahan', tr: 'B1 Sınav', en: 'B1 Exam', ru: 'B1 Экзамен' },
    },
  ],
  B2: [
    {
      id: 'b2_unit_01',
      order: 1,
      title: { az: 'Mürəkkəb Keçmiş: Past Perfect', tr: 'Geçmişin Geçmişi: Past Perfect', en: 'Past Perfect: Had done', ru: 'Прошедшее совершенное: Past Perfect' },
      description: { az: "Keçmişdəki iki hadisənin ardıcıllığı ('had + V3')", tr: "Geçmişte daha önce olmuş olaylar ('had + V3')", en: "Sequencing past events with Past Perfect", ru: "Предпрошедшее время: had + V3" },
      iconName: 'skip-back',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Past Perfect', tr: 'Past Perfect', en: 'Past Perfect', ru: 'Past Perfect' },
    },
    {
      id: 'b2_unit_02',
      order: 2,
      title: { az: 'Peşmanlıq və Şərt: Third Conditional', tr: 'Pişmanlık ve İhtimal: Şart Tip 3', en: 'Regrets: Third Conditional', ru: 'Сожаления: Третий тип условия' },
      description: { az: "'If I had studied harder, I would have passed'", tr: "'Keşke... yapsaydım olurdu' geçmiş pişmanlıklar", en: "Third Conditional for past regrets and missed chances", ru: "Сожаления о прошлом: If I had known" },
      iconName: 'refresh-ccw',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Şərt 3', tr: 'Şart 3', en: 'Cond 3', ru: 'Условие 3' },
    },
    {
      id: 'b2_chest_01',
      order: 3,
      title: { az: 'Professional Sandıq: +50 XP', tr: 'Profesyonel Sandık: +50 XP', en: 'Mastery Chest: +50 XP', ru: 'Сундук мастерства' },
      description: { az: 'İrəli səviyyə cəsarətiniz üçün mükafat', tr: 'İleri düzey İngilizce adımı ödülü', en: 'Reward for mastering complex B2 grammar', ru: 'Награда за сложную грамматику B2' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Sandıq', tr: 'Sandık', en: 'Chest', ru: 'Сундук' },
    },
    {
      id: 'b2_unit_03',
      order: 4,
      title: { az: 'Ehtimal Modalları: Must Have Been', tr: 'Geçmiş Çıkarımlar: Must Have Been', en: 'Modals of Deduction: Past', ru: 'Модальные глаголы дедукции' },
      description: { az: "'She must have forgotten', 'He can't have done it'", tr: "'Unutmuş olmalı', 'Yapmış olamaz' tahminleri", en: "Deductions about past: must have, could have, can't have", ru: "Выводы о прошлом: must have been" },
      iconName: 'help-circle',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Must Have', tr: 'Must Have', en: 'Must Have', ru: 'Must Have' },
    },
    {
      id: 'b2_unit_04',
      order: 5,
      title: { az: 'İrəli Səviyyə İdiomlar', tr: 'İleri Düzey Deyimler', en: 'Advanced Native Idioms', ru: 'Продвинутые идиомы' },
      description: { az: 'Bite the bullet, hit the nail on the head, see eye to eye', tr: 'Ana dili İngilizce olanların sık kullandığı deyimler', en: 'Authentic idioms for natural fluency', ru: 'Натуральные разговорные идиомы' },
      iconName: 'feather',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'İdiomlar', tr: 'Deyimler', en: 'Idioms', ru: 'Идиомы' },
    },
    {
      id: 'b2_chest_02',
      order: 6,
      title: { az: 'Qızıl Sandıq: +75 XP', tr: 'Altın Sandık: +75 XP', en: 'Golden Chest: +75 XP', ru: 'Золотой сундук' },
      description: { az: 'B2 səviyyəsinin ortasına çatmaq mükafatı!', tr: 'B2 yarısını tamamlama ödülü!', en: 'Reward for mid-B2 mastery!', ru: 'Награда за экватор B2!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Qızıl', tr: 'Altın', en: 'Gold', ru: 'Золото' },
    },
    {
      id: 'b2_unit_05',
      order: 7,
      title: { az: 'Rəsmi və Akademik Yazı', tr: 'Resmi ve Akademik Yazışma', en: 'Formal & Academic Writing', ru: 'Деловое и академическое письмо' },
      description: { az: 'Rəsmi məktublar, təkliflər və akademik lüğət', tr: 'Resmi e-postalar, raporlar ve akademik kelimeler', en: 'Professional emails, formal requests, and essays', ru: 'Официальные письма и эссе' },
      iconName: 'file-text',
      estimatedMinutes: 9,
      nodeType: 'lesson',
      shortTitle: { az: 'Rəsmi Yazı', tr: 'Resmi', en: 'Writing', ru: 'Письмо' },
    },
    {
      id: 'b2_unit_06',
      order: 8,
      title: { az: 'Müasir Cəmiyyət və Texnologiya', tr: 'Toplum ve Teknoloji', en: 'Society & Technology', ru: 'Общество и технологии' },
      description: { az: 'Süni intellekt, etik debatlar və qlobal gələcək', tr: 'Yapay zeka, etik ve teknolojik gelişmeler', en: 'AI, science, ethics, and philosophical debates', ru: 'ИИ, наука и этика' },
      iconName: 'cpu',
      estimatedMinutes: 9,
      nodeType: 'lesson',
      shortTitle: { az: 'Texnologiya', tr: 'Teknoloji', en: 'Tech', ru: 'Технологии' },
    },
    {
      id: 'b2_unit_07',
      order: 9,
      title: { az: 'İnversiya və Emosional Vurğu', tr: 'Devrik Cümleler: İnversiyon', en: 'Inversion & Emphasis', ru: 'Инверсия и акценты' },
      description: { az: "'Not only did she pass, but also...', 'Never have I seen'", tr: "'Not only... but also', 'Rarely do we see' kalıpları", en: "Inverted sentences for strong literary impact", ru: "Инверсия для эмоционального выделения" },
      iconName: 'sliders',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'İnversiya', tr: 'Devrik', en: 'Inversion', ru: 'Инверсия' },
    },
    {
      id: 'b2_unit_08',
      order: 10,
      title: { az: 'Mürəkkəb Məchul Növ', tr: 'İleri Edilgen Cümleler', en: 'Advanced Passives', ru: 'Сложный пассив' },
      description: { az: "'It is said that...', 'He is believed to have left'", tr: "'Söylendiğine göre...', 'Böyle olduğu düşünülüyor'", en: "Reporting passives: It is believed that...", ru: "Пассивные конструкции с инфинитивом" },
      iconName: 'globe',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'İrəli Passive', tr: 'İleri Edilgen', en: 'Adv Passive', ru: 'Пассив 2' },
    },
    {
      id: 'b2_chest_03',
      order: 11,
      title: { az: 'Axıcılıq Sandığı: +60 XP', tr: 'Akıcılık Sandığı: +60 XP', en: 'Fluency Chest: +60 XP', ru: 'Сундук беглости' },
      description: { az: 'C1 səviyyəsinin astanasında böyük mükafat!', tr: 'C1 seviyesinin eşiğinde büyük ödül!', en: 'Reward on the verge of C1 fluency!', ru: 'Награда на пороге C1!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Axıcılıq', tr: 'Akıcılık', en: 'Fluency', ru: 'Беглость' },
    },
    {
      id: 'b2_unit_09',
      order: 12,
      title: { az: 'Qlobal Məsələlər və İqlim', tr: 'Küresel Sorunlar ve Çevre', en: 'Global Issues & Climate', ru: 'Глобальные проблемы' },
      description: { az: 'İqtisadiyyat, ekologiya və beynəlxalq müzakirələr', tr: 'Ekonomi, çevre ve uluslararası konular', en: 'Debating climate change, economy, and global solutions', ru: 'Климат, экономика и дискуссии' },
      iconName: 'sun',
      estimatedMinutes: 9,
      nodeType: 'lesson',
      shortTitle: { az: 'İqlim', tr: 'Çevre', en: 'Climate', ru: 'Климат' },
    },
    {
      id: 'b2_unit_10',
      order: 13,
      title: { az: 'İrəli Feli Frazalar 3', tr: 'İleri Phrasal Verbs 3', en: 'Advanced Phrasals 3', ru: 'Продвинутые фразовые глаголы' },
      description: { az: 'Bring about, stand out, come across, rule out', tr: 'Bring about, stand out, rule out gibi ileri kalıplar', en: 'Native idiomatic phrasals in sophisticated contexts', ru: 'Bring about, stand out, rule out' },
      iconName: 'layers',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Frazalar 3', tr: 'Phrasals 3', en: 'Phrasals 3', ru: 'Глаголы 3' },
    },
    {
      id: 'b2_unit_11',
      order: 14,
      title: { az: 'Danışıqlar və İnandırma', tr: 'Müzakere ve İkna Etme', en: 'Negotiation & Persuasion', ru: 'Переговоры и убеждение' },
      description: { az: 'Biznes sazişləri, kompromis və təklif irəli sürmək', tr: 'İş anlaşmaları, uzlaşma ve ikna teknikleri', en: 'Diplomatic language, compromise, and counter-offers', ru: 'Дипломатический язык и компромиссы' },
      iconName: 'check-circle',
      estimatedMinutes: 9,
      nodeType: 'lesson',
      shortTitle: { az: 'Danışıqlar', tr: 'Müzakere', en: 'Negotiate', ru: 'Переговоры' },
    },
    {
      id: 'b2_unit_12',
      order: 15,
      title: { az: 'Ədəbiyyat və Fəlsəfə', tr: 'Edebiyat ve Felsefe', en: 'Literature & Nuances', ru: 'Литература и нюансы' },
      description: { az: 'Məcazi mənalar, dərin təhlil və zəngin leksika', tr: 'Mecazi anlamlar, derin analiz ve edebi dil', en: 'Nuanced literature analysis, metaphors, and style', ru: 'Метафоры, анализ и стиль' },
      iconName: 'book',
      estimatedMinutes: 9,
      nodeType: 'lesson',
      shortTitle: { az: 'Ədəbiyyat', tr: 'Edebiyat', en: 'Literature', ru: 'Литература' },
    },
    {
      id: 'b2_boss_01',
      order: 16,
      title: { az: 'B2 Peşəkar İngilis Dili Sınağı', tr: 'B2 Ustalık Seviye Sonu Sınavı', en: 'B2 Fluency Mastery Exam', ru: 'Финальный экзамен B2' },
      description: { az: 'Yüksək səviyyəli sərbəst danışıq və yekun imtahan!', tr: 'İleri düzey akıcı İngilizceyi tamamlayın!', en: 'Upper-intermediate master exam: achieve native-like fluency!', ru: 'Финальный экзамен на свободное владение!' },
      iconName: 'award',
      estimatedMinutes: 12,
      nodeType: 'checkpoint',
      shortTitle: { az: 'B2 İmtahan', tr: 'B2 Sınav', en: 'B2 Exam', ru: 'B2 Экзамен' },
    },
  ],
  C1: [],
};

export interface CurriculumSection {
  level: LevelId;
  order: number;
  title: string;
  description: string;
  accentColor: string;
  isUnlocked: boolean;
  units: UnitDisplayItem[];
}

/**
 * Lists all levels sequentially as a continuous downward Duolingo-style path.
 * Levels are unlocked strictly when previous level is completed.
 */
export async function listContinuousSectionsWithProgress(
  uiLang: string = 'az'
): Promise<CurriculumSection[]> {
  const allProgress = await getAllUserProgress();
  const progressMap = new Map<string, UserUnitProgress>();
  for (const p of allProgress) {
    progressMap.set(p.unitId, p);
  }

  const sections: CurriculumSection[] = [];
  const levelOrder: LevelId[] = ['A1', 'A2', 'B1', 'B2'];
  let previousLevelCompleted = true; // A1 starts unlocked

  for (let sIdx = 0; sIdx < levelOrder.length; sIdx++) {
    const levelId = levelOrder[sIdx];
    const syllabus = SYLLABUS_MAP[levelId] || [];
    const levelInfo = CEFR_LEVELS.find((l) => l.id === levelId) || CEFR_LEVELS[0];
    const isLevelUnlocked: boolean = previousLevelCompleted;

    const unitItems: UnitDisplayItem[] = [];
    let previousNodePassed = isLevelUnlocked;
    let completedLessonCount = 0;
    let totalLessonCount = 0;

    for (let i = 0; i < syllabus.length; i++) {
      const node = syllabus[i];
      if (node.nodeType === 'lesson' || node.nodeType === 'checkpoint') {
        totalLessonCount++;
      }

      const prog = progressMap.get(node.id);
      const isCompleted = prog?.status === 'completed';
      if (isCompleted && (node.nodeType === 'lesson' || node.nodeType === 'checkpoint')) {
        completedLessonCount++;
      }

      const isUnlocked: boolean =
        isLevelUnlocked &&
        (isCompleted || prog?.status === 'unlocked' || (i === 0 && isLevelUnlocked) || previousNodePassed);

      unitItems.push({
        id: node.id,
        order: node.order,
        level: levelId,
        title: getLocalizedContent(node.title, uiLang),
        description: getLocalizedContent(node.description, uiLang),
        iconName: node.iconName,
        estimatedMinutes: node.estimatedMinutes,
        status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
        stars: prog?.stars || 0,
        score: prog?.score || 0,
        nodeType: node.nodeType || 'lesson',
        shortTitle: getLocalizedContent(node.shortTitle, uiLang),
      });

      previousNodePassed = isCompleted || (node.nodeType === 'chest' && isUnlocked);
    }

    sections.push({
      level: levelId,
      order: sIdx + 1,
      title: getLocalizedContent(levelInfo.title, uiLang),
      description: getLocalizedContent(levelInfo.description, uiLang),
      accentColor: levelInfo.accentColor,
      isUnlocked: isLevelUnlocked,
      units: unitItems,
    });

    // Check if level is completed (final boss finished or all lessons done)
    const finalNode = syllabus[syllabus.length - 1];
    const finalBossPassed = finalNode ? progressMap.get(finalNode.id)?.status === 'completed' : false;
    previousLevelCompleted = isLevelUnlocked && (finalBossPassed || (totalLessonCount > 0 && completedLessonCount >= totalLessonCount));
  }

  return sections;
}

/**
 * Lists all units for a given level with their live user progress states
 */
export async function listUnitsWithProgress(
  levelId: LevelId,
  uiLang: string = 'az'
): Promise<UnitDisplayItem[]> {
  const allProgress = await getAllUserProgress();
  const progressMap = new Map<string, UserUnitProgress>();
  for (const p of allProgress) {
    progressMap.set(p.unitId, p);
  }

  // Determine if level itself is unlocked
  let isLevelUnlocked: boolean = true;
  if (levelId === 'A2') {
    const a1Syllabus = SYLLABUS_MAP.A1 || [];
    const a1FinalNode = a1Syllabus[a1Syllabus.length - 1];
    const a1Passed = a1FinalNode ? progressMap.get(a1FinalNode.id)?.status === 'completed' : false;
    isLevelUnlocked = a1Passed;
  } else if (levelId === 'B1') {
    const a2Syllabus = SYLLABUS_MAP.A2 || [];
    const a2FinalNode = a2Syllabus[a2Syllabus.length - 1];
    const a2Passed = a2FinalNode ? progressMap.get(a2FinalNode.id)?.status === 'completed' : false;
    isLevelUnlocked = a2Passed;
  } else if (levelId === 'B2') {
    const b1Syllabus = SYLLABUS_MAP.B1 || [];
    const b1FinalNode = b1Syllabus[b1Syllabus.length - 1];
    const b1Passed = b1FinalNode ? progressMap.get(b1FinalNode.id)?.status === 'completed' : false;
    isLevelUnlocked = b1Passed;
  }

  const syllabus = SYLLABUS_MAP[levelId] || [];
  const items: UnitDisplayItem[] = [];

  let previousPassed = isLevelUnlocked;

  for (let i = 0; i < syllabus.length; i++) {
    const node = syllabus[i];
    const prog = progressMap.get(node.id);

    const isCompleted = prog?.status === 'completed';
    const isUnlocked: boolean =
      isLevelUnlocked &&
      (isCompleted || prog?.status === 'unlocked' || (i === 0 && isLevelUnlocked) || previousPassed);

    items.push({
      id: node.id,
      order: node.order,
      level: levelId,
      title: getLocalizedContent(node.title, uiLang),
      description: getLocalizedContent(node.description, uiLang),
      iconName: node.iconName,
      estimatedMinutes: node.estimatedMinutes,
      status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
      stars: prog?.stars || 0,
      score: prog?.score || 0,
      nodeType: node.nodeType || 'lesson',
      shortTitle: getLocalizedContent(node.shortTitle, uiLang),
    });

    previousPassed = isCompleted || (node.nodeType === 'chest' && isUnlocked);
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
  return validateUnitAccess(unitId, levelId, unitOrder, isPremium, isOnline, isUnitBundled(unitId));
}
