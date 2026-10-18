import fs from 'fs';

const content = fs.readFileSync('lib/i18n/translations.ts', 'utf8');
const typeMatch = content.match(/export type TranslationKey =([\s\S]*?);/);
if (!typeMatch) {
  console.error('Could not find TranslationKey in translations.ts');
  process.exit(1);
}

const allKeys = [...typeMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
const allKeysSet = new Set(allKeys);
console.log('Total TranslationKey count:', allKeys.length);

const locales = ['it', 'pt', 'pl', 'cs', 'hu', 'uk'];

for (const loc of locales) {
  const filePath = `lib/i18n/locales/${loc}.ts`;
  if (!fs.existsSync(filePath)) {
    console.log(`Locale ${loc}: file does not exist yet.`);
    continue;
  }
  const locContent = fs.readFileSync(filePath, 'utf8');
  const matched = [...locContent.matchAll(/^\s*([a-zA-Z0-9_]+):/gm)].map(m => m[1]);
  const seen = new Set();
  const duplicates = [];
  for (const k of matched) {
    if (seen.has(k)) {
      duplicates.push(k);
    } else {
      seen.add(k);
    }
  }
  const missing = allKeys.filter(k => !seen.has(k));
  const extra = [...seen].filter(k => !allKeysSet.has(k));
  console.log(`Locale ${loc}: unique keys = ${seen.size}, missing = ${missing.length}, duplicates = ${duplicates.length}, extra = ${extra.length}`);
  if (extra.length > 0) {
    console.log(`Extra keys in ${loc}:`, extra);
  }
}
