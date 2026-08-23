import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LanguageCode } from '@/lib/i18n/constants';
import type { SavedWord } from './db';
import { listSavedWords } from './store';

export interface GameWordPair {
  id: string;
  word: string;
  translation: string;
  phonetic?: string | null;
  isUserSaved?: boolean;
}

export interface MatchingCard {
  id: string; // unique card id
  pairId: string; // ties matching pair together
  text: string;
  isEnglish: boolean;
  state: 'idle' | 'selected' | 'matched' | 'wrong';
}

const STORAGE_KEYS = {
  HEARTS: '@litera:vocab_hearts',
  HEARTS_LAST_UPDATE: '@litera:vocab_hearts_time',
  XP: '@litera:vocab_xp',
  STREAK: '@litera:vocab_streak',
  GAMES_PLAYED: '@litera:vocab_games_played',
  MATCHED_COUNT: '@litera:vocab_matched_count',
};

export const MAX_HEARTS = 5;
const HEART_RECOVERY_MINUTES = 30;

// Curated starter vocabulary dictionary for seamless gameplay across languages
const CURATED_VOCAB: Array<{
  en: string;
  phonetic: string;
  translations: Record<string, string>;
}> = [
  { en: 'ability', phonetic: '/əˈbɪləti/', translations: { az: 'qabiliyyət', ru: 'способность', tr: 'yetenek', es: 'habilidad', de: 'Fähigkeit', fr: 'capacité' } },
  { en: 'engagement', phonetic: '/ɪnˈɡeɪdʒmənt/', translations: { az: 'nişan', ru: 'помолвка', tr: 'nişan', es: 'compromiso', de: 'Verlobung', fr: 'fiançailles' } },
  { en: 'esteem', phonetic: '/ɪˈstiːm/', translations: { az: 'ehtiram', ru: 'уважение', tr: 'saygı', es: 'estima', de: 'Achtung', fr: 'estime' } },
  { en: 'particularly', phonetic: '/pərˈtɪkjələrli/', translations: { az: 'xüsusən', ru: 'особенно', tr: 'özellikle', es: 'particularmente', de: 'besonders', fr: 'particulièrement' } },
  { en: 'service', phonetic: '/ˈsɜːrvɪs/', translations: { az: 'xidmət', ru: 'служба', tr: 'hizmet', es: 'servicio', de: 'Dienst', fr: 'service' } },
  { en: 'opportunity', phonetic: '/ˌɑːpərˈtuːnəti/', translations: { az: 'fürsət', ru: 'возможность', tr: 'fırsat', es: 'oportunidad', de: 'Gelegenheit', fr: 'opportunité' } },
  { en: 'challenge', phonetic: '/ˈtʃælɪndʒ/', translations: { az: 'sınaq', ru: 'вызов', tr: 'meydan okuma', es: 'desafío', de: 'Herausforderung', fr: 'défi' } },
  { en: 'knowledge', phonetic: '/ˈnɑːlɪdʒ/', translations: { az: 'bilik', ru: 'знание', tr: 'bilgi', es: 'conocimiento', de: 'Wissen', fr: 'connaissance' } },
  { en: 'freedom', phonetic: '/ˈfriːdəm/', translations: { az: 'azadlıq', ru: 'свобода', tr: 'özgürlük', es: 'libertad', de: 'Freiheit', fr: 'liberté' } },
  { en: 'courage', phonetic: '/ˈkɜːrɪdʒ/', translations: { az: 'cəsarət', ru: 'смелость', tr: 'cesaret', es: 'valentía', de: 'Mut', fr: 'courage' } },
  { en: 'discover', phonetic: '/dɪˈskʌvər/', translations: { az: 'kəşf etmək', ru: 'открывать', tr: 'keşfetmek', es: 'descubrir', de: 'entdecken', fr: 'découvrir' } },
  { en: 'inspire', phonetic: '/ɪnˈspaɪər/', translations: { az: 'ilham vermək', ru: 'вдохновлять', tr: 'ilham vermek', es: 'inspirar', de: 'inspirieren', fr: 'inspirer' } },
  { en: 'patient', phonetic: '/ˈpeɪʃnt/', translations: { az: 'səbirli', ru: 'терпеливый', tr: 'sabırlı', es: 'paciente', de: 'geduldig', fr: 'patient' } },
  { en: 'curious', phonetic: '/ˈkjʊriəs/', translations: { az: 'maraqlanan', ru: 'любопытный', tr: 'meraklı', es: 'curioso', de: 'neugierig', fr: 'curieux' } },
  { en: 'strength', phonetic: '/streŋkθ/', translations: { az: 'güc', ru: 'сила', tr: 'güç', es: 'fuerza', de: 'Stärke', fr: 'force' } },
  { en: 'wisdom', phonetic: '/ˈwɪzdəm/', translations: { az: 'müdriklik', ru: 'мудрость', tr: 'bilgelik', es: 'sabiduría', de: 'Weisheit', fr: 'sagesse' } },
  { en: 'journey', phonetic: '/ˈdʒɜːrni/', translations: { az: 'səyahət', ru: 'путешествие', tr: 'yolculuk', es: 'viaje', de: 'Reise', fr: 'voyage' } },
  { en: 'achieve', phonetic: '/əˈtʃiːv/', translations: { az: 'nail olmaq', ru: 'достигать', tr: 'başarmak', es: 'lograr', de: 'erreichen', fr: 'atteindre' } },
  { en: 'grateful', phonetic: '/ˈɡreɪtfl/', translations: { az: 'minnətdar', ru: 'благодарный', tr: 'minnettar', es: 'agradecido', de: 'dankbar', fr: 'reconnaissant' } },
  { en: 'silence', phonetic: '/ˈsaɪləns/', translations: { az: 'sükut', ru: 'тишина', tr: 'sessizlik', es: 'silencio', de: 'Stille', fr: 'silence' } },
  { en: 'passion', phonetic: '/ˈpæʃn/', translations: { az: 'həvəs', ru: 'страсть', tr: 'tutku', es: 'pasión', de: 'Leidenschaft', fr: 'passion' } },
  { en: 'generous', phonetic: '/ˈdʒenərəs/', translations: { az: 'səxavətli', ru: 'щедрый', tr: 'cömert', es: 'generoso', de: 'großzügig', fr: 'généreux' } },
  { en: 'wonder', phonetic: '/ˈwʌndər/', translations: { az: 'möcüzə', ru: 'чудо', tr: 'mucize', es: 'maravilla', de: 'Wunder', fr: 'merveille' } },
  { en: 'treasure', phonetic: '/ˈtreʒər/', translations: { az: 'xəzinə', ru: 'сокровище', tr: 'hazine', es: 'tesoro', de: 'Schatz', fr: 'trésor' } },
  { en: 'harmony', phonetic: '/ˈhɑːrməni/', translations: { az: 'ahəngdarlıq', ru: 'гармония', tr: 'uyum', es: 'armonía', de: 'Harmonie', fr: 'harmonie' } },
  { en: 'brilliant', phonetic: '/ˈbrɪliənt/', translations: { az: 'parlaq', ru: 'блестящий', tr: 'parlak', es: 'brillante', de: 'brillant', fr: 'brillant' } },
  { en: 'horizon', phonetic: '/həˈraɪzn/', translations: { az: 'üfüq', ru: 'горизонт', tr: 'ufuk', es: 'horizonte', de: 'Horizont', fr: 'horizon' } },
  { en: 'adventure', phonetic: '/ədˈventʃər/', translations: { az: 'macəra', ru: 'приключение', tr: 'macera', es: 'aventura', de: 'Abenteuer', fr: 'aventure' } },
  { en: 'memory', phonetic: '/ˈmeməri/', translations: { az: 'xatirə', ru: 'память', tr: 'anı', es: 'memoria', de: 'Erinnerung', fr: 'mémoire' } },
  { en: 'promise', phonetic: '/ˈprɑːmɪs/', translations: { az: 'vəd', ru: 'обещание', tr: 'söz', es: 'promesa', de: 'Versprechen', fr: 'promesse' } },
];

/**
 * Loads or restores hearts based on elapsed time.
 */
export async function getHearts(): Promise<number> {
  try {
    const [heartsStr, timeStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.HEARTS),
      AsyncStorage.getItem(STORAGE_KEYS.HEARTS_LAST_UPDATE),
    ]);

    let hearts = heartsStr !== null ? parseInt(heartsStr, 10) : MAX_HEARTS;
    const lastTime = timeStr ? parseInt(timeStr, 10) : Date.now();

    // Time-based heart regeneration (1 heart every 30 mins)
    if (hearts < MAX_HEARTS) {
      const elapsedMinutes = (Date.now() - lastTime) / (1000 * 60);
      const heartsToAdd = Math.floor(elapsedMinutes / HEART_RECOVERY_MINUTES);
      if (heartsToAdd > 0) {
        hearts = Math.min(MAX_HEARTS, hearts + heartsToAdd);
        await AsyncStorage.setItem(STORAGE_KEYS.HEARTS, String(hearts));
        await AsyncStorage.setItem(STORAGE_KEYS.HEARTS_LAST_UPDATE, String(Date.now()));
      }
    }

    return isNaN(hearts) ? MAX_HEARTS : hearts;
  } catch {
    return MAX_HEARTS;
  }
}

/**
 * Deducts 1 heart if not premium. Returns updated heart count.
 */
export async function consumeHeart(isPremium: boolean): Promise<number> {
  if (isPremium) return MAX_HEARTS;
  const current = await getHearts();
  const next = Math.max(0, current - 1);
  await AsyncStorage.setItem(STORAGE_KEYS.HEARTS, String(next));
  await AsyncStorage.setItem(STORAGE_KEYS.HEARTS_LAST_UPDATE, String(Date.now()));
  return next;
}

/**
 * Refills hearts (e.g. +3 after watching an ad or full refill).
 */
export async function refillHearts(amount: number = 3): Promise<number> {
  const current = await getHearts();
  const next = Math.min(MAX_HEARTS, current + amount);
  await AsyncStorage.setItem(STORAGE_KEYS.HEARTS, String(next));
  await AsyncStorage.setItem(STORAGE_KEYS.HEARTS_LAST_UPDATE, String(Date.now()));
  return next;
}

/**
 * Loads vocabulary game statistics.
 */
export async function getGameStats(): Promise<{ xp: number; streak: number; gamesPlayed: number; matchedCount: number }> {
  try {
    const [xp, streak, played, matched] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.XP),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK),
      AsyncStorage.getItem(STORAGE_KEYS.GAMES_PLAYED),
      AsyncStorage.getItem(STORAGE_KEYS.MATCHED_COUNT),
    ]);
    return {
      xp: parseInt(xp || '0', 10) || 0,
      streak: parseInt(streak || '1', 10) || 1,
      gamesPlayed: parseInt(played || '0', 10) || 0,
      matchedCount: parseInt(matched || '0', 10) || 0,
    };
  } catch {
    return { xp: 0, streak: 1, gamesPlayed: 0, matchedCount: 0 };
  }
}

/**
 * Records a successful round completion.
 */
export async function recordGameSuccess(xpGain: number, pairsMatched: number): Promise<void> {
  try {
    const stats = await getGameStats();
    const newXp = stats.xp + xpGain;
    const newPlayed = stats.gamesPlayed + 1;
    const newMatched = stats.matchedCount + pairsMatched;

    await AsyncStorage.setItem(STORAGE_KEYS.XP, String(newXp));
    await AsyncStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, String(newPlayed));
  } catch {}
}

export const refillHeartsWithAd = refillHearts;
export const recordGameCompleted = recordGameSuccess;

/**
 * Generates a balanced deck of 5 word pairs for "Cüt yarat" matching game.
 * Merges user-saved words with curated dictionary.
 */
export async function generatePairDeck(targetLang: LanguageCode, count: number = 5): Promise<GameWordPair[]> {
  const pairs: GameWordPair[] = [];
  const langKey = targetLang || 'az';

  try {
    const userSaved = await listSavedWords(targetLang);
    const validUserWords = userSaved.filter((w) => w.word && w.translation);

    // Shuffle and pick user words first
    const shuffledUser = [...validUserWords].sort(() => 0.5 - Math.random());
    for (const uw of shuffledUser) {
      if (pairs.length >= count) break;
      pairs.push({
        id: `user_${uw.id}_${uw.word}`,
        word: uw.word,
        translation: uw.translation || '',
        phonetic: uw.phonetic,
        isUserSaved: true,
      });
    }
  } catch {}

  // Fill remaining slots with curated vocabulary
  const shuffledCurated = [...CURATED_VOCAB].sort(() => 0.5 - Math.random());
  for (const cv of shuffledCurated) {
    if (pairs.length >= count) break;
    // Don't duplicate if already in pairs
    if (pairs.some((p) => p.word.toLowerCase() === cv.en.toLowerCase())) continue;

    const trans = cv.translations[langKey] || cv.translations['az'] || cv.translations['ru'] || cv.en;
    pairs.push({
      id: `curated_${cv.en}`,
      word: cv.en,
      translation: trans,
      phonetic: cv.phonetic,
      isUserSaved: false,
    });
  }

  return pairs.slice(0, count);
}

/**
 * Generates cards for the 2-column "Cüt Yarat" game (5 English on left, 5 Shuffled translations on right).
 */
export function buildMatchingColumns(pairs: GameWordPair[]): {
  leftCards: MatchingCard[];
  rightCards: MatchingCard[];
} {
  const leftCards: MatchingCard[] = pairs.map((p) => ({
    id: `left_${p.id}`,
    pairId: p.id,
    text: p.word,
    isEnglish: true,
    state: 'idle',
  }));

  // Shuffle right cards
  const rightCards: MatchingCard[] = [...pairs]
    .sort(() => 0.5 - Math.random())
    .map((p) => ({
      id: `right_${p.id}`,
      pairId: p.id,
      text: p.translation,
      isEnglish: false,
      state: 'idle',
    }));

  return { leftCards, rightCards };
}
