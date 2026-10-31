import type {
  CurriculumExercise,
  CurriculumUnit,
  LevelId,
  LocalizedString,
  VocabularyItem,
} from '@/types/curriculum';

export interface TopicBlueprint {
  formula: string;
  explanation: LocalizedString;
  commonMistake: {
    incorrect: string;
    correct: string;
    explanation: LocalizedString;
  };
  chunks: Array<{
    word: string;
    phonetic: string;
    audioText: string;
    translations: LocalizedString;
    exampleSentence: string;
    exampleTranslation: LocalizedString;
  }>;
  dialogue: {
    title: string;
    titleTranslation: LocalizedString;
    lines: string[];
  };
  scrambleTask: {
    meaningPrompt: LocalizedString; // Native meaning OR conversational question in English when UI is 'en'
    sentenceToBuild: string[];
    distractorWords: string[];
    correctSentence: string;
  };
  blankTask: {
    sentenceWithBlank: string; // e.g., "Hi, ___ Alex."
    options: [string, string, string]; // First is correct
  };
  listenTask: {
    audioPrompt: string;
    options: [string, string, string]; // First is correct
  };
  bossTask: {
    meaningPrompt: LocalizedString;
    sentenceToBuild: string[];
    distractorWords: string[];
    correctSentence: string;
  };
}

/**
 * Helper to create a 13-language LocalizedString for curriculum content.
 * Ensures that even if a user's UI language is 'en', 'es', 'de', 'fr', 'it', 'pt', 'pl', 'cs', 'hu', or 'uk',
 * they NEVER get a raw English duplicate of a scramble answer!
 */
function ML(
  az: string,
  en: string,
  tr: string,
  ru: string,
  extra?: Partial<Record<'es' | 'de' | 'fr' | 'it' | 'pt' | 'pl' | 'cs' | 'hu' | 'uk', string>>
): LocalizedString {
  return {
    az,
    en,
    tr,
    ru,
    es: extra?.es || en,
    de: extra?.de || en,
    fr: extra?.fr || en,
    it: extra?.it || en,
    pt: extra?.pt || en,
    pl: extra?.pl || en,
    cs: extra?.cs || en,
    hu: extra?.hu || en,
    uk: extra?.uk || ru || en,
  };
}

/**
 * Master International Registry of Story-Driven Lexical Immersion Topics (A0 -> C1).
 * Designed by a 10+ Year International TESOL/CELTA Curriculum Director.
 * ZERO English-to-English word-scramble copy errors!
 */
export const IMMERSION_BLUEPRINTS: Record<string, TopicBlueprint> = {
  // ============================================================================
  // LEVEL A0: FIRST SPARK & SURVIVAL CHUNKS (PRE-BEGINNER)
  // ============================================================================
  a0_unit_01: {
    formula: "Hello! • Thank you! • Excuse me",
    explanation: ML(
      "İlk gündən ingiliscə ünsiyyətə başlamaq üçün ən vacib 3 sehrli ifadə: 'Hello' (Salam), 'Thank you' (Təşəkkür edirəm) və 'Excuse me' (Bağışlayın / İcazənizlə).",
      "Three magic survival chunks to start speaking from day one: 'Hello' to greet, 'Thank you' to show gratitude, and 'Excuse me' to get attention politely.",
      "İlk günden konuşmaya başlamak için 3 sihirli kalıp: 'Hello' (Merhaba), 'Thank you' (Teşekkür ederim) ve 'Excuse me' (Affedersiniz).",
      "Три ключевые фразы для общения с первого дня: 'Hello' (Привет), 'Thank you' (Спасибо) и 'Excuse me' (Извините).",
      {
        es: "Tres frases mágicas para hablar desde el primer día: 'Hello', 'Thank you' y 'Excuse me'.",
        de: "Drei magische Phrasen für den ersten Tag: 'Hello', 'Thank you' und 'Excuse me'.",
        fr: "Trois expressions clés dès le premier jour : 'Hello', 'Thank you' et 'Excuse me'.",
      }
    ),
    commonMistake: {
      incorrect: "Thanks you!",
      correct: "Thank you! (or Thanks!)",
      explanation: ML(
        "Ya 'Thank you', ya da təkcə 'Thanks' deyin. İkisini qarışdırıb 'Thanks you' deməyin.",
        "Say either 'Thank you' or 'Thanks'—never combine them into 'Thanks you'.",
        "Ya 'Thank you' ya da sadece 'Thanks' deyin. 'Thanks you' denmez.",
        "Говорите либо 'Thank you', либо 'Thanks', но не 'Thanks you'."
      ),
    },
    chunks: [
      {
        word: "Hello! How are you?",
        phonetic: "/həˈləʊ haʊ ɑː juː/",
        audioText: "Hello! How are you?",
        translations: ML("Salam! Necəsən?", "Greeting someone warmly", "Merhaba! Nasılsın?", "Привет! Как дела?", {
          es: "¡Hola! ¿Cómo estás?", de: "Hallo! Wie geht es dir?", fr: "Bonjour ! Comment ça va ?", it: "Ciao! Come stai?", pt: "Olá! Como vai?"
        }),
        exampleSentence: "Hello! How are you today?",
        exampleTranslation: ML("Salam! Bu gün necəsən?", "Friendly daily greeting", "Merhaba! Bugün nasılsın?", "Привет! Как ты сегодня?"),
      },
      {
        word: "Thank you very much",
        phonetic: "/θæŋk juː ˈveri mʌtʃ/",
        audioText: "Thank you very much",
        translations: ML("Çox təşəkkür edirəm", "Expressing warm gratitude", "Çok teşekkür ederim", "Большое спасибо", {
          es: "Muchas gracias", de: "Vielen Dank", fr: "Merci beaucoup", it: "Grazie mille", pt: "Muito obrigado"
        }),
        exampleSentence: "Thank you very much for your help!",
        exampleTranslation: ML("Köməyiniz üçün çox təşəkkür edirəm!", "Thanking someone for assistance", "Yardımınız için çok teşekkür ederim!", "Большое спасибо за помощь!"),
      },
      {
        word: "Excuse me, please",
        phonetic: "/ɪkˈskjuːz miː pliːz/",
        audioText: "Excuse me, please",
        translations: ML("Bağışlayın, zəhmət olmasa", "Polite way to ask or pass by", "Affedersiniz, lütfen", "Извините, пожалуйста", {
          es: "Disculpe, por favor", de: "Entschuldigung, bitte", fr: "Excusez-moi, s'il vous plaît", it: "Mi scusi, per favore", pt: "Com licença, por favor"
        }),
        exampleSentence: "Excuse me, please! Are you Emma?",
        exampleTranslation: ML("Bağışlayın! Siz Emmasınız?", "Politely getting someone's attention", "Affedersiniz! Siz Emma mısınız?", "Извините! Вы Эмма?"),
      },
    ],
    dialogue: {
      title: "At the Airport Gate",
      titleTranslation: ML("Hava Limanı Qapısında", "At the Airport Gate", "Havalimanı Kapısında", "У выхода в аэропорту"),
      lines: [
        "Emma: \"Excuse me, please!\"",
        "You: \"Hello! How are you?\"",
        "Emma: \"I am fine! Thank you very much.\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Çox təşəkkür edirəm",
        "Situation: Someone hands you your passport. Thank them warmly:",
        "Çok teşekkür ederim",
        "Большое спасибо",
        { es: "Muchas gracias", de: "Vielen Dank", fr: "Merci beaucoup", it: "Grazie mille", pt: "Muito obrigado", pl: "Dziękuję bardzo", cs: "Mnohokrát děkuji", hu: "Nagyon köszönöm", uk: "Дуже дякую" }
      ),
      sentenceToBuild: ["Thank", "you", "very", "much"],
      distractorWords: ["please", "hello"],
      correctSentence: "Thank you very much",
    },
    blankTask: {
      sentenceWithBlank: "Excuse ___, please!",
      options: ["me", "you", "my"],
    },
    listenTask: {
      audioPrompt: "Hello! How are you?",
      options: ["Hello! How are you?", "Thank you very much", "Goodbye my friend"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Bağışlayın, zəhmət olmasa",
        "Situation: Politely get someone's attention in a lobby:",
        "Affedersiniz, lütfen",
        "Извините, пожалуйста",
        { es: "Disculpe, por favor", de: "Entschuldigung, bitte", fr: "Excusez-moi, s'il vous plaît" }
      ),
      sentenceToBuild: ["Excuse", "me,", "please"],
      distractorWords: ["thank", "are"],
      correctSentence: "Excuse me, please",
    },
  },

  a0_unit_02: {
    formula: "I'm from... • Where are you from?",
    explanation: ML(
      "Haradan olduğunuzu demək və qarşı tərəfdən soruşmaq üçün hazır danışıq qəlibi: 'Where are you from?' (Haradansınız?) ➔ 'I'm from Baku' (Mən Bakıdanam).",
      "Ask someone's origin with 'Where are you from?' and reply naturally with 'I'm from [City/Country]'.",
      "Nereli olduğunuzu söylemek ve sormak için hazır kalıp: 'Where are you from?' (Nerelisin?) ➔ 'I'm from Istanbul'.",
      "Чтобы спросить, откуда человек, скажите 'Where are you from?', а ответьте: 'I'm from...'"
    ),
    commonMistake: {
      incorrect: "Where you are from?",
      correct: "Where are you from?",
      explanation: ML(
        "Sual verərkən həmişə 'Where are you...' ardıcıllığını saxlayın.",
        "Keep the natural rhythm: 'Where are you from?'",
        "Soru sorarken her zaman 'Where are you from?' dizilimini koruyun.",
        "В вопросе всегда сохраняйте порядок слов: 'Where are you from?'"
      ),
    },
    chunks: [
      {
        word: "Where are you from?",
        phonetic: "/weər ɑː juː frɒm/",
        audioText: "Where are you from?",
        translations: ML("Haradansınız? (Haralısınız?)", "Asking someone's home country or city", "Nerelisiniz?", "Откуда вы?", {
          es: "¿De dónde eres?", de: "Woher kommst du?", fr: "D'où venez-vous ?", it: "Di dove sei?", pt: "De onde você é?"
        }),
        exampleSentence: "Hi! Where are you from?",
        exampleTranslation: ML("Salam! Siz haradansınız?", "Friendly question on first meeting", "Merhaba! Nerelisiniz?", "Привет! Откуда ты?"),
      },
      {
        word: "I'm from...",
        phonetic: "/aɪm frɒm/",
        audioText: "I'm from London",
        translations: ML("Mən ...-danam", "Stating your city or country", "Ben ...-lıyım", "Я из...", {
          es: "Soy de...", de: "Ich komme aus...", fr: "Je viens de...", it: "Sono di...", pt: "Eu sou de..."
        }),
        exampleSentence: "I'm from London. Nice to meet you!",
        exampleTranslation: ML("Mən Londondanam. Tanışlığımıza şadam!", "Introducing your hometown", "Ben Londralıyım. Tanıştığıma memnun oldum!", "Я из Лондона. Приятно познакомиться!"),
      },
      {
        word: "Welcome to our city",
        phonetic: "/ˈwelkəm tuː ˈaʊə ˈsɪti/",
        audioText: "Welcome to our city",
        translations: ML("Şəhərimizə xoş gəlmisiniz", "Warmly welcoming a visitor", "Şehrimize hoş geldiniz", "Добро пожаловать в наш город", {
          es: "Bienvenido a nuestra ciudad", de: "Willkommen in unserer Stadt", fr: "Bienvenue dans notre ville"
        }),
        exampleSentence: "Welcome to our city, David!",
        exampleTranslation: ML("Şəhərimizə xoş gəlmisiniz, David!", "Greeting a guest", "Şehrimize hoş geldin, David!", "Добро пожаловать в наш город, Дэвид!"),
      },
    ],
    dialogue: {
      title: "In the Hotel Lobby",
      titleTranslation: ML("Otel Foyesində", "In the Hotel Lobby", "Otel Lobisinde", "В холле отеля"),
      lines: [
        "Reception: \"Hello! Where are you from?\"",
        "You: \"Hi! I'm from London.\"",
        "Reception: \"Wonderful! Welcome to our city!\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Siz haradansınız?",
        "Situation: Ask a new traveler which country or city they come from:",
        "Nerelisiniz?",
        "Откуда вы?",
        { es: "¿De dónde eres?", de: "Woher kommst du?", fr: "D'où venez-vous ?", it: "Di dove sei?", pt: "De onde você é?", pl: "Skąd jesteś?", cs: "Odkud jsi?", hu: "Honnan származol?", uk: "Звідки ви?" }
      ),
      sentenceToBuild: ["Where", "are", "you", "from?"],
      distractorWords: ["is", "who"],
      correctSentence: "Where are you from?",
    },
    blankTask: {
      sentenceWithBlank: "Hi! I'm ___ London.",
      options: ["from", "to", "at"],
    },
    listenTask: {
      audioPrompt: "Welcome to our city",
      options: ["Welcome to our city", "Where are you from", "See you tomorrow"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Şəhərimizə xoş gəlmisiniz",
        "Situation: Warmly welcome a visitor arriving in your hometown:",
        "Şehrimize hoş geldiniz",
        "Добро пожаловать в наш город"
      ),
      sentenceToBuild: ["Welcome", "to", "our", "city"],
      distractorWords: ["from", "are"],
      correctSentence: "Welcome to our city",
    },
  },

  a0_unit_03: {
    formula: "This is my... • Here is my passport",
    explanation: ML(
      "Yanınızdakı əşyanı və ya insanı göstərərkən 'This is my...' (Bu mənim ...-dir) və ya təqdim edərkən 'Here is...' (Buyurun, budur...) qəlibini işlədin.",
      "Introduce objects or people near you using 'This is my...' and hand over items with 'Here is...'.",
      "Yanınızdaki eşyayı veya kişiyi gösterirken 'This is my...' (Bu benim...), uzatırken 'Here is...' (İşte burada) kalıbını kullanın.",
      "Представляйте людей или вещи фразой 'This is my...', а подавая что-то, говорите 'Here is...'"
    ),
    commonMistake: {
      incorrect: "This my ticket.",
      correct: "This is my ticket.",
      explanation: ML(
        "İngiliscə 'is' bağlayıcısını unutmayın: 'This is my ticket'.",
        "Always include 'is' after 'This' in singular statements.",
        "'This' kelimesinden sonra 'is' getirmeyi unutmayın.",
        "Не забывайте глагол 'is': 'This is my ticket'."
      ),
    },
    chunks: [
      {
        word: "This is my bag",
        phonetic: "/ðɪs ɪz maɪ bæɡ/",
        audioText: "This is my bag",
        translations: ML("Bu mənim çantamdır", "Identifying your personal item", "Bu benim çantam", "Это моя сумка", {
          es: "Este es mi bolso", de: "Das ist meine Tasche", fr: "C'est mon sac"
        }),
        exampleSentence: "Excuse me, this is my bag.",
        exampleTranslation: ML("Bağışlayın, bu mənim çantamdır.", "Pointing out your luggage", "Affedersiniz, bu benim çantam.", "Извините, это моя сумка."),
      },
      {
        word: "Here is my ticket",
        phonetic: "/hɪər ɪz maɪ ˈtɪkɪt/",
        audioText: "Here is my ticket",
        translations: ML("Buyurun, bu da mənim biletim", "Handing your ticket to an agent", "Buyurun, işte biletim", "Вот мой билет", {
          es: "Aquí está mi billete", de: "Hier ist mein Ticket", fr: "Voici mon billet"
        }),
        exampleSentence: "Here is my ticket and passport.",
        exampleTranslation: ML("Buyurun, biletim və pasportum.", "At the boarding desk", "İşte biletim ve pasaportum.", "Вот мой билет и паспорт."),
      },
      {
        word: "Is this your phone?",
        phonetic: "/ɪz ðɪs jɔː fəʊn/",
        audioText: "Is this your phone?",
        translations: ML("Bu sənin telefonundur?", "Asking if an item belongs to someone", "Bu senin telefonun mu?", "Это твой телефон?", {
          es: "¿Es este tu teléfono?", de: "Ist das dein Handy?", fr: "Est-ce ton téléphone ?"
        }),
        exampleSentence: "Excuse me, is this your phone?",
        exampleTranslation: ML("Bağışlayın, bu sizin telefonunuzdur?", "Helping someone who dropped their phone", "Affedersiniz, bu sizin telefonunuz mu?", "Извините, это ваш телефон?"),
      },
    ],
    dialogue: {
      title: "At the Check-in Desk",
      titleTranslation: ML("Qeydiyyat Masasında", "At the Check-in Desk", "Kayıt Masasında", "На стойке регистрации"),
      lines: [
        "Agent: \"Hello! Is this your bag?\"",
        "You: \"Yes, this is my bag. Here is my ticket.\"",
        "Agent: \"Thank you! Have a nice flight.\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Bu mənim çantamdır",
        "Situation: Point to your suitcase and tell the agent it belongs to you:",
        "Bu benim çantam",
        "Это моя сумка",
        { es: "Este es mi bolso", de: "Das ist meine Tasche", fr: "C'est mon sac", it: "Questa è la mia borsa", pt: "Esta é a minha bolsa", pl: "To jest moja torba", cs: "To je moje taška", hu: "Ez az én táskám", uk: "Це моя сумка" }
      ),
      sentenceToBuild: ["This", "is", "my", "bag"],
      distractorWords: ["your", "are"],
      correctSentence: "This is my bag",
    },
    blankTask: {
      sentenceWithBlank: "Here ___ my ticket.",
      options: ["is", "are", "am"],
    },
    listenTask: {
      audioPrompt: "Is this your phone?",
      options: ["Is this your phone?", "This is my house", "Where are you from?"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Bu sənin telefonundur?",
        "Situation: You found a phone on the table. Ask your friend if it belongs to them:",
        "Bu senin telefonun mu?",
        "Это твой телефон?"
      ),
      sentenceToBuild: ["Is", "this", "your", "phone?"],
      distractorWords: ["my", "are"],
      correctSentence: "Is this your phone?",
    },
  },

  a0_unit_04: {
    formula: "Can I have water, please? • A table for two",
    explanation: ML(
      "Su, çay və ya kömək istəyərkən ən təbii sual qəlibi: 'Can I have..., please?' (Zəhmət olmasa, ... ala bilərəmmi?).",
      "Ask for water, food, or help anywhere in the world using the polite chunk: 'Can I have..., please?'.",
      "Su, çay veya bir şey isterken en doğal kalıp: 'Can I have..., please?' (... alabilir miyim lütfen?).",
      "Самый естественный способ попросить воды или еды: 'Can I have..., please?'"
    ),
    commonMistake: {
      incorrect: "Give me water.",
      correct: "Can I have some water, please?",
      explanation: ML(
        "'Give me' əmr kimi kobud çıxır. Həmişə 'Can I have..., please?' deyin.",
        "'Give me' sounds too blunt. Use 'Can I have..., please?' for natural politeness.",
        "'Give me' kaba duyulur. Her zaman 'Can I have..., please?' kullanın.",
        "'Give me' звучит грубо. Используйте вежливое 'Can I have..., please?'"
      ),
    },
    chunks: [
      {
        word: "Can I have water, please?",
        phonetic: "/kæn aɪ hæv ˈwɔːtə pliːz/",
        audioText: "Can I have water, please?",
        translations: ML("Zəhmət olmasa, su ala bilərəm?", "Politely asking for water", "Su alabilir miyim, lütfen?", "Можно мне воды, пожалуйста?", {
          es: "¿Me da agua, por favor?", de: "Kann ich bitte Wasser haben?", fr: "Puis-je avoir de l'eau, s'il vous plaît ?"
        }),
        exampleSentence: "Excuse me, can I have water, please?",
        exampleTranslation: ML("Bağışlayın, zəhmət olmasa su ala bilərəm?", "Asking a flight attendant", "Affedersiniz, su alabilir miyim lütfen?", "Извините, можно мне воды, пожалуйста?"),
      },
      {
        word: "A table for two, please",
        phonetic: "/ə ˈteɪbl fɔː tuː pliːz/",
        audioText: "A table for two, please",
        translations: ML("Zəhmət olmasa, iki nəfərlik masa", "Entering a restaurant with a friend", "İki kişilik bir masa, lütfen", "Столик на двоих, пожалуйста", {
          es: "Una mesa para dos, por favor", de: "Einen Tisch für zwei, bitte", fr: "Une table pour deux, s'il vous plaît"
        }),
        exampleSentence: "Good evening! A table for two, please.",
        exampleTranslation: ML("Axşamınız xeyir! İki nəfərlik masa, zəhmət olmasa.", "Greeting the restaurant host", "İyi akşamlar! İki kişilik bir masa, lütfen.", "Добрый вечер! Столик на двоих, пожалуйста."),
      },
      {
        word: "The menu, please",
        phonetic: "/ðə ˈmenjuː pliːz/",
        audioText: "The menu, please",
        translations: ML("Menyunu verə bilərsiniz, zəhmət olmasa?", "Asking to see the food list", "Menüyü alabilir miyim, lütfen?", "Меню, пожалуйста"),
        exampleSentence: "Can I have the menu, please?",
        exampleTranslation: ML("Zəhmət olmasa, menyunu ala bilərəm?", "Seated at a cafe", "Menüyü alabilir miyim lütfen?", "Можно меню, пожалуйста?"),
      },
    ],
    dialogue: {
      title: "First Evening Restaurant",
      titleTranslation: ML("İlk Axşam Restoranı", "First Evening Restaurant", "İlk Akşam Restoranı", "Первый ужин в ресторане"),
      lines: [
        "Host: \"Good evening! Welcome!\"",
        "You: \"Hello! A table for two, please.\"",
        "Host: \"Right this way!\"",
        "You: \"Thank you! Can I have water, please?\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Zəhmət olmasa, iki nəfərlik masa",
        "Situation: You arrive at a restaurant with one friend. Ask the host for a table:",
        "İki kişilik bir masa, lütfen",
        "Столик на двоих, пожалуйста",
        { es: "Una mesa para dos, por favor", de: "Einen Tisch für zwei, bitte", fr: "Une table pour deux, s'il vous plaît" }
      ),
      sentenceToBuild: ["A", "table", "for", "two,", "please"],
      distractorWords: ["one", "chair"],
      correctSentence: "A table for two, please",
    },
    blankTask: {
      sentenceWithBlank: "Can I ___ water, please?",
      options: ["have", "has", "are"],
    },
    listenTask: {
      audioPrompt: "Can I have water, please?",
      options: ["Can I have water, please?", "Where is the hotel?", "This is my ticket"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Zəhmət olmasa, su ala bilərəm?",
        "Situation: Ask the waiter politely for water:",
        "Su alabilir miyim, lütfen?",
        "Можно мне воды, пожалуйста?"
      ),
      sentenceToBuild: ["Can", "I", "have", "water,", "please?"],
      distractorWords: ["is", "you"],
      correctSentence: "Can I have water, please?",
    },
  },

  // ============================================================================
  // LEVEL A1: EVERYDAY SURVIVAL & NATURAL CONVERSATIONS
  // ============================================================================
  a1_unit_04: {
    formula: "I have a brother • Do you have any siblings?",
    explanation: ML(
      "Ailəniz və yaxınlarınız haqqında danışarkən 'I have...' (Mənim ... var) və qarşı tərəfdən soruşarkən 'Do you have...?' qəlibindən istifadə edin.",
      "Talk about family naturally using 'I have...' and ask others with 'Do you have...?'.",
      "Ailenizden bahsederken 'I have...' (Benim ... var) ve soru sorarken 'Do you have...?' kalıbını kullanın.",
      "Рассказывая о семье, используйте 'I have...', а спрашивайте с помощью 'Do you have...?'"
    ),
    commonMistake: {
      incorrect: "She have a sister.",
      correct: "She has a sister.",
      explanation: ML(
        "O (He/She) haqqında danışarkən 'have' yox, 'has' işlənir.",
        "Use 'has' when talking about he or she.",
        "O (He/She) öznesiyle 'have' değil 'has' kullanılır.",
        "С местоимениями He/She используется 'has', а не 'have'."
      ),
    },
    chunks: [
      {
        word: "I have a big family",
        phonetic: "/aɪ hæv ə bɪɡ ˈfæməli/",
        audioText: "I have a big family",
        translations: ML("Mənim böyük ailəm var", "Describing a large family", "Büyük bir ailem var", "У меня большая семья", {
          es: "Tengo una gran familia", de: "Ich habe eine große Familie", fr: "J'ai une grande famille"
        }),
        exampleSentence: "I have a big family in Baku.",
        exampleTranslation: ML("Bakıda böyük ailəm var.", "Talking about relatives", "Bakü'de büyük bir ailem var.", "У меня большая семья в Баку."),
      },
      {
        word: "Do you have brothers or sisters?",
        phonetic: "/duː juː hæv ˈbrʌðəz ɔː ˈsɪstəz/",
        audioText: "Do you have brothers or sisters?",
        translations: ML("Qardaşın və ya bacın var?", "Asking about siblings", "Erkek veya kız kardeşin var mı?", "У тебя есть братья или сестры?"),
        exampleSentence: "Tell me, do you have brothers or sisters?",
        exampleTranslation: ML("De görüm, qardaşın və ya bacın var?", "Getting to know a friend", "Söyle bakalım, kardeşin var mı?", "Скажи, у тебя есть братья или сестры?"),
      },
      {
        word: "We spend time together",
        phonetic: "/wiː spend taɪm təˈɡeðə/",
        audioText: "We spend time together",
        translations: ML("Biz birlikdə vaxt keçiririk", "Enjoying family company", "Birlikte vakit geçiriyoruz", "Мы проводим время вместе"),
        exampleSentence: "Every Sunday, we spend time together.",
        exampleTranslation: ML("Hər bazar günü birlikdə vaxt keçiririk.", "Weekend family habit", "Her pazar birlikte vakit geçiririz.", "Каждое воскресенье мы проводим время вместе."),
      },
    ],
    dialogue: {
      title: "Talking About Family",
      titleTranslation: ML("Ailə Haqqında Söhbət", "Talking About Family", "Aile Hakkında Sohbet", "Разговор о семье"),
      lines: [
        "Sarah: \"Do you have brothers or sisters?\"",
        "You: \"Yes! I have a big family—two brothers and one sister.\"",
        "Sarah: \"That's lovely!\"",
        "You: \"Every weekend, we spend time together.\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Mənim böyük ailəm var",
        "Situation: Tell your new friend that your family is large:",
        "Büyük bir ailem var",
        "У меня большая семья",
        { es: "Tengo una gran familia", de: "Ich habe eine große Familie", fr: "J'ai une grande famille" }
      ),
      sentenceToBuild: ["I", "have", "a", "big", "family"],
      distractorWords: ["has", "are"],
      correctSentence: "I have a big family",
    },
    blankTask: {
      sentenceWithBlank: "She ___ one younger sister.",
      options: ["has", "have", "is"],
    },
    listenTask: {
      audioPrompt: "We spend time together",
      options: ["We spend time together", "Where do you live?", "I wake up early"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Biz birlikdə vaxt keçiririk",
        "Situation: Express that you and your family hang out together:",
        "Birlikte vakit geçiriyoruz",
        "Мы проводим время вместе"
      ),
      sentenceToBuild: ["We", "spend", "time", "together"],
      distractorWords: ["has", "alone"],
      correctSentence: "We spend time together",
    },
  },

  a1_unit_05: {
    formula: "Excuse me, where is...? • Turn left / Go straight",
    explanation: ML(
      "Xaricdə ünvan soruşarkən 'Excuse me, where is the nearest...?' (Bağışlayın, ən yaxın ... haradadır?) qəlibi həyat qurtarır.",
      "Navigate any city effortlessly by asking 'Excuse me, where is the nearest...?' and following simple direction chunks.",
      "Yurt dışında adres sorarken 'Excuse me, where is the nearest...?' (Affedersiniz, en yakın ... nerede?) kalıbı hayat kurtarır.",
      "В незнакомом городе спросите дорогу фразой 'Excuse me, where is the nearest...?'"
    ),
    commonMistake: {
      incorrect: "Where is metro station?",
      correct: "Where is the metro station?",
      explanation: ML(
        "Konkret məkan soruşarkən 'the' artiklını işlədin: 'Where is the metro station?'.",
        "Include 'the' before specific places in town.",
        "Belirli bir yeri sorarken 'the' kullanın: 'Where is the metro station?'.",
        "Перед конкретным местом используйте артикль 'the'."
      ),
    },
    chunks: [
      {
        word: "Where is the nearest station?",
        phonetic: "/weər ɪz ðə ˈnɪərɪst ˈsteɪʃn/",
        audioText: "Where is the nearest station?",
        translations: ML("Ən yaxın stansiya haradadır?", "Asking for the closest train/metro stop", "En yakın istasyon nerede?", "Где ближайшая станция?", {
          es: "¿Dónde está la estación más cercana?", de: "Wo ist die nächste Station?", fr: "Où est la station la plus proche ?"
        }),
        exampleSentence: "Excuse me, where is the nearest station?",
        exampleTranslation: ML("Bağışlayın, ən yaxın stansiya haradadır?", "Asking a local on the street", "Affedersiniz, en yakın istasyon nerede?", "Извините, где ближайшая станция?"),
      },
      {
        word: "Go straight and turn left",
        phonetic: "/ɡəʊ streɪt ænd tɜːn left/",
        audioText: "Go straight and turn left",
        translations: ML("Düz gedin və sola dönün", "Giving clear street directions", "Düz gidin ve sola dönün", "Идите прямо и поверните налево"),
        exampleSentence: "Go straight and turn left at the corner.",
        exampleTranslation: ML("Düz gedin və tindən sola dönün.", "Guiding a tourist", "Düz gidin ve köşeden sola dönün.", "Идите прямо и поверните налево на углу."),
      },
      {
        word: "It's five minutes away",
        phonetic: "/ɪts faɪv ˈmɪnɪts əˈweɪ/",
        audioText: "It's five minutes away",
        translations: ML("Buradan beş dəqiqəlik məsafədədir", "Saying a place is very close", "Buradan beş dakika uzaklıkta", "Это в пяти минутах отсюда"),
        exampleSentence: "Don't worry, it's five minutes away.",
        exampleTranslation: ML("Narahat olmayın, beş dəqiqəlik yoldur.", "Reassuring a walker", "Merak etmeyin, beş dakika uzaklıkta.", "Не волнуйтесь, это в пяти минутах ходьбы."),
      },
    ],
    dialogue: {
      title: "Finding the Metro",
      titleTranslation: ML("Metronu Tapmaq", "Finding the Metro", "Metroyu Bulmak", "В поисках метро"),
      lines: [
        "You: \"Excuse me, where is the nearest station?\"",
        "Local: \"Go straight and turn left at the bank.\"",
        "You: \"Is it far from here?\"",
        "Local: \"No, it's five minutes away!\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Düz gedin və sola dönün",
        "Situation: Tell a tourist to walk straight ahead and then turn to the left:",
        "Düz gidin ve sola dönün",
        "Идите прямо и поверните налево",
        { es: "Sigue recto y gira a la izquierda", de: "Geh geradeaus und bieg links ab", fr: "Allez tout droit et tournez à gauche" }
      ),
      sentenceToBuild: ["Go", "straight", "and", "turn", "left"],
      distractorWords: ["from", "are"],
      correctSentence: "Go straight and turn left",
    },
    blankTask: {
      sentenceWithBlank: "Where is ___ nearest station?",
      options: ["the", "a", "an"],
    },
    listenTask: {
      audioPrompt: "It's five minutes away",
      options: ["It's five minutes away", "Turn right at the hotel", "I have a big family"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Ən yaxın stansiya haradadır?",
        "Situation: Ask someone on the street where the closest train station is:",
        "En yakın istasyon nerede?",
        "Где ближайшая станция?"
      ),
      sentenceToBuild: ["Where", "is", "the", "nearest", "station?"],
      distractorWords: ["are", "who"],
      correctSentence: "Where is the nearest station?",
    },
  },

  // ============================================================================
  // LEVEL A2: PAST STORIES, TRAVEL EXPERIENCES & FUTURE PLANS
  // ============================================================================
  a2_unit_01: {
    formula: "Last weekend, I went to... • We had a great time",
    explanation: ML(
      "Keçmişdə baş vermiş səyahət və xatirələri danışarkən hazır keçmiş zaman qəliblərindən istifadə edin: 'I went to...' (Mən ... getdim), 'We had a great time' (Əla vaxt keçirdik).",
      "Share past travel stories naturally with high-frequency past chunks: 'I went to...', 'We stayed at...', and 'We had a great time'.",
      "Geçmiş anıları ve seyahatleri anlatırken hazır geçmiş zaman kalıplarını kullanın: 'I went to...' (... gittim), 'We had a great time' (Harika vakit geçirdik).",
      "Делитесь прошлыми поездками с помощью готовых фраз: 'I went to...' (Я ездил в...) и 'We had a great time' (Мы отлично провели время)."
    ),
    commonMistake: {
      incorrect: "Yesterday I go to Rome.",
      correct: "Yesterday I went to Rome.",
      explanation: ML(
        "Keçmiş zamandan danışarkən 'go' həmişə 'went' olur.",
        "Use 'went' instead of 'go' when talking about the past.",
        "Geçmişten bahsederken 'go' yerine her zaman 'went' kullanılır.",
        "Говоря о прошлом, используйте 'went' вместо 'go'."
      ),
    },
    chunks: [
      {
        word: "Last weekend, I went to...",
        phonetic: "/lɑːst ˌwiːkˈend aɪ went tuː/",
        audioText: "Last weekend, I went to Paris",
        translations: ML("Keçən həftəsonu mən ... getdim", "Starting a story about a recent trip", "Geçen hafta sonu ... gittim", "На прошлых выходных я ездил в..."),
        exampleSentence: "Last weekend, I went to Rome with friends.",
        exampleTranslation: ML("Keçən həftəsonu dostlarla Romaya getdim.", "Sharing weekend news", "Geçen hafta sonu arkadaşlarla Roma'ya gittim.", "На прошлых выходных я ездил в Рим с друзьями."),
      },
      {
        word: "We had a wonderful time",
        phonetic: "/wiː hæd ə ˈwʌndəfl taɪm/",
        audioText: "We had a wonderful time",
        translations: ML("Biz möhtəşəm vaxt keçirdik", "Saying you really enjoyed an experience", "Harika vakit geçirdik", "Мы чудесно провели время"),
        exampleSentence: "The weather was sunny and we had a wonderful time.",
        exampleTranslation: ML("Hava günəşli idi və möhtəşəm vaxt keçirdik.", "Describing a holiday", "Hava güneşliydi ve harika vakit geçirdik.", "Погода была солнечной, и мы чудесно провели время."),
      },
      {
        word: "Did you enjoy the trip?",
        phonetic: "/dɪd juː ɪnˈdʒɔɪ ðə trɪp/",
        audioText: "Did you enjoy the trip?",
        translations: ML("Səyahət xoşuna gəldimi?", "Asking someone how their journey went", "Yolculuktan keyif aldın mı?", "Тебе понравилась поездка?"),
        exampleSentence: "Welcome back! Did you enjoy the trip?",
        exampleTranslation: ML("Xoş gəldin! Səyahət xoşuna gəldimi?", "Greeting a colleague after vacation", "Hoş geldin! Geziden keyif aldın mı?", "С возвращением! Тебе понравилась поездка?"),
      },
    ],
    dialogue: {
      title: "Monday Morning Coffee",
      titleTranslation: ML("Bazar Ertəsi Səhər Qəhvəsi", "Monday Morning Coffee", "Pazartesi Sabah Kahvesi", "Утренний кофе в понедельник"),
      lines: [
        "Mark: \"Welcome back! Did you enjoy the trip?\"",
        "You: \"Yes! Last weekend, I went to Rome.\"",
        "Mark: \"How was it?\"",
        "You: \"Amazing! We had a wonderful time.\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Biz möhtəşəm vaxt keçirdik",
        "Situation: Tell your colleague that you and your friends really enjoyed your holiday:",
        "Harika vakit geçirdik",
        "Мы чудесно провели время",
        { es: "Lo pasamos de maravilla", de: "Wir hatten eine wunderbare Zeit", fr: "Nous avons passé un moment merveilleux" }
      ),
      sentenceToBuild: ["We", "had", "a", "wonderful", "time"],
      distractorWords: ["have", "goes"],
      correctSentence: "We had a wonderful time",
    },
    blankTask: {
      sentenceWithBlank: "Last weekend, I ___ to Rome.",
      options: ["went", "go", "going"],
    },
    listenTask: {
      audioPrompt: "Did you enjoy the trip?",
      options: ["Did you enjoy the trip?", "Where are you going?", "Can I have the bill?"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Səyahət xoşuna gəldimi?",
        "Situation: Ask your friend if they liked their recent vacation:",
        "Yolculuktan keyif aldın mı?",
        "Тебе понравилась поездка?"
      ),
      sentenceToBuild: ["Did", "you", "enjoy", "the", "trip?"],
      distractorWords: ["do", "went"],
      correctSentence: "Did you enjoy the trip?",
    },
  },

  // ============================================================================
  // LEVEL B1: OPINIONS, CAREER FLUENCY & CONNECTED NARRATIVES
  // ============================================================================
  b1_unit_01: {
    formula: "I've been working on... • Have you ever tried...?",
    explanation: ML(
      "Təcrübələrinizdən və indiyə qədər gördüyünüz işlərdən danışarkən 'I have worked / I've been...' və 'Have you ever...?' qəlibləri nitqinizi B1 səviyyəsinə qaldırır.",
      "Connect past experiences to the present moment using 'Have you ever...?' and 'I've been working on...'.",
      "Deneyimlerinizden ve bugüne kadar yaptıklarınızdan bahsederken 'Have you ever...?' ve 'I've been...' kalıpları konuşmanızı B1 seviyesine taşır.",
      "Связывайте прошлый опыт с настоящим при помощи конструкций 'Have you ever...?' и 'I've been...'"
    ),
    commonMistake: {
      incorrect: "I am working here since 2023.",
      correct: "I've been working here since 2023.",
      explanation: ML(
        "Keçmişdə başlayıb hələ də davam edən işlər üçün 'I am' yox, 'I've been...' işlədin.",
        "Use 'I've been...' (not 'I am') when an action started in the past and continues now.",
        "Geçmişte başlayıp hala devam eden durumlar için 'I am' değil 'I've been...' kullanılır.",
        "Для действий, начавшихся в прошлом и продолжающихся сейчас, используйте 'I've been...'."
      ),
    },
    chunks: [
      {
        word: "I've been working on a new project",
        phonetic: "/aɪv biːn ˈwɜːkɪŋ ɒn ə njuː ˈprɒdʒekt/",
        audioText: "I've been working on a new project",
        translations: ML("Yeni bir layihə üzərində işləyirəm (bir müddətdir)", "Explaining your current professional focus", "Yeni bir proje üzerinde çalışıyorum", "Я работаю над новым проектом"),
        exampleSentence: "Recently, I've been working on a new project.",
        exampleTranslation: ML("Son vaxtlar yeni bir layihə üzərində işləyirəm.", "Updating your team", "Son zamanlarda yeni bir proje üzerinde çalışıyorum.", "В последнее время я работаю над новым проектом."),
      },
      {
        word: "Have you ever been abroad?",
        phonetic: "/hæv juː ˈevə biːn əˈbrɔːd/",
        audioText: "Have you ever been abroad?",
        translations: ML("Heç xaricdə olmusunuz?", "Asking about life experiences", "Hiç yurt dışında bulundun mu?", "Вы когда-нибудь бывали за границей?"),
        exampleSentence: "Tell me, have you ever been abroad for work?",
        exampleTranslation: ML("De görüm, iş üçün heç xaricdə olmusan?", "Career conversation", "İş için hiç yurt dışında bulundun mu?", "Скажи, ты когда-нибудь бывал за границей по работе?"),
      },
      {
        word: "It has made a huge difference",
        phonetic: "/ɪt hæz meɪd ə hjuːdʒ ˈdɪfrəns/",
        audioText: "It has made a huge difference",
        translations: ML("Bu, çox böyük fərq yaratdı", "Highlighting a strong positive impact", "Bu çok büyük bir fark yarattı", "Это кардинально всё изменило"),
        exampleSentence: "Daily reading has made a huge difference.",
        exampleTranslation: ML("Gündəlik mütaliə çox böyük fərq yaratdı.", "Sharing personal growth", "Günlük okuma çok büyük bir fark yarattı.", "Ежедневное чтение очень сильно помогло."),
      },
    ],
    dialogue: {
      title: "Catching Up at the Office",
      titleTranslation: ML("Ofisdə Həmsöhbətlik", "Catching Up at the Office", "Ofiste Sohbet", "Разговор в офисе"),
      lines: [
        "Elena: \"What have you been up to lately?\"",
        "You: \"I've been working on a new project with our international team.\"",
        "Elena: \"Sounds exciting! Have you ever been abroad with them?\"",
        "You: \"Yes, twice! It has made a huge difference to my career.\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Heç xaricdə olmusunuz?",
        "Situation: Ask a colleague if they have ever traveled to another country in their life:",
        "Hiç yurt dışında bulundun mu?",
        "Вы когда-нибудь бывали за границей?",
        { es: "¿Has estado alguna vez en el extranjero?", de: "Warst du schon einmal im Ausland?", fr: "Êtes-vous déjà allé à l'étranger ?" }
      ),
      sentenceToBuild: ["Have", "you", "ever", "been", "abroad?"],
      distractorWords: ["did", "went"],
      correctSentence: "Have you ever been abroad?",
    },
    blankTask: {
      sentenceWithBlank: "I've ___ working on a new project.",
      options: ["been", "be", "being"],
    },
    listenTask: {
      audioPrompt: "It has made a huge difference",
      options: ["It has made a huge difference", "We went there yesterday", "I will call you later"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Bu, çox böyük fərq yaratdı",
        "Situation: Express that a new method has had a massive positive impact:",
        "Bu çok büyük bir fark yarattı",
        "Это кардинально всё изменило"
      ),
      sentenceToBuild: ["It", "has", "made", "a", "huge", "difference"],
      distractorWords: ["make", "did"],
      correctSentence: "It has made a huge difference",
    },
  },

  // ============================================================================
  // LEVEL B2: PERSUASION, NUANCE & EXECUTIVE COMMUNICATION
  // ============================================================================
  b2_unit_01: {
    formula: "Had I known earlier... • We need to take into account...",
    explanation: ML(
      "B2 səviyyəsində fikirləri peşəkar və arqumentli çatdırmaq üçün 'take into account' (nəzərə almaq) və 'rule out' (istisna etmək) kimi yüksək leksik qəliblər işlədilir.",
      "Elevate your speech to Upper-Intermediate by using executive collocations like 'take into account' and 'rule out possibilities'.",
      "B2 seviyesinde fikirleri profesyonelce ifade etmek için 'take into account' (göz önünde bulundurmak) ve 'rule out' (hariç tutmak) kalıpları kullanılır.",
      "На уровне B2 используйте профессиональные обороты 'take into account' (учитывать) и 'rule out' (исключать)."
    ),
    commonMistake: {
      incorrect: "If I knew earlier, I would have told you.",
      correct: "If I had known earlier, I would have told you.",
      explanation: ML(
        "Keçmişdəki fərziyyələr haqqında danışarkən 'If I had known...' qəlibindən istifadə edin.",
        "Use 'If I had known' (Past Perfect) when reflecting on past hypothetical situations.",
        "Geçmişteki varsayımlar için 'If I had known...' yapısını kullanın.",
        "Для гипотетических ситуаций в прошлом используйте 'If I had known...'."
      ),
    },
    chunks: [
      {
        word: "We must take into account",
        phonetic: "/wiː mʌst teɪk ˈɪntuː əˈkaʊnt/",
        audioText: "We must take into account",
        translations: ML("Biz mütləq nəzərə almalıyıq", "Considering important factors in a decision", "Kesinlikle göz önünde bulundurmalıyız", "Мы должны принять во внимание"),
        exampleSentence: "We must take into account the long-term impact.",
        exampleTranslation: ML("Uzunmüddətli təsiri mütləq nəzərə almalıyıq.", "Strategic meeting statement", "Uzun vadeli etkiyi göz önünde bulundurmalıyız.", "Мы должны учитывать долгосрочный эффект."),
      },
      {
        word: "We cannot rule out this option",
        phonetic: "/wiː ˈkænɒt ruːl aʊt ðɪs ˈɒpʃn/",
        audioText: "We cannot rule out this option",
        translations: ML("Bu variantı istisna edə bilmərik", "Keeping a possibility open", "Bu seçeneği göz ardı edemeyiz", "Мы не можем исключать этот вариант"),
        exampleSentence: "At this stage, we cannot rule out this option.",
        exampleTranslation: ML("Bu mərhələdə həmin variantı istisna edə bilmərik.", "Analytical discussion", "Bu aşamada bu seçeneği dışlayamayız.", "На данном этапе мы не можем исключать этот вариант."),
      },
      {
        word: "From my perspective",
        phonetic: "/frɒm maɪ pəˈspektɪv/",
        audioText: "From my perspective",
        translations: ML("Mənim baxış bucağımdan / fikrimcə", "Sophisticated way to state your opinion", "Benim bakış açımdan", "С моей точки зрения"),
        exampleSentence: "From my perspective, quality comes first.",
        exampleTranslation: ML("Mənim baxış bucağımdan keyfiyyət birinci gəlir.", "Executive debate", "Benim bakış açımdan kalite önce gelir.", "С моей точки зрения, качество превыше всего."),
      },
    ],
    dialogue: {
      title: "Boardroom Strategy",
      titleTranslation: ML("İclas Otağında Strategiya", "Boardroom Strategy", "Yönetim Kurulu Stratejisi", "Стратегия на совещании"),
      lines: [
        "Director: \"Should we delay the product launch?\"",
        "You: \"From my perspective, we cannot rule out this option.\"",
        "Director: \"Why do you think so?\"",
        "You: \"Because we must take into account user feedback first.\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Biz mütləq nəzərə almalıyıq",
        "Situation: Remind the board that they need to consider all key factors:",
        "Kesinlikle göz önünde bulundurmalıyız",
        "Мы должны принять во внимание",
        { es: "Debemos tener en cuenta", de: "Wir müssen berücksichtigen", fr: "Nous devons prendre en compte" }
      ),
      sentenceToBuild: ["We", "must", "take", "into", "account"],
      distractorWords: ["on", "make"],
      correctSentence: "We must take into account",
    },
    blankTask: {
      sentenceWithBlank: "We cannot rule ___ this option.",
      options: ["out", "in", "by"],
    },
    listenTask: {
      audioPrompt: "From my perspective",
      options: ["From my perspective", "In the morning", "See you next week"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Bu variantı istisna edə bilmərik",
        "Situation: State professionally that you cannot exclude this possibility yet:",
        "Bu seçeneği göz ardı edemeyiz",
        "Мы не можем исключать этот вариант"
      ),
      sentenceToBuild: ["We", "cannot", "rule", "out", "this", "option"],
      distractorWords: ["off", "for"],
      correctSentence: "We cannot rule out this option",
    },
  },

  // ============================================================================
  // LEVEL C1: MASTERY, RHETORIC, SUBTLE IRONY & NATIVE IDIOMATIC PRECISION
  // ============================================================================
  c1_unit_01: {
    formula: "Little did we anticipate... • It goes without saying that...",
    explanation: ML(
      "C1 (Advanced Mastery) səviyyəsində ana dili daşıyıcıları kimi parlaq və təsirli danışmaq üçün inversiya ('Little did we know...') və ritorik keçidlərdən ('It goes without saying...') istifadə olunur.",
      "Master C1 rhetoric by employing emphatic inversion ('Little did we anticipate...') and nuanced discourse markers ('It goes without saying that...').",
      "C1 seviyesinde ana dili İngilizce olanlar gibi etkileyici konuşmak için devrik vurgu ('Little did we know...') ve retorik geçişler ('It goes without saying...') kullanılır.",
      "На уровне C1 используйте эмфатическую инверсию ('Little did we know...') и риторические связки ('It goes without saying...')."
    ),
    commonMistake: {
      incorrect: "Little we knew about the consequences.",
      correct: "Little did we know about the consequences.",
      explanation: ML(
        "Cümlə 'Little', 'Never', 'Rarely' kimi vurğulu sözlə başlayanda köməkçi fel mübtədadan əvvələ keçir: 'Little did we know'.",
        "Invert the auxiliary verb after negative/restrictive openers: 'Little did we know'.",
        "Cümle 'Little', 'Never' ile başladığında yardımcı fiil özneden önce gelir: 'Little did we know'.",
        "После отрицательных наречий в начале предложения используется инверсия: 'Little did we know'."
      ),
    },
    chunks: [
      {
        word: "Little did we know",
        phonetic: "/ˈlɪtl dɪd wiː nəʊ/",
        audioText: "Little did we know",
        translations: ML("Haradan biləydik ki / Heç ağlımıza gəlməzdi ki", "Emphatic storytelling opener for unexpected turns", "Nereden bilebilirdik ki", "Кто бы мог подумать / Мало ли мы знали"),
        exampleSentence: "Little did we know how transformative this idea would be.",
        exampleTranslation: ML("Bu ideyanın nə qədər dəyişdirici olacağını heç təsəvvür etmirdik.", "C1 narrative reflection", "Bu fikrin ne kadar dönüştürücü olacağını hiç tahmin etmezdik.", "Мы и представить не могли, насколько преображающей окажется эта идея."),
      },
      {
        word: "It goes without saying",
        phonetic: "/ɪt ɡəʊz wɪˈðaʊt ˈseɪɪŋ/",
        audioText: "It goes without saying",
        translations: ML("Sözsüz ki / Öz-özlüyündə aydındır ki", "Introducing an indisputable truth", "Söylemeye bile gerek yok ki", "Само собой разумеется"),
        exampleSentence: "It goes without saying that trust is paramount.",
        exampleTranslation: ML("Sözsüz ki, etibar hər şeydən üstündür.", "Keynote speech", "Söylemeye gerek yok ki güven her şeyden önemlidir.", "Само собой разумеется, что доверие превыше всего."),
      },
      {
        word: "To strike a delicate balance",
        phonetic: "/tuː straɪk ə ˈdelɪkət ˈbæləns/",
        audioText: "To strike a delicate balance",
        translations: ML("Həssas tarazlığı qorumaq / tapmaq", "Finding equilibrium between two complex demands", "Hassas bir denge kurmak", "Найти тонкий баланс"),
        exampleSentence: "Leaders must strike a delicate balance between speed and precision.",
        exampleTranslation: ML("Liderlər sürətlə dəqiqlik arasında həssas tarazlığı tapmalıdır.", "Executive leadership insight", "Liderler hız ve hassasiyet arasında ince bir denge kurmalıdır.", "Лидеры должны находить тонкий баланс между скоростью и точностью."),
      },
    ],
    dialogue: {
      title: "Keynote Reflection",
      titleTranslation: ML("Konfrans Çıxışı Müzakirəsi", "Keynote Reflection", "Konferans Değerlendirmesi", "Обсуждение доклада"),
      lines: [
        "Moderator: \"Looking back at the project, what surprised you most?\"",
        "You: \"Little did we know how rapidly the market would evolve.\"",
        "Moderator: \"How did your team adapt?\"",
        "You: \"It goes without saying that we had to strike a delicate balance between innovation and stability.\"",
      ],
    },
    scrambleTask: {
      meaningPrompt: ML(
        "Sözsüz ki (öz-özlüyündə aydındır)",
        "Situation: Express at a C1 level that something is completely obvious and needs no explanation:",
        "Söylemeye bile gerek yok ki",
        "Само собой разумеется",
        { es: "No hace falta decir que", de: "Es versteht sich von selbst", fr: "Il va sans dire que" }
      ),
      sentenceToBuild: ["It", "goes", "without", "saying"],
      distractorWords: ["by", "told"],
      correctSentence: "It goes without saying",
    },
    blankTask: {
      sentenceWithBlank: "Little ___ we know about the outcome.",
      options: ["did", "do", "were"],
    },
    listenTask: {
      audioPrompt: "To strike a delicate balance",
      options: ["To strike a delicate balance", "To make a quick phone call", "To take a morning walk"],
    },
    bossTask: {
      meaningPrompt: ML(
        "Heç ağlımıza gəlməzdi ki (Haradan biləydik ki)",
        "Situation: Use C1 inversion to say you had no idea at the time:",
        "Nereden bilebilirdik ki",
        "Мало ли мы знали (Кто бы мог подумать)"
      ),
      sentenceToBuild: ["Little", "did", "we", "know"],
      distractorWords: ["knew", "had"],
      correctSentence: "Little did we know",
    },
  },
};

/**
 * Curated Level-Specific Thematic Scenarios so every unit (A0 -> C1) has authentic,
 * non-repetitive, story-driven lexical chunks, live dialogues, and zero-defect exercises.
 */
const LEVEL_SCENARIO_POOLS: Record<LevelId, TopicBlueprint[]> = {
  A0: [
    IMMERSION_BLUEPRINTS.a0_unit_01,
    IMMERSION_BLUEPRINTS.a0_unit_02,
    IMMERSION_BLUEPRINTS.a0_unit_03,
    IMMERSION_BLUEPRINTS.a0_unit_04,
  ],
  A1: [
    IMMERSION_BLUEPRINTS.a1_unit_04,
    IMMERSION_BLUEPRINTS.a1_unit_05,
    {
      formula: "How much does this cost? • Can I pay by card?",
      explanation: ML(
        "Mağazada alış-veriş edərkən qiyməti soruşmaq və ödəniş etmək üçün ən təbii qəliblər: 'How much does this cost?' və 'Can I pay by card?'.",
        "Shop effortlessly anywhere using 'How much does this cost?' and 'Can I pay by card?'.",
        "Alışverişte fiyat sormak ve ödeme yapmak için en doğal kalıplar: 'How much does this cost?' ve 'Can I pay by card?'.",
        "В магазине используйте готовые фразы: 'How much does this cost?' (Сколько это стоит?) и 'Can I pay by card?' (Можно оплатить картой?)."
      ),
      commonMistake: {
        incorrect: "Can I pay with card?",
        correct: "Can I pay by card?",
        explanation: ML(
          "Kartla ödəniş deyərkən həmişə 'by card' işlədilir.",
          "Always use the preposition 'by' in 'pay by card'.",
          "Kartla ödeme derken her zaman 'by card' kullanılır.",
          "Всегда говорите 'pay by card'."
        ),
      },
      chunks: [
        {
          word: "How much does this cost?",
          phonetic: "/haʊ mʌtʃ dʌz ðɪs kɒst/",
          audioText: "How much does this cost?",
          translations: ML("Bunun qiyməti nə qədərdir?", "Asking the price of an item", "Bunun fiyatı ne kadar?", "Сколько это стоит?"),
          exampleSentence: "Excuse me, how much does this jacket cost?",
          exampleTranslation: ML("Bağışlayın, bu gödəkçənin qiyməti nə qədərdir?", "In a clothing store", "Affedersiniz, bu ceketin fiyatı ne kadar?", "Извините, сколько стоит эта куртка?"),
        },
        {
          word: "Can I pay by card?",
          phonetic: "/kæn aɪ peɪ baɪ kɑːd/",
          audioText: "Can I pay by card?",
          translations: ML("Kartla ödəyə bilərəm?", "Asking if credit/debit cards are accepted", "Kartla ödeyebilir miyim?", "Можно оплатить картой?"),
          exampleSentence: "I don't have cash. Can I pay by card?",
          exampleTranslation: ML("Nağd pulum yoxdur. Kartla ödəyə bilərəm?", "At the checkout counter", "Nakit param yok. Kartla ödeyebilir miyim?", "У меня нет наличных. Можно оплатить картой?"),
        },
        {
          word: "I'll take it!",
          phonetic: "/aɪl teɪk ɪt/",
          audioText: "I'll take it!",
          translations: ML("Bunu alıram!", "Deciding to buy an item", "Bunu alıyorum!", "Я беру это!"),
          exampleSentence: "It fits perfectly. I'll take it!",
          exampleTranslation: ML("Əynimə tam oturdu. Bunu alıram!", "Happy customer", "Tam üzerime oldu. Bunu alıyorum!", "Сидит идеально. Я беру это!"),
        },
      ],
      dialogue: {
        title: "At the Bookstore",
        titleTranslation: ML("Kitab Mağazasında", "At the Bookstore", "Kitapçıda", "В книжном магазине"),
        lines: [
          "You: \"Excuse me, how much does this book cost?\"",
          "Clerk: \"It's ten dollars.\"",
          "You: \"Great, I'll take it! Can I pay by card?\"",
          "Clerk: \"Of course! Right here, please.\"",
        ],
      },
      scrambleTask: {
        meaningPrompt: ML(
          "Kartla ödəyə bilərəm?",
          "Situation: Ask the cashier if you can use your bank card to pay:",
          "Kartla ödeyebilir miyim?",
          "Можно оплатить картой?",
          { es: "¿Puedo pagar con tarjeta?", de: "Kann ich mit Karte zahlen?", fr: "Puis-je payer par carte ?" }
        ),
        sentenceToBuild: ["Can", "I", "pay", "by", "card?"],
        distractorWords: ["with", "from"],
        correctSentence: "Can I pay by card?",
      },
      blankTask: {
        sentenceWithBlank: "How much ___ this cost?",
        options: ["does", "do", "is"],
      },
      listenTask: {
        audioPrompt: "I'll take it!",
        options: ["I'll take it!", "Where is the exit?", "See you tomorrow"],
      },
      bossTask: {
        meaningPrompt: ML(
          "Bunun qiyməti nə qədərdir?",
          "Situation: Ask the shop assistant how much an item costs:",
          "Bunun fiyatı ne kadar?",
          "Сколько это стоит?"
        ),
        sentenceToBuild: ["How", "much", "does", "this", "cost?"],
        distractorWords: ["many", "are"],
        correctSentence: "How much does this cost?",
      },
    },
  ],
  A2: [
    IMMERSION_BLUEPRINTS.a2_unit_01,
    {
      formula: "I'm going to... • Are you free tomorrow evening?",
      explanation: ML(
        "Gələcək planlar və görüş təyin etmək üçün 'I'm going to...' (planlaşdırıram) və 'Are you free...?' (vaxtın varmı / boşsanmı?) qəliblərindən istifadə edin.",
        "Make plans and arrange meetups naturally using 'I'm going to...' and 'Are you free...?'.",
        "Gelecek planları ve buluşma ayarlamak için 'I'm going to...' ve 'Are you free...?' kalıplarını kullanın.",
        "Для планов на будущее и встреч используйте 'I'm going to...' и 'Are you free...?'"
      ),
      commonMistake: {
        incorrect: "I going to call you tonight.",
        correct: "I'm going to call you tonight.",
        explanation: ML(
          "'going to' qəlibindən əvvəl 'am / is / are' köməkçisini unutmayın.",
          "Always include 'am / is / are' before 'going to'.",
          "'going to' kalıbından önce 'am / is / are' getirmeyi unutmayın.",
          "Не забывайте 'am / is / are' перед 'going to'."
        ),
      },
      chunks: [
        {
          word: "Are you free tomorrow evening?",
          phonetic: "/ɑː juː friː təˈmɒrəʊ ˈiːvnɪŋ/",
          audioText: "Are you free tomorrow evening?",
          translations: ML("Sabah axşam vaxtın varmı (boşsan)?", "Inviting a friend to hang out", "Yarın akşam müsait misin?", "Ты свободен завтра вечером?"),
          exampleSentence: "Hey! Are you free tomorrow evening for dinner?",
          exampleTranslation: ML("Salam! Sabah axşam şam yeməyi üçün boşsan?", "Texting a friend", "Selam! Yarın akşam yemek için müsait misin?", "Привет! Ты свободен завтра вечером на ужин?"),
        },
        {
          word: "I'm going to visit...",
          phonetic: "/aɪm ˈɡəʊɪŋ tuː ˈvɪzɪt/",
          audioText: "I'm going to visit the museum",
          translations: ML("Mən ... ziyarət etməyi planlaşdırıram", "Talking about an upcoming plan", "... ziyaret edeceğim", "Я собираюсь посетить..."),
          exampleSentence: "This Saturday, I'm going to visit the art gallery.",
          exampleTranslation: ML("Bu şənbə rəsm qalereyasını ziyarət edəcəyəm.", "Weekend plan", "Bu cumartesi sanat galerisini ziyaret edeceğim.", "В эту субботу я собираюсь посетить галерею."),
        },
        {
          word: "Sounds like a great plan!",
          phonetic: "/saʊndz laɪk ə ɡreɪt plæn/",
          audioText: "Sounds like a great plan!",
          translations: ML("Əla plan kimi səslənir! (Razıyam!)", "Enthusiastically agreeing to an invitation", "Harika bir plan gibi geliyor!", "Звучит как отличный план!"),
          exampleSentence: "Coffee at five? Sounds like a great plan!",
          exampleTranslation: ML("Saat beşdə qəhvə? Əla plan kimi səslənir!", "Accepting an invite", "Beşte kahve mi? Harika bir plan!", "Кофе в пять? Звучит как отличный план!"),
        },
      ],
      dialogue: {
        title: "Making Weekend Plans",
        titleTranslation: ML("Həftəsonu Planı", "Making Weekend Plans", "Hafta Sonu Planı", "Планы на выходные"),
        lines: [
          "Leo: \"Are you free tomorrow evening?\"",
          "You: \"Yes! What do you have in mind?\"",
          "Leo: \"I'm going to visit the new jazz club.\"",
          "You: \"Sounds like a great plan! Let's go together.\"",
        ],
      },
      scrambleTask: {
        meaningPrompt: ML(
          "Əla plan kimi səslənir!",
          "Situation: Enthusiastically agree to your friend's suggestion:",
          "Harika bir plan gibi geliyor!",
          "Звучит как отличный план!",
          { es: "¡Suena como un gran plan!", de: "Klingt nach einem tollen Plan!", fr: "Ça a l'air d'être un super plan !" }
        ),
        sentenceToBuild: ["Sounds", "like", "a", "great", "plan!"],
        distractorWords: ["is", "for"],
        correctSentence: "Sounds like a great plan!",
      },
      blankTask: {
        sentenceWithBlank: "Are you ___ tomorrow evening?",
        options: ["free", "freely", "freedom"],
      },
      listenTask: {
        audioPrompt: "Are you free tomorrow evening?",
        options: ["Are you free tomorrow evening?", "Where did you go yesterday?", "I have already eaten"],
      },
      bossTask: {
        meaningPrompt: ML(
          "Sabah axşam boşsan (vaxtın varmı)?",
          "Situation: Ask a friend if they are available tomorrow evening:",
          "Yarın akşam müsait misin?",
          "Ты свободен завтра вечером?"
        ),
        sentenceToBuild: ["Are", "you", "free", "tomorrow", "evening?"],
        distractorWords: ["do", "was"],
        correctSentence: "Are you free tomorrow evening?",
      },
    },
  ],
  B1: [
    IMMERSION_BLUEPRINTS.b1_unit_01,
    {
      formula: "If I were in your shoes... • It depends on...",
      explanation: ML(
        "Məsləhət verərkən və ya şərti situasiyaları qiymətləndirərkən 'If I were you...' (Sənin yerində olsaydım) və 'It depends on...' (...-dan asılıdır) qəliblərini işlədin.",
        "Give thoughtful advice and weigh options naturally using 'If I were you...' and 'It depends on...'.",
        "Tavsiye verirken veya koşulları değerlendirirken 'If I were you...' (Senin yerinde olsaydım) ve 'It depends on...' (...-e bağlı) kalıplarını kullanın.",
        "Давайте советы и оценивайте ситуации с помощью фраз 'If I were you...' и 'It depends on...'."
      ),
      commonMistake: {
        incorrect: "It depends from the weather.",
        correct: "It depends on the weather.",
        explanation: ML(
          "'depend' feli həmişə 'on' sözönü ilə işlənir: 'depends on'.",
          "Always pair 'depend' with 'on', never 'from' or 'of'.",
          "'depend' fiili her zaman 'on' edatıyla kullanılır: 'depends on'.",
          "Глагол 'depend' всегда используется с предлогом 'on'."
        ),
      },
      chunks: [
        {
          word: "If I were you, I would...",
          phonetic: "/ɪf aɪ wɜː juː aɪ wʊd/",
          audioText: "If I were you, I would accept the offer",
          translations: ML("Sənin yerində olsaydım, mən ... edərdim", "Giving friendly or professional advice", "Senin yerinde olsaydım ... yapardım", "На твоем месте я бы..."),
          exampleSentence: "If I were you, I would apply for that role.",
          exampleTranslation: ML("Sənin yerində olsaydım, o vəzifəyə müraciət edərdim.", "Career advice", "Senin yerinde olsaydım o pozisyona başvururdum.", "На твоем месте я бы подал заявку на эту должность."),
        },
        {
          word: "It really depends on...",
          phonetic: "/ɪt ˈrɪəli dɪˈpendz ɒn/",
          audioText: "It really depends on the budget",
          translations: ML("Bu, həqiqətən ...-dan asılıdır", "Giving a nuanced, realistic answer", "Bu gerçekten ...-e bağlı", "Это действительно зависит от..."),
          exampleSentence: "It really depends on our schedule next month.",
          exampleTranslation: ML("Bu, gələn aykı qrafikimizdən asılıdır.", "Project planning", "Bu tamamen gelecek ayki programımıza bağlı.", "Это зависит от нашего графика в следующем месяце."),
        },
        {
          word: "Let's look at the big picture",
          phonetic: "/lets lʊk æt ðə bɪɡ ˈpɪktʃə/",
          audioText: "Let's look at the big picture",
          translations: ML("Gəlin məsələyə geniş (ümumi) baxaq", "Focusing on the overall goal rather than small details", "Büyük resme bakalım", "Давайте посмотрим на картину в целом"),
          exampleSentence: "Before deciding, let's look at the big picture.",
          exampleTranslation: ML("Qərar verməzdən əvvəl gəlin məsələyə geniş baxaq.", "Team discussion", "Karar vermeden önce büyük resme bakalım.", "Прежде чем решить, давайте посмотрим на картину в целом."),
        },
      ],
      dialogue: {
        title: "Weighing a Job Offer",
        titleTranslation: ML("İş Təklifini Dəyərləndirmək", "Weighing a Job Offer", "İş Teklifini Değerlendirmek", "Обсуждение предложения о работе"),
        lines: [
          "Claire: \"Should I move to Berlin for this new job?\"",
          "You: \"It really depends on your long-term goals.\"",
          "Claire: \"The salary is great, but it's a big change.\"",
          "You: \"Let's look at the big picture. If I were you, I would go for it!\"",
        ],
      },
      scrambleTask: {
        meaningPrompt: ML(
          "Gəlin məsələyə geniş (ümumi) baxaq",
          "Situation: Encourage your team to focus on the overall vision rather than tiny details:",
          "Büyük resme bakalım",
          "Давайте посмотрим на картину в целом",
          { es: "Veamos el panorama general", de: "Schauen wir uns das große Ganze an", fr: "Regardons la situation dans son ensemble" }
        ),
        sentenceToBuild: ["Let's", "look", "at", "the", "big", "picture"],
        distractorWords: ["from", "was"],
        correctSentence: "Let's look at the big picture",
      },
      blankTask: {
        sentenceWithBlank: "It really depends ___ your goals.",
        options: ["on", "from", "of"],
      },
      listenTask: {
        audioPrompt: "Let's look at the big picture",
        options: ["Let's look at the big picture", "Where is the nearest station?", "Can I have some water?"],
      },
      bossTask: {
        meaningPrompt: ML(
          "Bu, həqiqətən büdcədən asılıdır",
          "Situation: Explain that the decision depends on the budget:",
          "Bu gerçekten bütçeye bağlı",
          "Это действительно зависит от бюджета"
        ),
        sentenceToBuild: ["It", "really", "depends", "on", "the", "budget"],
        distractorWords: ["from", "by"],
        correctSentence: "It really depends on the budget",
      },
    },
  ],
  B2: [IMMERSION_BLUEPRINTS.b2_unit_01],
  C1: [IMMERSION_BLUEPRINTS.c1_unit_01],
};

/**
 * Dynamically builds a 100% authentic, Story-Driven Lexical Immersion unit
 * for ANY node across A0, A1, A2, B1, B2, and C1.
 * Guarantees:
 * - Concise 2-minute bite-sized experience (3 core chunks)
 * - Interactive multi-turn dialogue (WhatsApp/Chat style)
 * - ZERO English-to-English word-scramble logical errors
 * - Full 13-language localization compatibility
 */
export function buildDynamicUnitContent(
  nodeId: string,
  levelId: LevelId,
  nodeTitle: LocalizedString,
  nodeDesc: LocalizedString,
  nodeOrder: number,
  shortTitle: LocalizedString,
  estimatedMinutes: number = 2,
  iconName: string = 'book-open',
  nodeType?: 'lesson' | 'chest' | 'checkpoint'
): CurriculumUnit {
  // 1. Check exact match in IMMERSION_BLUEPRINTS first, otherwise pick deterministically from the level pool
  const pool = LEVEL_SCENARIO_POOLS[levelId] || LEVEL_SCENARIO_POOLS.A1;
  const blueprint =
    IMMERSION_BLUEPRINTS[nodeId] ||
    pool[(Math.max(1, nodeOrder) - 1) % pool.length];

  const vocabList: VocabularyItem[] = blueprint.chunks.map((c, idx) => ({
    id: `${nodeId}_v${idx + 1}`,
    word: c.word,
    phonetic: c.phonetic,
    audioText: c.audioText,
    translations: c.translations,
    exampleSentence: c.exampleSentence,
    exampleTranslation: c.exampleTranslation,
  }));

  const dialogueContent = blueprint.dialogue.lines.join('\n');

  const exercises: CurriculumExercise[] = [
    {
      id: `${nodeId}_ex1`,
      type: 'word_scramble',
      prompt: ML(
        "Mənanı ingiliscə ifadə edin:",
        "Build the natural English expression for this situation:",
        "Bu anlamı İngilizce ifade edin:",
        "Выразите эту мысль по-английски:",
        {
          es: "Expresa esta idea en inglés:",
          de: "Drücke diesen Gedanken auf Englisch aus:",
          fr: "Exprimez cette idée en anglais :",
          it: "Esprimi questo concetto in inglese:",
          pt: "Expresse esta ideia em inglês:",
          pl: "Wyraź tę myśl po angielsku:",
          cs: "Vyjádřete tuto myšlenku anglicky:",
          hu: "Fejezd ki ezt a gondolatot angolul:",
          uk: "Висловіть цю думку англійською:",
        }
      ),
      instruction: blueprint.scrambleTask.meaningPrompt,
      sentenceToBuild: blueprint.scrambleTask.sentenceToBuild,
      distractorWords: blueprint.scrambleTask.distractorWords,
      correctSentence: blueprint.scrambleTask.correctSentence,
      xpReward: 10,
    },
    {
      id: `${nodeId}_ex2`,
      type: 'fill_in_the_blank',
      prompt: ML(
        "Boşluğa uyğun olan sözü seçin:",
        "Choose the natural word to complete the chunk:",
        "Boşluğa uygun olan kelimeyi seçin:",
        "Выберите подходящее слово для пропуска:",
        {
          es: "Elige la palabra correcta para el espacio:",
          de: "Wähle das passende Wort für die Lücke:",
          fr: "Choisissez le mot juste pour compléter :",
          it: "Scegli la parola corretta per completare:",
          pt: "Escolha a palavra certa para a lacuna:",
          pl: "Wybierz właściwe słowo w lukę:",
          cs: "Vyberte správné slovo do mezery:",
          hu: "Válaszd ki a megfelelő szót az üres helyre:",
          uk: "Виберіть відповідне слово для пропуску:",
        }
      ),
      instruction: ML(
        blueprint.blankTask.sentenceWithBlank,
        blueprint.blankTask.sentenceWithBlank,
        blueprint.blankTask.sentenceWithBlank,
        blueprint.blankTask.sentenceWithBlank
      ),
      options: [
        { id: 'o1', text: blueprint.blankTask.options[0], isCorrect: true },
        { id: 'o2', text: blueprint.blankTask.options[1], isCorrect: false },
        { id: 'o3', text: blueprint.blankTask.options[2], isCorrect: false },
      ],
      xpReward: 10,
    },
    {
      id: `${nodeId}_ex3`,
      type: 'listening_dictation',
      prompt: ML(
        "Səsi dinləyin və eşitdiyiniz ifadəni seçin:",
        "Listen carefully and select the phrase you hear:",
        "Sesi dinleyin ve duyduğunuz ifadeyi seçin:",
        "Прослушайте и выберите услышанную фразу:",
        {
          es: "Escucha y selecciona la frase que oyes:",
          de: "Hör zu und wähle die Phrase, die du hörst:",
          fr: "Écoutez et sélectionnez l'expression entendue :",
          it: "Ascolta e seleziona la frase che senti:",
          pt: "Ouça e selecione a frase que você ouviu:",
          pl: "Posłuchaj i wybierz usłyszany zwrot:",
          cs: "Poslouchejte a vyberte frázi, kterou slyšíte:",
          hu: "Hallgasd meg, és válaszd ki a hallott kifejezést:",
          uk: "Прослухайте та виберіть почуту фразу:",
        }
      ),
      audioPrompt: blueprint.listenTask.audioPrompt,
      options: [
        { id: 'l1', text: blueprint.listenTask.options[0], isCorrect: true },
        { id: 'l2', text: blueprint.listenTask.options[1], isCorrect: false },
        { id: 'l3', text: blueprint.listenTask.options[2], isCorrect: false },
      ],
      xpReward: 10,
    },
  ];

  const bossQuiz: CurriculumExercise[] = [
    {
      id: `${nodeId}_bq1`,
      type: 'word_scramble',
      prompt: ML(
        "Yekun sınaq: Frazanı ingiliscə qurun",
        "Final Mastery Recall: Build the English chunk",
        "Bölüm sonu tekrarı: Kalıbı İngilizce kurun",
        "Финальная проверка: Соберите английскую фразу",
        {
          es: "Repaso final: Construye la frase en inglés",
          de: "Abschlusstest: Bilde die englische Phrase",
          fr: "Rappel final : Construisez l'expression en anglais",
        }
      ),
      instruction: blueprint.bossTask.meaningPrompt,
      sentenceToBuild: blueprint.bossTask.sentenceToBuild,
      distractorWords: blueprint.bossTask.distractorWords,
      correctSentence: blueprint.bossTask.correctSentence,
      xpReward: 15,
    },
  ];

  return {
    id: nodeId,
    level: levelId,
    order: nodeOrder,
    title: nodeTitle,
    description: nodeDesc,
    estimatedMinutes: Math.min(estimatedMinutes, 3),
    iconName,
    grammarRule: {
      id: `${nodeId}_gr`,
      title: nodeTitle,
      subtitle: nodeDesc,
      explanation: blueprint.explanation,
      formula: blueprint.formula,
      examples: vocabList.slice(0, 2).map((v) => ({
        english: v.exampleSentence,
        translation: v.exampleTranslation,
      })),
      commonMistake: blueprint.commonMistake,
    },
    vocabulary: vocabList,
    story: {
      id: `${nodeId}_story`,
      title: blueprint.dialogue.title,
      titleTranslation: blueprint.dialogue.titleTranslation,
      cefr: levelId,
      wordCount: dialogueContent.split(/\s+/).length,
      content: dialogueContent,
      vocabularyHighlights: vocabList.map((v) => v.word),
    },
    exercises,
    bossQuiz,
    xpReward: nodeType === 'checkpoint' ? 80 : 35,
  };
}
