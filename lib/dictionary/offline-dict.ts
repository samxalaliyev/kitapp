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

// High-frequency curated loan words, essential prepositions & literary vocabulary (0ms instant lookup)
const COMMON_LITERARY_WORDS: Record<string, DictEntry> = {
  // Prepositions & Particles
  in: {
    az: 'içində, daxilində (-da / -də)',
    tr: 'içinde, -de / -da',
    ru: 'в, внутри',
    def: 'At or towards the interior of a defined space, such as a building or room.',
    pos: 'prep',
    phonetic: '/ɪn/',
    ex: 'She was sitting in the living room.',
  },
  on: {
    az: 'üstündə, üzərində; haqqında',
    tr: 'üzerinde, üstünde; hakkında',
    ru: 'на, поверх; о',
    def: 'Physically in contact with and supported by a surface.',
    pos: 'prep',
    phonetic: '/ɒn/',
    ex: 'The book was lying on the table.',
  },
  at: {
    az: 'yanında, yaxınlığında, -da / -də',
    tr: '-de / -da, yanında',
    ru: 'в, у, около',
    def: 'Expressing location or arrival in a particular place or position.',
    pos: 'prep',
    phonetic: '/æt/',
    ex: 'They met at the station.',
  },
  of: {
    az: '-ın, -in, -un, -ün (yiyəlik); haqqında',
    tr: '-in, -ın; hakkında',
    ru: 'из, о, от',
    def: 'Expressing the relationship between a part and a whole or belonging.',
    pos: 'prep',
    phonetic: '/ɒv/',
    ex: 'A piece of cake.',
  },
  to: {
    az: '-a, -ə, tərəf, sarı; üçün',
    tr: '-e / -a doğru; için',
    ru: 'к, в, на, чтобы',
    def: 'Expressing motion in the direction of a particular location.',
    pos: 'prep',
    phonetic: '/tuː/',
    ex: 'Walking to the library.',
  },
  for: {
    az: 'üçün; müddətində',
    tr: 'için; boyunca',
    ru: 'для, ради; в течение',
    def: 'Affecting, with connection to, or in respect of.',
    pos: 'prep',
    phonetic: '/fɔːr/',
    ex: 'This present is for you.',
  },
  with: {
    az: 'ilə, birgə, bərabər',
    tr: 'ile, birlikte',
    ru: 'с, вместе с',
    def: 'Accompanied by another person or thing.',
    pos: 'prep',
    phonetic: '/wɪð/',
    ex: 'She came with her brother.',
  },
  by: {
    az: 'tərəfindən; yanında; vasitəsilə',
    tr: 'tarafından; yanında; ile',
    ru: 'у, около; кем-то',
    def: 'Identifying the agent performing an action or indicating location near.',
    pos: 'prep',
    phonetic: '/baɪ/',
    ex: 'Written by an unknown author.',
  },
  from: {
    az: '-dan, -dən; mənbəyindən',
    tr: '-den, -dan',
    ru: 'из, от, с',
    def: 'Indicating the point in space or time at which an action begins.',
    pos: 'prep',
    phonetic: '/frɒm/',
    ex: 'A letter from home.',
  },
  into: {
    az: 'içinə, daxilinə',
    tr: 'içine',
    ru: 'в, внутрь',
    def: 'Expressing movement or action with the result that someone or something becomes enclosed.',
    pos: 'prep',
    phonetic: '/ˈɪn.tuː/',
    ex: 'He walked into the room.',
  },
  out: {
    az: 'çöldə, xaricdə, çıxmış',
    tr: 'dışarı, dışarıda',
    ru: 'наружу, вне',
    def: 'Moving or directed away from an enclosed space.',
    pos: 'adv/prep',
    phonetic: '/aʊt/',
    ex: 'He stepped out into the night.',
  },
  up: {
    az: 'yuxarı, yuxarıya',
    tr: 'yukarı, yukarıya',
    ru: 'вверх, наверх',
    def: 'Towards a higher place or position.',
    pos: 'adv/prep',
    phonetic: '/ʌp/',
    ex: 'She looked up at the stars.',
  },
  down: {
    az: 'aşağı, aşağıya',
    tr: 'aşağı, aşağıya',
    ru: 'вниз, внизу',
    def: 'Towards or in a lower place or position.',
    pos: 'adv/prep',
    phonetic: '/daʊn/',
    ex: 'Walking down the street.',
  },
  over: {
    az: 'üzərindən, yuxarısında; bitmiş',
    tr: 'üzerinde; bitmiş',
    ru: 'над, через; оконченный',
    def: 'Extending directly upward from or above.',
    pos: 'prep/adv',
    phonetic: '/ˈoʊ.vər/',
    ex: 'A bridge over the river.',
  },
  under: {
    az: 'altında, aşağısında',
    tr: 'altında',
    ru: 'под, ниже',
    def: 'Extending or directly below.',
    pos: 'prep',
    phonetic: '/ˈʌn.dər/',
    ex: 'Sleeping under the tree.',
  },
  through: {
    az: 'vasitəsilə, boyunca, içindən keçərək',
    tr: 'içinden, boyunca',
    ru: 'сквозь, через',
    def: 'Moving in one side and out of the other side of an opening or space.',
    pos: 'prep',
    phonetic: '/θruː/',
    ex: 'Looking through the window.',
  },
  between: {
    az: 'arasında (iki şeyin)',
    tr: 'arasında',
    ru: 'между',
    def: 'In or into the space which separates two places, people, or objects.',
    pos: 'prep',
    phonetic: '/bɪˈtwiːn/',
    ex: 'Standing between two pillars.',
  },
  among: {
    az: 'arasında (çoxluğun)',
    tr: 'arasında',
    ru: 'среди',
    def: 'Situated more or less centrally in relation to several other things.',
    pos: 'prep',
    phonetic: '/əˈmʌŋ/',
    ex: 'A flower among the thorns.',
  },
  before: {
    az: 'əvvəl, qabaq, qarşısında',
    tr: 'önce, önünde',
    ru: 'до, перед',
    def: 'During the period of time preceding.',
    pos: 'prep/conj',
    phonetic: '/bɪˈfɔːr/',
    ex: 'Think before you speak.',
  },
  after: {
    az: 'sonra, ardından',
    tr: 'sonra',
    ru: 'после, за',
    def: 'In the time following an event or another period of time.',
    pos: 'prep/conj',
    phonetic: '/ˈɑːf.tər/',
    ex: 'After the rain came the sun.',
  },
  against: {
    az: 'qarşı, əleyhinə',
    tr: 'karşı',
    ru: 'против',
    def: 'In opposition to.',
    pos: 'prep',
    phonetic: '/əˈɡenst/',
    ex: 'Leaning against the wall.',
  },
  without: {
    az: '-sız, -siz, olmadan',
    tr: '-sız, olmadan',
    ru: 'без',
    def: 'In the absence of.',
    pos: 'prep',
    phonetic: '/wɪˈðaʊt/',
    ex: 'He arrived without delay.',
  },
  within: {
    az: 'daxilində, ərzində',
    tr: 'içinde, bünyesinde',
    ru: 'внутри, в пределах',
    def: 'Inside something or occurring inside a period of time.',
    pos: 'prep',
    phonetic: '/wɪˈðɪn/',
    ex: 'Completed within two days.',
  },

  // Literary Verbs & Participles
  furnish: {
    az: 'təchiz etmək, mebelləmək',
    tr: 'döşemek, donatmak',
    ru: 'обставлять, снабжать',
    def: 'To provide a house or room with furniture and fittings.',
    pos: 'verb',
    phonetic: '/ˈfɜː.nɪʃ/',
    ex: 'They spent months furnishing their new home.',
  },
  furnished: {
    az: 'mebelli, təchiz olunmuş, bəzədilmiş',
    tr: 'döşeli, mobilyalı',
    ru: 'меблированный, обставленный',
    def: 'Supplied or fitted out with furniture and fittings.',
    pos: 'adj',
    phonetic: '/ˈfɜː.nɪʃt/',
    ex: 'A fully furnished apartment in the center.',
  },
  furniture: {
    az: 'mebel, ev əşyaları',
    tr: 'mobilya',
    ru: 'мебель',
    def: 'Large movable equipment, such as tables and chairs, used to make a house suitable for living.',
    pos: 'noun',
    phonetic: '/ˈfɜː.nɪ.tʃər/',
    ex: 'Antique oak furniture.',
  },
  occur: {
    az: 'baş vermək, meydana çıxmaq',
    tr: 'meydana gelmek, olmak',
    ru: 'происходить, случаться',
    def: 'To happen or take place.',
    pos: 'verb',
    phonetic: '/əˈkɜːr/',
    ex: 'The accident occurred at midnight.',
  },
  occurred: {
    az: 'baş verdi, meydana gəldi',
    tr: 'meydana geldi',
    ru: 'произошло, случилось',
    def: 'Happened or took place.',
    pos: 'verb',
    phonetic: '/əˈkɜːd/',
    ex: 'A strange idea occurred to him.',
  },
  appear: {
    az: 'görünmək, peyda olmaq',
    tr: 'görünmek, belirmek',
    ru: 'появляться, казаться',
    def: 'To come into sight or become visible.',
    pos: 'verb',
    phonetic: '/əˈpɪər/',
    ex: 'A figure appeared in the doorway.',
  },
  appeared: {
    az: 'göründü, peyda oldu',
    tr: 'göründü, belirdi',
    ru: 'появился, показался',
    def: 'Came into sight.',
    pos: 'verb',
    phonetic: '/əˈpɪəd/',
    ex: 'He appeared tired after the journey.',
  },
  remain: {
    az: 'qalmaq, dəyişməz qalmaq',
    tr: 'kalmak',
    ru: 'оставаться',
    def: 'To continue to exist, especially after others have ceased to exist.',
    pos: 'verb',
    phonetic: '/rɪˈmeɪn/',
    ex: 'Only a few ruins remain.',
  },
  remained: {
    az: 'qaldı, dəyişməz qaldı',
    tr: 'kaldı',
    ru: 'остался',
    def: 'Continued to exist or stay in a place.',
    pos: 'verb',
    phonetic: '/rɪˈmeɪnd/',
    ex: 'She remained silent throughout.',
  },
  overhear: {
    az: 'təsadüfən eşitmək, qulaq şahidi olmaq',
    tr: 'kulak misafiri olmak',
    ru: 'случайно услышать, подслушать',
    def: 'To hear what other people are saying without intending to.',
    pos: 'verb',
    phonetic: '/ˌoʊ.vərˈhɪər/',
    ex: 'I couldn’t help overhearing your conversation.',
  },
  overheard: {
    az: 'təsadüfən eşitdi, qulaq şahidi oldu',
    tr: 'kulak misafiri oldu',
    ru: 'случайно услышал',
    def: 'Heard without intending to.',
    pos: 'verb',
    phonetic: '/ˌoʊ.vərˈhɜːd/',
    ex: 'The lads had overheard in the cabin.',
  },

  // Conjunctions & Pronouns
  and: {
    az: 'və',
    tr: 've',
    ru: 'и',
    def: 'Used to connect words, clauses, or sentences.',
    pos: 'conj',
    phonetic: '/ænd/',
  },
  but: {
    az: 'amma, lakin, ancaq',
    tr: 'ama, fakat',
    ru: 'но, однако',
    def: 'Used to introduce a phrase or clause contrasting with what has already been mentioned.',
    pos: 'conj',
    phonetic: '/bʌt/',
  },
  or: {
    az: 'və ya, yaxud',
    tr: 'veya, ya da',
    ru: 'или',
    def: 'Used to link alternatives.',
    pos: 'conj',
    phonetic: '/ɔːr/',
  },
  so: {
    az: 'beləliklə, buna görə də; o dərəcədə',
    tr: 'öyleyse, bu yüzden',
    ru: 'так, поэтому',
    def: 'To such a great extent; therefore.',
    pos: 'adv/conj',
    phonetic: '/soʊ/',
  },
  if: {
    az: 'əgər, təqdirdə',
    tr: 'eğer',
    ru: 'если',
    def: 'Introducing a conditional clause.',
    pos: 'conj',
    phonetic: '/ɪf/',
  },
  as: {
    az: 'kimi, olaraq; çünki',
    tr: 'gibi, olarak',
    ru: 'как, в качестве',
    def: 'Used to indicate that something happens during the time when something else is taking place.',
    pos: 'conj/prep',
    phonetic: '/æz/',
  },
  than: {
    az: 'nisbətən, -dan / -dən',
    tr: '-den / -dan daha',
    ru: 'чем',
    def: 'Introducing the second element in a comparison.',
    pos: 'conj',
    phonetic: '/ðæn/',
  },
  that: {
    az: 'o, həmin; hansı ki; ki',
    tr: 'o, şu; ki',
    ru: 'тот, который, что',
    def: 'Identifying a specific person or thing observed by the speaker.',
    pos: 'pron/conj',
    phonetic: '/ðæt/',
  },
  this: {
    az: 'bu',
    tr: 'bu',
    ru: 'этот, эта',
    def: 'Identifying a specific person or thing close at hand.',
    pos: 'pron',
    phonetic: '/ðɪs/',
  },
  there: {
    az: 'orada, oraya',
    tr: 'orada, oraya',
    ru: 'там, туда',
    def: 'In, at, or to that place or position.',
    pos: 'adv',
    phonetic: '/ðeər/',
  },
  here: {
    az: 'burada, buraya',
    tr: 'burada, buraya',
    ru: 'здесь, сюда',
    def: 'In, at, or to this place or position.',
    pos: 'adv',
    phonetic: '/hɪər/',
  },

  // Curated Loan Words
  pilot: {
    az: 'təyyarəçi, pilot',
    tr: 'pilot, kaptan',
    ru: 'пилот, летчик',
    def: 'A person who operates the flying controls of an aircraft or steers a ship.',
    pos: 'noun',
    phonetic: '/ˈpaɪlət/',
    ex: 'The pilot steered the vessel safely into port.',
  },
  alibi: {
    az: 'alibi (cinayət zamanı başqa yerdə olma sübutu)',
    tr: 'alibi, mazeret',
    ru: 'алиби (доказательство непричастности)',
    def: 'A claim or piece of evidence that one was elsewhere when an act is alleged to have taken place.',
    pos: 'noun',
    phonetic: '/ˈælɪbaɪ/',
    ex: 'He had a solid alibi for the night of the crime.',
  },
  hotel: {
    az: 'hotel, mehmanxana',
    tr: 'otel',
    ru: 'отель, гостиница',
    def: 'An establishment providing accommodations, meals, and other services for travelers.',
    pos: 'noun',
  },
  radio: {
    az: 'radio',
    tr: 'radyo',
    ru: 'радио',
    def: 'The transmission and reception of electromagnetic waves of radio frequency.',
    pos: 'noun',
  },
  taxi: {
    az: 'taksi',
    tr: 'taksi',
    ru: 'такси',
    def: 'A motor vehicle licensed to transport passengers in return for payment.',
    pos: 'noun',
  },
  bank: {
    az: 'bank; sahil',
    tr: 'banka; kıyı',
    ru: 'банк; берег реки',
    def: 'A financial establishment or the land alongside a body of water.',
    pos: 'noun',
  },
  park: {
    az: 'park, istirahət bağı',
    tr: 'park',
    ru: 'парк',
    def: 'A large public garden or area of land used for recreation.',
    pos: 'noun',
  },
  virus: {
    az: 'virus',
    tr: 'virüs',
    ru: 'вирус',
    def: 'An infective agent that typically consists of a nucleic acid molecule.',
    pos: 'noun',
  },
  tennis: {
    az: 'tennis',
    tr: 'tenis',
    ru: 'теннис',
    def: 'A racket sport that can be played individually against an opponent.',
    pos: 'noun',
  },
  doctor: {
    az: 'həkim, həkim-doktor',
    tr: 'doktor, hekim',
    ru: 'врач, доктор',
    def: 'A qualified practitioner of medicine.',
    pos: 'noun',
  },
};

/**
 * Returns full offline dictionary entry (phonetics, pos, definition, example, translation)
 */
export function getOfflineDictEntry(word: string): DictEntry | null {
  const candidates = getWordCandidateLemmas(word);

  for (const cand of candidates) {
    if (COMMON_LITERARY_WORDS[cand]) return COMMON_LITERARY_WORDS[cand];

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

  // Safeguard: only reject if corrupted dummy entry where all languages matched raw English word
  if (cleanTrans === cleanWord && entry.ru === cleanWord && entry.tr === cleanWord) {
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
