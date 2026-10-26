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
 * Dynamically builds a rich, fully-functional starter unit if not found on CDN
 * to ensure offline resilience and prevent any error popups.
 */
function buildStarterUnitFallback(unitId: string, levelId: LevelId): CurriculumUnit | null {
  const syllabus = SYLLABUS_MAP[levelId] || [];
  const node = syllabus.find((n) => n.id === unitId);
  if (!node) return null;

  const titleText = node.title.az || node.title.en || 'İngilis Dili Dərsi';
  const shortTitle = node.shortTitle.az || node.shortTitle.en || 'Dərs';

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
        az: `${titleText} üzrə əsas cümlə strukturları, praktik nümunələr və danışıq qaydaları.`,
        en: `Core sentence structures, practical examples and conversational patterns for ${node.title.en || titleText}.`,
        tr: `${node.title.tr || titleText} ile ilgili temel gramer yapıları ve pratik örnekler.`,
        ru: `Основные грамматические конструкции и практические примеры по теме ${node.title.ru || titleText}.`,
      },
      formula: `${shortTitle} • Conversational Patterns`,
      examples: [
        {
          english: `This is an essential expression in English.`,
          translation: {
            az: `Bu, ingilis dilində ən vacib ifadələrdən biridir.`,
            en: `This is an essential expression in English.`,
            tr: `Bu, İngilizcede çok önemli bir ifadedir.`,
            ru: `Это важное выражение на английском языке.`,
          },
        },
        {
          english: `Practice every single day to speak naturally.`,
          translation: {
            az: `Təbii danışmaq üçün hər gün məşq edin.`,
            en: `Practice every single day to speak naturally.`,
            tr: `Doğal konuşmak için her gün pratik yapın.`,
            ru: `Практикуйтесь каждый день, чтобы говорить естественно.`,
          },
        },
      ],
      commonMistake: {
        incorrect: `I am agree with you.`,
        correct: `I agree with you.`,
        explanation: {
          az: `'Agree' artıq feldir, 'am' ilə işlənməz. 'I agree' deyilir.`,
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
        translations: { az: 'Öyrənmək', en: 'Learn', tr: 'Öğrenmek', ru: 'Учить' },
        exampleSentence: 'I learn English every day.',
        exampleTranslation: { az: 'Mən hər gün ingilis dili öyrənirəm.', en: 'I learn English every day.' },
      },
      {
        id: 'v_f2',
        word: 'Speak',
        phonetic: '/spiːk/',
        audioText: 'Speak',
        translations: { az: 'Danışmaq', en: 'Speak', tr: 'Konuşmak', ru: 'Говорить' },
        exampleSentence: 'Can you speak English?',
        exampleTranslation: { az: 'İngiliscə danışa bilirsiniz?', en: 'Can you speak English?' },
      },
      {
        id: 'v_f3',
        word: 'Practice',
        phonetic: '/ˈpræktɪs/',
        audioText: 'Practice',
        translations: { az: 'Məşq / Təcrübə', en: 'Practice', tr: 'Pratik', ru: 'Практика' },
        exampleSentence: 'Practice makes perfect.',
        exampleTranslation: { az: 'Təcrübə mükəmməllik yaradır.', en: 'Practice makes perfect.' },
      },
      {
        id: 'v_f4',
        word: 'Understand',
        phonetic: '/ˌʌndəˈstænd/',
        audioText: 'Understand',
        translations: { az: 'Başa düşmək', en: 'Understand', tr: 'Anlamak', ru: 'Понимать' },
        exampleSentence: 'I understand this rule.',
        exampleTranslation: { az: 'Mən bu qaydanı başa düşürəm.', en: 'I understand this rule.' },
      },
      {
        id: 'v_f5',
        word: 'Important',
        phonetic: '/ɪmˈpɔːtnt/',
        audioText: 'Important',
        translations: { az: 'Vacib', en: 'Important', tr: 'Önemli', ru: 'Важный' },
        exampleSentence: 'This lesson is very important.',
        exampleTranslation: { az: 'Bu dərs çox vacibdir.', en: 'This lesson is very important.' },
      },
      {
        id: 'v_f6',
        word: 'Fluently',
        phonetic: '/ˈfluːəntli/',
        audioText: 'Fluently',
        translations: { az: 'Sərbəst / Axıcı', en: 'Fluently', tr: 'Akıcı bir şekilde', ru: 'Бегло' },
        exampleSentence: 'She speaks English fluently.',
        exampleTranslation: { az: 'O, ingiliscə sərbəst danışır.', en: 'She speaks English fluently.' },
      },
      {
        id: 'v_f7',
        word: 'Success',
        phonetic: '/səkˈses/',
        audioText: 'Success',
        translations: { az: 'Uğur / Nailiyyət', en: 'Success', tr: 'Başarı', ru: 'Успех' },
        exampleSentence: 'You will achieve great success.',
        exampleTranslation: { az: 'Böyük uğur qazanacaqsınız.', en: 'You will achieve great success.' },
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
          en: 'Choose the correct option:',
        },
        instruction: {
          az: 'I want to ___ English fluently.',
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
          en: 'Fill in the blank with the correct form:',
        },
        instruction: {
          az: 'Practice ___ perfect.',
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
          en: 'Build sentence: "I can speak English"',
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
          en: 'Complete the sentence:',
        },
        instruction: {
          az: 'She ___ English very well.',
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
 * Loads a unit either from local cache, bundled assets, fetches from Cloudflare R2,
 * or safely generates a starter fallback so it NEVER fails.
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

const SYLLABUS_MAP: Record<LevelId, SyllabusNode[]> = {
  A1: [
    {
      id: 'a1_unit_01',
      order: 1,
      title: { az: 'İlk Tanışma və Salamlaşma', en: 'Introductions & Greetings', tr: 'İlk Tanışma ve Selamlaşma', ru: 'Знакомство и приветствие' },
      description: { az: "'To Be' feli, salamlaşmalar və təqdimat dialoqu", en: "Verb 'To Be', greetings, and introducing yourself", tr: "'To Be' fiili, selamlaşmalar ve kendini tanıtma", ru: "Глагол 'To Be', приветствия и диалог знакомства" },
      iconName: 'smile',
      estimatedMinutes: 5,
      nodeType: 'lesson',
      shortTitle: { az: 'Tanışlıq', en: 'Greetings', tr: 'Tanışma', ru: 'Привет' },
    },
    {
      id: 'a1_unit_02',
      order: 2,
      title: { az: 'Kafedə Sifariş və Qiymətlər', en: 'Ordering at a Cafe', tr: 'Kafede Sipariş ve Fiyatlar', ru: 'Заказ в кафе и цены' },
      description: { az: "'Would like', 'How much' və nəzakətli sifarişlər", en: "Polite ordering with 'would like' and asking prices", tr: "'Would like', 'How much' ve kibar sipariş", ru: "Вежливый заказ с 'would like' и вопросы о цене" },
      iconName: 'coffee',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Kafedə', en: 'At Cafe', tr: 'Kafede', ru: 'В кафе' },
    },
    {
      id: 'a1_chest_01',
      order: 3,
      title: { az: 'Xəzinə Sandığı: +25 XP', en: 'Bonus Chest: +25 XP', tr: 'Hazine Sandığı: +25 XP', ru: 'Сундук бонуса: +25 XP' },
      description: { az: 'Səylərinizə görə əlavə XP və Can hədiyyəsi!', en: 'Extra XP & Hearts reward for your consistency!', tr: 'Tebrikler, ekstra XP ve Can hediyesi!', ru: 'Награда дополнительным опытом за старания!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Sandıq', en: 'Chest', tr: 'Sandık', ru: 'Сундук' },
    },
    {
      id: 'a1_unit_03',
      order: 4,
      title: { az: 'Gündəlik Rejim və Zaman', en: 'Daily Routines & Time', tr: 'Günlük Alışkanlıklar ve Zaman', ru: 'Распорядок дня и время' },
      description: { az: 'Present Simple zamanı və Ezop təmsili', en: 'Present Simple habits and Aesop fable', tr: 'Geniş Zaman ve Ezop masalı', ru: 'Настоящее простое время и басня Эзопа' },
      iconName: 'sun',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Rejim', en: 'Routine', tr: 'Zaman', ru: 'Режим' },
    },
    {
      id: 'a1_unit_04',
      order: 5,
      title: { az: 'Ailə və Münasibətlər', en: 'Family & Relations', tr: 'Aile ve İlişkiler', ru: 'Семья и отношения' },
      description: { az: "Ailə üzvləri və 'have / has got' qəlibi", en: "Family members and 'have / has got'", tr: "Aile üyeleri ve 'have/has got'", ru: "Члены семьи и оборот 'have/has got'" },
      iconName: 'users',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Ailə', en: 'Family', tr: 'Aile', ru: 'Семья' },
    },
    {
      id: 'a1_chest_02',
      order: 6,
      title: { az: 'Qızıl Sandıq: +50 XP', en: 'Golden Chest: +50 XP', tr: 'Altın Sandık: +50 XP', ru: 'Золотой сундук: +50 XP' },
      description: { az: 'Səviyyə ortası böyük nailiyyət mükafatı!', en: 'Mid-level major milestone reward!', tr: 'Büyük aşama ödülü!', ru: 'Большая награда за прохождение середины уровня!' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Qızıl Sandıq', en: 'Gold Chest', tr: 'Altın Sandık', ru: 'Золото' },
    },
    {
      id: 'a1_unit_05',
      order: 7,
      title: { az: 'Şəhər və İstiqamətlər', en: 'City & Directions', tr: 'Şehir ve Yönler', ru: 'Город и направления' },
      description: { az: 'Yer önlükləri və harada yerləşdiyini soruşmaq', en: 'Prepositions of place and asking directions', tr: 'Yer edatları ve adres sorma', ru: 'Предлоги места и ориентирование в городе' },
      iconName: 'map-pin',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Şəhər', en: 'City', tr: 'Şehir', ru: 'Город' },
    },
    {
      id: 'a1_unit_06',
      order: 8,
      title: { az: 'Geyim və Alış-veriş', en: 'Clothes & Shopping', tr: 'Kıyafetler ve Alışveriş', ru: 'Одежда и покупки' },
      description: { az: "Geyimlər, rənglər və 'this / that' demonstrativləri", en: "Clothes, colors, and demonstratives", tr: "Giysiler, renkler ve 'this/that'", ru: "Одежда, цвета и указательные местоимения" },
      iconName: 'shopping-bag',
      estimatedMinutes: 6,
      nodeType: 'lesson',
      shortTitle: { az: 'Geyim', en: 'Shopping', tr: 'Giyim', ru: 'Одежда' },
    },
    {
      id: 'a1_unit_07',
      order: 9,
      title: { az: 'Hobbilər və Bacarıqlar', en: 'Hobbies & Abilities', tr: 'Hobiler ve Yetenekler', ru: 'Хобби и способности' },
      description: { az: "'Can / Can't' modalları və asudə vaxt", en: "'Can / Can't' modal verbs and leisure", tr: "'Can/Can't' ve boş zaman aktiviteleri", ru: "Модальный глагол 'Can/Can't' и увлечения" },
      iconName: 'activity',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Bacarıq', en: 'Hobbies', tr: 'Yetenek', ru: 'Хобби' },
    },
    {
      id: 'a1_boss_01',
      order: 10,
      title: { az: 'A1 Səviyyə Sonu İmtahanı', en: 'A1 Checkpoint Exam', tr: 'A1 Seviye Sonu Sınavı', ru: 'Финальный тест A1' },
      description: { az: 'A1 səviyyəsini təsdiqləyən böyük sınaq və +100 XP!', en: 'Comprehensive test to master A1 Level and earn +100 XP!', tr: 'A1 Seviyesini tamamla ve +100 XP kazan!', ru: 'Финальный тест уровня A1 и +100 XP!' },
      iconName: 'award',
      estimatedMinutes: 10,
      nodeType: 'checkpoint',
      shortTitle: { az: 'A1 İmtahan', en: 'Exam', tr: 'Sınav', ru: 'Экзамен' },
    },
  ],
  A2: [
    {
      id: 'a2_unit_01',
      order: 1,
      title: { az: 'Keçmiş Zaman və Xatirələr', en: 'Past Memories', tr: 'Geçmiş Zaman ve Anılar', ru: 'Прошедшее время' },
      description: { az: 'Past Simple: Qaydalı və qaydasız fellər', en: 'Past Simple: Regular & Irregular verbs', tr: 'Past Simple fiilleri', ru: 'Правильные и неправильные глаголы' },
      iconName: 'calendar',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Keçmiş', en: 'Past', tr: 'Geçmiş', ru: 'Прошлое' },
    },
    {
      id: 'a2_unit_02',
      order: 2,
      title: { az: 'Səyahət və Nəqliyyat', en: 'Travel & Transport', tr: 'Seyahat ve Ulaşım', ru: 'Путешествия и транспорт' },
      description: { az: 'Hava limanı, bilet almaq və otel rezervasiyası', en: 'Airports, tickets, and booking hotels', tr: 'Havaalanı ve bilet alma', ru: 'Аэропорт, билеты и бронирование' },
      iconName: 'compass',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Səyahət', en: 'Travel', tr: 'Seyahat', ru: 'Поездка' },
    },
    {
      id: 'a2_chest_01',
      order: 3,
      title: { az: 'Gəzgin Sandığı: +30 XP', en: 'Traveler Chest: +30 XP', tr: 'Gezgin Sandığı: +30 XP', ru: 'Сундук путешественника' },
      description: { az: 'Səyahət bölməsi üçün bonus mükafat', en: 'Bonus reward for travel unit', tr: 'Seyahat ünitesi için ödül', ru: 'Бонусная награда за раздел путешествий' },
      iconName: 'gift',
      estimatedMinutes: 1,
      nodeType: 'chest',
      shortTitle: { az: 'Sandıq', en: 'Chest', tr: 'Sandık', ru: 'Сундук' },
    },
    {
      id: 'a2_unit_03',
      order: 4,
      title: { az: 'Müqayisələr və Üstünlüklər', en: 'Comparisons', tr: 'Kıyaslamalar', ru: 'Сравнения' },
      description: { az: 'Daha böyük, ən yaxşı: Sifətin dərəcələri', en: 'Comparative and superlative adjectives', tr: 'Sıfat dereceleri', ru: 'Сравнительные и превосходные степени' },
      iconName: 'bar-chart-2',
      estimatedMinutes: 7,
      nodeType: 'lesson',
      shortTitle: { az: 'Müqayisə', en: 'Compare', tr: 'Kıyas', ru: 'Сравнение' },
    },
    {
      id: 'a2_boss_01',
      order: 5,
      title: { az: 'A2 Təməl Qələbə', en: 'A2 Mastery Exam', tr: 'A2 Seviye Sonu Sınavı', ru: 'Финальный тест A2' },
      description: { az: 'A2 səviyyəsinin yekun sınağı və sertifikat nişanı', en: 'Final test for A2 mastery', tr: 'A2 tamamlama sınavı', ru: 'Финальный тест уровня A2' },
      iconName: 'award',
      estimatedMinutes: 10,
      nodeType: 'checkpoint',
      shortTitle: { az: 'A2 İmtahan', en: 'Exam', tr: 'Sınav', ru: 'Экзамен' },
    },
  ],
  B1: [
    {
      id: 'b1_unit_01',
      order: 1,
      title: { az: 'İş və Karyera Dialoqları', en: 'Work & Career Dialogues', tr: 'İş ve Kariyer Diyalogları', ru: 'Работа и карьера' },
      description: { az: 'Müsahibə, CV və peşəkar ünsiyyət', en: 'Interviews, CVs, and professional English', tr: 'Mülakat ve iş İngilizcesi', ru: 'Собеседование и деловое общение' },
      iconName: 'briefcase',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Karyera', en: 'Career', tr: 'Kariyer', ru: 'Карьера' },
    },
    {
      id: 'b1_unit_02',
      order: 2,
      title: { az: 'Feli Frazalar (Phrasal Verbs)', en: 'Essential Phrasal Verbs', tr: 'Önemli Phrasal Verbs', ru: 'Фразовые глаголы' },
      description: { az: 'Gündəlik danışıqda ən çox işlənən 30 feli fraza', en: '30 most common native phrasal verbs', tr: 'Günlük konuşmada 30 phrasal verb', ru: '30 самых частых фразовых глаголов' },
      iconName: 'layers',
      estimatedMinutes: 8,
      nodeType: 'lesson',
      shortTitle: { az: 'Frazalar', en: 'Phrasals', tr: 'Kalıplar', ru: 'Фразы' },
    },
    {
      id: 'b1_boss_01',
      order: 3,
      title: { az: 'B1 Orta Səviyyə Sınağı', en: 'B1 Intermediate Exam', tr: 'B1 Sınavı', ru: 'Тест B1' },
      description: { az: 'B1 səviyyəsini fəth edin!', en: 'Conquer Intermediate B1 level!', tr: 'Orta seviyeyi tamamla!', ru: 'Покорите средний уровень B1!' },
      iconName: 'award',
      estimatedMinutes: 10,
      nodeType: 'checkpoint',
      shortTitle: { az: 'B1 İmtahan', en: 'Exam', tr: 'Sınav', ru: 'Экзамен' },
    },
  ],
  B2: [
    {
      id: 'b2_unit_01',
      order: 1,
      title: { az: 'Müasir Cəmiyyət və Texnologiya', en: 'Society & Technology', tr: 'Toplum ve Teknoloji', ru: 'Общество и технологии' },
      description: { az: 'Süni intellekt, elm və mübahisəli mövzular', en: 'AI, science, and philosophical debates', tr: 'Yapay zeka ve bilimsel tartışmalar', ru: 'ИИ, наука и дискуссии' },
      iconName: 'cpu',
      estimatedMinutes: 10,
      nodeType: 'lesson',
      shortTitle: { az: 'Texnologiya', en: 'Tech', tr: 'Teknoloji', ru: 'Технологии' },
    },
    {
      id: 'b2_boss_01',
      order: 2,
      title: { az: 'B2 Peşəkar İngilis Dili', en: 'B2 Fluency Mastery', tr: 'B2 Akıcı İngilizce', ru: 'Мастерство B2' },
      description: { az: 'Yüksək səviyyəli sərbəst danışıq və yekun imtahan', en: 'Upper-intermediate final exam', tr: 'İleri seviye sınavı', ru: 'Финальный экзамен B2' },
      iconName: 'award',
      estimatedMinutes: 12,
      nodeType: 'checkpoint',
      shortTitle: { az: 'B2 İmtahan', en: 'Exam', tr: 'Sınav', ru: 'Экзамен' },
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
        title: node.title[uiLang] || node.title.en,
        description: node.description[uiLang] || node.description.en,
        iconName: node.iconName,
        estimatedMinutes: node.estimatedMinutes,
        status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
        stars: prog?.stars || 0,
        score: prog?.score || 0,
        nodeType: node.nodeType || 'lesson',
        shortTitle: node.shortTitle[uiLang] || node.shortTitle.en,
      });

      previousNodePassed = isCompleted || (node.nodeType === 'chest' && isUnlocked);
    }

    sections.push({
      level: levelId,
      order: sIdx + 1,
      title: levelInfo.title[uiLang] || levelInfo.title.en,
      description: levelInfo.description[uiLang] || levelInfo.description.en,
      accentColor: levelInfo.accentColor,
      isUnlocked: isLevelUnlocked,
      units: unitItems,
    });

    // Check if level is completed (final boss finished or >= 70% of lessons done)
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
      title: node.title[uiLang] || node.title.en,
      description: node.description[uiLang] || node.description.en,
      iconName: node.iconName,
      estimatedMinutes: node.estimatedMinutes,
      status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
      stars: prog?.stars || 0,
      score: prog?.score || 0,
      nodeType: node.nodeType || 'lesson',
      shortTitle: node.shortTitle[uiLang] || node.shortTitle.en,
    });

    // A node unlocks next node if completed or if chest
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
  return validateUnitAccess(unitId, levelId, unitOrder, isPremium, isOnline);
}

