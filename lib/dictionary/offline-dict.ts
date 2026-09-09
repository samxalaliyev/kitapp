import type { LanguageCode } from '@/lib/i18n/constants';
import bundledDictionaryJson from '@/assets/data/bundled_dictionary.json';

export interface DictEntry {
  phonetic?: string;
  pos?: string;
  def?: string;
  ex?: string;
  az: string;
  tr?: string;
  ru?: string;
  es?: string;
  de?: string;
  fr?: string;
}

// Irregular English verb & noun lemmatization map
const IRREGULAR_LEMMAS: Record<string, string> = {
  am: 'be',
  is: 'be',
  are: 'be',
  was: 'be',
  were: 'be',
  been: 'be',
  has: 'have',
  had: 'have',
  having: 'have',
  does: 'do',
  did: 'do',
  done: 'do',
  went: 'go',
  gone: 'go',
  goes: 'go',
  said: 'say',
  says: 'say',
  made: 'make',
  makes: 'make',
  making: 'make',
  knew: 'know',
  known: 'know',
  knows: 'know',
  thought: 'think',
  thoughts: 'think',
  took: 'take',
  taken: 'take',
  takes: 'take',
  saw: 'see',
  seen: 'see',
  sees: 'see',
  came: 'come',
  comes: 'come',
  coming: 'come',
  gave: 'give',
  given: 'give',
  gives: 'give',
  found: 'find',
  finds: 'find',
  told: 'tell',
  tells: 'tell',
  became: 'become',
  becomes: 'become',
  left: 'leave',
  leaves: 'leave',
  felt: 'feel',
  feels: 'feel',
  brought: 'bring',
  brings: 'bring',
  began: 'begin',
  begun: 'begin',
  begins: 'begin',
  kept: 'keep',
  keeps: 'keep',
  held: 'hold',
  holds: 'hold',
  wrote: 'write',
  written: 'write',
  writes: 'write',
  stood: 'stand',
  stands: 'stand',
  heard: 'hear',
  hears: 'hear',
  let: 'let',
  lets: 'let',
  meant: 'mean',
  means: 'mean',
  set: 'set',
  sets: 'set',
  met: 'meet',
  meets: 'meet',
  ran: 'run',
  runs: 'run',
  running: 'run',
  paid: 'pay',
  pays: 'pay',
  sat: 'sit',
  sits: 'sit',
  spoke: 'speak',
  spoken: 'speak',
  speaks: 'speak',
  lay: 'lie',
  lain: 'lie',
  lies: 'lie',
  led: 'lead',
  leads: 'lead',
  read: 'read',
  reads: 'read',
  grew: 'grow',
  grown: 'grow',
  grows: 'grow',
  lost: 'lose',
  loses: 'lose',
  fell: 'fall',
  fallen: 'fall',
  falls: 'fall',
  sent: 'send',
  sends: 'send',
  built: 'build',
  builds: 'build',
  understood: 'understand',
  understands: 'understand',
  drew: 'draw',
  drawn: 'draw',
  draws: 'draw',
  broke: 'break',
  broken: 'break',
  breaks: 'break',
  spent: 'spend',
  spends: 'spend',
  cut: 'cut',
  cuts: 'cut',
  rose: 'rise',
  risen: 'rise',
  rises: 'rise',
  drove: 'drive',
  driven: 'drive',
  drives: 'drive',
  bought: 'buy',
  buys: 'buy',
  wore: 'wear',
  worn: 'wear',
  wears: 'wear',
  chose: 'choose',
  chosen: 'choose',
  chooses: 'choose',
  children: 'child',
  men: 'man',
  women: 'woman',
  feet: 'foot',
  teeth: 'tooth',
  mice: 'mouse',
  people: 'person',
  leaves_n: 'leaf',
  lives: 'life',
  wolves: 'wolf',
  calves: 'calf',
  knives: 'knife',
  wives: 'wife',
};

// Bundled multilingual dictionary dataset
const BASE_DICTIONARY: Record<string, DictEntry> = (bundledDictionaryJson as Record<string, DictEntry>) || {};

// In-memory runtime cache for dynamically translated words
const runtimeDictCache = new Map<string, DictEntry>();

/**
 * Returns candidate root forms (lemmas) for an English word
 */
export function getWordCandidateLemmas(word: string): string[] {
  const clean = word.toLowerCase().trim().replace(/^[^a-z]+|[^a-z]+$/g, '');
  if (!clean) return [];

  const candidates: string[] = [clean];

  // 1. Irregular check
  if (IRREGULAR_LEMMAS[clean]) {
    candidates.push(IRREGULAR_LEMMAS[clean]);
  }

  // 2. Morphological suffix stripping rules
  if (clean.endsWith('ies') && clean.length > 4) {
    candidates.push(clean.slice(0, -3) + 'y');
  }
  if (clean.endsWith('ves') && clean.length > 4) {
    candidates.push(clean.slice(0, -3) + 'f');
    candidates.push(clean.slice(0, -3) + 'fe');
  }
  if (clean.endsWith('ing') && clean.length > 4) {
    candidates.push(clean.slice(0, -3));
    candidates.push(clean.slice(0, -3) + 'e');
  }
  if (clean.endsWith('ed') && clean.length > 3) {
    candidates.push(clean.slice(0, -2));
    candidates.push(clean.slice(0, -1));
  }
  if (clean.endsWith('ly') && clean.length > 4) {
    candidates.push(clean.slice(0, -2));
  }
  if (clean.endsWith('es') && clean.length > 3) {
    candidates.push(clean.slice(0, -2));
  }
  if (clean.endsWith('s') && clean.length > 2) {
    candidates.push(clean.slice(0, -1));
  }

  return Array.from(new Set(candidates));
}

/**
 * Returns full offline dictionary entry (phonetics, pos, definition, example, translation)
 */
export function getOfflineDictEntry(word: string): DictEntry | null {
  const candidates = getWordCandidateLemmas(word);

  for (const cand of candidates) {
    const cached = runtimeDictCache.get(cand);
    if (cached) return cached;

    const entry = BASE_DICTIONARY[cand];
    if (entry) {
      // Safeguard: ignore corrupted dummy entries
      if (entry.def && entry.def.includes('common literary English term')) continue;
      if (entry.az === cand && entry.ru === cand && entry.tr === cand) continue;
      return entry;
    }
  }

  return null;
}

/**
 * Searches offline dictionary for a single word. Returns translation in target language (0ms, offline).
 */
export function getOfflineTranslation(
  word: string,
  targetLang: LanguageCode,
): string | null {
  const entry = getOfflineDictEntry(word);
  if (!entry) return null;

  const trans = entry[targetLang as keyof DictEntry];
  const candidateTrans = trans || (targetLang === 'az' ? entry.az : null);
  if (!candidateTrans) return null;

  const cleanTrans = candidateTrans.trim().toLowerCase();
  const cleanWord = word.trim().toLowerCase();

  // Safeguard: If the "translation" is literally the identical English word, reject it!
  if (cleanTrans === cleanWord) {
    return null;
  }

  return candidateTrans;
}

/**
 * Adds an external verified translation to offline runtime memory
 */
export function setOfflineTranslation(
  word: string,
  targetLang: LanguageCode,
  translation: string,
  extra?: { phonetic?: string; pos?: string; def?: string; ex?: string },
) {
  const clean = word.toLowerCase().trim();
  if (!clean || !translation) return;

  const existing = runtimeDictCache.get(clean) || { az: '' };
  (existing as any)[targetLang] = translation.trim();
  if (extra?.phonetic) existing.phonetic = extra.phonetic;
  if (extra?.pos) existing.pos = extra.pos;
  if (extra?.def) existing.def = extra.def;
  if (extra?.ex) existing.ex = extra.ex;

  runtimeDictCache.set(clean, existing);
}
