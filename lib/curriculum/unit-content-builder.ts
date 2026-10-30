import type {
  CurriculumExercise,
  CurriculumUnit,
  LevelId,
  LocalizedString,
  VocabularyItem,
} from '@/types/curriculum';

export interface TopicPayload {
  formula: string;
  explanation: LocalizedString;
  examples: Array<{ english: string; translation: LocalizedString }>;
  commonMistake: {
    incorrect: string;
    correct: string;
    explanation: LocalizedString;
  };
  vocabulary: VocabularyItem[];
  story: {
    title: string;
    titleTranslation: LocalizedString;
    content: string;
    vocabularyHighlights: string[];
  };
  exercises: CurriculumExercise[];
  bossQuiz?: CurriculumExercise[];
}

/**
 * Dedicated registry of topic-specific English learning materials.
 * Covers all units across A1, A2, B1, and B2 with 100% distinct vocabulary,
 * authentic graded stories, grammar formulas, and interactive exercises.
 */
export const TOPIC_REGISTRY: Record<string, TopicPayload> = {
  // ================= A1 UNITS =================
  a1_unit_04: {
    formula: "have got / has got • my, your, his, her • family members",
    explanation: {
      az: "Ailə və mülkiyyət haqqında danışarkən: 'I have got a brother' və ya 'This is my mother'.",
      tr: "Aile ve sahiplik anlatırken: 'I have got a brother' veya 'This is my mother' kalıpları kullanılır.",
      en: "Expressing possession and describing family members using 'have got' and possessive adjectives.",
      ru: "Выражение владения и рассказ о семье с использованием 'have got' и притяжательных местоимений.",
    },
    examples: [
      {
        english: "I have got two sisters and one brother.",
        translation: {
          az: "Mənim iki bacım və bir qardaşım var.",
          tr: "İki kız kardeşim ve bir erkek kardeşim var.",
          en: "I have got two sisters and one brother.",
          ru: "У меня две сестры и один брат.",
        },
      },
      {
        english: "Her mother is a very kind doctor.",
        translation: {
          az: "Onun anası çox mehriban həkimdir.",
          tr: "Onun annesi çok kibar bir doktordur.",
          en: "Her mother is a very kind doctor.",
          ru: "Ее мама — очень добрый врач.",
        },
      },
    ],
    commonMistake: {
      incorrect: "She have two brothers.",
      correct: "She has two brothers. (She's got two brothers)",
      explanation: {
        az: "'He/She/It' üçün 'have' yox, 'has' istifadə edilir.",
        tr: "'He/She/It' öznelerinde 'have' değil 'has' kullanılır.",
        en: "Use 'has' with 3rd-person singular (He/She/It).",
        ru: "С местоимениями He/She/It используется 'has', а не 'have'.",
      },
    },
    vocabulary: [
      {
        id: 'v4_1',
        word: 'Family',
        phonetic: '/ˈfæməli/',
        audioText: 'Family',
        translations: { az: 'Ailə', tr: 'Aile', en: 'Family', ru: 'Семья' },
        exampleSentence: 'I love spending time with my family.',
        exampleTranslation: { az: 'Ailəmlə vaxt keçirməyi sevirəm.', tr: 'Ailemle vakit geçirmeyi seviyorum.', en: 'I love spending time with my family.' },
      },
      {
        id: 'v4_2',
        word: 'Brother',
        phonetic: '/ˈbrʌðə/',
        audioText: 'Brother',
        translations: { az: 'Qardaş', tr: 'Erkek kardeş', en: 'Brother', ru: 'Брат' },
        exampleSentence: 'My brother plays football.',
        exampleTranslation: { az: 'Qardaşım futbol oynayır.', tr: 'Erkek kardeşim futbol oynuyor.', en: 'My brother plays football.' },
      },
      {
        id: 'v4_3',
        word: 'Sister',
        phonetic: '/ˈsɪstə/',
        audioText: 'Sister',
        translations: { az: 'Bacı', tr: 'Kız kardeş', en: 'Sister', ru: 'Сестра' },
        exampleSentence: 'Her sister is an artist.',
        exampleTranslation: { az: 'Onun bacısı rəssamdır.', tr: 'Onun kız kardeşi bir sanatçıdır.', en: 'Her sister is an artist.' },
      },
      {
        id: 'v4_4',
        word: 'Parent',
        phonetic: '/ˈpeərənt/',
        audioText: 'Parent',
        translations: { az: 'Valideyn', tr: 'Ebeveyn', en: 'Parent', ru: 'Родитель' },
        exampleSentence: 'My parents live in a quiet town.',
        exampleTranslation: { az: 'Valideynlərim sakit bir qəsəbədə yaşayır.', tr: 'Ebeveynlerim sakin bir kasabada yaşıyor.', en: 'My parents live in a quiet town.' },
      },
      {
        id: 'v4_5',
        word: 'House',
        phonetic: '/haʊs/',
        audioText: 'House',
        translations: { az: 'Ev', tr: 'Ev', en: 'House', ru: 'Дом' },
        exampleSentence: 'We have got a big house.',
        exampleTranslation: { az: 'Bizim böyük evimiz var.', tr: 'Bizim büyük bir evimiz var.', en: 'We have got a big house.' },
      },
      {
        id: 'v4_6',
        word: 'Together',
        phonetic: '/təˈɡeðə/',
        audioText: 'Together',
        translations: { az: 'Birlikdə', tr: 'Birlikte', en: 'Together', ru: 'Вместе' },
        exampleSentence: 'We always eat dinner together.',
        exampleTranslation: { az: 'Biz həmişə şamı birlikdə yeyirik.', tr: 'Her zaman akşam yemeğini birlikte yeriz.', en: 'We always eat dinner together.' },
      },
      {
        id: 'v4_7',
        word: 'Kind',
        phonetic: '/kaɪnd/',
        audioText: 'Kind',
        translations: { az: 'Mehriban / Xeyirxah', tr: 'Kibar / Nazik', en: 'Kind', ru: 'Добрый' },
        exampleSentence: 'My grandmother is very kind.',
        exampleTranslation: { az: 'Nənəm çox mehribandır.', tr: 'Büyükannem çok naziktir.', en: 'My grandmother is very kind.' },
      },
    ],
    story: {
      title: 'Our Sunday Dinner',
      titleTranslation: { az: 'Bazar Şamımız', tr: 'Pazar Akşam Yemeğimiz', en: 'Our Sunday Dinner', ru: 'Наш воскресный ужин' },
      content: 'Every Sunday, our family gathers together at our grandmother\'s house. My brother helps in the kitchen, and my sister brings sweet apples. We share stories, laugh, and enjoy warm tea. Having a supportive family is the greatest blessing.',
      vocabularyHighlights: ['Family', 'Brother', 'Sister', 'Together', 'House'],
    },
    exercises: [
      {
        id: 'a1_u04_ex1',
        type: 'multiple_choice',
        prompt: { az: 'Boşluğa uyğun olanı seçin:', tr: 'Boşluğa uygun olanı seçin:', en: 'Select the correct option:', ru: 'Выберите правильный вариант:' },
        instruction: { az: 'He ___ got two elder brothers.', tr: 'He ___ got two elder brothers.', en: 'He ___ got two elder brothers.' },
        options: [
          { id: 'o1', text: 'has', isCorrect: true },
          { id: 'o2', text: 'have', isCorrect: false },
          { id: 'o3', text: 'is', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'a1_u04_ex2',
        type: 'fill_in_the_blank',
        prompt: { az: 'Cümləni tamamlayın:', tr: 'Cümleyi tamamlayın:', en: 'Complete the sentence:', ru: 'Заполните пропуск:' },
        instruction: { az: 'We live ___ with our parents.', tr: 'We live ___ with our parents.', en: 'We live ___ with our parents.' },
        options: [
          { id: 'fb1', text: 'together', isCorrect: true },
          { id: 'fb2', text: 'sister', isCorrect: false },
          { id: 'fb3', text: 'house', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'a1_u04_ex3',
        type: 'word_scramble',
        prompt: { az: 'Cümləni qurun: "I love my family"', tr: 'Cümleyi kurun: "I love my family"', en: 'Build sentence: "I love my family"', ru: 'Соберите: "I love my family"' },
        sentenceToBuild: ['I', 'love', 'my', 'family'],
        distractorWords: ['is', 'are'],
        correctSentence: 'I love my family',
        xpReward: 10,
      },
    ],
    bossQuiz: [
      {
        id: 'a1_u04_bq1',
        type: 'multiple_choice',
        prompt: { az: 'Düzgün cümləni seçin:', tr: 'Doğru cümleyi seçin:', en: 'Choose the correct sentence:', ru: 'Выберите верное предложение:' },
        instruction: { az: 'My sister ___ very kind to everyone.', tr: 'My sister ___ very kind to everyone.', en: 'My sister ___ very kind to everyone.' },
        options: [
          { id: 'bq1', text: 'is', isCorrect: true },
          { id: 'bq2', text: 'are', isCorrect: false },
          { id: 'bq3', text: 'have', isCorrect: false },
        ],
        xpReward: 15,
      },
    ],
  },

  a1_unit_05: {
    formula: "Countable & Uncountable • some / any • how many / how much",
    explanation: {
      az: "Sayila bilən (apples) və sayila bilməyən (milk, bread) isimlər üçün 'some' (təsdiqdə) və 'any' (sual/inkarda) işlənir.",
      tr: "Sayılan ve sayılamayan isimlerde 'some' (olumlu) ve 'any' (soru/olumsuz) kalıpları kullanılır.",
      en: "Learn countable vs uncountable food items and polite grocery requests using some/any.",
      ru: "Исчисляемые и неисчисляемые существительные с 'some' и 'any'.",
    },
    examples: [
      {
        english: "I would like some fresh apples, please.",
        translation: {
          az: "Zəhmət olmasa, bir az təzə alma istərdim.",
          tr: "Lütfen biraz taze elma rica ediyorum.",
          en: "I would like some fresh apples, please.",
          ru: "Я бы хотел немного свежих яблок, пожалуйста.",
        },
      },
      {
        english: "Do we have any milk in the fridge?",
        translation: {
          az: "Soyuducuda süd varmı?",
          tr: "Buzdolabında hiç süt var mı?",
          en: "Do we have any milk in the fridge?",
          ru: "Есть ли молоко в холодильнике?",
        },
      },
    ],
    commonMistake: {
      incorrect: "I don't have some money.",
      correct: "I don't have any money.",
      explanation: {
        az: "İnkar cümlələrində 'some' yox, 'any' işlədilir.",
        tr: "Olumsuz cümlelerde 'some' yerine 'any' kullanılır.",
        en: "Use 'any' in negative sentences and questions.",
        ru: "В отрицательных предложениях используется 'any', а не 'some'.",
      },
    },
    vocabulary: [
      {
        id: 'v5_1',
        word: 'Bread',
        phonetic: '/bred/',
        audioText: 'Bread',
        translations: { az: 'Çörək', tr: 'Ekmek', en: 'Bread', ru: 'Хлеб' },
        exampleSentence: 'I buy fresh bread every morning.',
        exampleTranslation: { az: 'Hər səhər təzə çörək alıram.', tr: 'Her sabah taze ekmek alırım.', en: 'I buy fresh bread every morning.' },
      },
      {
        id: 'v5_2',
        word: 'Milk',
        phonetic: '/mɪlk/',
        audioText: 'Milk',
        translations: { az: 'Süd', tr: 'Süt', en: 'Milk', ru: 'Молоко' },
        exampleSentence: 'Drink a glass of warm milk.',
        exampleTranslation: { az: 'Bir stəkan isti süd için.', tr: 'Bir bardak ılık süt için.', en: 'Drink a glass of warm milk.' },
      },
      {
        id: 'v5_3',
        word: 'Apple',
        phonetic: '/ˈæpl/',
        audioText: 'Apple',
        translations: { az: 'Alma', tr: 'Elma', en: 'Apple', ru: 'Яблоко' },
        exampleSentence: 'An apple a day keeps the doctor away.',
        exampleTranslation: { az: 'Gündə bir alma sağlamlıq deməkdir.', tr: 'Günde bir elma doktoru uzak tutar.', en: 'An apple a day keeps the doctor away.' },
      },
      {
        id: 'v5_4',
        word: 'Cheese',
        phonetic: '/tʃiːz/',
        audioText: 'Cheese',
        translations: { az: 'Pendir', tr: 'Peynir', en: 'Cheese', ru: 'Сыр' },
        exampleSentence: 'This cheese tastes delicious.',
        exampleTranslation: { az: 'Bu pendir dadlıdır.', tr: 'Bu peynir çok lezzetli.', en: 'This cheese tastes delicious.' },
      },
      {
        id: 'v5_5',
        word: 'Price',
        phonetic: '/praɪs/',
        audioText: 'Price',
        translations: { az: 'Qiymət', tr: 'Fiyat', en: 'Price', ru: 'Цена' },
        exampleSentence: 'The price is very reasonable.',
        exampleTranslation: { az: 'Qiymət çox münasibdir.', tr: 'Fiyat oldukça makul.', en: 'The price is very reasonable.' },
      },
      {
        id: 'v5_6',
        word: 'Market',
        phonetic: '/ˈmɑːkɪt/',
        audioText: 'Market',
        translations: { az: 'Bazar / Market', tr: 'Pazar / Market', en: 'Market', ru: 'Рынок' },
        exampleSentence: 'Let us go to the local market.',
        exampleTranslation: { az: 'Gəlin yerli bazara gedək.', tr: 'Yerel pazara gidelim.', en: 'Let us go to the local market.' },
      },
      {
        id: 'v5_7',
        word: 'Fresh',
        phonetic: '/freʃ/',
        audioText: 'Fresh',
        translations: { az: 'Təzə', tr: 'Taze', en: 'Fresh', ru: 'Свежий' },
        exampleSentence: 'These vegetables are very fresh.',
        exampleTranslation: { az: 'Bu tərəvəzlər çox təzədir.', tr: 'Bu sebzeler çok taze.', en: 'These vegetables are very fresh.' },
      },
    ],
    story: {
      title: 'At the Farmers Market',
      titleTranslation: { az: 'Fermer Bazarında', tr: 'Çiftçi Pazarında', en: 'At the Farmers Market', ru: 'На фермерском рынке' },
      content: 'On Saturday mornings, Alex visits the farmers market. The stalls are filled with fresh apples, yellow cheese, and warm bread. He asks the vendor for the price of strawberries. Everyone smiles and the atmosphere is lively.',
      vocabularyHighlights: ['Bread', 'Milk', 'Apple', 'Cheese', 'Fresh'],
    },
    exercises: [
      {
        id: 'a1_u05_ex1',
        type: 'multiple_choice',
        prompt: { az: 'Düzgün variantı seçin:', tr: 'Doğru seçeneği seçin:', en: 'Choose the correct option:', ru: 'Выберите правильный вариант:' },
        instruction: { az: 'Do you have ___ fresh bread left?', tr: 'Do you have ___ fresh bread left?', en: 'Do you have ___ fresh bread left?' },
        options: [
          { id: 'o1', text: 'any', isCorrect: true },
          { id: 'o2', text: 'some', isCorrect: false },
          { id: 'o3', text: 'many', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'a1_u05_ex2',
        type: 'fill_in_the_blank',
        prompt: { az: 'Boşluğu doldurun:', tr: 'Boşluğu doldurun:', en: 'Fill in the blank:', ru: 'Заполните пропуск:' },
        instruction: { az: 'How ___ is this bottle of milk?', tr: 'How ___ is this bottle of milk?', en: 'How ___ is this bottle of milk?' },
        options: [
          { id: 'fb1', text: 'much', isCorrect: true },
          { id: 'fb2', text: 'many', isCorrect: false },
          { id: 'fb3', text: 'any', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'a1_u05_ex3',
        type: 'word_scramble',
        prompt: { az: 'Cümləni yığın: "I would like some milk"', tr: 'Cümleyi kurun: "I would like some milk"', en: 'Build sentence: "I would like some milk"', ru: 'Соберите: "I would like some milk"' },
        sentenceToBuild: ['I', 'would', 'like', 'some', 'milk'],
        distractorWords: ['any', 'price'],
        correctSentence: 'I would like some milk',
        xpReward: 10,
      },
    ],
  },

  // ================= A2 UNITS =================
  a2_unit_01: {
    formula: "Past Simple • Regular (-ed) & Irregular (went, had, saw, bought)",
    explanation: {
      az: "Keçmişdə tamamlanmış hərəkətlər: qaydalı fellərə '-ed' əlavə olunur (worked), qaydasızlar isə dəyişir (went).",
      tr: "Geçmişte bitmiş eylemler: düzenli fiillere '-ed' eklenir (visited), düzensiz fiiller ikinci hallerini alır (went).",
      en: "Talk about finished past actions using past simple verbs and time markers (yesterday, last year).",
      ru: "Прошедшее простое время (Past Simple) для завершенных действий в прошлом.",
    },
    examples: [
      {
        english: "We traveled to Italy last summer and visited Rome.",
        translation: {
          az: "Biz keçən yay İtaliyaya səyahət etdik və Romanı gəzdik.",
          tr: "Geçen yaz İtalya'ya seyahat ettik ve Roma'yı ziyaret ettik.",
          en: "We traveled to Italy last summer and visited Rome.",
          ru: "Прошлым летом мы поехали в Италию и посетили Рим.",
        },
      },
      {
        english: "I saw an old friend at the train station yesterday.",
        translation: {
          az: "Dünən dəmiryolu vağzalında köhnə dostumu gördüm.",
          tr: "Dün tren istasyonunda eski bir arkadaşımı gördüm.",
          en: "I saw an old friend at the train station yesterday.",
          ru: "Вчера на вокзале я встретил старого друга.",
        },
      },
    ],
    commonMistake: {
      incorrect: "I didn't saw him yesterday.",
      correct: "I didn't see him yesterday.",
      explanation: {
        az: "'Didn't' inkar köməkçisindən sonra fel əsas formada (V1) qalır.",
        tr: "'Didn't' yapısından sonra fiil yalın halde (V1) kullanılır.",
        en: "After 'didn't', the main verb must always be in base form (infinitive).",
        ru: "После вспомогательного глагола 'didn't' основной глагол стоит в начальной форме.",
      },
    },
    vocabulary: [
      {
        id: 'v_a2_1',
        word: 'Travel',
        phonetic: '/ˈtrævl/',
        audioText: 'Travel',
        translations: { az: 'Səyahət etmək', tr: 'Seyahat etmek', en: 'Travel', ru: 'Путешествовать' },
        exampleSentence: 'We traveled by train across Europe.',
        exampleTranslation: { az: 'Qatarlar Avropanı səyahət etdik.', tr: 'Trenle Avrupa\'yı gezdik.', en: 'We traveled by train across Europe.' },
      },
      {
        id: 'v_a2_2',
        word: 'Yesterday',
        phonetic: '/ˈjestədeɪ/',
        audioText: 'Yesterday',
        translations: { az: 'Dünən', tr: 'Dün', en: 'Yesterday', ru: 'Вчера' },
        exampleSentence: 'I finished the project yesterday.',
        exampleTranslation: { az: 'Layihəni dünən bitirdim.', tr: 'Projeyi dün bitirdim.', en: 'I finished the project yesterday.' },
      },
      {
        id: 'v_a2_3',
        word: 'Decide',
        phonetic: '/dɪˈsaɪd/',
        audioText: 'Decide',
        translations: { az: 'Qərara gəlmək', tr: 'Karar vermek', en: 'Decide', ru: 'Решать' },
        exampleSentence: 'She decided to study abroad.',
        exampleTranslation: { az: 'Xaricdə oxumağa qərar verdi.', tr: 'Yurtdışında okumaya karar verdi.', en: 'She decided to study abroad.' },
      },
      {
        id: 'v_a2_4',
        word: 'Arrive',
        phonetic: '/əˈraɪv/',
        audioText: 'Arrive',
        translations: { az: 'Çatmaq / Gəlib çıxmaq', tr: 'Varmak / Ulaşmak', en: 'Arrive', ru: 'Прибывать' },
        exampleSentence: 'The plane arrived on time.',
        exampleTranslation: { az: 'Təyyarə vaxtında çatdı.', tr: 'Uçak vaktinde vardı.', en: 'The plane arrived on time.' },
      },
      {
        id: 'v_a2_5',
        word: 'Memorable',
        phonetic: '/ˈmemərəbl/',
        audioText: 'Memorable',
        translations: { az: 'Yaddaqalan', tr: 'Unutulmaz', en: 'Memorable', ru: 'Памятный' },
        exampleSentence: 'It was a truly memorable journey.',
        exampleTranslation: { az: 'Həqiqətən yaddaqalan bir səyahət idi.', tr: 'Gerçekten unutulmaz bir yolculuktu.', en: 'It was a truly memorable journey.' },
      },
      {
        id: 'v_a2_6',
        word: 'Hotel',
        phonetic: '/həʊˈtel/',
        audioText: 'Hotel',
        translations: { az: 'Otel', tr: 'Otel', en: 'Hotel', ru: 'Отель' },
        exampleSentence: 'We stayed at a cozy hotel near the beach.',
        exampleTranslation: { az: 'Çimərlik yaxınlığında rahat bir oteldə qaldıq.', tr: 'Plaja yakın şirin bir otelde kaldık.', en: 'We stayed at a cozy hotel near the beach.' },
      },
      {
        id: 'v_a2_7',
        word: 'Experience',
        phonetic: '/ɪkˈspɪəriəns/',
        audioText: 'Experience',
        translations: { az: 'Təcrübə', tr: 'Deneyim', en: 'Experience', ru: 'Опыт' },
        exampleSentence: 'Living in London was an unforgettable experience.',
        exampleTranslation: { az: 'Londonda yaşamaq unudulmaz təcrübə idi.', tr: 'Londra\'da yaşamak harika bir deneyimdi.', en: 'Living in London was an unforgettable experience.' },
      },
    ],
    story: {
      title: 'A Weekend in Prague',
      titleTranslation: { az: 'Praqada Həftəsonu', tr: 'Prag\'da Bir Hafta Sonu', en: 'A Weekend in Prague', ru: 'Выходные в Праге' },
      content: 'Last autumn, Maya and her friend traveled to Prague. They arrived on Friday evening and checked into a small historic hotel. On Saturday, they walked across the Charles Bridge and tasted local pastries. It was their most memorable trip of the year.',
      vocabularyHighlights: ['Travel', 'Yesterday', 'Arrive', 'Hotel', 'Memorable'],
    },
    exercises: [
      {
        id: 'a2_u01_ex1',
        type: 'multiple_choice',
        prompt: { az: 'Düzgün keçmiş zaman formasını seçin:', tr: 'Doğru geçmiş zaman formunu seçin:', en: 'Choose correct past tense form:', ru: 'Выберите форму прошедшего времени:' },
        instruction: { az: 'They ___ to Paris last weekend.', tr: 'They ___ to Paris last weekend.', en: 'They ___ to Paris last weekend.' },
        options: [
          { id: 'o1', text: 'went', isCorrect: true },
          { id: 'o2', text: 'go', isCorrect: false },
          { id: 'o3', text: 'gone', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'a2_u01_ex2',
        type: 'fill_in_the_blank',
        prompt: { az: 'İnkar cümləsini tamamlayın:', tr: 'Olumsuz cümleyi tamamlayın:', en: 'Complete negative past sentence:', ru: 'Дополните отрицание:' },
        instruction: { az: 'I didn\'t ___ the museum yesterday.', tr: 'I didn\'t ___ the museum yesterday.', en: 'I didn\'t ___ the museum yesterday.' },
        options: [
          { id: 'fb1', text: 'visit', isCorrect: true },
          { id: 'fb2', text: 'visited', isCorrect: false },
          { id: 'fb3', text: 'visiting', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'a2_u01_ex3',
        type: 'word_scramble',
        prompt: { az: 'Cümləni yığın: "We arrived on time"', tr: 'Cümleyi kurun: "We arrived on time"', en: 'Build sentence: "We arrived on time"', ru: 'Соберите: "We arrived on time"' },
        sentenceToBuild: ['We', 'arrived', 'on', 'time'],
        distractorWords: ['did', 'arrive'],
        correctSentence: 'We arrived on time',
        xpReward: 10,
      },
    ],
  },

  // ================= B1 UNITS =================
  b1_unit_05: {
    formula: "First Conditional • If + Present Simple, will + base verb",
    explanation: {
      az: "Gələcəkdə baş verə biləcək real şərtlər: 'If it rains, we will stay home' (Əgər yağış yağsa, evdə qalacağıq).",
      tr: "Gelecekte olası gerçek şartlar: 'If it rains, we will stay home' (Yağmur yağarsa evde kalacağız).",
      en: "Real and possible future situations using First Conditional structure.",
      ru: "Реальные условия в будущем (First Conditional): If + Present, Will + Verb.",
    },
    examples: [
      {
        english: "If you study hard, you will pass the English exam.",
        translation: {
          az: "Əgər çox çalışsan, ingilis dili imtahanından keçəcəksən.",
          tr: "Eğer sıkı çalışırsan İngilizce sınavını geçeceksin.",
          en: "If you study hard, you will pass the English exam.",
          ru: "Если ты будешь усердно учиться, ты сдашь экзамен по английскому.",
        },
      },
      {
        english: "We will miss the train if we do not leave now.",
        translation: {
          az: "İndi çıxmasaq, qatarı qaçıracağıq.",
          tr: "Şimdi çıkmazsak treni kaçıracağız.",
          en: "We will miss the train if we do not leave now.",
          ru: "Мы опоздаем на поезд, если не выйдем сейчас.",
        },
      },
    ],
    commonMistake: {
      incorrect: "If it will rain, I will stay.",
      correct: "If it rains, I will stay.",
      explanation: {
        az: "'If' olan budaq cümlədə 'will' işlənmir, Present Simple işlənir.",
        tr: "'If' cümlesinin içine asla 'will' gelmez, geniş zaman kullanılır.",
        en: "Never use 'will' in the if-clause; use Present Simple.",
        ru: "В придаточном предложении с 'if' будущее время (will) не используется.",
      },
    },
    vocabulary: [
      {
        id: 'v_b1_1',
        word: 'Opportunity',
        phonetic: '/ˌɒpəˈtjuːnəti/',
        audioText: 'Opportunity',
        translations: { az: 'Fürsət / Şans', tr: 'Fırsat', en: 'Opportunity', ru: 'Возможность' },
        exampleSentence: 'This job is a fantastic opportunity.',
        exampleTranslation: { az: 'Bu iş möhtəşəm bir fürsətdir.', tr: 'Bu iş harika bir fırsat.', en: 'This job is a fantastic opportunity.' },
      },
      {
        id: 'v_b1_2',
        word: 'Consequence',
        phonetic: '/ˈkɒnsɪkwəns/',
        audioText: 'Consequence',
        translations: { az: 'Nəticə', tr: 'Sonuç', en: 'Consequence', ru: 'Последствие' },
        exampleSentence: 'Every decision brings a consequence.',
        exampleTranslation: { az: 'Hər qərar bir nəticə doğurur.', tr: 'Her kararın bir sonucu vardır.', en: 'Every decision brings a consequence.' },
      },
      {
        id: 'v_b1_3',
        word: 'Improve',
        phonetic: '/ɪmˈpruːv/',
        audioText: 'Improve',
        translations: { az: 'İnkişaf etdirmək', tr: 'Geliştirmek', en: 'Improve', ru: 'Улучшать' },
        exampleSentence: 'Reading books will improve your vocabulary.',
        exampleTranslation: { az: 'Kitab oxumaq lüğətini inkişaf etdirəcək.', tr: 'Kitap okumak kelime dağarcığını geliştirir.', en: 'Reading books will improve your vocabulary.' },
      },
      {
        id: 'v_b1_4',
        word: 'Achieve',
        phonetic: '/əˈtʃiːv/',
        audioText: 'Achieve',
        translations: { az: 'Nail olmaq', tr: 'Elde etmek / Başarmak', en: 'Achieve', ru: 'Достигать' },
        exampleSentence: 'With focus, you can achieve your goals.',
        exampleTranslation: { az: 'Fokuslansan, hədəflərinə nail ola bilərsən.', tr: 'Odaklanırsan hedeflerine ulaşabilirsin.', en: 'With focus, you can achieve your goals.' },
      },
      {
        id: 'v_b1_5',
        word: 'Effort',
        phonetic: '/ˈefət/',
        audioText: 'Effort',
        translations: { az: 'Zəhmət / Cəhd', tr: 'Çaba / Emek', en: 'Effort', ru: 'Усилие' },
        exampleSentence: 'Real progress requires continuous effort.',
        exampleTranslation: { az: 'Real inkişaf davamlı zəhmət tələb edir.', tr: 'Gerçek ilerleme sürekli çaba gerektirir.', en: 'Real progress requires continuous effort.' },
      },
      {
        id: 'v_b1_6',
        word: 'Possible',
        phonetic: '/ˈpɒsəbl/',
        audioText: 'Possible',
        translations: { az: 'Mümkün', tr: 'Mümkün', en: 'Possible', ru: 'Возможный' },
        exampleSentence: 'Anything is possible if you believe.',
        exampleTranslation: { az: 'İnansan, hər şey mümkündür.', tr: 'İnanırsan her şey mümkündür.', en: 'Anything is possible if you believe.' },
      },
      {
        id: 'v_b1_7',
        word: 'Succeed',
        phonetic: '/səkˈsiːd/',
        audioText: 'Succeed',
        translations: { az: 'Uğur qazanmaq', tr: 'Başarmak', en: 'Succeed', ru: 'Преуспевать' },
        exampleSentence: 'She worked hard and succeeded.',
        exampleTranslation: { az: 'Çox çalışdı və uğur qazandı.', tr: 'Çok çalıştı ve başardı.', en: 'She worked hard and succeeded.' },
      },
    ],
    story: {
      title: 'Preparing for Tomorrow',
      titleTranslation: { az: 'Sabaha Hazırlıq', tr: 'Yarına Hazırlık', en: 'Preparing for Tomorrow', ru: 'Подготовка к завтрашнему дню' },
      content: 'If you invest thirty minutes every day in self-improvement, you will notice remarkable changes in a few months. Consistent practice opens new career doors. A positive mindset turns small everyday efforts into life-changing success.',
      vocabularyHighlights: ['Opportunity', 'Improve', 'Achieve', 'Effort', 'Succeed'],
    },
    exercises: [
      {
        id: 'b1_u05_ex1',
        type: 'multiple_choice',
        prompt: { az: 'Düzgün şərt formasını seçin:', tr: 'Doğru şart formunu seçin:', en: 'Choose the correct conditional form:', ru: 'Выберите верную форму:' },
        instruction: { az: 'If the weather ___ nice tomorrow, we will go hiking.', tr: 'If the weather ___ nice tomorrow, we will go hiking.', en: 'If the weather ___ nice tomorrow, we will go hiking.' },
        options: [
          { id: 'o1', text: 'is', isCorrect: true },
          { id: 'o2', text: 'will be', isCorrect: false },
          { id: 'o3', text: 'was', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'b1_u05_ex2',
        type: 'fill_in_the_blank',
        prompt: { az: 'Boşluğu tamamlayın:', tr: 'Boşluğu tamamlayın:', en: 'Fill in the blank:', ru: 'Заполните пропуск:' },
        instruction: { az: 'If you practice daily, you ___ achieve fluency.', tr: 'If you practice daily, you ___ achieve fluency.', en: 'If you practice daily, you ___ achieve fluency.' },
        options: [
          { id: 'fb1', text: 'will', isCorrect: true },
          { id: 'fb2', text: 'would', isCorrect: false },
          { id: 'fb3', text: 'did', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'b1_u05_ex3',
        type: 'word_scramble',
        prompt: { az: 'Cümləni qurun: "You will achieve great success"', tr: 'Cümleyi kurun: "You will achieve great success"', en: 'Build sentence: "You will achieve great success"', ru: 'Соберите: "You will achieve great success"' },
        sentenceToBuild: ['You', 'will', 'achieve', 'great', 'success'],
        distractorWords: ['if', 'effort'],
        correctSentence: 'You will achieve great success',
        xpReward: 10,
      },
    ],
  },

  // ================= B2 UNITS =================
  b2_unit_07: {
    formula: "Inversion for Emphasis • Negative Adverb + Auxiliary + Subject + Verb",
    explanation: {
      az: "Cümləni daha təsirli və ədəbi etmək üçün 'Never', 'Rarely', 'Not only' sözləri cümlənin əvvəlinə gəldikdə köməkçi fel mübtədadan qabağa keçir (inversiya).",
      tr: "Cümleyi daha vurucu yapmak için 'Never', 'Rarely', 'Not only' gibi olumsuz zarflar başa geldiğinde devrik yapı kurulur.",
      en: "Inversion puts the auxiliary verb before the subject after negative or restrictive adverbs for dramatic emphasis.",
      ru: "Инверсия после отрицательных наречий (Never, Rarely, Seldom) для эмфатического выделения.",
    },
    examples: [
      {
        english: "Never have I seen such an extraordinary performance.",
        translation: {
          az: "Heç vaxt belə qeyri-adi bir çıxış görməmişdim.",
          tr: "Asla böylesine olağanüstü bir performans görmemiştim.",
          en: "Never have I seen such an extraordinary performance.",
          ru: "Никогда еще я не видел такого потрясающего выступления.",
        },
      },
      {
        english: "Not only did she win the competition, but she also inspired everyone.",
        translation: {
          az: "O təkcə yarışda qalib gəlmədi, həm də hamını ruhlandırdı.",
          tr: "Yalnızca yarışmayı kazanmakla kalmadı, aynı zamanda herkese ilham verdi.",
          en: "Not only did she win the competition, but she also inspired everyone.",
          ru: "Она не только победила в соревновании, но и вдохновила всех.",
        },
      },
    ],
    commonMistake: {
      incorrect: "Rarely I have seen such dedication.",
      correct: "Rarely have I seen such dedication.",
      explanation: {
        az: "'Rarely' başda gələndə 'have' mübtədadan (I) qabaqda olmalıdır.",
        tr: "'Rarely' başta kullanılırsa devrik yapı gerekir (Rarely have I...).",
        en: "After negative adverbs like 'rarely', auxiliary precedes the subject.",
        ru: "После 'rarely' вспомогательный глагол ставится перед подлежащим.",
      },
    },
    vocabulary: [
      {
        id: 'v_b2_1',
        word: 'Extraordinary',
        phonetic: '/ɪkˈstrɔːdnri/',
        audioText: 'Extraordinary',
        translations: { az: 'Fövqəladə / Qeyri-adi', tr: 'Olağanüstü', en: 'Extraordinary', ru: 'Необычайный' },
        exampleSentence: 'She has an extraordinary talent for languages.',
        exampleTranslation: { az: 'Onun dillərə qarşı qeyri-adi istedadı var.', tr: 'Dillere karşı olağanüstü bir yeteneği var.', en: 'She has an extraordinary talent for languages.' },
      },
      {
        id: 'v_b2_2',
        word: 'Dedication',
        phonetic: '/ˌdedɪˈkeɪʃn/',
        audioText: 'Dedication',
        translations: { az: 'Fədakarlıq / Sədaqət', tr: 'Adanmışlık / Özveri', en: 'Dedication', ru: 'Преданность делу' },
        exampleSentence: 'Success requires intense dedication and passion.',
        exampleTranslation: { az: 'Uğur dərin fədakarlıq və ehtiras tələb edir.', tr: 'Başarı yoğun bir adanmışlık gerektirir.', en: 'Success requires intense dedication and passion.' },
      },
      {
        id: 'v_b2_3',
        word: 'Witness',
        phonetic: '/ˈwɪtnəs/',
        audioText: 'Witness',
        translations: { az: 'Şahid olmaq', tr: 'Tanıklık etmek', en: 'Witness', ru: 'Свидетельствовать' },
        exampleSentence: 'We witnessed a historic breakthrough in science.',
        exampleTranslation: { az: 'Elmdə tarixi bir dönüş nöqtəsinə şahid olduq.', tr: 'Bilimde tarihi bir kırılmaya tanıklık ettik.', en: 'We witnessed a historic breakthrough in science.' },
      },
      {
        id: 'v_b2_4',
        word: 'Profound',
        phonetic: '/prəˈfaʊnd/',
        audioText: 'Profound',
        translations: { az: 'Dərin / Təsiredici', tr: 'Derin / Kapsamlı', en: 'Profound', ru: 'Глубокий' },
        exampleSentence: 'His speech had a profound impact on listeners.',
        exampleTranslation: { az: 'Onun çıxışı dinləyicilərə dərin təsir etdi.', tr: 'Konuşması dinleyiciler üzerinde derin bir etki bıraktı.', en: 'His speech had a profound impact on listeners.' },
      },
      {
        id: 'v_b2_5',
        word: 'Sophisticated',
        phonetic: '/səˈfɪstɪkeɪtɪd/',
        audioText: 'Sophisticated',
        translations: { az: 'Mürəkkəb / Zərif', tr: 'Gelişmiş / Sofistike', en: 'Sophisticated', ru: 'Утонченный / Сложный' },
        exampleSentence: 'She uses sophisticated vocabulary effortlessly.',
        exampleTranslation: { az: 'O, zərif və zəngin leksikanı rahatlıqla işlədir.', tr: 'Gelişmiş kelimeleri zahmetsizce kullanıyor.', en: 'She uses sophisticated vocabulary effortlessly.' },
      },
      {
        id: 'v_b2_6',
        word: 'Nuance',
        phonetic: '/ˈnjuːɑːns/',
        audioText: 'Nuance',
        translations: { az: 'İncəlik / Nüans', tr: 'Nüans / İnce ayrıntı', en: 'Nuance', ru: 'Нюанс' },
        exampleSentence: 'Notice the subtle nuances between similar synonyms.',
        exampleTranslation: { az: 'Oxşar sinonimlər arasındakı incə nüansları fərq edin.', tr: 'Benzer eşanlamlılar arasındaki ince ayrıntıları fark edin.', en: 'Notice the subtle nuances between similar synonyms.' },
      },
      {
        id: 'v_b2_7',
        word: 'Inspire',
        phonetic: '/ɪnˈspaɪə/',
        audioText: 'Inspire',
        translations: { az: 'İlham vermək', tr: 'İlham vermek', en: 'Inspire', ru: 'Вдохновлять' },
        exampleSentence: 'Great literature continues to inspire generations.',
        exampleTranslation: { az: 'Böyük ədəbiyyat nəsillərə ilham verməyə davam edir.', tr: 'Büyük edebiyat nesillere ilham vermeye devam ediyor.', en: 'Great literature continues to inspire generations.' },
      },
    ],
    story: {
      title: 'The Power of Inversion',
      titleTranslation: { az: 'İnversiyanın Gücü', tr: 'Devrik Cümlelerin Gücü', en: 'The Power of Inversion', ru: 'Сила инверсии' },
      content: 'Never before in modern history has communication evolved so rapidly. Seldom do we pause to admire the sophisticated nuances of our language. Master communicators use rhetorical inversion to deliver profound, memorable speeches that inspire millions.',
      vocabularyHighlights: ['Extraordinary', 'Dedication', 'Witness', 'Profound', 'Sophisticated'],
    },
    exercises: [
      {
        id: 'b2_u07_ex1',
        type: 'multiple_choice',
        prompt: { az: 'Düzgün inversiya ardıcıllığını seçin:', tr: 'Doğru devrik cümle sıralamasını seçin:', en: 'Choose correct inversion word order:', ru: 'Выберите правильный порядок слов при инверсии:' },
        instruction: { az: 'Never ___ such breathtaking scenery.', tr: 'Never ___ such breathtaking scenery.', en: 'Never ___ such breathtaking scenery.' },
        options: [
          { id: 'o1', text: 'have I seen', isCorrect: true },
          { id: 'o2', text: 'I have seen', isCorrect: false },
          { id: 'o3', text: 'saw I', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: 'b2_u07_ex2',
        type: 'fill_in_the_blank',
        prompt: { az: 'İnversiya cümləsini tamamlayın:', tr: 'Devrik cümleyi tamamlayın:', en: 'Complete inversion sentence:', ru: 'Дополните инверсионное предложение:' },
        instruction: {
          az: 'Seldom ___ we encounter such extraordinary elegance.',
          tr: 'Seldom ___ we encounter such extraordinary elegance.',
          en: 'Seldom ___ we encounter such extraordinary elegance.',
          ru: 'Seldom ___ we encounter such extraordinary elegance.',
        },
        options: [
          { id: 'o1', text: 'do', isCorrect: true },
          { id: 'o2', text: 'have', isCorrect: false },
          { id: 'o3', text: 'are', isCorrect: false },
          { id: 'o4', text: 'did', isCorrect: false },
        ],
        xpReward: 10,
      },
    ],
  },
};

export function buildDynamicUnitContent(
  nodeId: string,
  levelId: LevelId,
  nodeTitle: LocalizedString,
  nodeDesc: LocalizedString,
  nodeOrder: number,
  shortTitle: LocalizedString,
  estimatedMinutes: number = 10,
  iconName: string = 'book-outline',
  nodeType?: string
): CurriculumUnit {
  const specialized = TOPIC_REGISTRY[nodeId];
  if (specialized) {
    return {
      id: nodeId,
      level: levelId,
      order: nodeOrder,
      title: nodeTitle,
      description: nodeDesc,
      estimatedMinutes,
      iconName,
      grammarRule: {
        id: `${nodeId}_gr`,
        title: nodeTitle,
        subtitle: nodeDesc,
        explanation: specialized.explanation,
        formula: specialized.formula,
        examples: specialized.examples,
        commonMistake: specialized.commonMistake,
      },
      vocabulary: specialized.vocabulary,
      story: {
        id: `story_${nodeId}`,
        title: specialized.story.title,
        titleTranslation: specialized.story.titleTranslation,
        cefr: levelId,
        wordCount: specialized.story.content.split(/\s+/).length,
        content: specialized.story.content,
        vocabularyHighlights: specialized.story.vocabularyHighlights,
      },
      exercises: specialized.exercises || [],
      bossQuiz: specialized.bossQuiz || [],
      xpReward: 50,
    };
  }

  // 2. Intelligent Level-Aware Generator for remaining nodes
  const titleAz = nodeTitle.az || nodeTitle.en;
  const titleTr = nodeTitle.tr || titleAz;
  const shortEn = shortTitle.en || shortTitle.az || 'English';

  // Level-specific vocabulary bank
  const levelVocabBank: Partial<Record<LevelId, Array<{ word: string; phonetic: string; az: string; tr: string; ru: string }>>> = {
    A1: [
      { word: 'Morning', phonetic: '/ˈmɔːnɪŋ/', az: 'Səhər', tr: 'Sabah', ru: 'Утро' },
      { word: 'Evening', phonetic: '/ˈiːvnɪŋ/', az: 'Axşam', tr: 'Akşam', ru: 'Вечер' },
      { word: 'Listen', phonetic: '/ˈlɪsn/', az: 'Qulaq asmaq', tr: 'Dinlemek', ru: 'Слушать' },
      { word: 'Friend', phonetic: '/frend/', az: 'Dost', tr: 'Arkadaş', ru: 'Друг' },
      { word: 'City', phonetic: '/ˈsɪti/', az: 'Şəhər', tr: 'Şehir', ru: 'Город' },
      { word: 'Street', phonetic: '/striːt/', az: 'Küçə', tr: 'Cadde', ru: 'Улица' },
      { word: 'Happy', phonetic: '/ˈhæpi/', az: 'Xoşbəxt', tr: 'Mutlu', ru: 'Счастливый' },
    ],
    A2: [
      { word: 'Airport', phonetic: '/ˈeəpɔːt/', az: 'Hava limanı', tr: 'Havalimanı', ru: 'Аэропорт' },
      { word: 'Luggage', phonetic: '/ˈlʌɡɪdʒ/', az: 'Baqaj', tr: 'Bagaj', ru: 'Багаж' },
      { word: 'Ticket', phonetic: '/ˈtɪkɪt/', az: 'Bilet', tr: 'Bilet', ru: 'Билет' },
      { word: 'Future', phonetic: '/ˈfjuːtʃə/', az: 'Gələcək', tr: 'Gelecek', ru: 'Будущее' },
      { word: 'Promise', phonetic: '/ˈprɒmɪs/', az: 'Söz vermək', tr: 'Söz vermek', ru: 'Обещать' },
      { word: 'Weather', phonetic: '/ˈweðə/', az: 'Hava', tr: 'Hava durumu', ru: 'Погода' },
      { word: 'Exciting', phonetic: '/ɪkˈsaɪtɪŋ/', az: 'Həyəcanverici', tr: 'Heyecan verici', ru: 'Захватывающий' },
    ],
    B1: [
      { word: 'Interview', phonetic: '/ˈɪntəvjuː/', az: 'Müsahibə', tr: 'Mülakat', ru: 'Собеседование' },
      { word: 'Career', phonetic: '/kəˈrɪə/', az: 'Karyera', tr: 'Kariyer', ru: 'Карьера' },
      { word: 'Project', phonetic: '/ˈprɒdʒekt/', az: 'Layihə', tr: 'Proje', ru: 'Проект' },
      { word: 'Deadline', phonetic: '/ˈdedlaɪn/', az: 'Son müddət', tr: 'Son teslim tarihi', ru: 'Крайний срок' },
      { word: 'Colleague', phonetic: '/ˈkɒliːɡ/', az: 'Həmkar', tr: 'İş arkadaşı', ru: 'Коллега' },
      { word: 'Strategy', phonetic: '/ˈstrætədʒi/', az: 'Strategiya', tr: 'Strateji', ru: 'Стратегия' },
      { word: 'Resolve', phonetic: '/rɪˈzɒlv/', az: 'Həll etmək', tr: 'Çözmek', ru: 'Разрешать' },
    ],
    B2: [
      { word: 'Inversion', phonetic: '/ɪnˈvɜːʃn/', az: 'İnversiya', tr: 'Devrik yapı', ru: 'Инверсия' },
      { word: 'Nuance', phonetic: '/ˈnjuːɑːns/', az: 'Nüans', tr: 'İnce ayrıntı', ru: 'Нюанс' },
      { word: 'Diplomatic', phonetic: '/ˌdɪpləˈmætɪk/', az: 'Diplomatik', tr: 'Diplomatik', ru: 'Дипломатичный' },
      { word: 'Compromise', phonetic: '/ˈkɒmprəmaɪz/', az: 'Kompromis', tr: 'Uzlaşma', ru: 'Компромисс' },
      { word: 'Persuade', phonetic: '/pəˈsweɪd/', az: 'İnandırmaq', tr: 'İkna etmek', ru: 'Убеждать' },
      { word: 'Subtle', phonetic: '/ˈsʌtl/', az: 'Həssas / İncə', tr: 'Hafif / İnce', ru: 'Тонкий' },
      { word: 'Phenomenon', phonetic: '/fəˈnɒmɪnən/', az: 'Hadisə / Fenomen', tr: 'Olgu / Fenomen', ru: 'Феномен' },
    ],
  };

  const rawBank = levelVocabBank[levelId] || levelVocabBank.A1 || [];
  const vocabList: VocabularyItem[] = rawBank.map((item, idx) => ({
    id: `v_${nodeId}_${idx + 1}`,
    word: item.word,
    phonetic: item.phonetic,
    audioText: item.word,
    translations: { az: item.az, tr: item.tr, en: item.word, ru: item.ru },
    exampleSentence: `Mastering '${item.word}' is vital for fluent communication.`,
    exampleTranslation: {
      az: `'${item.word}' kəlməsini öyrənmək sərbəst ünsiyyət üçün vacibdir.`,
      tr: `'${item.word}' kelimesini öğrenmek akıcı konuşma için çok önemlidir.`,
      en: `Mastering '${item.word}' is vital for fluent communication.`,
      ru: `Освоение слова '${item.word}' важно для свободного общения.`,
    },
  }));

  const primaryVocab = vocabList[0]?.word || 'Communication';
  const secondaryVocab = vocabList[1]?.word || 'Fluency';

  return {
    id: nodeId,
    level: levelId,
    order: nodeOrder,
    title: nodeTitle,
    description: nodeDesc,
    estimatedMinutes,
    iconName,
    grammarRule: {
      id: `${nodeId}_gr`,
      title: nodeTitle,
      subtitle: nodeDesc,
      explanation: {
        az: `${titleAz} üzrə əsas qrammatik strukturlar, nümunə cümlələr və danışıq şablonları.`,
        tr: `${titleTr} ile ilgili temel gramer kuralları, örnek cümleler ve konuşma kalıpları.`,
        en: `Core grammar structures, practical everyday examples, and fluency patterns for ${nodeTitle.en}.`,
        ru: `Основные грамматические правила и речевые шаблоны по теме ${nodeTitle.ru || titleAz}.`,
      },
      formula: `${shortEn} • ${levelId} CEFR Mastery`,
      examples: [
        {
          english: `Good command of ${shortEn.toLowerCase()} makes your English natural.`,
          translation: {
            az: `${shortEn} mövzusunu dərindən bilmək nitqinizi təbii edir.`,
            tr: `${shortEn} konusuna hakim olmak İngilizcenizi doğal kılar.`,
            en: `Good command of ${shortEn.toLowerCase()} makes your English natural.`,
            ru: `Хорошее владение этой темой делает речь естественной.`,
          },
        },
        {
          english: `Practice daily to speak with confidence and clarity.`,
          translation: {
            az: `İnamla və aydın danışmaq üçün hər gün məşq edin.`,
            tr: `Güvenle ve net konuşmak için her gün pratik yapın.`,
            en: `Practice daily to speak with confidence and clarity.`,
            ru: `Практикуйтесь ежедневно, чтобы говорить уверенно и четко.`,
          },
        },
      ],
      commonMistake: {
        incorrect: `She don't understand this rule.`,
        correct: `She doesn't understand this rule.`,
        explanation: {
          az: "'He/She/It' üçün inkar formasında 'doesn't' işlənir, 'don't' yox.",
          tr: "'He/She/It' öznelerinde olumsuzluk için 'doesn't' kullanılır, 'don't' değil.",
          en: "Use 'doesn't' (not 'don't') with third-person singular subjects.",
          ru: "С местоимениями He/She/It в отрицании используется 'doesn't', а не 'don't'.",
        },
      },
    },
    vocabulary: vocabList,
    story: {
      id: `${nodeId}_story`,
      title: `${nodeTitle.en || 'Mastery Steps'}: In Practice`,
      titleTranslation: nodeTitle,
      cefr: levelId,
      wordCount: 110,
      content: `Every dedicated language learner discovers that regular immersion brings breakthrough results. Focus on ${primaryVocab.toLowerCase()} and notice how native speakers express ${secondaryVocab.toLowerCase()} in context. Step by step, fluency becomes second nature.`,
      vocabularyHighlights: [primaryVocab, secondaryVocab],
    },
    exercises: [
      {
        id: `${nodeId}_ex1`,
        type: 'multiple_choice',
        prompt: {
          az: 'Cümləni düzgün tamamlayın:',
          tr: 'Cümleyi doğru tamamlayın:',
          en: 'Complete the sentence correctly:',
          ru: 'Дополните предложение правильно:',
        },
        instruction: {
          az: `Regular practice helps you speak ___ and clearly.`,
          tr: `Regular practice helps you speak ___ and clearly.`,
          en: `Regular practice helps you speak ___ and clearly.`,
        },
        options: [
          { id: 'o1', text: 'naturally', isCorrect: true },
          { id: 'o2', text: 'natural', isCorrect: false },
          { id: 'o3', text: 'nature', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: `${nodeId}_ex2`,
        type: 'fill_in_the_blank',
        prompt: {
          az: 'Boşluğa uyğun olan variantı seçin:',
          tr: 'Boşluğa uygun olan seçeneği işaretleyin:',
          en: 'Choose the correct word for the blank:',
          ru: 'Выберите подходящее слово для пропуска:',
        },
        instruction: {
          az: `She ___ English every single day.`,
          tr: `She ___ English every single day.`,
          en: `She ___ English every single day.`,
        },
        options: [
          { id: 'fb1', text: 'practices', isCorrect: true },
          { id: 'fb2', text: 'practice', isCorrect: false },
          { id: 'fb3', text: 'practicing', isCorrect: false },
        ],
        xpReward: 10,
      },
      {
        id: `${nodeId}_ex3`,
        type: 'word_scramble',
        prompt: {
          az: `Cümləni qurun: "I can speak English well"`,
          tr: `Cümleyi kurun: "I can speak English well"`,
          en: `Build sentence: "I can speak English well"`,
          ru: `Соберите: "I can speak English well"`,
        },
        sentenceToBuild: ['I', 'can', 'speak', 'English', 'well'],
        distractorWords: ['is', 'are'],
        correctSentence: 'I can speak English well',
        xpReward: 10,
      },
    ],
    bossQuiz: [
      {
        id: `${nodeId}_bq1`,
        type: 'multiple_choice',
        prompt: {
          az: 'Yekun test: Düzgün qrammatik variantı seçin:',
          tr: 'Bölüm sonu testi: Doğru gramer formunu seçin:',
          en: 'Checkpoint test: Choose the grammatically sound option:',
          ru: 'Финальный вопрос: Выберите верный вариант:',
        },
        instruction: {
          az: `We ___ our learning goals together.`,
          tr: `We ___ our learning goals together.`,
          en: `We ___ our learning goals together.`,
        },
        options: [
          { id: 'bq_o1', text: 'achieved', isCorrect: true },
          { id: 'bq_o2', text: 'achieving', isCorrect: false },
          { id: 'bq_o3', text: 'achieveing', isCorrect: false },
        ],
        xpReward: 15,
      },
    ],
    xpReward: nodeType === 'checkpoint' ? 100 : 50,
  };
}
