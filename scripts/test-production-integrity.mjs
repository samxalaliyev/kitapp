/**
 * Automated Production Integrity & Regression Test Suite
 * Tests translation pipeline, dictionary lemmatizer, i18n completeness, and Android configs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAILED: ${message}`);
  }
}

console.log('\n--- 1. Testing Android & EAS Release Configurations ---');
const appJsonPath = path.join(rootDir, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
assert(appJson.expo.android?.package === 'com.litera.app', 'app.json defines android package com.litera.app');
assert(typeof appJson.expo.android?.versionCode === 'number' && appJson.expo.android.versionCode >= 1, 'app.json defines valid android versionCode >= 1');
assert(Array.isArray(appJson.expo.android?.permissions), 'app.json explicitly declares android permissions');
assert(appJson.expo.android?.softwareKeyboardLayoutMode === 'pan', 'app.json sets softwareKeyboardLayoutMode to pan');

const easJsonPath = path.join(rootDir, 'eas.json');
assert(fs.existsSync(easJsonPath), 'eas.json exists in project root');
const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
assert(easJson.build?.production?.android?.buildType === 'app-bundle', 'eas.json specifies app-bundle for production Android build');
assert(easJson.build?.preview?.android?.buildType === 'apk', 'eas.json specifies apk for preview Android build');

console.log('\n--- 2. Testing Bundled Dictionary Integrity ---');
const dictPath = path.join(rootDir, 'assets/data/bundled_dictionary.json');
assert(fs.existsSync(dictPath), 'bundled_dictionary.json exists');
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
const sampleWords = ['abandon', 'ability', 'able', 'about', 'book', 'read'];
for (const word of sampleWords) {
  assert(!!dict[word] && !!dict[word].az, `Dictionary contains entry and Azerbaijani translation for '${word}'`);
}
assert(Object.keys(dict).length > 10000, `Dictionary contains ${Object.keys(dict).length} offline definitions (>10000)`);

console.log('\n--- 3. Testing i18n Localization Integrity ---');
const translationsPath = path.join(rootDir, 'lib/i18n/translations.ts');
assert(fs.existsSync(translationsPath), 'lib/i18n/translations.ts exists');
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

const requiredLangs = ['az', 'en', 'tr', 'ru', 'es', 'de', 'fr'];
for (const lang of requiredLangs) {
  assert(translationsContent.includes(`${lang}: {`), `translations.ts includes language dictionary for '${lang}'`);
}

const criticalKeys = [
  'library_title',
  'search_placeholder',
  'theme_mode',
  'privacy_policy',
  'terms_of_service',
  'login_register_btn',
  'restore_purchases',
];

for (const key of criticalKeys) {
  assert(translationsContent.includes(`'${key}':`) || translationsContent.includes(`"${key}":`) || translationsContent.includes(`${key}:`), `Translations include key '${key}'`);
}

console.log('\n--- 4. Testing Supabase RLS Schema Security ---');
const schemaPath = path.join(rootDir, 'supabase_schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
assert(schemaContent.includes('trg_prevent_profile_privilege_escalation'), 'supabase_schema.sql includes privilege escalation trigger');
assert(schemaContent.includes('service_role'), 'supabase_schema.sql enforces service_role check on sensitive updates');

console.log('\n--- 5. Testing Android Modal Back-Button Safety ---');
const fullscreenAdPath = path.join(rootDir, 'components/FullscreenAdModal.tsx');
const fullscreenAdContent = fs.readFileSync(fullscreenAdPath, 'utf8');
assert(!fullscreenAdContent.includes('onRequestClose={() => {}}'), 'FullscreenAdModal does not trap back button with empty handler');

const rewardedVideoPath = path.join(rootDir, 'components/RewardedVideoPlayerModal.tsx');
const rewardedVideoContent = fs.readFileSync(rewardedVideoPath, 'utf8');
assert(!rewardedVideoContent.includes('onRequestClose={() => {}}'), 'RewardedVideoPlayerModal does not trap back button with empty handler');

console.log('\n========================================');
console.log(`Test Results: ${passedTests}/${totalTests} passed, ${failedTests} failed.`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
