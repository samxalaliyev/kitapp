import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.resolve(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(FILE_PATH, 'utf-8');

// 1. Update TranslationKey union
const oldKeys = `  | 'category_popular'
  | 'category_fiction'
  | 'category_adventure'
  | 'category_philosophy'
  | 'category_drama'`;

const newKeys = `  | 'category_all'
  | 'category_popular'
  | 'category_fiction'
  | 'category_adventure'
  | 'category_philosophy'
  | 'category_drama'
  | 'category_masterpieces'
  | 'category_russian_lit'
  | 'category_english_lit'
  | 'category_french_lit'
  | 'category_american_lit'
  | 'category_philosophy_wisdom'
  | 'category_mystery_detective'
  | 'category_romance_drama'`;

content = content.replace(oldKeys, newKeys);

// 2. Add category keys to each language
const CATEGORY_MAP = {
  az: `    category_all: 'Hamısı',
    category_masterpieces: '🌟 Şah Əsərlər',
    category_russian_lit: '🇷🇺 Rus Ədəbiyyatı',
    category_english_lit: '🇬🇧 İngilis Ədəbiyyatı',
    category_french_lit: '🇫🇷 Fransız Ədəbiyyatı',
    category_american_lit: '🇺🇸 Amerika Ədəbiyyatı',
    category_philosophy_wisdom: '🏛️ Fəlsəfə və Hikmət',
    category_mystery_detective: '🔍 Detektiv və Sirr',
    category_romance_drama: '❤️ Romantika və Sevgi',`,
  en: `    category_all: 'All',
    category_masterpieces: '🌟 Masterpieces',
    category_russian_lit: '🇷🇺 Russian Classics',
    category_english_lit: '🇬🇧 English Literature',
    category_french_lit: '🇫🇷 French Classics',
    category_american_lit: '🇺🇸 American Literature',
    category_philosophy_wisdom: '🏛️ Philosophy & Wisdom',
    category_mystery_detective: '🔍 Mystery & Detective',
    category_romance_drama: '❤️ Romance & Passion',`,
  ru: `    category_all: 'Все',
    category_masterpieces: '🌟 Шедевры',
    category_russian_lit: '🇷🇺 Русская Классика',
    category_english_lit: '🇬🇧 Английская Классика',
    category_french_lit: '🇫🇷 Французская Классика',
    category_american_lit: '🇺🇸 Американская Классика',
    category_philosophy_wisdom: '🏛️ Философия и Мудрость',
    category_mystery_detective: '🔍 Детективы и Тайны',
    category_romance_drama: '❤️ Романтика и Любовь',`,
  tr: `    category_all: 'Tümü',
    category_masterpieces: '🌟 Başyapıtlar',
    category_russian_lit: '🇷🇺 Rus Edebiyatı',
    category_english_lit: '🇬🇧 İngiliz Edebiyatı',
    category_french_lit: '🇫🇷 Fransız Edebiyatı',
    category_american_lit: '🇺🇸 Amerikan Edebiyatı',
    category_philosophy_wisdom: '🏛️ Felsefe ve Hikmet',
    category_mystery_detective: '🔍 Dedektif ve Gizem',
    category_romance_drama: '❤️ Romantizm ve Aşk',`,
  es: `    category_all: 'Todos',
    category_masterpieces: '🌟 Obras Maestras',
    category_russian_lit: '🇷🇺 Literatura Rusa',
    category_english_lit: '🇬🇧 Literatura Inglesa',
    category_french_lit: '🇫🇷 Literatura Francesa',
    category_american_lit: '🇺🇸 Literatura Estadounidense',
    category_philosophy_wisdom: '🏛️ Filosofía y Sabiduría',
    category_mystery_detective: '🔍 Misterio y Detectives',
    category_romance_drama: '❤️ Romance y Pasión',`,
  de: `    category_all: 'Alle',
    category_masterpieces: '🌟 Meisterwerke',
    category_russian_lit: '🇷🇺 Russische Klassiker',
    category_english_lit: '🇬🇧 Englische Literatur',
    category_french_lit: '🇫🇷 Französische Literatur',
    category_american_lit: '🇺🇸 Amerikanische Klassiker',
    category_philosophy_wisdom: '🏛️ Philosophie & Weisheit',
    category_mystery_detective: '🔍 Krimi & Detektive',
    category_romance_drama: '❤️ Romantik & Liebe',`,
  fr: `    category_all: 'Tous',
    category_masterpieces: "🌟 Chefs-d'œuvre",
    category_russian_lit: '🇷🇺 Littérature Russe',
    category_english_lit: '🇬🇧 Littérature Anglaise',
    category_french_lit: '🇫🇷 Littérature Française',
    category_american_lit: '🇺🇸 Littérature Américaine',
    category_philosophy_wisdom: '🏛️ Philosophie et Sagesse',
    category_mystery_detective: '🔍 Mystère et Détective',
    category_romance_drama: '❤️ Romance et Passion',`,
};

for (const [lang, addedLines] of Object.entries(CATEGORY_MAP)) {
  const pattern = new RegExp(`(${lang}: \\{[\\s\\S]*?category_drama:[^\\n]*\\n)`, 'm');
  content = content.replace(pattern, `$1${addedLines}\n`);
}

fs.writeFileSync(FILE_PATH, content, 'utf-8');
console.log('✅ translations.ts updated with rich categories across all 7 languages!');
