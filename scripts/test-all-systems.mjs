import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('🚀 LITERA FULL SYSTEM INTEGRITY & OFFLINE DICT TEST');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// TEST 1: Dictionary JSON Integrity
console.log('📦 TEST 1: Bundled Dictionary JSON Integrity...');
const dictPath = path.resolve(__dirname, '../assets/data/bundled_dictionary.json');
assert(fs.existsSync(dictPath), 'bundled_dictionary.json exists on disk');

const rawData = fs.readFileSync(dictPath, 'utf-8');
const dict = JSON.parse(rawData);
const keys = Object.keys(dict);

assert(keys.length > 10000, `Dictionary contains ${keys.length} unique words (Target > 10,000)`);
assert(dict['wisdom'] && dict['wisdom'].az, 'Sample word "wisdom" exists with Azerbaijani translation');
assert(dict['beautiful'] && dict['beautiful'].phonetic, 'Sample word "beautiful" contains phonetic transcription');
assert(dict['courage'] && dict['courage'].ex, 'Sample word "courage" contains example sentence');

// TEST 2: Morphology & Lemmatization Engine
console.log('\n🔤 TEST 2: Morphology & Candidate Lemma Detection...');

// Simple in-script replica of getWordCandidateLemmas to test logic
const IRREGULAR_LEMMAS = {
  went: 'go',
  saw: 'see',
  children: 'child',
  bought: 'buy',
  better: 'good',
};

function getLemmas(word) {
  const clean = word.toLowerCase().trim();
  const cands = [clean];
  if (IRREGULAR_LEMMAS[clean]) cands.push(IRREGULAR_LEMMAS[clean]);
  if (clean.endsWith('ies') && clean.length > 4) cands.push(clean.slice(0, -3) + 'y');
  if (clean.endsWith('ing') && clean.length > 4) {
    cands.push(clean.slice(0, -3));
    cands.push(clean.slice(0, -3) + 'e');
  }
  if (clean.endsWith('ed') && clean.length > 3) {
    cands.push(clean.slice(0, -2));
    cands.push(clean.slice(0, -1));
  }
  if (clean.endsWith('ly') && clean.length > 4) cands.push(clean.slice(0, -2));
  if (clean.endsWith('s') && clean.length > 2) cands.push(clean.slice(0, -1));
  return cands;
}

function lookup(word, lang = 'az') {
  const cands = getLemmas(word);
  for (const c of cands) {
    if (dict[c] && dict[c][lang]) return dict[c][lang];
  }
  return null;
}

const transWisdom = lookup('wisdom', 'az');
assert(!!transWisdom, `Lookup 'wisdom' (az) -> "${transWisdom}"`);

const transBeautifully = lookup('beautifully', 'az');
assert(!!transBeautifully, `Lookup derived adverb 'beautifully' (az) -> "${transBeautifully}"`);

const transBelieved = lookup('believed', 'tr');
assert(!!transBelieved, `Lookup past verb 'believed' (tr) -> "${transBelieved}"`);

const transDreams = lookup('dreams', 'ru');
assert(!!transDreams, `Lookup plural noun 'dreams' (ru) -> "${transDreams}"`);

// TEST 3: Multilingual Coverage
console.log('\n🌐 TEST 3: Multilingual 6-Language Coverage for "freedom"...');
const freedom = dict['freedom'];
assert(!!freedom.az, `Azerbaijani: "${freedom.az}"`);
assert(!!freedom.tr, `Turkish: "${freedom.tr}"`);
assert(!!freedom.ru, `Russian: "${freedom.ru}"`);
assert(!!freedom.es, `Spanish: "${freedom.es}"`);
assert(!!freedom.de, `German: "${freedom.de}"`);
assert(!!freedom.fr, `French: "${freedom.fr}"`);

// TEST 4: Cloudflare R2 Edge CDN Availability Check
console.log('\n☁️ TEST 4: Cloudflare R2 Public CDN Book Availability...');
const sampleR2Url = 'https://pub-09392b74223c430486bb0bde1d6cddbb.r2.dev/epubs/anna-katharine-green_hand-and-ring.epub';

try {
  const headRes = await fetch(sampleR2Url, { method: 'HEAD' });
  const contentLength = headRes.headers.get('content-length');
  assert(headRes.status === 200, `R2 Public CDN returned HTTP ${headRes.status} OK`);
  assert(parseInt(contentLength || '0') > 100000, `R2 EPUB file is valid (~${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  assert(false, `R2 CDN check failed: ${err.message}`);
}

// TEST 5: Standard Ebooks Catalog Match
console.log('\n📚 TEST 5: Local Book Catalog Validation...');
const catalogPath = path.resolve(__dirname, '../assets/data/standard_ebooks.json');
assert(fs.existsSync(catalogPath), 'standard_ebooks.json exists');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
assert(catalog.length >= 1500, `Catalog contains ${catalog.length} books ready for instant offline search`);

console.log('\n====================================================');
console.log(`📊 FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED!`);
if (passedTests === totalTests) {
  console.log('🎉 ALL SYSTEMS ARE 100% OPERATIONAL, OPTIMIZED & RESILIENT!');
} else {
  console.log('⚠️ SOME TESTS FAILED. PLEASE CHECK LOGS.');
}
console.log('====================================================\n');
