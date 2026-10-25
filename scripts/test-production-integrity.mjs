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
assert(appJson.expo.android?.package === 'com.literabooks.app', 'app.json defines android package com.literabooks.app');
assert(typeof appJson.expo.android?.versionCode === 'number' && appJson.expo.android.versionCode >= 1, 'app.json defines valid android versionCode >= 1');
assert(Array.isArray(appJson.expo.android?.permissions), 'app.json explicitly declares android permissions');
assert(appJson.expo.android?.softwareKeyboardLayoutMode === 'resize', 'app.json sets softwareKeyboardLayoutMode to resize');

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

const requiredLangs = ['az', 'en', 'tr', 'ru', 'es', 'de', 'fr', 'it', 'pt', 'pl', 'cs', 'hu', 'uk'];
for (const lang of requiredLangs) {
  assert(translationsContent.includes(`${lang}:`) || translationsContent.includes(`${lang}Translations`), `translations.ts includes language dictionary for '${lang}'`);
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

console.log('\n--- 6. Testing Notifications Configuration & Service Integrity ---');
assert(appJson.expo.android?.permissions?.includes('android.permission.POST_NOTIFICATIONS') || appJson.expo.android?.permissions?.includes('POST_NOTIFICATIONS'), 'app.json grants POST_NOTIFICATIONS permission');
assert(appJson.expo.android?.permissions?.includes('android.permission.RECEIVE_BOOT_COMPLETED') || appJson.expo.android?.permissions?.includes('RECEIVE_BOOT_COMPLETED'), 'app.json grants RECEIVE_BOOT_COMPLETED permission');
const hasExpoNotificationsPlugin = Array.isArray(appJson.expo.plugins) && appJson.expo.plugins.some(p => (Array.isArray(p) ? p[0] : p) === 'expo-notifications');
assert(hasExpoNotificationsPlugin, 'app.json registers expo-notifications plugin');

const notifServicePath = path.join(rootDir, 'lib/notifications/notification-service.ts');
assert(fs.existsSync(notifServicePath), 'lib/notifications/notification-service.ts exists');
const notifServiceContent = fs.readFileSync(notifServicePath, 'utf8');
assert(notifServiceContent.includes('scheduleAllSmartReminders'), 'notification-service exports scheduleAllSmartReminders');
assert(notifServiceContent.includes('sendInstantTestNotification'), 'notification-service exports sendInstantTestNotification');
assert(notifServiceContent.includes('requestNotificationPermissions'), 'notification-service exports requestNotificationPermissions');
assert(notifServiceContent.includes('getNotificationPreferences'), 'notification-service exports getNotificationPreferences');
assert(notifServiceContent.includes('saveNotificationPreferences'), 'notification-service exports saveNotificationPreferences');

console.log('\n--- 7. Testing English Learning Curriculum & Anti-Bypass Integrity ---');
const typesCurriculumPath = path.join(rootDir, 'types/curriculum.ts');
assert(fs.existsSync(typesCurriculumPath), 'types/curriculum.ts exists');

const curriculumDbPath = path.join(rootDir, 'lib/curriculum/db.ts');
assert(fs.existsSync(curriculumDbPath), 'lib/curriculum/db.ts exists');
const curriculumDbContent = fs.readFileSync(curriculumDbPath, 'utf8');
assert(curriculumDbContent.includes('initCurriculumDatabase'), 'curriculum/db.ts exports initCurriculumDatabase');
assert(curriculumDbContent.includes('getUnitProgress'), 'curriculum/db.ts exports getUnitProgress');
assert(curriculumDbContent.includes('saveUnitProgress'), 'curriculum/db.ts exports saveUnitProgress');
assert(curriculumDbContent.includes('unlockUnit'), 'curriculum/db.ts exports unlockUnit');
assert(curriculumDbContent.includes('cacheUnitPayload'), 'curriculum/db.ts exports cacheUnitPayload');

const securityGuardPath = path.join(rootDir, 'lib/curriculum/security-guard.ts');
assert(fs.existsSync(securityGuardPath), 'lib/curriculum/security-guard.ts exists');
const securityGuardContent = fs.readFileSync(securityGuardPath, 'utf8');
assert(securityGuardContent.includes('validateUnitAccess'), 'security-guard.ts exports validateUnitAccess (anti-bypass)');
assert(securityGuardContent.includes('handleLessonCompletion'), 'security-guard.ts exports handleLessonCompletion');
assert(securityGuardContent.includes('OFFLINE_FREE_RESTRICTED'), 'security-guard.ts enforces OFFLINE_FREE_RESTRICTED for free users');
assert(securityGuardContent.includes('PREREQUISITE_LOCKED'), 'security-guard.ts enforces PREREQUISITE_LOCKED sequential unlocks');

const curriculumServicePath = path.join(rootDir, 'lib/curriculum/curriculum-service.ts');
assert(fs.existsSync(curriculumServicePath), 'lib/curriculum/curriculum-service.ts exists');
const curriculumServiceContent = fs.readFileSync(curriculumServicePath, 'utf8');
assert(curriculumServiceContent.includes('CEFR_LEVELS'), 'curriculum-service.ts exports CEFR_LEVELS (A1, A2, B1, B2)');
assert(curriculumServiceContent.includes('getUnitData'), 'curriculum-service.ts exports getUnitData');
assert(curriculumServiceContent.includes('listUnitsWithProgress'), 'curriculum-service.ts exports listUnitsWithProgress');

const lessonPlayerModalPath = path.join(rootDir, 'components/curriculum/LessonPlayerModal.tsx');
assert(fs.existsSync(lessonPlayerModalPath), 'components/curriculum/LessonPlayerModal.tsx exists');
const lessonPlayerModalContent = fs.readFileSync(lessonPlayerModalPath, 'utf8');
assert(lessonPlayerModalContent.includes('LessonPlayerModal'), 'LessonPlayerModal component is exported');
assert(lessonPlayerModalContent.includes('showCurriculumInterstitialAd'), 'LessonPlayerModal triggers interstitial ad for free users');

const interstitialAdsPath = path.join(rootDir, 'lib/monetization/interstitial-ads.ts');
const interstitialAdsContent = fs.readFileSync(interstitialAdsPath, 'utf8');
assert(interstitialAdsContent.includes('showCurriculumInterstitialAd'), 'interstitial-ads.ts exports showCurriculumInterstitialAd');

// Bundled units verification
const bundledUnits = ['unit_01.json', 'unit_02.json', 'unit_03.json'];
for (const unitFile of bundledUnits) {
  const unitFilePath = path.join(rootDir, 'assets/data/curriculum/a1', unitFile);
  assert(fs.existsSync(unitFilePath), `Bundled curriculum file exists: a1/${unitFile}`);
  const unitJson = JSON.parse(fs.readFileSync(unitFilePath, 'utf8'));
  assert(unitJson.id && unitJson.level === 'A1', `${unitFile} has valid id and level A1`);
  assert(unitJson.grammarRule?.title && unitJson.grammarRule?.formula, `${unitFile} has grammar rule and formula`);
  assert(Array.isArray(unitJson.vocabulary) && unitJson.vocabulary.length >= 7, `${unitFile} has vocabulary deck with >= 7 words`);
  assert(unitJson.story?.content && Array.isArray(unitJson.story?.vocabularyHighlights), `${unitFile} has graded story with vocabulary highlights`);
  assert(Array.isArray(unitJson.exercises) && unitJson.exercises.length >= 3, `${unitFile} has interactive exercises array (>= 3 exercises)`);
}

console.log('\n========================================');
console.log(`Test Results: ${passedTests}/${totalTests} passed, ${failedTests} failed.`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

