import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.resolve(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(FILE_PATH, 'utf-8');

// 1. Add keys to TranslationKey union
const keyAnchor = `  | 'terms_of_service'
  | 'section_legal';`;

const newKeys = `  | 'terms_of_service'
  | 'section_legal'
  | 'tutorial_skip'
  | 'tutorial_next'
  | 'onboarding_slide1_title'
  | 'onboarding_slide1_sub'
  | 'onboarding_slide2_title'
  | 'onboarding_slide2_sub'
  | 'onboarding_slide3_title'
  | 'onboarding_slide3_sub'
  | 'onboarding_slide4_title'
  | 'onboarding_slide4_sub'
  | 'reader_tut_tap_word_title'
  | 'reader_tut_tap_word_desc'
  | 'reader_tut_story_title'
  | 'reader_tut_story_desc'
  | 'reader_tut_got_it';`;

content = content.replace(keyAnchor, newKeys);

// 2. Add language translations
const LANG_MAP = {
  az: `    tutorial_skip: 'Ötür',
    tutorial_next: 'Növbəti',
    onboarding_slide1_title: '⚡ Ani Söz Tərcüməsi və Səs',
    onboarding_slide1_sub: 'Kitab oxuyarkən bilmədiyiniz sözə toxunun — 0 millisaniyədə tərcümə, tərif və audio tələffüz dərhal açılsın.',
    onboarding_slide2_title: '📸 Sitatları Instagram Story-də Paylaş',
    onboarding_slide2_sub: 'Bəyəndiyiniz cümlə və sitatları seçərək estetik gradient kartlara çevirin və birbaşa Instagram Story-nizə atın.',
    onboarding_slide3_title: '📚 1500+ Dünya Şah Əsəri',
    onboarding_slide3_sub: 'Tolstoy, Dostoyevski, Jane Austen, Şerlok Holms və Şekspirin ən məşhur əsərlərini orijinal dildə kəşf edin.',
    onboarding_slide4_title: '🎮 Əyləncəli Oyunlar və Lüğət',
    onboarding_slide4_sub: 'Yadda saxladığınız sözləri 3D Flashcard, Cüt Eşləşdirmə və Viktorina oyunları ilə əbədi yadda saxlayın.',
    reader_tut_tap_word_title: '👆 Sözün Üzərinə Toxunun!',
    reader_tut_tap_word_desc: 'Oxuyarkən istənilən sözə toxunaraq tərcüməsini, oxunuşunu və səsini anında görün.',
    reader_tut_story_title: '📸 Instagram Story Paylaşımı',
    reader_tut_story_desc: 'Sitat yaratmaq üçün cümləni seçin və ya bu düyməyə basaraq estetik kart hazırlayın!',
    reader_tut_got_it: 'Anladım 👍',`,

  en: `    tutorial_skip: 'Skip',
    tutorial_next: 'Next',
    onboarding_slide1_title: '⚡ Instant Translation & Audio',
    onboarding_slide1_sub: 'Tap any unknown word while reading — get instant 0ms translation, definition, and native audio pronunciation.',
    onboarding_slide2_title: '📸 Share Quotes to Instagram Story',
    onboarding_slide2_sub: 'Select inspiring quotes from books and transform them into gorgeous aesthetic gradient cards directly to Instagram Stories.',
    onboarding_slide3_title: '📚 1500+ World Masterpieces',
    onboarding_slide3_sub: 'Explore timeless classics by Tolstoy, Dostoevsky, Jane Austen, Sherlock Holmes, and Shakespeare in original English.',
    onboarding_slide4_title: '🎮 Fun Vocabulary Games',
    onboarding_slide4_sub: 'Master saved vocabulary forever with interactive 3D Flashcards, Match Pairs, and Quiz mini-games.',
    reader_tut_tap_word_title: '👆 Tap Any Word!',
    reader_tut_tap_word_desc: 'Tap any word in the text to see its instant definition, translation, and audio pronunciation.',
    reader_tut_story_title: '📸 Instagram Story Sharing',
    reader_tut_story_desc: 'Select quote lines and tap here to create a stunning Instagram Story card!',
    reader_tut_got_it: 'Got it 👍',`,

  tr: `    tutorial_skip: 'Geç',
    tutorial_next: 'İleri',
    onboarding_slide1_title: '⚡ Anında Kelime Çevirisi ve Telaffuz',
    onboarding_slide1_sub: 'Kitap okurken bilmediğiniz kelimeye dokunun — 0 milisaniyede çeviri, tanım ve sesli telaffuz anında açılsın.',
    onboarding_slide2_title: '📸 Alıntıları Instagram Story\'de Paylaş',
    onboarding_slide2_sub: 'Beğendiğiniz cümleleri seçerek estetik gradyan kartlara dönüştürün ve doğrudan Instagram Hikayenizde paylaşın.',
    onboarding_slide3_title: '📚 1500+ Dünya Başyapıtı',
    onboarding_slide3_sub: 'Tolstoy, Dostoyevski, Jane Austen, Sherlock Holmes ve Shakespeare\'in en ünlü klasiklerini orijinal dilinde keşfedin.',
    onboarding_slide4_title: '🎮 Eğlenceli Oyunlar ve Kelime Havuzu',
    onboarding_slide4_sub: 'Kaydettiğiniz kelimeleri 3D Flashcard, Eşleştirme ve Kelime Testi oyunlarıyla kalıcı olarak öğrenin.',
    reader_tut_tap_word_title: '👆 Kelimenin Üzerine Dokunun!',
    reader_tut_tap_word_desc: 'Okurken herhangi bir kelimeye dokunarak anında çevirisini ve sesli telaffuzunu görün.',
    reader_tut_story_title: '📸 Instagram Story Paylaşımı',
    reader_tut_story_desc: 'Alıntı oluşturmak için cümleleri seçin veya bu butona dokunarak estetik hikaye kartı oluşturun!',
    reader_tut_got_it: 'Anladım 👍',`,

  ru: `    tutorial_skip: 'Пропустить',
    tutorial_next: 'Далее',
    onboarding_slide1_title: '⚡ Мгновенный Перевод и Озвучка',
    onboarding_slide1_sub: 'Нажмите на любое незнакомое слово при чтении — моментально увидите перевод, определение и аудио-произношение.',
    onboarding_slide2_title: '📸 Цитаты в Instagram Story',
    onboarding_slide2_sub: 'Выделяйте любимые цитаты и создавайте стильные открытки с градиентом для мгновенной публикации в Instagram.',
    onboarding_slide3_title: '📚 1500+ Мировых Шедевров',
    onboarding_slide3_sub: 'Читайте бессмертную классику Толстого, Достоевского, Джейн Остин, Шерлока Холмса и Шекспира в оригинале.',
    onboarding_slide4_title: '🎮 Игры для Запоминания Слов',
    onboarding_slide4_sub: 'Закрепляйте сохраненные слова с помощью 3D-карточек, викторин и игры «Найди пару».',
    reader_tut_tap_word_title: '👆 Нажмите на слово!',
    reader_tut_tap_word_desc: 'Нажмите на любое слово в тексте, чтобы увидеть перевод, транскрипцию и услышать произношение.',
    reader_tut_story_title: '📸 Публикация в Instagram Story',
    reader_tut_story_desc: 'Выделяйте цитаты и делитесь красивыми эстетичными карточками в Stories!',
    reader_tut_got_it: 'Понятно 👍',`,

  es: `    tutorial_skip: 'Saltar',
    tutorial_next: 'Siguiente',
    onboarding_slide1_title: '⚡ Traducción Instantánea y Pronunciación',
    onboarding_slide1_sub: 'Toca cualquier palabra mientras lees — obtén traducción en 0ms, definición y pronunciación en audio al instante.',
    onboarding_slide2_title: '📸 Comparte Citas en Instagram Stories',
    onboarding_slide2_sub: 'Selecciona citas inspiradoras y conviértelas en elegantes tarjetas con degradados para Instagram Stories.',
    onboarding_slide3_title: '📚 1500+ Obras Maestras',
    onboarding_slide3_sub: 'Descubre clásicos universales de Tolstói, Dostoievski, Jane Austen, Sherlock Holmes y Shakespeare en su idioma original.',
    onboarding_slide4_title: '🎮 Juegos para Aprender Vocabulario',
    onboarding_slide4_sub: 'Domina tus palabras guardadas con Flashcards 3D, Emparejar y Quizzes interactivos.',
    reader_tut_tap_word_title: '👆 ¡Toca cualquier palabra!',
    reader_tut_tap_word_desc: 'Toca una palabra para ver su traducción instantánea, definición y audio.',
    reader_tut_story_title: '📸 Compartir en Instagram Story',
    reader_tut_story_desc: '¡Selecciona frases y toca aquí para crear una hermosa historia de Instagram!',
    reader_tut_got_it: 'Entendido 👍',`,

  de: `    tutorial_skip: 'Überspringen',
    tutorial_next: 'Weiter',
    onboarding_slide1_title: '⚡ Sofortige Übersetzung & Aussprache',
    onboarding_slide1_sub: 'Tippen Sie beim Lesen auf ein beliebiges Wort – erhalten Sie sofort Übersetzung, Definition und Audio-Aussprache.',
    onboarding_slide2_title: '📸 Zitate auf Instagram Stories teilen',
    onboarding_slide2_sub: 'Wählen Sie inspirierende Zitate aus und erstellen Sie ästhetische Karten direkt für Instagram Stories.',
    onboarding_slide3_title: '📚 1500+ Meisterwerke der Weltliteratur',
    onboarding_slide3_sub: 'Entdecken Sie Klassiker von Tolstoi, Dostojewski, Jane Austen, Sherlock Holmes und Shakespeare im englischen Original.',
    onboarding_slide4_title: '🎮 Spielerisches Vokabeltraining',
    onboarding_slide4_sub: 'Vertiefen Sie gespeicherte Wörter mit 3D-Karteikarten, Paare-Finden und schnellen Wort-Quizzen.',
    reader_tut_tap_word_title: '👆 Tippen Sie auf ein Wort!',
    reader_tut_tap_word_desc: 'Tippen Sie auf ein Wort, um sofort Übersetzung und Aussprache zu sehen.',
    reader_tut_story_title: '📸 Instagram Story teilen',
    reader_tut_story_desc: 'Wählen Sie Zitate aus, um eine stilvolle Story-Karte zu erstellen!',
    reader_tut_got_it: 'Verstanden 👍',`,

  fr: `    tutorial_skip: 'Passer',
    tutorial_next: 'Suivant',
    onboarding_slide1_title: '⚡ Traduction Instantanée et Prononciation',
    onboarding_slide1_sub: 'Touchez n’importe quel mot en lisant — obtenez instantanément sa traduction, définition et prononciation audio.',
    onboarding_slide2_title: '📸 Partagez des Citations en Instagram Story',
    onboarding_slide2_sub: 'Sélectionnez des citations inspirantes et transformez-les en magnifiques visuels directement pour Instagram Stories.',
    onboarding_slide3_title: '📚 1500+ Chefs-d’œuvre Mondiaux',
    onboarding_slide3_sub: 'Explorez les grands classiques de Tolstoï, Dostoïevski, Jane Austen, Sherlock Holmes et Shakespeare en version originale.',
    onboarding_slide4_title: '🎮 Jeux de Vocabulaire Interactifs',
    onboarding_slide4_sub: 'Mémorisez vos mots enregistrés grâce aux Flashcards 3D, au jeu d’associations et aux quiz.',
    reader_tut_tap_word_title: '👆 Touchez un mot !',
    reader_tut_tap_word_desc: 'Touchez un mot dans le texte pour voir instantanément sa traduction et sa prononciation.',
    reader_tut_story_title: '📸 Partager en Story Instagram',
    reader_tut_story_desc: 'Sélectionnez des phrases et créez une superbe carte pour votre Story !',
    reader_tut_got_it: 'Compris 👍',`,
};

for (const [lang, addedLines] of Object.entries(LANG_MAP)) {
  const pattern = new RegExp(`(${lang}: \\{[\\s\\S]*?section_legal:[^\\n]*\\n)`, 'm');
  content = content.replace(pattern, `$1${addedLines}\n`);
}

fs.writeFileSync(FILE_PATH, content, 'utf-8');
console.log('✅ translations.ts updated with comprehensive tutorial keys across all 7 languages!');
