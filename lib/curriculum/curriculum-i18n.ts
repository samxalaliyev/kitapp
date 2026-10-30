import type { LocalizedString } from '@/types/curriculum';

export type CurriculumStringKey =
  | 'learn_map_title'
  | 'learn_map_subtitle'
  | 'section'
  | 'level'
  | 'rules'
  | 'start'
  | 'locked_section_note'
  | 'minute_micro_lesson'
  | 'start_lesson'
  | 'review_lesson'
  | 'locked'
  | 'chest_reward'
  | 'level_exam'
  | 'rules_handbook'
  | 'basic_formulas'
  | 'got_it_back'
  | 'lesson'
  | 'min'
  | 'quick_rule'
  | 'examples'
  | 'common_mistake'
  | 'continue_to_words'
  | 'word_counter'
  | 'translation'
  | 'example_sentence'
  | 'previous'
  | 'next_word'
  | 'continue_to_story'
  | 'graded_reading'
  | 'words'
  | 'listen_story'
  | 'stop_audio'
  | 'learned_keywords'
  | 'start_exercises'
  | 'exercise'
  | 'fill_blank_instruction'
  | 'listen_sentence_help'
  | 'scramble_placeholder'
  | 'check_answer'
  | 'feedback_correct'
  | 'feedback_wrong'
  | 'correct_answer_label'
  | 'continue_btn'
  | 'victory_title'
  | 'defeat_title'
  | 'lesson_passed_sub'
  | 'lesson_failed_sub'
  | 'earned_xp'
  | 'accuracy'
  | 'return_to_map'
  | 'try_again'
  | 'lesson_locked_title'
  | 'lesson_locked_prev_level'
  | 'lesson_locked_prev_unit'
  | 'ok'
  | 'need_internet_title'
  | 'need_internet_msg'
  | 'cancel'
  | 'upgrade_premium'
  | 'exit_lesson_title'
  | 'exit_lesson_msg'
  | 'stay_btn'
  | 'exit_btn'
  | 'slow_audio'
  | 'chest_opened_reward'
  | 'stage_theory'
  | 'stage_vocab'
  | 'stage_story'
  | 'stage_exercise'
  | 'tap_to_listen'
  | 'pro_tip_title'
  | 'wrong_label'
  | 'correct_label'
  | 'see_examples'
  | 'see_trap'
  | 'rule_step_title'
  | 'examples_step_title'
  | 'step_counter';

const CURRICULUM_STRINGS: Record<CurriculumStringKey, Record<string, string>> = {
  learn_map_title: {
    tr: 'Öğrenme Haritası',
    az: 'Tədris Xəritəsi',
    en: 'Learning Path',
    ru: 'Карта обучения',
  },
  learn_map_subtitle: {
    tr: 'Adım adım akıcı İngilizce',
    az: 'Addım-addım sərbəst ingilis dili',
    en: 'Step-by-step English fluency',
    ru: 'Пошаговый путь к свободному английскому',
  },
  section: {
    tr: 'BÖLÜM',
    az: 'BÖLMƏ',
    en: 'SECTION',
    ru: 'РАЗДЕЛ',
  },
  level: {
    tr: 'SEVİYE',
    az: 'SEVİYYƏ',
    en: 'LEVEL',
    ru: 'УРОВЕНЬ',
  },
  rules: {
    tr: 'Kurallar',
    az: 'Qaydalar',
    en: 'Rules',
    ru: 'Правила',
  },
  start: {
    tr: 'BAŞLA',
    az: 'BAŞLA',
    en: 'START',
    ru: 'СТАРТ',
  },
  locked_section_note: {
    tr: 'Bu bölümü açmak için önceki seviyeyi tamamlayın',
    az: 'Bu bölməni açmaq üçün əvvəlki səviyyəni tamamlayın',
    en: 'Complete previous level to unlock this section',
    ru: 'Завершите предыдущий уровень, чтобы открыть этот раздел',
  },
  minute_micro_lesson: {
    tr: 'Dakikalık Mikro Ders',
    az: 'Dəqiqəlik Mikro-Dərs',
    en: 'Minute Micro-Lesson',
    ru: 'Минутный микро-урок',
  },
  start_lesson: {
    tr: 'Derse Başla',
    az: 'Dərsə Başla',
    en: 'Start Lesson',
    ru: 'Начать урок',
  },
  review_lesson: {
    tr: 'Tekrar Et',
    az: 'Təkrar Et',
    en: 'Review Lesson',
    ru: 'Повторить',
  },
  locked: {
    tr: 'Kilitli',
    az: 'Kilidlidir',
    en: 'Locked',
    ru: 'Заблокировано',
  },
  chest_reward: {
    tr: '🎁 HAZİNE ÖDÜLÜ',
    az: '🎁 XƏZİNƏ MÜKAFATI',
    en: '🎁 CHEST REWARD',
    ru: '🎁 СУНДУК НАГРАДЫ',
  },
  level_exam: {
    tr: '🏆 SEVİYE SINAVI',
    az: '🏆 SƏVİYYƏ İMTAHANI',
    en: '🏆 CHECKPOINT EXAM',
    ru: '🏆 ЭКЗАМЕН УРОВНЯ',
  },
  rules_handbook: {
    tr: 'Kurallar Kitapçığı',
    az: 'Qaydalar Kitabçası',
    en: 'Grammar Handbook',
    ru: 'Справочник правил',
  },
  basic_formulas: {
    tr: 'temel formülleri',
    az: 'təməl formulları',
    en: 'core formulas',
    ru: 'основные формулы',
  },
  got_it_back: {
    tr: 'Anladım, Haritaya Dön',
    az: 'Anladım, Xəritəyə Qayıt',
    en: 'Got it, Back to Map',
    ru: 'Понятно, вернуться к карте',
  },
  lesson: {
    tr: 'DERS',
    az: 'DƏRS',
    en: 'LESSON',
    ru: 'УРОК',
  },
  min: {
    tr: 'dk',
    az: 'dəq',
    en: 'min',
    ru: 'мин',
  },
  quick_rule: {
    tr: '⚡ ALTIN KURAL',
    az: '⚡ QIZIL QAYDA',
    en: '⚡ GOLDEN RULE',
    ru: '⚡ ГЛАВНОЕ ПРАВИЛО',
  },
  examples: {
    tr: 'Cümle İçinde Gör',
    az: 'Cümlədə İşlənməsi',
    en: 'See in Action',
    ru: 'Примеры в речи',
  },
  common_mistake: {
    tr: 'DİKKAT! TUZAK NOKTASI',
    az: 'DİQQƏT! ƏSAS TƏLƏ',
    en: 'WATCH OUT! COMMON PITFALL',
    ru: 'ВНИМАНИЕ! ЧАСТАЯ ЛОВУШКА',
  },
  continue_to_words: {
    tr: 'Kelimelere Geç',
    az: 'Sözlərə Keç',
    en: 'Continue to Words',
    ru: 'К словам',
  },
  word_counter: {
    tr: 'Kelime',
    az: 'Söz',
    en: 'Word',
    ru: 'Слово',
  },
  translation: {
    tr: 'Çeviri',
    az: 'Tərcümə',
    en: 'Translation',
    ru: 'Перевод',
  },
  example_sentence: {
    tr: 'Örnek Cümle',
    az: 'Nümunə Cümlə',
    en: 'Example Sentence',
    ru: 'Пример предложения',
  },
  previous: {
    tr: 'Önceki',
    az: 'Əvvəlki',
    en: 'Previous',
    ru: 'Назад',
  },
  next_word: {
    tr: 'Sonraki Kelime',
    az: 'Növbəti Söz',
    en: 'Next Word',
    ru: 'Следующее слово',
  },
  continue_to_story: {
    tr: 'Hikayeye Geç 📖',
    az: 'Hekayəyə Keç 📖',
    en: 'Continue to Story 📖',
    ru: 'К рассказу 📖',
  },
  graded_reading: {
    tr: 'Seviyeli Okuma',
    az: 'Səviyyəli Oxu',
    en: 'Graded Reading',
    ru: 'Чтение по уровням',
  },
  words: {
    tr: 'kelime',
    az: 'söz',
    en: 'words',
    ru: 'слов',
  },
  listen_story: {
    tr: 'Hikayeyi Dinle (TTS)',
    az: 'Hekayəni Dinlə (TTS)',
    en: 'Listen to Story (TTS)',
    ru: 'Слушать историю (TTS)',
  },
  stop_audio: {
    tr: 'Sesi Durdur',
    az: 'Səsi Dayandır',
    en: 'Stop Audio',
    ru: 'Остановить звук',
  },
  learned_keywords: {
    tr: 'Öğrendiğiniz Anahtar Kelimeler',
    az: 'Öyrəndiyiniz Açar Sözlər',
    en: 'Key Learned Vocabulary',
    ru: 'Ключевые слова',
  },
  start_exercises: {
    tr: 'Alıştırmalara Başla',
    az: 'Məşqlərə Başla',
    en: 'Start Exercises',
    ru: 'Начать упражнения',
  },
  exercise: {
    tr: 'Alıştırma',
    az: 'Məşq',
    en: 'Exercise',
    ru: 'Упражнение',
  },
  fill_blank_instruction: {
    tr: 'Boşluğa uygun olan seçeneği aşağıdan seçin:',
    az: 'Boşluğa uyğun olan variantı aşağıdan seçin:',
    en: 'Select the correct option below to fill the blank:',
    ru: 'Выберите подходящий вариант для пропуска:',
  },
  listen_sentence_help: {
    tr: 'Dokunarak sesli cümleyi dinleyin',
    az: 'Toxunaraq audio cümləni dinləyin',
    en: 'Tap to listen to the audio sentence',
    ru: 'Нажмите, чтобы прослушать предложение',
  },
  scramble_placeholder: {
    tr: 'Aşağıdaki kelimelere dokunarak cümleyi kurun...',
    az: 'Aşağıdakı sözlərə toxunaraq cümləni yığın...',
    en: 'Tap words below to build the sentence...',
    ru: 'Нажимайте на слова внизу, чтобы собрать предложение...',
  },
  check_answer: {
    tr: 'Cevabı Kontrol Et',
    az: 'Cavabı Yoxla',
    en: 'Check Answer',
    ru: 'Проверить ответ',
  },
  feedback_correct: {
    tr: 'Harika! Doğru cevap!',
    az: 'Əla! Doğru cavab!',
    en: 'Great! Correct answer!',
    ru: 'Отлично! Правильный ответ!',
  },
  feedback_wrong: {
    tr: 'Yanlış cevap! (-1 can)',
    az: 'Səhv cavab! (-1 can)',
    en: 'Wrong answer! (-1 heart)',
    ru: 'Неверный ответ! (-1 жизнь)',
  },
  correct_answer_label: {
    tr: 'Doğru cevap:',
    az: 'Doğru cavab:',
    en: 'Correct answer:',
    ru: 'Правильный ответ:',
  },
  continue_btn: {
    tr: 'Devam et',
    az: 'Davam et',
    en: 'Continue',
    ru: 'Продолжить',
  },
  victory_title: {
    tr: 'Tebrikler! Ders Bitti!',
    az: 'Təbriklər! Dərs Bitdi!',
    en: 'Congratulations! Lesson Finished!',
    ru: 'Поздравляем! Урок завершен!',
  },
  defeat_title: {
    tr: 'Pes Etmek Yok!',
    az: 'Təslim Olmaq Yoxdur!',
    en: 'Never Give Up!',
    ru: 'Не сдавайтесь!',
  },
  lesson_passed_sub: {
    tr: 'başarıyla tamamlandı.',
    az: 'uğurla tamamlandı.',
    en: 'completed successfully.',
    ru: 'успешно завершен.',
  },
  lesson_failed_sub: {
    tr: 'Sonraki modülü açmak için en az %70 puan almalısınız.',
    az: 'Növbəti modulu açmaq üçün ən azı 70% nəticə toplamalısınız.',
    en: 'Score at least 70% to unlock the next module.',
    ru: 'Наберите не менее 70%, чтобы открыть следующий модуль.',
  },
  earned_xp: {
    tr: 'Kazanılan XP',
    az: 'Qazanılan XP',
    en: 'Earned XP',
    ru: 'Полученный XP',
  },
  accuracy: {
    tr: 'Doğruluk',
    az: 'Dəqiqlik',
    en: 'Accuracy',
    ru: 'Точность',
  },
  return_to_map: {
    tr: 'Haritaya Dön',
    az: 'Xəritəyə Qayıt',
    en: 'Return to Map',
    ru: 'Вернуться к карте',
  },
  try_again: {
    tr: 'Tekrar Dene',
    az: 'Yenidən Sına',
    en: 'Try Again',
    ru: 'Попробовать снова',
  },
  lesson_locked_title: {
    tr: '🔒 Ders Kilitli',
    az: '🔒 Dərs Kilidlidir',
    en: '🔒 Lesson Locked',
    ru: '🔒 Урок заблокирован',
  },
  lesson_locked_prev_level: {
    tr: 'Bu derse başlamak için önce önceki seviyeyi başarıyla tamamlayın.',
    az: 'Bu dərsinə başlamaq üçün əvvəlcə əvvəlki səviyyəni uğurla tamamlayın.',
    en: 'Complete the previous level to start this lesson.',
    ru: 'Завершите предыдущий уровень, чтобы начать этот урок.',
  },
  lesson_locked_prev_unit: {
    tr: 'Bu dersin kilidini açmak için önceki dersi en az %70 başarıyla tamamlayın.',
    az: 'Bu dərsin kilidini açmaq üçün əvvəlki dərsi ən azı 70% nəticə ilə bitirin.',
    en: 'Score at least 70% on the previous lesson to unlock this one.',
    ru: 'Наберите не менее 70% в предыдущем уроке, чтобы открыть этот.',
  },
  ok: {
    tr: 'Tamam',
    az: 'Oldu',
    en: 'OK',
    ru: 'ОК',
  },
  need_internet_title: {
    tr: '📶 İnternet Bağlantısı Gerekli',
    az: '📶 İnternet Bağlantısı Tələb Olunur',
    en: '📶 Internet Connection Required',
    ru: '📶 Требуется подключение к интернету',
  },
  need_internet_msg: {
    tr: 'Sonraki derslere internetsiz erişmek için Litera Premium\'a geçin veya internetinizi açın.',
    az: 'Növbəti dərslərə internetsiz daxil olmaq üçün Litera Premium-a keçin və ya interneti aktiv edin.',
    en: 'Connect to the internet or upgrade to Litera Premium for offline access.',
    ru: 'Подключитесь к интернету или перейдите на Litera Premium для офлайн-доступа.',
  },
  cancel: {
    tr: 'İptal',
    az: 'Ləğv et',
    en: 'Cancel',
    ru: 'Отмена',
  },
  upgrade_premium: {
    tr: '👑 Premium\'a Geç',
    az: '👑 Premium Al',
    en: '👑 Get Premium',
    ru: '👑 Перейти на Premium',
  },
  exit_lesson_title: {
    tr: 'Dersten çıkmak istiyor musunuz?',
    az: 'Dərsdən çıxmaq istəyirsiniz?',
    en: 'Do you want to exit the lesson?',
    ru: 'Вы хотите выйти из урока?',
  },
  exit_lesson_msg: {
    tr: 'Şimdi çıkarsanız mevcut ilerlemeniz sıfırlanacaktır.',
    az: 'Dərsdən indi çıxsanız cari irəliləyiş sıfırlanacaq.',
    en: 'If you exit now, your current progress in this lesson will be lost.',
    ru: 'Если вы выйдете сейчас, текущий прогресс будет потерян.',
  },
  stay_btn: {
    tr: 'Kal',
    az: 'Qal',
    en: 'Stay',
    ru: 'Остаться',
  },
  exit_btn: {
    tr: 'Çık',
    az: 'Çıx',
    en: 'Exit',
    ru: 'Выйти',
  },
  slow_audio: {
    tr: 'Yavaş Dinle',
    az: 'Yavaş Dinlə',
    en: 'Slow Audio',
    ru: 'Медленно',
  },
  chest_opened_reward: {
    tr: 'Tebrikler! +25 XP ve +1 Can Kazandınız! 🎁',
    az: 'Təbriklər! +25 XP və +1 Can Qazandınız! 🎁',
    en: 'Congratulations! You earned +25 XP and +1 Heart! 🎁',
    ru: 'Поздравляем! Вы получили +25 XP и +1 Жизнь! 🎁',
  },
  stage_theory: {
    tr: 'Kural',
    az: 'Qayda',
    en: 'Rule',
    ru: 'Правило',
  },
  stage_vocab: {
    tr: 'Kelimeler',
    az: 'Sözlər',
    en: 'Words',
    ru: 'Слова',
  },
  stage_story: {
    tr: 'Hikaye',
    az: 'Hekayə',
    en: 'Story',
    ru: 'Рассказ',
  },
  stage_exercise: {
    tr: 'Alıştırma',
    az: 'Məşq',
    en: 'Practice',
    ru: 'Практика',
  },
  tap_to_listen: {
    tr: 'Dinlemek için dokunun',
    az: 'Dinləmək üçün toxunun',
    en: 'Tap to listen',
    ru: 'Нажмите, чтобы слушать',
  },
  pro_tip_title: {
    tr: 'Püf Noktası & Sık Hata',
    az: 'Püf Nöqtəsi & Əsas Səhv',
    en: 'Pro Tip & Common Pitfall',
    ru: 'Совет и частая ошибка',
  },
  wrong_label: {
    tr: 'Sakın Böyle Söyleme',
    az: 'Belə Demə',
    en: "Don't say this",
    ru: 'Так не говорят',
  },
  correct_label: {
    tr: 'Doğrusu Bu',
    az: 'Doğrusu Budur',
    en: 'Say it like this',
    ru: 'Правильно так',
  },
  see_examples: {
    tr: 'Örnekleri Gör',
    az: 'Nümunələrə Bax',
    en: 'See Examples',
    ru: 'Посмотреть примеры',
  },
  see_trap: {
    tr: 'Püf Noktasına Bak',
    az: 'Püf Nöqtəsinə Bax',
    en: 'See Common Trap',
    ru: 'Ловушки и нюансы',
  },
  rule_step_title: {
    tr: 'Temel Kural & Formül',
    az: 'Əsas Qayda & Düstur',
    en: 'Core Rule & Formula',
    ru: 'Базовое правило',
  },
  examples_step_title: {
    tr: 'Cümle İçinde Kullanım',
    az: 'Cümlədə İstifadəsi',
    en: 'Usage in Context',
    ru: 'Примеры в речи',
  },
  step_counter: {
    tr: 'Adım',
    az: 'Addım',
    en: 'Step',
    ru: 'Шаг',
  },
};

/**
 * Gets localized curriculum UI string for any supported language.
 * Seamlessly adapts to Turkish, Azerbaijani, English, Russian, etc.
 */
export function getCurriculumText(key: CurriculumStringKey, lang: string = 'az'): string {
  const table = CURRICULUM_STRINGS[key];
  if (!table) return key;

  if (table[lang]) return table[lang];
  if (lang === 'tr') return table.tr || table.en || table.az;
  if (lang === 'az') return table.az || table.tr || table.en;
  if (lang === 'ru') return table.ru || table.en || table.tr || table.az;
  return table.en || table.tr || table.az || key;
}

/**
 * Returns localized text from a LocalizedString object with smart fallbacks
 * prioritizing the active user UI language.
 */
export function getLocalizedContent(
  item: LocalizedString | undefined,
  lang: string = 'az',
  fallback: string = ''
): string {
  if (!item) return fallback;

  if (item[lang]) return item[lang]!;
  if (lang === 'tr') return item.tr || item.en || item.az || fallback;
  if (lang === 'az') return item.az || item.tr || item.en || fallback;
  if (lang === 'ru') return item.ru || item.en || item.tr || item.az || fallback;
  return item.en || item.tr || item.az || fallback;
}
