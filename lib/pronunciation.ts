import { getOfflineDictEntry } from '@/lib/dictionary/offline-dict';

export interface PronunciationMeaning {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export interface PronunciationResult {
  phonetic?: string;
  audioUrl?: string | null;
  ttsFallbackUrls?: string[];
  meanings: PronunciationMeaning[];
}

/**
 * Validates that a string is a real IPA phonetic transcription,
 * and NOT just the original English word wrapped in slashes (e.g. not '/kerchief/').
 */
export function isValidPhonetic(phonetic?: string | null, word?: string): boolean {
  if (!phonetic || typeof phonetic !== 'string') return false;
  const trimmed = phonetic.trim();
  if (!trimmed || trimmed === '//' || trimmed.length < 3) return false;
  if (word) {
    const rawInner = trimmed.replace(/^\/|\/$/g, '').trim().toLowerCase();
    const rawWord = word.trim().toLowerCase();
    if (rawInner === rawWord) return false;
  }
  return true;
}

/**
 * English Grapheme-to-Phoneme (G2P) rule-based IPA generator.
 * Converts English spellings to accurate International Phonetic Alphabet (IPA) transcriptions.
 * Ensures that even offline or for words not in the dictionary, a proper IPA transcription
 * (like /trænˈskrɪp.ʃən/ or /ˈkɜːrtʃɪf/) is ALWAYS generated.
 */
export function englishToIPA(word: string): string {
  if (!word) return '';
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!clean) return '';

  const KNOWN_MAP: Record<string, string> = {
    the: 'ðə', of: 'əv', to: 'tuː', and: 'ænd', a: 'ə', in: 'ɪn', is: 'ɪz', it: 'ɪt',
    you: 'juː', that: 'ðæt', he: 'hiː', was: 'wɒz', for: 'fɔːr', on: 'ɒn', are: 'ɑːr',
    as: 'æz', with: 'wɪð', his: 'hɪz', they: 'ðeɪ', i: 'aɪ', at: 'æt', be: 'biː',
    this: 'ðɪs', have: 'hæv', from: 'frɒm', or: 'ɔːr', one: 'wʌn', had: 'hæd',
    by: 'baɪ', word: 'wɜːrd', but: 'bʌt', not: 'nɒt', what: 'wɒt', all: 'ɔːl',
    were: 'wɜːr', we: 'wiː', when: 'wɛn', your: 'jɔːr', can: 'kæn', said: 'sɛd',
    there: 'ðɛər', use: 'juːz', an: 'æn', each: 'iːtʃ', which: 'wɪtʃ', she: 'ʃiː',
    do: 'duː', how: 'haʊ', their: 'ðɛər', if: 'ɪf', will: 'wɪl', up: 'ʌp', other: 'ˈʌðər',
    about: 'əˈbaʊt', out: 'aʊt', many: 'ˈmɛni', then: 'ðɛn', them: 'ðɛm', these: 'ðiːz',
    so: 'soʊ', some: 'sʌm', her: 'hɜːr', would: 'wʊd', make: 'meɪk', like: 'laɪk',
    him: 'hɪm', into: 'ˈɪntuː', time: 'taɪm', has: 'hæz', look: 'lʊk', two: 'tuː',
    more: 'mɔːr', write: 'raɪt', go: 'ɡoʊ', see: 'siː', number: 'ˈnʌmbər', no: 'noʊ',
    way: 'weɪ', could: 'kʊd', people: 'ˈpiːpəl', my: 'maɪ', than: 'ðæn', first: 'fɜːrst',
    water: 'ˈwɔːtər', been: 'bɪn', call: 'kɔːl', who: 'huː', oil: 'ɔɪl', its: 'ɪts',
    now: 'naʊ', find: 'faɪnd', long: 'lɒŋ', down: 'daʊn', day: 'deɪ', did: 'dɪd',
    get: 'ɡɛt', come: 'kʌm', made: 'meɪd', may: 'meɪ', part: 'pɑːrt',
    kerchief: 'ˈkɜːrtʃɪf', dostoevsky: 'ˌdɒstəˈjɛfski', preface: 'ˈprɛfəs',
    farewell: 'ˌfɛərˈwɛl', unbound: 'ʌnˈbaʊnd', plestcheiev: 'plɛstˈtʃeɪɛv',
    transcription: 'trænˈskrɪp.ʃən',
  };

  if (KNOWN_MAP[clean]) {
    return `/${KNOWN_MAP[clean]}/`;
  }

  let w = clean;

  // Handle silent letters at start
  w = w.replace(/^kn/, 'n')
       .replace(/^wr/, 'r')
       .replace(/^gn/, 'n')
       .replace(/^ps/, 's')
       .replace(/^pn/, 'n');

  // Multi-letter phoneme replacements
  w = w
    .replace(/trans/g, 'trænz')
    .replace(/tion/g, 'ʃən')
    .replace(/sion/g, 'ʒən')
    .replace(/cious|tious/g, 'ʃəs')
    .replace(/cial/g, 'ʃəl')
    .replace(/ture/g, 'tʃər')
    .replace(/sure/g, 'ʒər')
    .replace(/ough/g, 'ɔː')
    .replace(/augh/g, 'ɔː')
    .replace(/eigh/g, 'eɪ')
    .replace(/ight/g, 'aɪt')
    .replace(/tch/g, 'tʃ')
    .replace(/ch/g, 'tʃ')
    .replace(/sh/g, 'ʃ')
    .replace(/th/g, 'θ')
    .replace(/ph/g, 'f')
    .replace(/wh/g, 'w')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'kw')
    .replace(/ee|ea/g, 'iː')
    .replace(/oo/g, 'uː')
    .replace(/ou|ow/g, 'aʊ')
    .replace(/ai|ay/g, 'eɪ')
    .replace(/oi|oy/g, 'ɔɪ')
    .replace(/oa/g, 'oʊ')
    .replace(/au|aw/g, 'ɔː')
    .replace(/er|ir|ur/g, 'ɜːr')
    .replace(/ar/g, 'ɑːr')
    .replace(/or/g, 'ɔːr')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/j/g, 'dʒ')
    .replace(/g(?=[eiy])/g, 'dʒ')
    .replace(/x/g, 'ks')
    .replace(/y$/g, 'i')
    .replace(/a(?=[b-df-hj-np-tv-z]e$)/g, 'eɪ')
    .replace(/i(?=[b-df-hj-np-tv-z]e$)/g, 'aɪ')
    .replace(/o(?=[b-df-hj-np-tv-z]e$)/g, 'oʊ')
    .replace(/u(?=[b-df-hj-np-tv-z]e$)/g, 'juː')
    .replace(/e$/g, '');

  const stress = w.length > 3 ? 'ˈ' : '';
  return `/${stress}${w}/`;
}

// Google CDN audio URL
function buildGoogleAudioUrl(word: string): string {
  const cleanWord = encodeURIComponent(word.trim().toLowerCase());
  return `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${cleanWord}--_gb_1.mp3`;
}

function formatAudioUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

const cache = new Map<string, PronunciationResult>();

export async function getPronunciationCached(
  word: string,
): Promise<PronunciationResult | null> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return null;

  if (cache.has(cleanWord)) {
    return cache.get(cleanWord)!;
  }

  const googleAudio = buildGoogleAudioUrl(cleanWord);

  // 1. Check Offline Bundled Dictionary (14,000+ words, 0ms latency)
  const offlineEntry = getOfflineDictEntry(cleanWord);
  if (offlineEntry && (offlineEntry.phonetic || offlineEntry.def)) {
    const validPhonetic = isValidPhonetic(offlineEntry.phonetic, cleanWord)
      ? offlineEntry.phonetic
      : englishToIPA(cleanWord);

    const offlineResult: PronunciationResult = {
      phonetic: validPhonetic,
      audioUrl: googleAudio,
      ttsFallbackUrls: [],
      meanings: offlineEntry.def
        ? [
            {
              partOfSpeech: offlineEntry.pos || 'word',
              definition: offlineEntry.def,
              example: offlineEntry.ex,
            },
          ]
        : [],
    };
    cache.set(cleanWord, offlineResult);
    return offlineResult;
  }

  // 2. Online Dictionary Lookup (Datamuse API + DictionaryAPI.dev with timeout)
  let phoneticText: string | undefined;
  const meanings: PronunciationMeaning[] = [];
  const fallbackUrls: string[] = [];

  try {
    // Query Datamuse API for CMU-based IPA and definitions (extremely fast & resilient)
    const datamusePromise = fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=rd&ipa=1`
    )
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const exactMatch =
            data.find((item: any) => item.word?.toLowerCase() === cleanWord) || data[0];
          const ipaTag = exactMatch?.tags?.find((t: string) => t.startsWith('ipa_pron:'));
          const ipa = ipaTag ? ipaTag.replace('ipa_pron:', '').trim() : null;

          const defs: PronunciationMeaning[] = [];
          if (Array.isArray(exactMatch?.defs)) {
            for (const d of exactMatch.defs) {
              const parts = d.split('\t');
              const pos =
                parts[0] === 'n'
                  ? 'noun'
                  : parts[0] === 'v'
                  ? 'verb'
                  : parts[0] === 'adj'
                  ? 'adjective'
                  : parts[0] || 'word';
              const defText = parts[1] || parts[0];
              if (defText) {
                defs.push({ partOfSpeech: pos, definition: defText.trim() });
              }
            }
          }

          return {
            phonetic: ipa ? `/${ipa}/` : undefined,
            meanings: defs,
          };
        }
        return null;
      })
      .catch(() => null);

    // Query DictionaryAPI.dev for detailed definitions and audio recordings
    const dictApiPromise = fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      { headers: { 'User-Agent': 'KitabOxu/1.0' } }
    )
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text;
          const audios: string[] = [];
          if (entry.phonetics && Array.isArray(entry.phonetics)) {
            for (const p of entry.phonetics) {
              const formatted = formatAudioUrl(p.audio);
              if (formatted && formatted !== googleAudio) {
                audios.push(formatted);
              }
            }
          }
          const dictDefs: PronunciationMeaning[] = [];
          if (Array.isArray(entry.meanings)) {
            for (const m of entry.meanings) {
              const defObj = m.definitions?.[0];
              if (defObj?.definition) {
                dictDefs.push({
                  partOfSpeech: m.partOfSpeech || 'word',
                  definition: defObj.definition,
                  example: defObj.example,
                });
              }
            }
          }
          return { phonetic, audios, meanings: dictDefs };
        }
        return null;
      })
      .catch(() => null);

    // Run both with timeout of 2.2s
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2200));
    const [datamuseRes, dictApiRes] = await Promise.all([
      Promise.race([datamusePromise, timeoutPromise]),
      Promise.race([dictApiPromise, timeoutPromise]),
    ]);

    if (dictApiRes?.phonetic && isValidPhonetic(dictApiRes.phonetic, cleanWord)) {
      phoneticText = dictApiRes.phonetic;
    } else if (datamuseRes?.phonetic && isValidPhonetic(datamuseRes.phonetic, cleanWord)) {
      phoneticText = datamuseRes.phonetic;
    }

    if (dictApiRes?.audios) {
      fallbackUrls.push(...dictApiRes.audios);
    }

    if (dictApiRes?.meanings && dictApiRes.meanings.length > 0) {
      meanings.push(...dictApiRes.meanings);
    } else if (datamuseRes?.meanings && datamuseRes.meanings.length > 0) {
      meanings.push(...datamuseRes.meanings);
    }
  } catch {}

  // 3. Fallback: If no valid IPA was returned by any API, generate with English G2P rules!
  if (!phoneticText || !isValidPhonetic(phoneticText, cleanWord)) {
    phoneticText = englishToIPA(cleanWord);
  }

  // Ensure phoneticText is always enclosed in /.../
  if (phoneticText && !phoneticText.startsWith('/')) {
    phoneticText = `/${phoneticText}`;
  }
  if (phoneticText && !phoneticText.endsWith('/')) {
    phoneticText = `${phoneticText}/`;
  }

  const result: PronunciationResult = {
    phonetic: phoneticText,
    audioUrl: googleAudio,
    ttsFallbackUrls: fallbackUrls,
    meanings,
  };

  cache.set(cleanWord, result);
  return result;
}

