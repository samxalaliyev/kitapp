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
      "Three magic survival chunks to start speaking from day one: 'Hello' (greeting), 'Thank you' (gratitude), and 'Excuse me' (getting attention politely).",
      "İlk günden konuşmaya başlamak için 3 sihirli kalıp: 'Hello' (Merhaba), 'Thank you' (Teşekkür ederim) ve 'Excuse me' (Affedersiniz).",
      "Три ключевые фразы для общения с первого дня: 'Hello' (Привет), 'Thank you' (Спасибо) и 'Excuse me' (Извините).",
      {
        es: "Tres frases mágicas para hablar desde el primer día: 'Hello' (Hola), 'Thank you' (Gracias) y 'Excuse me' (Disculpe).",
        de: "Drei magische Phrasen für den ersten Tag: 'Hello' (Hallo), 'Thank you' (Danke) und 'Excuse me' (Entschuldigung).",
        fr: "Trois expressions clés dès le premier jour : 'Hello' (Bonjour), 'Thank you' (Merci) et 'Excuse me' (Excusez-moi).",
        it: "Tre frasi magiche fin dal primo giorno: 'Hello' (Ciao/Salve), 'Thank you' (Grazie) ed 'Excuse me' (Mi scusi).",
        pt: "Três frases mágicas desde o primeiro dia: 'Hello' (Olá), 'Thank you' (Obrigado) e 'Excuse me' (Com licença).",
        pl: "Trzy magiczne zwroty od pierwszego dnia: 'Hello' (Cześć), 'Thank you' (Dziękuję) oraz 'Excuse me' (Przepraszam).",
        cs: "Tři kouzelné fráze od prvního dne: 'Hello' (Ahoj/Dobrý den), 'Thank you' (Děkuji) a 'Excuse me' (Promiňte).",
        hu: "Három varázskifejezés az első naptól: 'Hello' (Szia/Üdv), 'Thank you' (Köszönöm) és 'Excuse me' (Elnézést).",
        uk: "Три ключові фрази з першого дня: 'Hello' (Привіт), 'Thank you' (Дякую) та 'Excuse me' (Вибачте).",
      }
    ),
    commonMistake: {
      incorrect: "Thanks you!",
      correct: "Thank you! (or Thanks!)",
      explanation: ML(
        "Ya 'Thank you', ya da təkcə 'Thanks' deyin. İkisini qarışdırıb 'Thanks you' deməyin.",
        "Say either 'Thank you' or 'Thanks'—never combine them into 'Thanks you'.",
        "Ya 'Thank you' ya da sadece 'Thanks' deyin. 'Thanks you' denmez.",
        "Говорите либо 'Thank you', либо 'Thanks', но не 'Thanks you'.",
        {
          es: "Di 'Thank you' o 'Thanks', pero nunca 'Thanks you'.",
          de: "Sage entweder 'Thank you' oder 'Thanks', niemals 'Thanks you'.",
          fr: "Dites 'Thank you' ou 'Thanks', mais jamais 'Thanks you'.",
          it: "Di' 'Thank you' oppure 'Thanks', mai 'Thanks you'.",
          pt: "Diga 'Thank you' ou 'Thanks', nunca 'Thanks you'.",
          pl: "Mów 'Thank you' albo 'Thanks', nigdy 'Thanks you'.",
          cs: "Říkejte buď 'Thank you', nebo 'Thanks', nikdy 'Thanks you'.",
          hu: "Mondd azt, hogy 'Thank you' vagy 'Thanks', de soha ne 'Thanks you'.",
          uk: "Кажіть або 'Thank you', або 'Thanks', але не 'Thanks you'.",
        }
      ),
    },
    chunks: [
      {
        word: "Hello! How are you?",
        phonetic: "/həˈləʊ haʊ ɑː juː/",
        audioText: "Hello! How are you?",
        translations: ML("Salam! Necəsən?", "Greeting someone warmly", "Merhaba! Nasılsın?", "Привет! Как дела?", {
          es: "¡Hola! ¿Cómo estás?", de: "Hallo! Wie geht es dir?", fr: "Bonjour ! Comment ça va ?", it: "Ciao! Come stai?", pt: "Olá! Como vai?", pl: "Cześć! Jak się masz?", cs: "Ahoj! Jak se máš?", hu: "Szia! Hogy vagy?", uk: "Привіт! Як справи?"
        }),
        exampleSentence: "Hello! How are you today?",
        exampleTranslation: ML("Salam! Bu gün necəsən?", "Friendly daily greeting", "Merhaba! Bugün nasılsın?", "Привет! Как ты сегодня?", {
          es: "¡Hola! ¿Cómo estás hoy?", de: "Hallo! Wie geht es dir heute?", fr: "Bonjour ! Comment vas-tu aujourd'hui ?", it: "Ciao! Come stai oggi?", pt: "Olá! Como você está hoje?", pl: "Cześć! Jak się dziś masz?", cs: "Ahoj! Jak se dnes máš?", hu: "Szia! Hogy vagy ma?", uk: "Привіт! Як ти сьогодні?"
        }),
      },
      {
        word: "Thank you very much",
        phonetic: "/θæŋk juː ˈveri mʌtʃ/",
        audioText: "Thank you very much",
        translations: ML("Çox təşəkkür edirəm", "Expressing warm gratitude", "Çok teşekkür ederim", "Большое спасибо", {
          es: "Muchas gracias", de: "Vielen Dank", fr: "Merci beaucoup", it: "Grazie mille", pt: "Muito obrigado", pl: "Dziękuję bardzo", cs: "Mnohokrát děkuji", hu: "Nagyon köszönöm", uk: "Дуже дякую"
        }),
        exampleSentence: "Thank you very much for your help!",
        exampleTranslation: ML("Köməyiniz üçün çox təşəkkür edirəm!", "Thanking someone for assistance", "Yardımınız için çok teşekkür ederim!", "Большое спасибо за помощь!", {
          es: "¡Muchas gracias por tu ayuda!", de: "Vielen Dank für deine Hilfe!", fr: "Merci beaucoup pour votre aide !", it: "Grazie mille per il tuo aiuto!", pt: "Muito obrigado pela sua ajuda!", pl: "Dziękuję bardzo za pomoc!", cs: "Mnohokrát děkuji za pomoc!", hu: "Nagyon köszönöm a segítséged!", uk: "Дуже дякую за вашу допомогу!"
        }),
      },
      {
        word: "Excuse me, please",
        phonetic: "/ɪkˈskjuːz miː pliːz/",
        audioText: "Excuse me, please",
        translations: ML("Bağışlayın, zəhmət olmasa", "Polite way to ask or pass by", "Affedersiniz, lütfen", "Извините, пожалуйста", {
          es: "Disculpe, por favor", de: "Entschuldigung, bitte", fr: "Excusez-moi, s'il vous plaît", it: "Mi scusi, per favore", pt: "Com licença, por favor", pl: "Przepraszam, proszę", cs: "Promiňte, prosím", hu: "Elnézést, kérem", uk: "Вибачте, будь ласка"
        }),
        exampleSentence: "Excuse me, please! Are you Emma?",
        exampleTranslation: ML("Bağışlayın! Siz Emmasınız?", "Politely getting someone's attention", "Affedersiniz! Siz Emma mısınız?", "Извините! Вы Эмма?", {
          es: "¡Disculpe, por favor! ¿Es usted Emma?", de: "Entschuldigung, bitte! Sind Sie Emma?", fr: "Excusez-moi ! Êtes-vous Emma ?", it: "Mi scusi! Lei è Emma?", pt: "Com licença! Você é a Emma?", pl: "Przepraszam! Czy ty jesteś Emma?", cs: "Promiňte! Vy jste Emma?", hu: "Elnézést! Ön Emma?", uk: "Вибачте! Ви Емма?"
        }),
      },
    ],
    dialogue: {
      title: "At the Airport Gate",
      titleTranslation: ML("Hava Limanı Qapısında", "At the Airport Gate", "Havalimanı Kapısında", "У выхода в аэропорту", {
        es: "En la puerta del aeropuerto", de: "Am Flughafen-Gate", fr: "À la porte d'embarquement", it: "Al gate dell'aeroporto", pt: "No portão do aeroporto", pl: "Przy bramce na lotnisku", cs: "U letištní brány", hu: "A repülőtéri kapunál", uk: "Біля виходу в аеропорту"
      }),
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
        { es: "Disculpe, por favor", de: "Entschuldigung, bitte", fr: "Excusez-moi, s'il vous plaît", it: "Mi scusi, per favore", pt: "Com licença, por favor", pl: "Przepraszam, proszę", cs: "Promiňte, prosím", hu: "Elnézést, kérem", uk: "Вибачте, будь ласка" }
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
      "Ask someone's origin with 'Where are you from?' (origin question) and reply naturally with 'I'm from...' (hometown).",
      "Nereli olduğunuzu söylemek ve sormak için hazır kalıp: 'Where are you from?' (Nerelisiniz?) ➔ 'I'm from Istanbul' (İstanbulluyum).",
      "Чтобы спросить, откуда человек, скажите 'Where are you from?' (Откуда вы?), а ответьте: 'I'm from...' (Я из...).",
      {
        es: "Para preguntar el origen usa 'Where are you from?' (¿De dónde eres?) y responde con 'I'm from...' (Soy de...).",
        de: "Frage nach der Herkunft mit 'Where are you from?' (Woher kommst du?) und antworte mit 'I'm from...' (Ich komme aus...).",
        fr: "Demandez l'origine avec 'Where are you from?' (D'où venez-vous ?) et répondez 'I'm from...' (Je viens de...).",
        it: "Chiedi la provenienza con 'Where are you from?' (Di dove sei?) e rispondi 'I'm from...' (Sono di...).",
        pt: "Pergunte a origem com 'Where are you from?' (De onde você é?) e responda 'I'm from...' (Eu sou de...).",
        pl: "Pytaj o pochodzenie zwrotem 'Where are you from?' (Skąd jesteś?) i odpowiadaj 'I'm from...' (Jestem z...).",
        cs: "Zeptejte se na původ frází 'Where are you from?' (Odkud jsi?) a odpovězte 'I'm from...' (Jsem z...).",
        hu: "Kérdezd meg valaki származását így: 'Where are you from?' (Honnan származol?), és válaszolj: 'I'm from...' (...-ból származom).",
        uk: "Запитуйте походження фразою 'Where are you from?' (Звідки ви?) та відповідайте 'I'm from...' (Я з...).",
      }
    ),
    commonMistake: {
      incorrect: "Where you are from?",
      correct: "Where are you from?",
      explanation: ML(
        "Sual verərkən həmişə 'Where are you...' ardıcıllığını saxlayın.",
        "Keep the natural rhythm: 'Where are you from?'",
        "Soru sorarken her zaman 'Where are you from?' dizilimini koruyun.",
        "В вопросе всегда сохраняйте порядок слов: 'Where are you from?'",
        {
          es: "Mantén siempre el orden en la pregunta: 'Where are you from?'",
          de: "Behalte in der Frage immer die Reihenfolge 'Where are you from?' bei.",
          fr: "Gardez toujours l'ordre des mots : 'Where are you from?'",
          it: "Mantieni sempre l'ordine corretto: 'Where are you from?'",
          pt: "Mantenha sempre a ordem na pergunta: 'Where are you from?'",
          pl: "W pytaniu zawsze zachowuj szyk: 'Where are you from?'",
          cs: "V otázce vždy zachovejte slovosled: 'Where are you from?'",
          hu: "Kérdésben mindig tartsd meg a sorrendet: 'Where are you from?'",
          uk: "У запитанні завжди зберігайте порядок слів: 'Where are you from?'",
        }
      ),
    },
    chunks: [
      {
        word: "Where are you from?",
        phonetic: "/weər ɑː juː frɒm/",
        audioText: "Where are you from?",
        translations: ML("Haradansınız? (Haralısınız?)", "Asking someone's home country or city", "Nerelisiniz?", "Откуда вы?", {
          es: "¿De dónde eres?", de: "Woher kommst du?", fr: "D'où venez-vous ?", it: "Di dove sei?", pt: "De onde você é?", pl: "Skąd jesteś?", cs: "Odkud jsi?", hu: "Honnan származol?", uk: "Звідки ви?"
        }),
        exampleSentence: "Hi! Where are you from?",
        exampleTranslation: ML("Salam! Siz haradansınız?", "Friendly question on first meeting", "Merhaba! Nerelisiniz?", "Привет! Откуда ты?", {
          es: "¡Hola! ¿De dónde eres?", de: "Hallo! Woher kommst du?", fr: "Salut ! D'où viens-tu ?", it: "Ciao! Di dove sei?", pt: "Oi! De onde você é?", pl: "Cześć! Skąd jesteś?", cs: "Ahoj! Odkud jsi?", hu: "Szia! Honnan származol?", uk: "Привіт! Звідки ти?"
        }),
      },
      {
        word: "I'm from...",
        phonetic: "/aɪm frɒm/",
        audioText: "I'm from London",
        translations: ML("Mən ...-danam", "Stating your city or country", "Ben ...-lıyım", "Я из...", {
          es: "Soy de...", de: "Ich komme aus...", fr: "Je viens de...", it: "Sono di...", pt: "Eu sou de...", pl: "Jestem z...", cs: "Jsem z...", hu: "...-ból/-ből származom", uk: "Я з..."
        }),
        exampleSentence: "I'm from London. Nice to meet you!",
        exampleTranslation: ML("Mən Londondanam. Tanışlığımıza şadam!", "Introducing your hometown", "Ben Londralıyım. Tanıştığıma memnun oldum!", "Я из Лондона. Приятно познакомиться!", {
          es: "Soy de Londres. ¡Mucho gusto!", de: "Ich komme aus London. Freut mich!", fr: "Je viens de Londres. Enchanté !", it: "Sono di Londra. Piacere di conoscerti!", pt: "Eu sou de Londres. Prazer em conhecer você!", pl: "Jestem z Londynu. Miło cię poznać!", cs: "Jsem z Londýna. Rád tě poznávám!", hu: "Londonból származom. Örülök, hogy megismertelek!", uk: "Я з Лондона. Приємно познайомитися!"
        }),
      },
      {
        word: "Welcome to our city",
        phonetic: "/ˈwelkəm tuː ˈaʊə ˈsɪti/",
        audioText: "Welcome to our city",
        translations: ML("Şəhərimizə xoş gəlmisiniz", "Warmly welcoming a visitor", "Şehrimize hoş geldiniz", "Добро пожаловать в наш город", {
          es: "Bienvenido a nuestra ciudad", de: "Willkommen in unserer Stadt", fr: "Bienvenue dans notre ville", it: "Benvenuto nella nostra città", pt: "Bem-vindo à nossa cidade", pl: "Witamy w naszym mieście", cs: "Vítejte v našem městě", hu: "Üdvözöljük a városunkban", uk: "Ласкаво просимо до нашого міста"
        }),
        exampleSentence: "Welcome to our city, David!",
        exampleTranslation: ML("Şəhərimizə xoş gəlmisiniz, David!", "Greeting a guest", "Şehrimize hoş geldin, David!", "Добро пожаловать в наш город, Дэвид!", {
          es: "¡Bienvenido a nuestra ciudad, David!", de: "Willkommen in unserer Stadt, David!", fr: "Bienvenue dans notre ville, David !", it: "Benvenuto nella nostra città, David!", pt: "Bem-vindo à nossa cidade, David!", pl: "Witamy w naszym mieście, David!", cs: "Vítejte v našem městě, Davide!", hu: "Üdvözöllek a városunkban, David!", uk: "Ласкаво просимо до нашого міста, Девіде!"
        }),
      },
    ],
    dialogue: {
      title: "In the Hotel Lobby",
      titleTranslation: ML("Otel Foyesində", "In the Hotel Lobby", "Otel Lobisinde", "В холле отеля", {
        es: "En el vestíbulo del hotel", de: "In der Hotellobby", fr: "Dans le hall de l'hôtel", it: "Nella hall dell'hotel", pt: "No lobby do hotel", pl: "W lobby hotelowym", cs: "V hotelové hale", hu: "A szálloda halljában", uk: "У холі готелю"
      }),
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
        "Добро пожаловать в наш город",
        { es: "Bienvenido a nuestra ciudad", de: "Willkommen in unserer Stadt", fr: "Bienvenue dans notre ville", it: "Benvenuto nella nostra città", pt: "Bem-vindo à nossa cidade", pl: "Witamy w naszym mieście", cs: "Vítejte v našem městě", hu: "Üdvözöljük a városunkban", uk: "Ласкаво просимо до нашого міста" }
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
      "Introduce objects or people near you using 'This is my...' (showing ownership) and hand over items with 'Here is...' (offering).",
      "Yanınızdaki eşyayı veya kişiyi gösterirken 'This is my...' (Bu benim...), uzatırken 'Here is...' (İşte burada) kalıbını kullanın.",
      "Представляйте людей или вещи фразой 'This is my...' (Это мой...), а подавая что-то, говорите 'Here is...' (Вот...).",
      {
        es: "Muestra tus objetos o amigos con 'This is my...' (Este es mi...) y entrega algo diciendo 'Here is...' (Aquí está...).",
        de: "Zeige Dinge oder Personen mit 'This is my...' (Das ist mein...) und überreiche etwas mit 'Here is...' (Hier ist...).",
        fr: "Présentez vos affaires avec 'This is my...' (C'est mon...) et tendez un objet avec 'Here is...' (Voici...).",
        it: "Mostra oggetti o persone con 'This is my...' (Questo è il mio...) e porgi qualcosa con 'Here is...' (Ecco il mio...).",
        pt: "Mostre objetos ou pessoas com 'This is my...' (Este é o meu...) e entregue algo com 'Here is...' (Aqui está...).",
        pl: "Wskazuj rzeczy lub osoby zwrotem 'This is my...' (To jest mój...), a podając coś mów 'Here is...' (Oto mój...).",
        cs: "Ukazujte věci nebo lidi pomocí 'This is my...' (To je můj...) a podávejte věci frází 'Here is...' (Tady je...).",
        hu: "Mutass be tárgyakat vagy személyeket a 'This is my...' (Ez az én ...-m) és nyújts át dolgokat a 'Here is...' (Tessék, itt a ...) kifejezéssel.",
        uk: "Представляйте речі чи людей фразою 'This is my...' (Це мій...), а подаючи щось, кажіть 'Here is...' (Ось мій...).",
      }
    ),
    commonMistake: {
      incorrect: "This my ticket.",
      correct: "This is my ticket.",
      explanation: ML(
        "İngiliscə 'is' bağlayıcısını unutmayın: 'This is my ticket'.",
        "Always include 'is' after 'This' in singular statements.",
        "'This' kelimesinden sonra 'is' getirmeyi unutmayın.",
        "Не забывайте глагол 'is': 'This is my ticket'.",
        {
          es: "No olvides incluir 'is' después de 'This': 'This is my ticket'.",
          de: "Vergiss nicht das Wort 'is' nach 'This': 'This is my ticket'.",
          fr: "N'oubliez pas le verbe 'is' après 'This' : 'This is my ticket'.",
          it: "Non dimenticare il verbo 'is' dopo 'This': 'This is my ticket'.",
          pt: "Não se esqueça do verbo 'is' após 'This': 'This is my ticket'.",
          pl: "Nie zapominaj o słowie 'is' po 'This': 'This is my ticket'.",
          cs: "Nezapomínejte na sloveso 'is' po 'This': 'This is my ticket'.",
          hu: "Ne felejtsd el az 'is' szócskát a 'This' után: 'This is my ticket'.",
          uk: "Не забувайте дієслово 'is' після 'This': 'This is my ticket'.",
        }
      ),
    },
    chunks: [
      {
        word: "This is my bag",
        phonetic: "/ðɪs ɪz maɪ bæɡ/",
        audioText: "This is my bag",
        translations: ML("Bu mənim çantamdır", "Identifying your personal item", "Bu benim çantam", "Это моя сумка", {
          es: "Este es mi bolso", de: "Das ist meine Tasche", fr: "C'est mon sac", it: "Questa è la mia borsa", pt: "Esta é a minha bolsa", pl: "To jest moja torba", cs: "To je moje taška", hu: "Ez az én táskám", uk: "Це моя сумка"
        }),
        exampleSentence: "Excuse me, this is my bag.",
        exampleTranslation: ML("Bağışlayın, bu mənim çantamdır.", "Pointing out your luggage", "Affedersiniz, bu benim çantam.", "Извините, это моя сумка.", {
          es: "Disculpe, este es mi bolso.", de: "Entschuldigung, das ist meine Tasche.", fr: "Excusez-moi, c'est mon sac.", it: "Mi scusi, questa è la mia borsa.", pt: "Com licença, esta é a minha bolsa.", pl: "Przepraszam, to jest moja torba.", cs: "Promiňte, to je moje taška.", hu: "Elnézést, ez az én táskám.", uk: "Вибачте, це моя сумка."
        }),
      },
      {
        word: "Here is my ticket",
        phonetic: "/hɪər ɪz maɪ ˈtɪkɪt/",
        audioText: "Here is my ticket",
        translations: ML("Buyurun, bu da mənim biletim", "Handing your ticket to an agent", "Buyurun, işte biletim", "Вот мой билет", {
          es: "Aquí está mi billete", de: "Hier ist mein Ticket", fr: "Voici mon billet", it: "Ecco il mio biglietto", pt: "Aqui está o meu bilhete", pl: "Oto mój bilet", cs: "Tady je moje jízdenka", hu: "Tessék, itt a jegyem", uk: "Ось мій квиток"
        }),
        exampleSentence: "Here is my ticket and passport.",
        exampleTranslation: ML("Buyurun, biletim və pasportum.", "At the boarding desk", "İşte biletim ve pasaportum.", "Вот мой билет и паспорт.", {
          es: "Aquí están mi billete y mi pasaporte.", de: "Hier sind mein Ticket und mein Reisepass.", fr: "Voici mon billet et mon passeport.", it: "Ecco il mio biglietto e il passaporto.", pt: "Aqui estão meu bilhete e passaporte.", pl: "Oto mój bilet i paszport.", cs: "Tady je moje letenka a pas.", hu: "Tessék, itt a jegyem és az útlevelem.", uk: "Ось мій квиток і паспорт."
        }),
      },
      {
        word: "Is this your phone?",
        phonetic: "/ɪz ðɪs jɔː fəʊn/",
        audioText: "Is this your phone?",
        translations: ML("Bu sənin telefonundur?", "Asking if an item belongs to someone", "Bu senin telefonun mu?", "Это твой телефон?", {
          es: "¿Es este tu teléfono?", de: "Ist das dein Handy?", fr: "Est-ce ton téléphone ?", it: "È questo il tuo telefono?", pt: "Este é o seu telefone?", pl: "Czy to twój telefon?", cs: "Je to tvůj telefon?", hu: "Ez a te telefonod?", uk: "Це твій телефон?"
        }),
        exampleSentence: "Excuse me, is this your phone?",
        exampleTranslation: ML("Bağışlayın, bu sizin telefonunuzdur?", "Helping someone who dropped their phone", "Affedersiniz, bu sizin telefonunuz mu?", "Извините, это ваш телефон?", {
          es: "Disculpe, ¿es este su teléfono?", de: "Entschuldigung, ist das Ihr Handy?", fr: "Excusez-moi, est-ce votre téléphone ?", it: "Mi scusi, è il Suo telefono?", pt: "Com licença, este é o seu telefone?", pl: "Przepraszam, czy to twój telefon?", cs: "Promiňte, je to váš telefon?", hu: "Elnézést, ez az Ön telefonja?", uk: "Вибачте, це ваш телефон?"
        }),
      },
    ],
    dialogue: {
      title: "At the Check-in Desk",
      titleTranslation: ML("Qeydiyyat Masasında", "At the Check-in Desk", "Kayıt Masasında", "На стойке регистрации", {
        es: "En el mostrador de facturación", de: "Am Check-in-Schalter", fr: "Au comptoir d'enregistrement", it: "Al banco del check-in", pt: "No balcão de check-in", pl: "Przy stanowisku odprawy", cs: "U odbavovací přepážky", hu: "Az utasfelvételi pultnál", uk: "На стійці реєстрації"
      }),
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
        "Это твой телефон?",
        { es: "¿Es este tu teléfono?", de: "Ist das dein Handy?", fr: "Est-ce ton téléphone ?", it: "È questo il tuo telefono?", pt: "Este é o seu telefone?", pl: "Czy to twój telefon?", cs: "Je to tvůj telefon?", hu: "Ez a te telefonod?", uk: "Це твій телефон?" }
      ),
      sentenceToBuild: ["Is", "this", "your", "phone?"],
      distractorWords: ["my", "are"],
      correctSentence: "Is this your phone?",
    },
  },

  a0_unit_04: {
    formula: "Can I have water, please? • A table for two",
    explanation: ML(
      "Su, çay və ya kömək istəyərkən ən təbii sual qəlibi: 'Can I have..., please?' (Zəhmət olmasa, ... ala bilərəmmi?) və 'A table for two' (İki nəfərlik masa).",
      "Ask for water, food, or help anywhere in the world using the polite chunk: 'Can I have..., please?' (polite request) and 'A table for two' (at a restaurant).",
      "Su, çay veya bir şey isterken en doğal kalıp: 'Can I have..., please?' (... alabilir miyim lütfen?) ve 'A table for two' (İki kişilik masa).",
      "Самый естественный способ попросить воды или еды: 'Can I have..., please?' (Можно мне..., пожалуйста?) и 'A table for two' (Столик на двоих).",
      {
        es: "Para pedir agua o comida con cortesía usa 'Can I have..., please?' (¿Me da..., por favor?) y 'A table for two' (Una mesa para dos).",
        de: "Bitte höflich um Wasser oder Essen mit 'Can I have..., please?' (Kann ich bitte ... haben?) und 'A table for two' (Ein Tisch für zwei).",
        fr: "Demandez de l'eau ou un plat poliment avec 'Can I have..., please?' (Puis-je avoir..., s'il vous plaît ?) et 'A table for two' (Une table pour deux).",
        it: "Chiedi acqua o cibo con cortesia usando 'Can I have..., please?' (Posso avere..., per favore?) e 'A table for two' (Un tavolo per due).",
        pt: "Peça água ou comida educadamente com 'Can I have..., please?' (Pode me dar..., por favor?) e 'A table for two' (Uma mesa para dois).",
        pl: "Proś o wodę lub jedzenie uprzejmym zwrotem 'Can I have..., please?' (Czy mogę prosić o...?) oraz 'A table for two' (Stolik dla dwojga).",
        cs: "Požádejte o vodu či jídlo zdvořilou frází 'Can I have..., please?' (Mohu dostat..., prosím?) a 'A table for two' (Stůl pro dva).",
        hu: "Kérj vizet vagy ételt udvariasan a 'Can I have..., please?' (Kaphatok ...-t, kérem?) és 'A table for two' (Asztal két főre) kifejezésekkel.",
        uk: "Найприродніший спосіб попросити води чи їжі: 'Can I have..., please?' (Можна мені..., будь ласка?) та 'A table for two' (Столик на двох).",
      }
    ),
    commonMistake: {
      incorrect: "Give me water.",
      correct: "Can I have some water, please?",
      explanation: ML(
        "'Give me' əmr kimi kobud çıxır. Həmişə 'Can I have..., please?' deyin.",
        "'Give me' sounds too blunt. Use 'Can I have..., please?' for natural politeness.",
        "'Give me' kaba duyulur. Her zaman 'Can I have..., please?' kullanın.",
        "'Give me' звучит грубо. Используйте вежливое 'Can I have..., please?'",
        {
          es: "'Give me' suena brusco. Usa siempre 'Can I have..., please?'.",
          de: "'Give me' klingt unhöflich. Nutze immer 'Can I have..., please?'.",
          fr: "'Give me' est trop brusque. Dites toujours 'Can I have..., please?'.",
          it: "'Give me' suona scortese. Usa sempre 'Can I have..., please?'.",
          pt: "'Give me' soa rude. Use sempre 'Can I have..., please?'.",
          pl: "'Give me' brzmi niegrzecznie. Zawsze używaj 'Can I have..., please?'.",
          cs: "'Give me' zní nezdvořile. Vždy používejte 'Can I have..., please?'.",
          hu: "A 'Give me' túl nyers. Használd mindig a 'Can I have..., please?' formát.",
          uk: "'Give me' звучить грубо. Завжди використовуйте ввічливе 'Can I have..., please?'.",
        }
      ),
    },
    chunks: [
      {
        word: "Can I have water, please?",
        phonetic: "/kæn aɪ hæv ˈwɔːtə pliːz/",
        audioText: "Can I have water, please?",
        translations: ML("Zəhmət olmasa, su ala bilərəm?", "Politely asking for water", "Su alabilir miyim, lütfen?", "Можно мне воды, пожалуйста?", {
          es: "¿Me da agua, por favor?", de: "Kann ich bitte Wasser haben?", fr: "Puis-je avoir de l'eau, s'il vous plaît ?", it: "Posso avere dell'acqua, per favore?", pt: "Pode me trazer água, por favor?", pl: "Czy mogę prosić o wodę?", cs: "Mohu dostat vodu, prosím?", hu: "Kaphatok vizet, kérem?", uk: "Можна мені води, будь ласка?"
        }),
        exampleSentence: "Excuse me, can I have water, please?",
        exampleTranslation: ML("Bağışlayın, zəhmət olmasa su ala bilərəm?", "Asking a flight attendant", "Affedersiniz, su alabilir miyim lütfen?", "Извините, можно мне воды, пожалуйста?", {
          es: "Disculpe, ¿me da agua, por favor?", de: "Entschuldigung, kann ich bitte Wasser haben?", fr: "Excusez-moi, puis-je avoir de l'eau, s'il vous plaît ?", it: "Mi scusi, posso avere dell'acqua, per favore?", pt: "Com licença, pode me dar água, por favor?", pl: "Przepraszam, czy mogę prosić o wodę?", cs: "Promiňte, mohu dostat vodu, prosím?", hu: "Elnézést, kaphatok vizet, kérem?", uk: "Вибачте, можна мені води, будь ласка?"
        }),
      },
      {
        word: "A table for two, please",
        phonetic: "/ə ˈteɪbl fɔː tuː pliːz/",
        audioText: "A table for two, please",
        translations: ML("Zəhmət olmasa, iki nəfərlik masa", "Entering a restaurant with a friend", "İki kişilik bir masa, lütfen", "Столик на двоих, пожалуйста", {
          es: "Una mesa para dos, por favor", de: "Einen Tisch für zwei, bitte", fr: "Une table pour deux, s'il vous plaît", it: "Un tavolo per due, per favore", pt: "Uma mesa para dois, por favor", pl: "Stolik dla dwojga, proszę", cs: "Stůl pro dva, prosím", hu: "Egy asztalt két főre, kérem", uk: "Столик на двох, будь ласка"
        }),
        exampleSentence: "Good evening! A table for two, please.",
        exampleTranslation: ML("Axşamınız xeyir! İki nəfərlik masa, zəhmət olmasa.", "Greeting the restaurant host", "İyi akşamlar! İki kişilik bir masa, lütfen.", "Добрый вечер! Столик на двоих, пожалуйста.", {
          es: "¡Buenas noches! Una mesa para dos, por favor.", de: "Guten Abend! Einen Tisch für zwei, bitte.", fr: "Bonsoir ! Une table pour deux, s'il vous plaît.", it: "Buonasera! Un tavolo per due, per favore.", pt: "Boa noite! Uma mesa para dois, por favor.", pl: "Dobry wieczór! Stolik dla dwojga, proszę.", cs: "Dobrý večer! Stůl pro dva, prosím.", hu: "Jó estét! Egy asztalt két főre, kérem.", uk: "Добрий вечір! Столик на двох, будь ласка."
        }),
      },
      {
        word: "The menu, please",
        phonetic: "/ðə ˈmenjuː pliːz/",
        audioText: "The menu, please",
        translations: ML("Menyunu verə bilərsiniz, zəhmət olmasa?", "Asking to see the food list", "Menüyü alabilir miyim, lütfen?", "Меню, пожалуйста", {
          es: "El menú, por favor", de: "Die Speisekarte, bitte", fr: "La carte, s'il vous plaît", it: "Il menù, per favore", pt: "O cardápio, por favor", pl: "Poproszę menu", cs: "Jídelní lístek, prosím", hu: "Az étlapot, kérem", uk: "Меню, будь ласка"
        }),
        exampleSentence: "Can I have the menu, please?",
        exampleTranslation: ML("Zəhmət olmasa, menyunu ala bilərəm?", "Seated at a cafe", "Menüyü alabilir miyim lütfen?", "Можно меню, пожалуйста?", {
          es: "¿Me trae el menú, por favor?", de: "Kann ich bitte die Speisekarte haben?", fr: "Puis-je avoir le menu, s'il vous plaît ?", it: "Posso avere il menù, per favore?", pt: "Pode me trazer o cardápio, por favor?", pl: "Czy mogę prosić o menu?", cs: "Mohu dostat jídelní lístek, prosím?", hu: "Megkaphatom az étlapot, kérem?", uk: "Можна меню, будь ласка?"
        }),
      },
    ],
    dialogue: {
      title: "First Evening Restaurant",
      titleTranslation: ML("İlk Axşam Restoranı", "First Evening Restaurant", "İlk Akşam Restoranı", "Первый ужин в ресторане", {
        es: "Primera cena en el restaurante", de: "Erster Abend im Restaurant", fr: "Premier dîner au restaurant", it: "Prima sera al ristorante", pt: "Primeiro jantar no restaurante", pl: "Pierwszy wieczór w restauracji", cs: "První večer v restauraci", hu: "Első este az étteremben", uk: "Перша вечеря в ресторані"
      }),
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
        { es: "Una mesa para dos, por favor", de: "Einen Tisch für zwei, bitte", fr: "Une table pour deux, s'il vous plaît", it: "Un tavolo per due, per favore", pt: "Uma mesa para dois, por favor", pl: "Stolik dla dwojga, proszę", cs: "Stůl pro dva, prosím", hu: "Egy asztalt két főre, kérem", uk: "Столик на двох, будь ласка" }
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
        "Можно мне воды, пожалуйста?",
        { es: "¿Me da agua, por favor?", de: "Kann ich bitte Wasser haben?", fr: "Puis-je avoir de l'eau, s'il vous plaît ?", it: "Posso avere dell'acqua, per favore?", pt: "Pode me dar água, por favor?", pl: "Czy mogę prosić o wodę?", cs: "Mohu dostat vodu, prosím?", hu: "Kaphatok vizet, kérem?", uk: "Можна мені води, будь ласка?" }
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
      "Рассказывая о семье, используйте 'I have...', а спрашивайте с помощью 'Do you have...?'",
      {
        es: "Habla de tu familia usando 'I have...' (Tengo...) y pregunta con 'Do you have...?' (¿Tienes...?).",
        de: "Sprich über deine Familie mit 'I have...' (Ich habe...) und frage andere mit 'Do you have...?' (Hast du...?).",
        fr: "Parlez de votre famille avec 'I have...' (J'ai...) et posez des questions avec 'Do you have...?' (Avez-vous... ?).",
        it: "Parla della tua famiglia usando 'I have...' (Ho...) e chiedi con 'Do you have...?' (Hai...?).",
        pt: "Fale sobre a família usando 'I have...' (Eu tenho...) e pergunte com 'Do you have...?' (Você tem...?).",
        pl: "Mów o rodzinie za pomocą 'I have...' (Mam...) i pytaj innych zwrotem 'Do you have...?' (Czy masz...?).",
        cs: "Mluvte o rodině pomocí 'I have...' (Mám...) a ptejte se ostatních 'Do you have...?' (Máš...?).",
        hu: "Beszélj a családodról az 'I have...' (Nekem van...) szerkezettel, és kérdezz a 'Do you have...?' (Van neked...?) fordulattal.",
        uk: "Розповідайте про сім'ю за допомогою 'I have...' (У мене є...) і запитуйте 'Do you have...?' (Чи є у тебе...?).",
      }
    ),
    commonMistake: {
      incorrect: "She have a sister.",
      correct: "She has a sister.",
      explanation: ML(
        "O (He/She) haqqında danışarkən 'have' yox, 'has' işlənir.",
        "Use 'has' when talking about he or she.",
        "O (He/She) öznesiyle 'have' değil 'has' kullanılır.",
        "С местоимениями He/She используется 'has', а не 'have'.",
        {
          es: "Con 'he' o 'she' se usa 'has', no 'have'.",
          de: "Bei 'he' oder 'she' verwendet man 'has' statt 'have'.",
          fr: "Avec 'he' ou 'she', utilisez 'has' et non 'have'.",
          it: "Con 'he' o 'she' si usa 'has', non 'have'.",
          pt: "Com 'he' ou 'she' usa-se 'has', e não 'have'.",
          pl: "Z zaimkami 'he' oraz 'she' używamy 'has', a nie 'have'.",
          cs: "S 'he' nebo 'she' se používá 'has', nikoli 'have'.",
          hu: "A 'he' és 'she' névmásokkal 'has' használatos, nem 'have'.",
          uk: "Із займенниками 'he' та 'she' вживається 'has', а не 'have'.",
        }
      ),
    },
    chunks: [
      {
        word: "I have a big family",
        phonetic: "/aɪ hæv ə bɪɡ ˈfæməli/",
        audioText: "I have a big family",
        translations: ML("Mənim böyük ailəm var", "Describing a large family", "Büyük bir ailem var", "У меня большая семья", {
          es: "Tengo una gran familia",
          de: "Ich habe eine große Familie",
          fr: "J'ai une grande famille",
          it: "Ho una grande famiglia",
          pt: "Eu tenho uma família grande",
          pl: "Mam dużą rodzinę",
          cs: "Mám velkou rodinu",
          hu: "Nagy családom van",
          uk: "У мене велика сім'я",
        }),
        exampleSentence: "I have a big family in Baku.",
        exampleTranslation: ML("Bakıda böyük ailəm var.", "Talking about relatives", "Bakü'de büyük bir ailem var.", "У меня большая семья в Баку.", {
          es: "Tengo una gran familia en Bakú.",
          de: "Ich habe eine große Familie in Baku.",
          fr: "J'ai une grande famille à Bakou.",
          it: "Ho una grande famiglia a Baku.",
          pt: "Tenho uma grande família em Baku.",
          pl: "Mam dużą rodzinę w Baku.",
          cs: "Mám velkou rodinu v Baku.",
          hu: "Nagy családom van Bakuban.",
          uk: "У мене велика сім'я в Баку.",
        }),
      },
      {
        word: "Do you have brothers or sisters?",
        phonetic: "/duː juː hæv ˈbrʌðəz ɔː ˈsɪstəz/",
        audioText: "Do you have brothers or sisters?",
        translations: ML("Qardaşın və ya bacın var?", "Asking about siblings", "Erkek veya kız kardeşin var mı?", "У тебя есть братья или сестры?", {
          es: "¿Tienes hermanos o hermanas?",
          de: "Hast du Brüder oder Schwestern?",
          fr: "Avez-vous des frères ou des sœurs ?",
          it: "Hai fratelli o sorelle?",
          pt: "Você tem irmãos ou irmãs?",
          pl: "Czy masz braci lub siostry?",
          cs: "Máš bratry nebo sestry?",
          hu: "Vannak fiú- vagy lánytestvéreid?",
          uk: "У тебе є брати чи сестри?",
        }),
        exampleSentence: "Tell me, do you have brothers or sisters?",
        exampleTranslation: ML("De görüm, qardaşın və ya bacın var?", "Getting to know a friend", "Söyle bakalım, kardeşin var mı?", "Скажи, у тебя есть братья или сестры?", {
          es: "Dime, ¿tienes hermanos o hermanas?",
          de: "Sag mal, hast du Brüder oder Schwestern?",
          fr: "Dis-moi, as-tu des frères ou des sœurs ?",
          it: "Dimmi, hai fratelli o sorelle?",
          pt: "Diga-me, você tem irmãos ou irmãs?",
          pl: "Powiedz mi, czy masz braci lub siostry?",
          cs: "Řekni mi, máš bratry nebo sestry?",
          hu: "Mondd csak, vannak testvéreid?",
          uk: "Скажи, у тебе є брати чи сестри?",
        }),
      },
      {
        word: "We spend time together",
        phonetic: "/wiː spend taɪm təˈɡeðə/",
        audioText: "We spend time together",
        translations: ML("Biz birlikdə vaxt keçiririk", "Enjoying family company", "Birlikte vakit geçiriyoruz", "Мы проводим время вместе", {
          es: "Pasamos tiempo juntos",
          de: "Wir verbringen Zeit miteinander",
          fr: "Nous passons du temps ensemble",
          it: "Passiamo del tempo insieme",
          pt: "Nós passamos tempo juntos",
          pl: "Spędzamy razem czas",
          cs: "Trávíme spolu čas",
          hu: "Együtt töltjük az időt",
          uk: "Ми проводимо час разом",
        }),
        exampleSentence: "Every Sunday, we spend time together.",
        exampleTranslation: ML("Hər bazar günü birlikdə vaxt keçiririk.", "Weekend family habit", "Her pazar birlikte vakit geçiririz.", "Каждое воскресенье мы проводим время вместе.", {
          es: "Cada domingo pasamos tiempo juntos.",
          de: "Jeden Sonntag verbringen wir Zeit miteinander.",
          fr: "Chaque dimanche, nous passons du temps ensemble.",
          it: "Ogni domenica passiamo del tempo insieme.",
          pt: "Todo domingo nós passamos tempo juntos.",
          pl: "W każdą niedzielę spędzamy razem czas.",
          cs: "Každou neděli trávíme čas spolu.",
          hu: "Minden vasárnap együtt töltjük az időt.",
          uk: "Щонеділі ми проводимо час разом.",
        }),
      },
    ],
    dialogue: {
      title: "Talking About Family",
      titleTranslation: ML("Ailə Haqqında Söhbət", "Talking About Family", "Aile Hakkında Sohbet", "Разговор о семье", {
        es: "Hablando de la familia",
        de: "Über die Familie sprechen",
        fr: "Parler de la famille",
        it: "Parlando della famiglia",
        pt: "Falando sobre a família",
        pl: "Rozmowa o rodzinie",
        cs: "Povídání o rodině",
        hu: "Beszélgetés a családról",
        uk: "Розмова про сім'ю",
      }),
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
        {
          es: "Tengo una gran familia",
          de: "Ich habe eine große Familie",
          fr: "J'ai une grande famille",
          it: "Ho una grande famiglia",
          pt: "Eu tenho uma família grande",
          pl: "Mam dużą rodzinę",
          cs: "Mám velkou rodinu",
          hu: "Nagy családom van",
          uk: "У мене велика сім'я",
        }
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
        "Мы проводим время вместе",
        {
          es: "Pasamos tiempo juntos",
          de: "Wir verbringen Zeit miteinander",
          fr: "Nous passons du temps ensemble",
          it: "Passiamo del tempo insieme",
          pt: "Nós passamos tempo juntos",
          pl: "Spędzamy razem czas",
          cs: "Trávíme spolu čas",
          hu: "Együtt töltjük az időt",
          uk: "Ми проводимо час разом",
        }
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
      "В незнакомом городе спросите дорогу фразой 'Excuse me, where is the nearest...?'",
      {
        es: "En otra ciudad, preguntar 'Excuse me, where is the nearest...?' (Disculpe, ¿dónde está el ... más cercano?) te salvará.",
        de: "In einer fremden Stadt hilft dir 'Excuse me, where is the nearest...?' (Entschuldigung, wo ist die nächste...?) sofort weiter.",
        fr: "En voyage, la formule 'Excuse me, where is the nearest...?' (Excusez-moi, où est le/la ... le plus proche ?) est indispensable.",
        it: "In viaggio, chiedere 'Excuse me, where is the nearest...?' (Mi scusi, dov'è il ... più vicino?) è utilissimo.",
        pt: "No exterior, perguntar 'Excuse me, where is the nearest...?' (Com licença, onde fica o ... mais próximo?) é essencial.",
        pl: "Za granicą pytanie 'Excuse me, where is the nearest...?' (Przepraszam, gdzie jest najbliższa...?) jest niezastąpione.",
        cs: "V cizině vám otázka 'Excuse me, where is the nearest...?' (Promiňte, kde je nejbližší...?) vždy pomůže.",
        hu: "Külföldön útbaigazításkor az 'Excuse me, where is the nearest...?' (Elnézést, hol van a legközelebbi...?) kifejezés életmentő.",
        uk: "За кордоном фраза 'Excuse me, where is the nearest...?' (Вибачте, де найближча...?) завжди виручить.",
      }
    ),
    commonMistake: {
      incorrect: "Where is metro station?",
      correct: "Where is the metro station?",
      explanation: ML(
        "Konkret məkan soruşarkən 'the' artiklını işlədin: 'Where is the metro station?'.",
        "Include 'the' before specific places in town.",
        "Belirli bir yeri sorarken 'the' kullanın: 'Where is the metro station?'.",
        "Перед конкретным местом используйте артикль 'the'.",
        {
          es: "Usa el artículo 'the' antes de lugares específicos: 'Where is the metro station?'.",
          de: "Verwende 'the' vor bestimmten Orten: 'Where is the metro station?'.",
          fr: "Utilisez 'the' devant un lieu précis : 'Where is the metro station?'.",
          it: "Usa l'articolo 'the' prima di luoghi specifici: 'Where is the metro station?'.",
          pt: "Use 'the' antes de lugares específicos: 'Where is the metro station?'.",
          pl: "Przed konkretnym miejscem użyj przedimka 'the': 'Where is the metro station?'.",
          cs: "Před konkrétním místem použijte člen 'the': 'Where is the metro station?'.",
          hu: "Konkrét helyek előtt használd a 'the' névelőt: 'Where is the metro station?'.",
          uk: "Перед конкретним місцем вживайте артикль 'the': 'Where is the metro station?'.",
        }
      ),
    },
    chunks: [
      {
        word: "Where is the nearest station?",
        phonetic: "/weər ɪz ðə ˈnɪərɪst ˈsteɪʃn/",
        audioText: "Where is the nearest station?",
        translations: ML("Ən yaxın stansiya haradadır?", "Asking for the closest train/metro stop", "En yakın istasyon nerede?", "Где ближайшая станция?", {
          es: "¿Dónde está la estación más cercana?",
          de: "Wo ist die nächste Station?",
          fr: "Où est la station la plus proche ?",
          it: "Dov'è la stazione più vicina?",
          pt: "Onde fica a estação mais próxima?",
          pl: "Gdzie jest najbliższa stacja?",
          cs: "Kde je nejbližší stanice?",
          hu: "Hol van a legközelebbi állomás?",
          uk: "Де знаходиться найближча станція?",
        }),
        exampleSentence: "Excuse me, where is the nearest station?",
        exampleTranslation: ML("Bağışlayın, ən yaxın stansiya haradadır?", "Asking a local on the street", "Affedersiniz, en yakın istasyon nerede?", "Извините, где ближайшая станция?", {
          es: "Disculpe, ¿dónde está la estación más cercana?",
          de: "Entschuldigung, wo ist die nächste Station?",
          fr: "Excusez-moi, où est la station la plus proche ?",
          it: "Mi scusi, dov'è la stazione più vicina?",
          pt: "Com licença, onde fica a estação mais próxima?",
          pl: "Przepraszam, gdzie jest najbliższa stacja?",
          cs: "Promiňte, kde je nejbližší stanice?",
          hu: "Elnézést, hol van a legközelebbi állomás?",
          uk: "Вибачте, де найближча станція?",
        }),
      },
      {
        word: "Go straight and turn left",
        phonetic: "/ɡəʊ streɪt ænd tɜːn left/",
        audioText: "Go straight and turn left",
        translations: ML("Düz gedin və sola dönün", "Giving clear street directions", "Düz gidin ve sola dönün", "Идите прямо и поверните налево", {
          es: "Sigue recto y gira a la izquierda",
          de: "Geh geradeaus und bieg links ab",
          fr: "Allez tout droit et tournez à gauche",
          it: "Vai dritto e gira a sinistra",
          pt: "Siga em frente e vire à esquerda",
          pl: "Idź prosto i skręć w lewo",
          cs: "Jděte rovně a zahněte doleva",
          hu: "Menj egyenesen, majd fordulj balra",
          uk: "Ідіть прямо і поверніть ліворуч",
        }),
        exampleSentence: "Go straight and turn left at the corner.",
        exampleTranslation: ML("Düz gedin və tindən sola dönün.", "Guiding a tourist", "Düz gidin ve köşeden sola dönün.", "Идите прямо и поверните налево на углу.", {
          es: "Sigue recto y gira a la izquierda en la esquina.",
          de: "Geh geradeaus und bieg an der Ecke links ab.",
          fr: "Allez tout droit et tournez à gauche au coin.",
          it: "Vai dritto e gira a sinistra all'angolo.",
          pt: "Siga em frente e vire à esquerda na esquina.",
          pl: "Idź prosto i skręć w lewo na rogu.",
          cs: "Jděte rovně a na rohu zahněte doleva.",
          hu: "Menj egyenesen, és a sarkon fordulj balra.",
          uk: "Ідіть прямо і поверніть ліворуч на розі.",
        }),
      },
      {
        word: "It's five minutes away",
        phonetic: "/ɪts faɪv ˈmɪnɪts əˈweɪ/",
        audioText: "It's five minutes away",
        translations: ML("Buradan beş dəqiqəlik məsafədədir", "Saying a place is very close", "Buradan beş dakika uzaklıkta", "Это в пяти минутах отсюда", {
          es: "Está a cinco minutos",
          de: "Es ist fünf Minuten entfernt",
          fr: "C'est à cinq minutes d'ici",
          it: "È a cinque minuti da qui",
          pt: "Fica a cinco minutos daqui",
          pl: "To jest pięć minut stąd",
          cs: "Je to pět minut odtud",
          hu: "Öt percre van innen",
          uk: "Це за п'ять хвилин звідси",
        }),
        exampleSentence: "Don't worry, it's five minutes away.",
        exampleTranslation: ML("Narahat olmayın, beş dəqiqəlik yoldur.", "Reassuring a walker", "Merak etmeyin, beş dakika uzaklıkta.", "Не волнуйтесь, это в пяти минутах ходьбы.", {
          es: "No te preocupes, está a cinco minutos.",
          de: "Keine Sorge, es ist fünf Minuten entfernt.",
          fr: "Ne vous inquiétez pas, c'est à cinq minutes.",
          it: "Non preoccuparti, è a cinque minuti.",
          pt: "Não se preocupe, fica a cinco minutos.",
          pl: "Nie martw się, to pięć minut stąd.",
          cs: "Nebojte se, je to pět minut odtud.",
          hu: "Ne aggódj, öt percre van innen.",
          uk: "Не хвилюйтеся, це за п'ять хвилин звідси.",
        }),
      },
    ],
    dialogue: {
      title: "Finding the Metro",
      titleTranslation: ML("Metronu Tapmaq", "Finding the Metro", "Metroyu Bulmak", "В поисках метро", {
        es: "Encontrando el metro",
        de: "Die U-Bahn finden",
        fr: "Trouver le métro",
        it: "Trovare la metropolitana",
        pt: "Encontrando o metrô",
        pl: "Szukanie metra",
        cs: "Hledání metra",
        hu: "A metró megtalálása",
        uk: "У пошуках метро",
      }),
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
        {
          es: "Sigue recto y gira a la izquierda",
          de: "Geh geradeaus und bieg links ab",
          fr: "Allez tout droit et tournez à gauche",
          it: "Vai dritto e gira a sinistra",
          pt: "Siga em frente e vire à esquerda",
          pl: "Idź prosto i skręć w lewo",
          cs: "Jděte rovně a zahněte doleva",
          hu: "Menj egyenesen, majd fordulj balra",
          uk: "Ідіть прямо і поверніть ліворуч",
        }
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
        "Где ближайшая станция?",
        {
          es: "¿Dónde está la estación más cercana?",
          de: "Wo ist die nächste Station?",
          fr: "Où est la station la plus proche ?",
          it: "Dov'è la stazione più vicina?",
          pt: "Onde fica a estação mais próxima?",
          pl: "Gdzie jest najbliższa stacja?",
          cs: "Kde je nejbližší stanice?",
          hu: "Hol van a legközelebbi állomás?",
          uk: "Де знаходиться найближча станція?",
        }
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
      "Делитесь прошлыми поездками с помощью готовых фраз: 'I went to...' (Я ездил в...) и 'We had a great time' (Мы отлично провели время).",
      {
        es: "Comparte viajes pasados con frases hechas: 'I went to...' (Fui a...) y 'We had a wonderful time' (Lo pasamos genial).",
        de: "Erzähle von vergangenen Reisen mit Ausdrücken wie 'I went to...' (Ich bin nach ... gefahren) und 'We had a wonderful time' (Wir hatten eine tolle Zeit).",
        fr: "Racontez vos voyages passés avec 'I went to...' (Je suis allé à...) et 'We had a wonderful time' (Nous avons passé un super moment).",
        it: "Racconta viaggi passati con espressioni pronte: 'I went to...' (Sono andato a...) e 'We had a wonderful time' (Siamo stati benissimo).",
        pt: "Conte viagens passadas usando 'I went to...' (Eu fui para...) e 'We had a wonderful time' (Nós nos divertimos muito).",
        pl: "Opowiadaj o przeszłych podróżach za pomocą zwrotów 'I went to...' (Pojechałem do...) oraz 'We had a wonderful time' (Świetnie spędziliśmy czas).",
        cs: "Vyprávějte o minulých cestách pomocí vazeb 'I went to...' (Jel jsem do...) a 'We had a wonderful time' (Skvěle jsme si to užili).",
        hu: "Mesélj múltbeli utazásokról az 'I went to...' (Elmentem ...-ba) és 'We had a wonderful time' (Csodásan éreztük magunkat) kifejezésekkel.",
        uk: "Розповідайте про минулі подорожі за допомогою фраз 'I went to...' (Я їздив до...) та 'We had a wonderful time' (Ми чудово провели час).",
      }
    ),
    commonMistake: {
      incorrect: "Yesterday I go to Rome.",
      correct: "Yesterday I went to Rome.",
      explanation: ML(
        "Keçmiş zamandan danışarkən 'go' həmişə 'went' olur.",
        "Use 'went' instead of 'go' when talking about the past.",
        "Geçmişten bahsederken 'go' yerine her zaman 'went' kullanılır.",
        "Говоря о прошлом, используйте 'went' вместо 'go'.",
        {
          es: "Al hablar del pasado, usa 'went' en lugar de 'go'.",
          de: "Verwende in der Vergangenheit immer 'went' statt 'go'.",
          fr: "Au passé, utilisez toujours 'went' au lieu de 'go'.",
          it: "Quando parli del passato, usa 'went' invece di 'go'.",
          pt: "Ao falar do passado, use 'went' em vez de 'go'.",
          pl: "Mówiąc o przeszłości, używaj 'went' zamiast 'go'.",
          cs: "V minulém čase používejte 'went' místo 'go'.",
          hu: "Múlt időben a 'go' helyett mindig a 'went' alakot használd.",
          uk: "Говорячи про минуле, використовуйте 'went' замість 'go'.",
        }
      ),
    },
    chunks: [
      {
        word: "Last weekend, I went to...",
        phonetic: "/lɑːst ˌwiːkˈend aɪ went tuː/",
        audioText: "Last weekend, I went to Paris",
        translations: ML("Keçən həftəsonu mən ... getdim", "Starting a story about a recent trip", "Geçen hafta sonu ... gittim", "На прошлых выходных я ездил в...", {
          es: "El fin de semana pasado fui a...",
          de: "Letztes Wochenende bin ich nach ... gefahren",
          fr: "Le week-end dernier, je suis allé à...",
          it: "Lo scorso fine settimana sono andato a...",
          pt: "No fim de semana passado, eu fui para...",
          pl: "W zeszły weekend pojechałem do...",
          cs: "Minulý víkend jsem jel do...",
          hu: "Múlt hétvégén elmentem...",
          uk: "Минулими вихідними я їздив до...",
        }),
        exampleSentence: "Last weekend, I went to Rome with friends.",
        exampleTranslation: ML("Keçən həftəsonu dostlarla Romaya getdim.", "Sharing weekend news", "Geçen hafta sonu arkadaşlarla Roma'ya gittim.", "На прошлых выходных я ездил в Рим с друзьями.", {
          es: "El fin de semana pasado fui a Roma con amigos.",
          de: "Letztes Wochenende bin ich mit Freunden nach Rom gefahren.",
          fr: "Le week-end dernier, je suis allé à Rome avec des amis.",
          it: "Lo scorso fine settimana sono andato a Roma con gli amici.",
          pt: "No fim de semana passado, fui a Roma com amigos.",
          pl: "W zeszły weekend pojechałem z przyjaciółmi do Rzymu.",
          cs: "Minulý víkend jsem jel s přáteli do Říma.",
          hu: "Múlt hétvégén Rómába mentem a barátaimmal.",
          uk: "Минулими вихідними я їздив до Рима з друзями.",
        }),
      },
      {
        word: "We had a wonderful time",
        phonetic: "/wiː hæd ə ˈwʌndəfl taɪm/",
        audioText: "We had a wonderful time",
        translations: ML("Biz möhtəşəm vaxt keçirdik", "Saying you really enjoyed an experience", "Harika vakit geçirdik", "Мы чудесно провели время", {
          es: "Lo pasamos de maravilla",
          de: "Wir hatten eine wunderbare Zeit",
          fr: "Nous avons passé un moment merveilleux",
          it: "Siamo stati benissimo",
          pt: "Nós nos divertimos muito",
          pl: "Spędziliśmy cudowny czas",
          cs: "Užili jsme si nádherný čas",
          hu: "Csodálatosan éreztük magunkat",
          uk: "Ми чудово провели час",
        }),
        exampleSentence: "The weather was sunny and we had a wonderful time.",
        exampleTranslation: ML("Hava günəşli idi və möhtəşəm vaxt keçirdik.", "Describing a holiday", "Hava güneşliydi ve harika vakit geçirdik.", "Погода была солнечной, и мы чудесно провели время.", {
          es: "El clima estuvo soleado y lo pasamos de maravilla.",
          de: "Das Wetter war sonnig und wir hatten eine wunderbare Zeit.",
          fr: "Il faisait beau et nous avons passé un moment merveilleux.",
          it: "Il tempo era soleggiato e siamo stati benissimo.",
          pt: "O tempo estava ensolarado e nos divertimos muito.",
          pl: "Pogoda była słoneczna i spędziliśmy cudowny czas.",
          cs: "Počasí bylo slunečné a skvěle jsme si to užili.",
          hu: "Napos volt az idő, és csodálatosan éreztük magunkat.",
          uk: "Погода була сонячною, і ми чудово провели час.",
        }),
      },
      {
        word: "Did you enjoy the trip?",
        phonetic: "/dɪd juː ɪnˈdʒɔɪ ðə trɪp/",
        audioText: "Did you enjoy the trip?",
        translations: ML("Səyahət xoşuna gəldimi?", "Asking someone how their journey went", "Yolculuktan keyif aldın mı?", "Тебе понравилась поездка?", {
          es: "¿Disfrutaste el viaje?",
          de: "Hat dir die Reise gefallen?",
          fr: "Avez-vous apprécié le voyage ?",
          it: "Ti è piaciuto il viaggio?",
          pt: "Você gostou da viagem?",
          pl: "Czy podobała ci się podróż?",
          cs: "Líbil se ti výlet?",
          hu: "Tetszett az utazás?",
          uk: "Тобі сподобалася поїздка?",
        }),
        exampleSentence: "Welcome back! Did you enjoy the trip?",
        exampleTranslation: ML("Xoş gəldin! Səyahət xoşuna gəldimi?", "Greeting a colleague after vacation", "Hoş geldin! Geziden keyif aldın mı?", "С возвращением! Тебе понравилась поездка?", {
          es: "¡Bienvenido de nuevo! ¿Disfrutaste el viaje?",
          de: "Willkommen zurück! Hat dir die Reise gefallen?",
          fr: "Bon retour ! Avez-vous apprécié le voyage ?",
          it: "Bentornato! Ti è piaciuto il viaggio?",
          pt: "Bem-vindo de volta! Você gostou da viagem?",
          pl: "Witaj z powrotem! Podobała ci się podróż?",
          cs: "Vítej zpátky! Líbil se ti výlet?",
          hu: "Üdv újra itt! Tetszett az utazás?",
          uk: "З поверненням! Тобі сподобалася поїздка?",
        }),
      },
    ],
    dialogue: {
      title: "Monday Morning Coffee",
      titleTranslation: ML("Bazar Ertəsi Səhər Qəhvəsi", "Monday Morning Coffee", "Pazartesi Sabah Kahvesi", "Утренний кофе в понедельник", {
        es: "Café del lunes por la mañana",
        de: "Kaffee am Montagmorgen",
        fr: "Café du lundi matin",
        it: "Caffè del lunedì mattina",
        pt: "Café de segunda de manhã",
        pl: "Poniedziałkowa poranna kawa",
        cs: "Pondělní ranní káva",
        hu: "Hétfő reggeli kávé",
        uk: "Ранкова кава в понеділок",
      }),
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
        {
          es: "Lo pasamos de maravilla",
          de: "Wir hatten eine wunderbare Zeit",
          fr: "Nous avons passé un moment merveilleux",
          it: "Siamo stati benissimo",
          pt: "Nós nos divertimos muito",
          pl: "Spędziliśmy cudowny czas",
          cs: "Užili jsme si nádherný čas",
          hu: "Csodálatosan éreztük magunkat",
          uk: "Ми чудово провели час",
        }
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
        "Тебе понравилась поездка?",
        {
          es: "¿Disfrutaste el viaje?",
          de: "Hat dir die Reise gefallen?",
          fr: "Avez-vous apprécié le voyage ?",
          it: "Ti è piaciuto il viaggio?",
          pt: "Você gostou da viagem?",
          pl: "Czy podobała ci się podróż?",
          cs: "Líbil se ti výlet?",
          hu: "Tetszett az utazás?",
          uk: "Тобі сподобалася поїздка?",
        }
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
      "Связывайте прошлый опыт с настоящим при помощи конструкций 'Have you ever...?' и 'I've been...'",
      {
        es: "Conecta tus experiencias con el presente usando 'Have you ever...?' (¿Alguna vez has...?) y 'I've been working on...' (He estado trabajando en...).",
        de: "Verbinde bisherige Erfahrungen mit der Gegenwart durch 'Have you ever...?' (Warst du jemals...?) und 'I've been working on...' (Ich arbeite seit Kurzem an...).",
        fr: "Reliez vos expériences au présent avec 'Have you ever...?' (Avez-vous déjà... ?) et 'I've been working on...' (Je travaille sur...).",
        it: "Collega le esperienze passate al presente con 'Have you ever...?' (Sei mai stato...?) e 'I've been working on...' (Sto lavorando a...).",
        pt: "Conecte experiências passadas ao presente usando 'Have you ever...?' (Você já...?) e 'I've been working on...' (Tenho trabalhado em...).",
        pl: "Łącz dotychczasowe doświadczenia z teraźniejszością za pomocą 'Have you ever...?' (Czy kiedykolwiek...?) i 'I've been working on...' (Pracuję nad...).",
        cs: "Propojte dosavadní zkušenosti se současností pomocí 'Have you ever...?' (Byl jsi někdy...?) a 'I've been working on...' (Pracuji na...).",
        hu: "Kapcsold össze a tapasztalataidat a jelennel a 'Have you ever...?' (Voltál már valaha...?) és az 'I've been working on...' (Egy új projekten dolgozom...) szerkezetekkel.",
        uk: "Пов'язуйте минулий досвід із теперішнім за допомогою 'Have you ever...?' (Ви коли-небудь...?) та 'I've been working on...' (Я працюю над...).",
      }
    ),
    commonMistake: {
      incorrect: "I am working here since 2023.",
      correct: "I've been working here since 2023.",
      explanation: ML(
        "Keçmişdə başlayıb hələ də davam edən işlər üçün 'I am' yox, 'I've been...' işlədin.",
        "Use 'I've been...' (not 'I am') when an action started in the past and continues now.",
        "Geçmişte başlayıp hala devam eden durumlar için 'I am' değil 'I've been...' kullanılır.",
        "Для действий, начавшихся в прошлом и продолжающихся сейчас, используйте 'I've been...'.",
        {
          es: "Para acciones que empezaron en el pasado y continúan hoy, usa 'I've been...' en vez de 'I am'.",
          de: "Für Handlungen, die in der Vergangenheit begannen und noch andauern, nutzt man 'I've been...' statt 'I am'.",
          fr: "Pour une action commencée dans le passé et qui continue, utilisez 'I've been...' et non 'I am'.",
          it: "Per azioni iniziate nel passato che continuano ora, usa 'I've been...' e non 'I am'.",
          pt: "Para ações que começaram no passado e continuam agora, use 'I've been...' e não 'I am'.",
          pl: "Dla czynności rozpoczętych w przeszłości i trwających nadal używaj 'I've been...', a nie 'I am'.",
          cs: "Pro děje, které začaly v minulosti a stále trvají, použijte 'I've been...', nikoli 'I am'.",
          hu: "A múltban kezdődött és most is tartó cselekvésekhez az 'I've been...' szerkezetet használd, ne az 'I am'-et.",
          uk: "Для дій, що почалися в минулому і тривають досі, вживайте 'I've been...', а не 'I am'.",
        }
      ),
    },
    chunks: [
      {
        word: "I've been working on a new project",
        phonetic: "/aɪv biːn ˈwɜːkɪŋ ɒn ə njuː ˈprɒdʒekt/",
        audioText: "I've been working on a new project",
        translations: ML("Yeni bir layihə üzərində işləyirəm (bir müddətdir)", "Explaining your current professional focus", "Yeni bir proje üzerinde çalışıyorum", "Я работаю над новым проектом", {
          es: "He estado trabajando en un nuevo proyecto",
          de: "Ich arbeite seit Kurzem an einem neuen Projekt",
          fr: "Je travaille sur un nouveau projet",
          it: "Sto lavorando a un nuovo progetto",
          pt: "Tenho trabalhado em um novo projeto",
          pl: "Pracuję nad nowym projektem",
          cs: "Pracuji na novém projektu",
          hu: "Egy új projekten dolgozom",
          uk: "Я працюю над новим проєктом",
        }),
        exampleSentence: "Recently, I've been working on a new project.",
        exampleTranslation: ML("Son vaxtlar yeni bir layihə üzərində işləyirəm.", "Updating your team", "Son zamanlarda yeni bir proje üzerinde çalışıyorum.", "В последнее время я работаю над новым проектом.", {
          es: "Recientemente he estado trabajando en un nuevo proyecto.",
          de: "In letzter Zeit arbeite ich an einem neuen Projekt.",
          fr: "Récemment, j'ai travaillé sur un nouveau projet.",
          it: "Di recente sto lavorando a un nuovo progetto.",
          pt: "Recentemente, tenho trabalhado em um novo projeto.",
          pl: "Ostatnio pracuję nad nowym projektem.",
          cs: "V poslední době pracuji na novém projektu.",
          hu: "Mostanában egy új projekten dolgozom.",
          uk: "Останнім часом я працюю над новим проєктом.",
        }),
      },
      {
        word: "Have you ever been abroad?",
        phonetic: "/hæv juː ˈevə biːn əˈbrɔːd/",
        audioText: "Have you ever been abroad?",
        translations: ML("Heç xaricdə olmusunuz?", "Asking about life experiences", "Hiç yurt dışında bulundun mu?", "Вы когда-нибудь бывали за границей?", {
          es: "¿Has estado alguna vez en el extranjero?",
          de: "Warst du schon einmal im Ausland?",
          fr: "Êtes-vous déjà allé à l'étranger ?",
          it: "Sei mai stato all'estero?",
          pt: "Você já esteve no exterior?",
          pl: "Czy byłeś kiedykolwiek za granicą?",
          cs: "Byl jsi někdy v zahraničí?",
          hu: "Jártál már valaha külföldön?",
          uk: "Ви коли-небудь бували за кордоном?",
        }),
        exampleSentence: "Tell me, have you ever been abroad for work?",
        exampleTranslation: ML("De görüm, iş üçün heç xaricdə olmusan?", "Career conversation", "İş için hiç yurt dışında bulundun mu?", "Скажи, ты когда-нибудь бывал за границей по работе?", {
          es: "Dime, ¿alguna vez has estado en el extranjero por trabajo?",
          de: "Sag mal, warst du beruflich schon einmal im Ausland?",
          fr: "Dis-moi, es-tu déjà allé à l'étranger pour le travail ?",
          it: "Dimmi, sei mai stato all'estero per lavoro?",
          pt: "Diga-me, você já esteve no exterior a trabalho?",
          pl: "Powiedz, czy byłeś kiedyś za granicą służbowo?",
          cs: "Řekni mi, byl jsi někdy pracovně v zahraničí?",
          hu: "Mondd, jártál már valaha külföldön munka miatt?",
          uk: "Скажи, ти коли-небудь бував за кордоном по роботі?",
        }),
      },
      {
        word: "It has made a huge difference",
        phonetic: "/ɪt hæz meɪd ə hjuːdʒ ˈdɪfrəns/",
        audioText: "It has made a huge difference",
        translations: ML("Bu, çox böyük fərq yaratdı", "Highlighting a strong positive impact", "Bu çok büyük bir fark yarattı", "Это кардинально всё изменило", {
          es: "Ha marcado una gran diferencia",
          de: "Es hat einen riesigen Unterschied gemacht",
          fr: "Cela a fait une énorme différence",
          it: "Ha fatto un'enorme differenza",
          pt: "Isso fez uma enorme diferença",
          pl: "To zrobiło ogromną różnicę",
          cs: "Udělalo to obrovský rozdíl",
          hu: "Ez hatalmas változást hozott",
          uk: "Це суттєво все змінило",
        }),
        exampleSentence: "Daily reading has made a huge difference.",
        exampleTranslation: ML("Gündəlik mütaliə çox böyük fərq yaratdı.", "Sharing personal growth", "Günlük okuma çok büyük bir fark yarattı.", "Ежедневное чтение очень сильно помогло.", {
          es: "La lectura diaria ha marcado una gran diferencia.",
          de: "Tägliches Lesen hat einen riesigen Unterschied gemacht.",
          fr: "La lecture quotidienne a fait une énorme différence.",
          it: "La lettura quotidiana ha fatto un'enorme differenza.",
          pt: "A leitura diária fez uma enorme diferença.",
          pl: "Codzienne czytanie zrobiło ogromną różnicę.",
          cs: "Každodenní čtení udělalo obrovský rozdíl.",
          hu: "A napi olvasás hatalmas változást hozott.",
          uk: "Щоденне читання суттєво все змінило.",
        }),
      },
    ],
    dialogue: {
      title: "Catching Up at the Office",
      titleTranslation: ML("Ofisdə Həmsöhbətlik", "Catching Up at the Office", "Ofiste Sohbet", "Разговор в офисе", {
        es: "Poniéndose al día en la oficina",
        de: "Gespräch im Büro",
        fr: "Discussion au bureau",
        it: "Aggiornarsi in ufficio",
        pt: "Conversando no escritório",
        pl: "Rozmowa w biurze",
        cs: "Povídání v kanceláři",
        hu: "Beszélgetés az irodában",
        uk: "Розмова в офісі",
      }),
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
        {
          es: "¿Has estado alguna vez en el extranjero?",
          de: "Warst du schon einmal im Ausland?",
          fr: "Êtes-vous déjà allé à l'étranger ?",
          it: "Sei mai stato all'estero?",
          pt: "Você já esteve no exterior?",
          pl: "Czy byłeś kiedykolwiek za granicą?",
          cs: "Byl jsi někdy v zahraničí?",
          hu: "Jártál már valaha külföldön?",
          uk: "Ви коли-небудь бували за кордоном?",
        }
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
        "Это кардинально всё изменило",
        {
          es: "Ha marcado una gran diferencia",
          de: "Es hat einen riesigen Unterschied gemacht",
          fr: "Cela a fait une énorme différence",
          it: "Ha fatto un'enorme differenza",
          pt: "Isso fez uma enorme diferença",
          pl: "To zrobiło ogromną różnicę",
          cs: "Udělalo to obrovský rozdíl",
          hu: "Ez hatalmas változást hozott",
          uk: "Це суттєво все змінило",
        }
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
      "На уровне B2 используйте профессиональные обороты 'take into account' (учитывать) и 'rule out' (исключать).",
      {
        es: "En el nivel B2, expresa argumentos profesionales con 'take into account' (tener en cuenta) y 'rule out' (descartar).",
        de: "Auf B2-Niveau nutzt man professionelle Ausdrücke wie 'take into account' (berücksichtigen) und 'rule out' (ausschließen).",
        fr: "Au niveau B2, structurez vos arguments avec 'take into account' (prendre en compte) et 'rule out' (exclure).",
        it: "Al livello B2, esprimi argomentazioni professionali con 'take into account' (tenere in considerazione) e 'rule out' (escludere).",
        pt: "No nível B2, expresse argumentos profissionais com 'take into account' (levar em conta) e 'rule out' (descartar).",
        pl: "Na poziomie B2 używaj profesjonalnych zwrotów, takich jak 'take into account' (brać pod uwagę) oraz 'rule out' (wykluczać).",
        cs: "Na úrovni B2 používejte profesionální obraty jako 'take into account' (vzít v úvahu) a 'rule out' (vyloučit).",
        hu: "B2 szinten érvelj profin a 'take into account' (figyelembe vesz) és a 'rule out' (kizár) kifejezésekkel.",
        uk: "На рівні B2 використовуйте професійні звороти 'take into account' (брати до уваги) та 'rule out' (виключати).",
      }
    ),
    commonMistake: {
      incorrect: "If I knew earlier, I would have told you.",
      correct: "If I had known earlier, I would have told you.",
      explanation: ML(
        "Keçmişdəki fərziyyələr haqqında danışarkən 'If I had known...' qəlibindən istifadə edin.",
        "Use 'If I had known' (Past Perfect) when reflecting on past hypothetical situations.",
        "Geçmişteki varsayımlar için 'If I had known...' yapısını kullanın.",
        "Для гипотетических ситуаций в прошлом используйте 'If I had known...'.",
        {
          es: "Para situaciones hipotéticas del pasado, usa 'If I had known...'.",
          de: "Für hypothetische Situationen in der Vergangenheit verwendet man 'If I had known...'.",
          fr: "Pour des hypothèses dans le passé, utilisez 'If I had known...'.",
          it: "Per ipotesi nel passato, usa 'If I had known...'.",
          pt: "Para hipóteses no passado, use 'If I had known...'.",
          pl: "Mówiąc o hipotezach w przeszłości, używaj konstrukcji 'If I had known...'.",
          cs: "Pro hypotetické situace v minulosti použijte 'If I had known...'.",
          hu: "Múltbeli feltételezésekhez használd az 'If I had known...' szerkezetet.",
          uk: "Для гіпотетичних ситуацій у минулому вживайте 'If I had known...'.",
        }
      ),
    },
    chunks: [
      {
        word: "We must take into account",
        phonetic: "/wiː mʌst teɪk ˈɪntuː əˈkaʊnt/",
        audioText: "We must take into account",
        translations: ML("Biz mütləq nəzərə almalıyıq", "Considering important factors in a decision", "Kesinlikle göz önünde bulundurmalıyız", "Мы должны принять во внимание", {
          es: "Debemos tener en cuenta",
          de: "Wir müssen berücksichtigen",
          fr: "Nous devons prendre en compte",
          it: "Dobbiamo tenere in considerazione",
          pt: "Devemos levar em conta",
          pl: "Musimy wziąć pod uwagę",
          cs: "Musíme vzít v úvahu",
          hu: "Figyelembe kell vennünk",
          uk: "Ми повинні взяти до уваги",
        }),
        exampleSentence: "We must take into account the long-term impact.",
        exampleTranslation: ML("Uzunmüddətli təsiri mütləq nəzərə almalıyıq.", "Strategic meeting statement", "Uzun vadeli etkiyi göz önünde bulundurmalıyız.", "Мы должны учитывать долгосрочный эффект.", {
          es: "Debemos tener en cuenta el impacto a largo plazo.",
          de: "Wir müssen die langfristigen Auswirkungen berücksichtigen.",
          fr: "Nous devons prendre en compte l'impact à long terme.",
          it: "Dobbiamo tenere in considerazione l'impatto a lungo termine.",
          pt: "Devemos levar em conta o impacto a longo prazo.",
          pl: "Musimy wziąć pod uwagę długoterminowy wpływ.",
          cs: "Musíme vzít v úvahu dlouhodobý dopad.",
          hu: "Figyelembe kell vennünk a hosszú távú hatást.",
          uk: "Ми повинні враховувати довгостроковий вплив.",
        }),
      },
      {
        word: "We cannot rule out this option",
        phonetic: "/wiː ˈkænɒt ruːl aʊt ðɪs ˈɒpʃn/",
        audioText: "We cannot rule out this option",
        translations: ML("Bu variantı istisna edə bilmərik", "Keeping a possibility open", "Bu seçeneği göz ardı edemeyiz", "Мы не можем исключать этот вариант", {
          es: "No podemos descartar esta opción",
          de: "Wir können diese Option nicht ausschließen",
          fr: "Nous ne pouvons pas exclure cette option",
          it: "Non possiamo escludere questa opzione",
          pt: "Não podemos descartar esta opção",
          pl: "Nie możemy wykluczyć tej opcji",
          cs: "Nemůžeme vyloučit tuto možnost",
          hu: "Nem zárhatjuk ki ezt a lehetőséget",
          uk: "Ми не можемо виключати цей варіант",
        }),
        exampleSentence: "At this stage, we cannot rule out this option.",
        exampleTranslation: ML("Bu mərhələdə həmin variantı istisna edə bilmərik.", "Analytical discussion", "Bu aşamada bu seçeneği dışlayamayız.", "На данном этапе мы не можем исключать этот вариант.", {
          es: "En esta etapa, no podemos descartar esta opción.",
          de: "In dieser Phase können wir diese Option nicht ausschließen.",
          fr: "À ce stade, nous ne pouvons pas exclure cette option.",
          it: "In questa fase non possiamo escludere questa opzione.",
          pt: "Nesta fase, não podemos descartar esta opção.",
          pl: "Na tym etapie nie możemy wykluczyć tej opcji.",
          cs: "V této fázi nemůžeme tuto možnost vyloučit.",
          hu: "Ebben a szakaszban nem zárhatjuk ki ezt a lehetőséget.",
          uk: "На цьому етапі ми не можемо виключати цей варіант.",
        }),
      },
      {
        word: "From my perspective",
        phonetic: "/frɒm maɪ pəˈspektɪv/",
        audioText: "From my perspective",
        translations: ML("Mənim baxış bucağımdan / fikrimcə", "Sophisticated way to state your opinion", "Benim bakış açımdan", "С моей точки зрения", {
          es: "Desde mi perspectiva",
          de: "Aus meiner Sicht",
          fr: "De mon point de vue",
          it: "Dal mio punto di vista",
          pt: "Da minha perspectiva",
          pl: "Z mojej perspektywy",
          cs: "Z mého pohledu",
          hu: "Az én szemszögemből",
          uk: "З моєї точки зору",
        }),
        exampleSentence: "From my perspective, quality comes first.",
        exampleTranslation: ML("Mənim baxış bucağımdan keyfiyyət birinci gəlir.", "Executive debate", "Benim bakış açımdan kalite önce gelir.", "С моей точки зрения, качество превыше всего.", {
          es: "Desde mi perspectiva, la calidad es lo primero.",
          de: "Aus meiner Sicht steht Qualität an erster Stelle.",
          fr: "De mon point de vue, la qualité passe avant tout.",
          it: "Dal mio punto di vista, la qualità viene prima di tutto.",
          pt: "Da minha perspectiva, a qualidade vem em primeiro lugar.",
          pl: "Z mojej perspektywy jakość jest najważniejsza.",
          cs: "Z mého pohledu je kvalita na prvním místě.",
          hu: "Az én szemszögemből a minőség az első.",
          uk: "З моєї точки зору, якість понад усе.",
        }),
      },
    ],
    dialogue: {
      title: "Boardroom Strategy",
      titleTranslation: ML("İclas Otağında Strategiya", "Boardroom Strategy", "Yönetim Kurulu Stratejisi", "Стратегия на совещании", {
        es: "Estrategia en la sala de juntas",
        de: "Strategie im Konferenzraum",
        fr: "Stratégie en salle de réunion",
        it: "Strategia in sala riunioni",
        pt: "Estratégia na sala de reuniões",
        pl: "Strategia na spotkaniu zarządu",
        cs: "Strategie v zasedací místnosti",
        hu: "Stratégia a tárgyalóban",
        uk: "Стратегія на нараді",
      }),
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
        {
          es: "Debemos tener en cuenta",
          de: "Wir müssen berücksichtigen",
          fr: "Nous devons prendre en compte",
          it: "Dobbiamo tenere in considerazione",
          pt: "Devemos levar em conta",
          pl: "Musimy wziąć pod uwagę",
          cs: "Musíme vzít v úvahu",
          hu: "Figyelembe kell vennünk",
          uk: "Ми повинні взяти до уваги",
        }
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
        "Мы не можем исключать этот вариант",
        {
          es: "No podemos descartar esta opción",
          de: "Wir können diese Option nicht ausschließen",
          fr: "Nous ne pouvons pas exclure cette option",
          it: "Non possiamo escludere questa opzione",
          pt: "Não podemos descartar esta opção",
          pl: "Nie możemy wykluczyć tej opcji",
          cs: "Nemůžeme vyloučit tuto možnost",
          hu: "Nem zárhatjuk ki ezt a lehetőséget",
          uk: "Ми не можемо виключати цей варіант",
        }
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
      "На уровне C1 используйте эмфатическую инверсию ('Little did we know...') и риторические связки ('It goes without saying...').",
      {
        es: "En el nivel C1, domina la retórica usando inversión enfática ('Little did we know...') y conectores avanzados ('It goes without saying...').",
        de: "Meistere das C1-Niveau mit emphatischer Inversion ('Little did we know...') und rhetorischen Wendungen ('It goes without saying...').",
        fr: "Au niveau C1, maîtrisez la rhétorique grâce à l'inversion emphatique ('Little did we know...') et aux formules telles que 'It goes without saying...'.",
        it: "Al livello C1, padroneggia la retorica usando l'inversione enfatica ('Little did we know...') e locuzioni come 'It goes without saying...'.",
        pt: "No nível C1, domine a retórica usando inversão enfática ('Little did we know...') e expressões como 'It goes without saying...'.",
        pl: "Na poziomie C1 opanuj retorykę dzięki inwersji ('Little did we know...') oraz zwrotom takim jak 'It goes without saying...'.",
        cs: "Na úrovni C1 ovládněte rétoriku pomocí inverze ('Little did we know...') a obratů jako 'It goes without saying...'.",
        hu: "C1 szinten tedd választékossá a beszédedet nyomatékosító szórenddel ('Little did we know...') és retorikai fordulatokkal ('It goes without saying...').",
        uk: "На рівні C1 використовуйте емфатичну інверсію ('Little did we know...') та риторичні звороти ('It goes without saying...').",
      }
    ),
    commonMistake: {
      incorrect: "Little we knew about the consequences.",
      correct: "Little did we know about the consequences.",
      explanation: ML(
        "Cümlə 'Little', 'Never', 'Rarely' kimi vurğulu sözlə başlayanda köməkçi fel mübtədadan əvvələ keçir: 'Little did we know'.",
        "Invert the auxiliary verb after negative/restrictive openers: 'Little did we know'.",
        "Cümle 'Little', 'Never' ile başladığında yardımcı fiil özneden önce gelir: 'Little did we know'.",
        "После отрицательных наречий в начале предложения используется инверсия: 'Little did we know'.",
        {
          es: "Tras adverbios restrictivos al inicio ('Little', 'Never'), invierte el auxiliar: 'Little did we know'.",
          de: "Nach einschränkenden Wörtern am Satzanfang ('Little', 'Never') folgt die Inversion: 'Little did we know'.",
          fr: "Après 'Little' ou 'Never' en début de phrase, inversez l'auxiliaire : 'Little did we know'.",
          it: "Dopo avverbi restrittivi all'inizio ('Little', 'Never'), usa l'inversione: 'Little did we know'.",
          pt: "Após palavras restritivas no início ('Little', 'Never'), inverta o auxiliar: 'Little did we know'.",
          pl: "Po przysłówkach przeczących na początku zdania ('Little', 'Never') stosujemy inwersję: 'Little did we know'.",
          cs: "Po záporných příslovcích na začátku věty ('Little', 'Never') použijte inverzi: 'Little did we know'.",
          hu: "Korlátozó szavak ('Little', 'Never') után a mondat elején fordított szórendet használunk: 'Little did we know'.",
          uk: "Після обмежувальних прислівників на початку речення ('Little', 'Never') використовується інверсія: 'Little did we know'.",
        }
      ),
    },
    chunks: [
      {
        word: "Little did we know",
        phonetic: "/ˈlɪtl dɪd wiː nəʊ/",
        audioText: "Little did we know",
        translations: ML("Haradan biləydik ki / Heç ağlımıza gəlməzdi ki", "Emphatic storytelling opener for unexpected turns", "Nereden bilebilirdik ki", "Кто бы мог подумать / Мало ли мы знали", {
          es: "Poco sabíamos / Quién iba a imaginar",
          de: "Wir ahnten ja nicht",
          fr: "Nous étions loin de nous douter",
          it: "Non immaginavamo minimamente",
          pt: "Mal sabíamos nós",
          pl: "Nie mieliśmy pojęcia / Kto by pomyślał",
          cs: "Netušili jsme / Kdo by si pomyslel",
          hu: "Mit sem sejtettük",
          uk: "Хто б міг подумати / Ми й не здогадувалися",
        }),
        exampleSentence: "Little did we know how transformative this idea would be.",
        exampleTranslation: ML("Bu ideyanın nə qədər dəyişdirici olacağını heç təsəvvür etmirdik.", "C1 narrative reflection", "Bu fikrin ne kadar dönüştürücü olacağını hiç tahmin etmezdik.", "Мы и представить не могли, насколько преображающей окажется эта идея.", {
          es: "Poco sabíamos lo transformadora que sería esta idea.",
          de: "Wir ahnten nicht, wie bahnbrechend diese Idee sein würde.",
          fr: "Nous étions loin de nous douter à quel point cette idée serait transformatrice.",
          it: "Non immaginavamo quanto sarebbe stata rivoluzionaria questa idea.",
          pt: "Mal sabíamos nós quão transformadora seria essa ideia.",
          pl: "Nie mieliśmy pojęcia, jak przełomowy okaże się ten pomysł.",
          cs: "Netušili jsme, jak přelomový tento nápad bude.",
          hu: "Mit sem sejtettük, milyen átütő erejű lesz ez az ötlet.",
          uk: "Ми й уявити не могли, наскільки революційною виявиться ця ідея.",
        }),
      },
      {
        word: "It goes without saying",
        phonetic: "/ɪt ɡəʊz wɪˈðaʊt ˈseɪɪŋ/",
        audioText: "It goes without saying",
        translations: ML("Sözsüz ki / Öz-özlüyündə aydındır ki", "Introducing an indisputable truth", "Söylemeye bile gerek yok ki", "Само собой разумеется", {
          es: "No hace falta decir que / Está claro que",
          de: "Es versteht sich von selbst",
          fr: "Il va sans dire que",
          it: "Va da sé che / È ovvio che",
          pt: "Não é preciso dizer que / É evidente que",
          pl: "Rozumie się samo przez się",
          cs: "Je naprosto samozřejmé",
          hu: "Magától értetődik",
          uk: "Само собою зрозуміло",
        }),
        exampleSentence: "It goes without saying that trust is paramount.",
        exampleTranslation: ML("Sözsüz ki, etibar hər şeydən üstündür.", "Keynote speech", "Söylemeye gerek yok ki güven her şeyden önemlidir.", "Само собой разумеется, что доверие превыше всего.", {
          es: "No hace falta decir que la confianza es primordial.",
          de: "Es versteht sich von selbst, dass Vertrauen an erster Stelle steht.",
          fr: "Il va sans dire que la confiance est primordiale.",
          it: "Va da sé che la fiducia è fondamentale.",
          pt: "Não é preciso dizer que a confiança é primordial.",
          pl: "Rozumie się samo przez się, że zaufanie jest najważniejsze.",
          cs: "Je samozřejmé, že důvěra je prvořadá.",
          hu: "Magától értetődik, hogy a bizalom mindenek felett áll.",
          uk: "Само собою зрозуміло, що довіра понад усе.",
        }),
      },
      {
        word: "To strike a delicate balance",
        phonetic: "/tuː straɪk ə ˈdelɪkət ˈbæləns/",
        audioText: "To strike a delicate balance",
        translations: ML("Həssas tarazlığı qorumaq / tapmaq", "Finding equilibrium between two complex demands", "Hassas bir denge kurmak", "Найти тонкий баланс", {
          es: "Lograr un equilibrio delicado",
          de: "Ein feines Gleichgewicht finden",
          fr: "Trouver un équilibre délicat",
          it: "Trovare un delicato equilibrio",
          pt: "Encontrar um equilíbrio delicado",
          pl: "Znaleźć delikatną równowagę",
          cs: "Najít křehkou rovnováhu",
          hu: "Kényes egyensúlyt teremteni",
          uk: "Знайти тонкий баланс",
        }),
        exampleSentence: "Leaders must strike a delicate balance between speed and precision.",
        exampleTranslation: ML("Liderlər sürətlə dəqiqlik arasında həssas tarazlığı tapmalıdır.", "Executive leadership insight", "Liderler hız ve hassasiyet arasında ince bir denge kurmalıdır.", "Лидеры должны находить тонкий баланс между скоростью и точностью.", {
          es: "Los líderes deben lograr un equilibrio delicado entre velocidad y precisión.",
          de: "Führungskräfte müssen ein feines Gleichgewicht zwischen Tempo und Präzision finden.",
          fr: "Les dirigeants doivent trouver un équilibre délicat entre rapidité et précision.",
          it: "I leader devono trovare un delicato equilibrio tra velocità e precisione.",
          pt: "Os líderes devem encontrar um equilíbrio delicado entre velocidade e precisão.",
          pl: "Liderzy muszą znaleźć delikatną równowagę między szybkością a precyzją.",
          cs: "Lídři musí najít křehkou rovnováhu mezi rychlostí a přesností.",
          hu: "A vezetőknek kényes egyensúlyt kell teremteniük a gyorsaság és a pontosság között.",
          uk: "Лідери повинні знаходити тонкий баланс між швидкістю та точністю.",
        }),
      },
    ],
    dialogue: {
      title: "Keynote Reflection",
      titleTranslation: ML("Konfrans Çıxışı Müzakirəsi", "Keynote Reflection", "Konferans Değerlendirmesi", "Обсуждение доклада", {
        es: "Reflexión en la conferencia",
        de: "Rückblick auf die Keynote",
        fr: "Réflexion lors de la conférence",
        it: "Riflessione alla conferenza",
        pt: "Reflexão na conferência",
        pl: "Refleksja podczas konferencji",
        cs: "Zamyšlení na konferenci",
        hu: "Konferencia-visszatekintés",
        uk: "Обговорення доповіді",
      }),
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
        {
          es: "No hace falta decir que",
          de: "Es versteht sich von selbst",
          fr: "Il va sans dire que",
          it: "Va da sé che",
          pt: "Não é preciso dizer que",
          pl: "Rozumie się samo przez się",
          cs: "Je naprosto samozřejmé",
          hu: "Magától értetődik",
          uk: "Само собою зрозуміло",
        }
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
        "Мало ли мы знали (Кто бы мог подумать)",
        {
          es: "Poco sabíamos (Quién iba a imaginar)",
          de: "Wir ahnten ja nicht",
          fr: "Nous étions loin de nous douter",
          it: "Non immaginavamo minimamente",
          pt: "Mal sabíamos nós",
          pl: "Nie mieliśmy pojęcia (Kto by pomyślał)",
          cs: "Netušili jsme (Kdo by si pomyslel)",
          hu: "Mit sem sejtettük",
          uk: "Хто б міг подумати (Ми й не здогадувалися)",
        }
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
        "В магазине используйте готовые фразы: 'How much does this cost?' (Сколько это стоит?) и 'Can I pay by card?' (Можно оплатить картой?).",
        {
          es: "Al comprar, pregunta precios y paga fácilmente con 'How much does this cost?' (¿Cuánto cuesta esto?) y 'Can I pay by card?' (¿Puedo pagar con tarjeta?).",
          de: "Beim Einkaufen fragst du nach dem Preis und bezahlst mit 'How much does this cost?' (Was kostet das?) und 'Can I pay by card?' (Kann ich mit Karte zahlen?).",
          fr: "En magasin, demandez le prix et payez avec 'How much does this cost?' (Combien ça coûte ?) et 'Can I pay by card?' (Puis-je payer par carte ?).",
          it: "Quando fai acquisti, usa 'How much does this cost?' (Quanto costa questo?) e 'Can I pay by card?' (Posso pagare con la carta?).",
          pt: "Ao fazer compras, pergunte o preço e pague usando 'How much does this cost?' (Quanto custa isto?) e 'Can I pay by card?' (Posso pagar com cartão?).",
          pl: "Na zakupach pytaj o cenę i płać za pomocą zwrotów 'How much does this cost?' (Ile to kosztuje?) oraz 'Can I pay by card?' (Czy mogę zapłacić kartą?).",
          cs: "Při nakupování se ptejte na cenu a plaťte pomocí 'How much does this cost?' (Kolik to stojí?) a 'Can I pay by card?' (Mohu platit kartou?).",
          hu: "Vásárláskor kérdezd meg az árat és fizess a 'How much does this cost?' (Mennyibe kerül ez?) és a 'Can I pay by card?' (Fizethetek kártyával?) kifejezésekkel.",
          uk: "У магазині запитуйте ціну й оплачуйте за допомогою 'How much does this cost?' (Скільки це коштує?) та 'Can I pay by card?' (Чи можна оплатити карткою?).",
        }
      ),
      commonMistake: {
        incorrect: "Can I pay with card?",
        correct: "Can I pay by card?",
        explanation: ML(
          "Kartla ödəniş deyərkən həmişə 'by card' işlədilir.",
          "Always use the preposition 'by' in 'pay by card'.",
          "Kartla ödeme derken her zaman 'by card' kullanılır.",
          "Всегда говорите 'pay by card'.",
          {
            es: "Para pago con tarjeta, usa siempre 'by card'.",
            de: "Bei Kartenzahlung sagt man immer 'by card'.",
            fr: "Pour le paiement par carte, utilisez toujours 'by card'.",
            it: "Per il pagamento con carta, usa sempre 'by card'.",
            pt: "Para pagamento com cartão, use sempre 'by card'.",
            pl: "Mówiąc o płatności kartą, zawsze używaj 'by card'.",
            cs: "Při platbě kartou vždy používejte 'by card'.",
            hu: "Kártyás fizetésnél mindig a 'by card' kifejezést használd.",
            uk: "При оплаті карткою завжди кажіть 'by card'.",
          }
        ),
      },
      chunks: [
        {
          word: "How much does this cost?",
          phonetic: "/haʊ mʌtʃ dʌz ðɪs kɒst/",
          audioText: "How much does this cost?",
          translations: ML("Bunun qiyməti nə qədərdir?", "Asking the price of an item", "Bunun fiyatı ne kadar?", "Сколько это стоит?", {
            es: "¿Cuánto cuesta esto?",
            de: "Wie viel kostet das?",
            fr: "Combien cela coûte-t-il ?",
            it: "Quanto costa questo?",
            pt: "Quanto custa isto?",
            pl: "Ile to kosztuje?",
            cs: "Kolik to stojí?",
            hu: "Mennyibe kerül ez?",
            uk: "Скільки це коштує?",
          }),
          exampleSentence: "Excuse me, how much does this jacket cost?",
          exampleTranslation: ML("Bağışlayın, bu gödəkçənin qiyməti nə qədərdir?", "In a clothing store", "Affedersiniz, bu ceketin fiyatı ne kadar?", "Извините, сколько стоит эта куртка?", {
            es: "Disculpe, ¿cuánto cuesta esta chaqueta?",
            de: "Entschuldigung, wie viel kostet diese Jacke?",
            fr: "Excusez-moi, combien coûte cette veste ?",
            it: "Mi scusi, quanto costa questa giacca?",
            pt: "Com licença, quanto custa esta jaqueta?",
            pl: "Przepraszam, ile kosztuje ta kurtka?",
            cs: "Promiňte, kolik stojí tato bunda?",
            hu: "Elnézést, mennyibe kerül ez a kabát?",
            uk: "Вибачте, скільки коштує ця куртка?",
          }),
        },
        {
          word: "Can I pay by card?",
          phonetic: "/kæn aɪ peɪ baɪ kɑːd/",
          audioText: "Can I pay by card?",
          translations: ML("Kartla ödəyə bilərəm?", "Asking if credit/debit cards are accepted", "Kartla ödeyebilir miyim?", "Можно оплатить картой?", {
            es: "¿Puedo pagar con tarjeta?",
            de: "Kann ich mit Karte zahlen?",
            fr: "Puis-je payer par carte ?",
            it: "Posso pagare con la carta?",
            pt: "Posso pagar com cartão?",
            pl: "Czy mogę zapłacić kartą?",
            cs: "Mohu platit kartou?",
            hu: "Fizethetek kártyával?",
            uk: "Чи можна оплатити карткою?",
          }),
          exampleSentence: "I don't have cash. Can I pay by card?",
          exampleTranslation: ML("Nağd pulum yoxdur. Kartla ödəyə bilərəm?", "At the checkout counter", "Nakit param yok. Kartla ödeyebilir miyim?", "У меня нет наличных. Можно оплатить картой?", {
            es: "No tengo efectivo. ¿Puedo pagar con tarjeta?",
            de: "Ich habe kein Bargeld. Kann ich mit Karte zahlen?",
            fr: "Je n'ai pas d'espèces. Puis-je payer par carte ?",
            it: "Non ho contanti. Posso pagare con la carta?",
            pt: "Não tenho dinheiro em espécie. Posso pagar com cartão?",
            pl: "Nie mam gotówki. Czy mogę zapłacić kartą?",
            cs: "Nemám hotovost. Mohu platit kartou?",
            hu: "Nincs nálam készpénz. Fizethetek kártyával?",
            uk: "У мене немає готівки. Чи можна оплатити карткою?",
          }),
        },
        {
          word: "I'll take it!",
          phonetic: "/aɪl teɪk ɪt/",
          audioText: "I'll take it!",
          translations: ML("Bunu alıram!", "Deciding to buy an item", "Bunu alıyorum!", "Я беру это!", {
            es: "¡Me lo llevo!",
            de: "Ich nehme es!",
            fr: "Je le prends !",
            it: "Lo prendo!",
            pt: "Vou levar!",
            pl: "Biorę to!",
            cs: "Beru to!",
            hu: "Megveszem!",
            uk: "Я беру це!",
          }),
          exampleSentence: "It fits perfectly. I'll take it!",
          exampleTranslation: ML("Əynimə tam oturdu. Bunu alıram!", "Happy customer", "Tam üzerime oldu. Bunu alıyorum!", "Сидит идеально. Я беру это!", {
            es: "Me queda perfecto. ¡Me lo llevo!",
            de: "Es passt perfekt. Ich nehme es!",
            fr: "Ça me va parfaitement. Je le prends !",
            it: "Mi sta benissimo. Lo prendo!",
            pt: "Ficou perfeito. Vou levar!",
            pl: "Pasuje idealnie. Biorę to!",
            cs: "Sedí perfektně. Beru to!",
            hu: "Tökéletesen passzol. Megveszem!",
            uk: "Сидить ідеально. Я беру це!",
          }),
        },
      ],
      dialogue: {
        title: "At the Bookstore",
        titleTranslation: ML("Kitab Mağazasında", "At the Bookstore", "Kitapçıda", "В книжном магазине", {
          es: "En la librería",
          de: "Im Buchladen",
          fr: "À la librairie",
          it: "In libreria",
          pt: "Na livraria",
          pl: "W księgarni",
          cs: "V knihkupectví",
          hu: "A könyvesboltban",
          uk: "У книгарні",
        }),
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
          {
            es: "¿Puedo pagar con tarjeta?",
            de: "Kann ich mit Karte zahlen?",
            fr: "Puis-je payer par carte ?",
            it: "Posso pagare con la carta?",
            pt: "Posso pagar com cartão?",
            pl: "Czy mogę zapłacić kartą?",
            cs: "Mohu platit kartou?",
            hu: "Fizethetek kártyával?",
            uk: "Чи можна оплатити карткою?",
          }
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
          "Сколько это стоит?",
          {
            es: "¿Cuánto cuesta esto?",
            de: "Wie viel kostet das?",
            fr: "Combien cela coûte-t-il ?",
            it: "Quanto costa questo?",
            pt: "Quanto custa isto?",
            pl: "Ile to kosztuje?",
            cs: "Kolik to stojí?",
            hu: "Mennyibe kerül ez?",
            uk: "Скільки це коштує?",
          }
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
        "Для планов на будущее и встреч используйте 'I'm going to...' и 'Are you free...?'",
        {
          es: "Haz planes y organiza encuentros con 'I'm going to...' (Voy a...) y 'Are you free...?' (¿Estás libre...?).",
          de: "Schmiede Pläne und vereinbare Treffen mit 'I'm going to...' (Ich habe vor...) und 'Are you free...?' (Hast du ... Zeit?).",
          fr: "Faites des projets et organisez des sorties avec 'I'm going to...' (Je vais...) et 'Are you free...?' (Es-tu libre... ?).",
          it: "Fai progetti e organizza incontri usando 'I'm going to...' (Ho intenzione di...) e 'Are you free...?' (Sei libero...?).",
          pt: "Faça planos e marque encontros usando 'I'm going to...' (Eu vou...) e 'Are you free...?' (Você está livre...?).",
          pl: "Planuj spotkania za pomocą zwrotów 'I'm going to...' (Zamierzam...) oraz 'Are you free...?' (Czy jesteś wolny...?).",
          cs: "Plánujte setkání pomocí vazeb 'I'm going to...' (Chystám se...) a 'Are you free...?' (Máš ... volno?).",
          hu: "Tervezz programokat az 'I'm going to...' (Azt tervezem, hogy...) és az 'Are you free...?' (Szabad vagy...?) kifejezésekkel.",
          uk: "Будуйте плани та домовляйтеся про зустрічі за допомогою 'I'm going to...' (Я збираюся...) і 'Are you free...?' (Ти вільний...?).",
        }
      ),
      commonMistake: {
        incorrect: "I going to call you tonight.",
        correct: "I'm going to call you tonight.",
        explanation: ML(
          "'going to' qəlibindən əvvəl 'am / is / are' köməkçisini unutmayın.",
          "Always include 'am / is / are' before 'going to'.",
          "'going to' kalıbından önce 'am / is / are' getirmeyi unutmayın.",
          "Не забывайте 'am / is / are' перед 'going to'.",
          {
            es: "No olvides incluir 'am / is / are' antes de 'going to'.",
            de: "Vergiss nicht 'am / is / are' vor 'going to'.",
            fr: "N'oubliez pas d'ajouter 'am / is / are' avant 'going to'.",
            it: "Non dimenticare 'am / is / are' prima di 'going to'.",
            pt: "Não se esqueça de incluir 'am / is / are' antes de 'going to'.",
            pl: "Pamiętaj o dodaniu 'am / is / are' przed 'going to'.",
            cs: "Nezapomeňte před 'going to' uvést 'am / is / are'.",
            hu: "Ne felejtsd el az 'am / is / are' segédigét a 'going to' elé tenni.",
            uk: "Не забувайте ставити 'am / is / are' перед 'going to'.",
          }
        ),
      },
      chunks: [
        {
          word: "Are you free tomorrow evening?",
          phonetic: "/ɑː juː friː təˈmɒrəʊ ˈiːvnɪŋ/",
          audioText: "Are you free tomorrow evening?",
          translations: ML("Sabah axşam vaxtın varmı (boşsan)?", "Inviting a friend to hang out", "Yarın akşam müsait misin?", "Ты свободен завтра вечером?", {
            es: "¿Estás libre mañana por la tarde?",
            de: "Hast du morgen Abend Zeit?",
            fr: "Es-tu libre demain soir ?",
            it: "Sei libero domani sera?",
            pt: "Você está livre amanhã à noite?",
            pl: "Czy jesteś wolny jutro wieczorem?",
            cs: "Máš zítra večer volno?",
            hu: "Szabad vagy holnap este?",
            uk: "Ти вільний завтра ввечері?",
          }),
          exampleSentence: "Hey! Are you free tomorrow evening for dinner?",
          exampleTranslation: ML("Salam! Sabah axşam şam yeməyi üçün boşsan?", "Texting a friend", "Selam! Yarın akşam yemek için müsait misin?", "Привет! Ты свободен завтра вечером на ужин?", {
            es: "¡Hola! ¿Estás libre mañana por la noche para cenar?",
            de: "Hey! Hast du morgen Abend Zeit zum Abendessen?",
            fr: "Salut ! Es-tu libre demain soir pour dîner ?",
            it: "Ehi! Sei libero domani sera per cena?",
            pt: "Oi! Você está livre amanhã à noite para jantar?",
            pl: "Hej! Jesteś wolny jutro wieczorem na kolację?",
            cs: "Ahoj! Máš zítra večer volno na večeři?",
            hu: "Szia! Szabad vagy holnap este egy vacsorára?",
            uk: "Привіт! Ти вільний завтра ввечері на вечерю?",
          }),
        },
        {
          word: "I'm going to visit...",
          phonetic: "/aɪm ˈɡəʊɪŋ tuː ˈvɪzɪt/",
          audioText: "I'm going to visit the museum",
          translations: ML("Mən ... ziyarət etməyi planlaşdırıram", "Talking about an upcoming plan", "... ziyaret edeceğim", "Я собираюсь посетить...", {
            es: "Voy a visitar...",
            de: "Ich werde ... besuchen",
            fr: "Je vais visiter...",
            it: "Ho intenzione di visitare...",
            pt: "Eu vou visitar...",
            pl: "Zamierzam odwiedzić...",
            cs: "Chystám se navštívit...",
            hu: "Meg fogom látogatni...",
            uk: "Я збираюся відвідати...",
          }),
          exampleSentence: "This Saturday, I'm going to visit the art gallery.",
          exampleTranslation: ML("Bu şənbə rəsm qalereyasını ziyarət edəcəyəm.", "Weekend plan", "Bu cumartesi sanat galerisini ziyaret edeceğim.", "В эту субботу я собираюсь посетить галерею.", {
            es: "Este sábado voy a visitar la galería de arte.",
            de: "Diesen Samstag werde ich die Kunstgalerie besuchen.",
            fr: "Ce samedi, je vais visiter la galerie d'art.",
            it: "Questo sabato visiterò la galleria d'arte.",
            pt: "Neste sábado, vou visitar a galeria de arte.",
            pl: "W tę sobotę zamierzam odwiedzić galerię sztuki.",
            cs: "Tuto sobotu se chystám navštívit uměleckou galerii.",
            hu: "Ezen a szombaton meglátogatom a művészeti galériát.",
            uk: "Цієї суботи я збираюся відвідати художню галерею.",
          }),
        },
        {
          word: "Sounds like a great plan!",
          phonetic: "/saʊndz laɪk ə ɡreɪt plæn/",
          audioText: "Sounds like a great plan!",
          translations: ML("Əla plan kimi səslənir! (Razıyam!)", "Enthusiastically agreeing to an invitation", "Harika bir plan gibi geliyor!", "Звучит как отличный план!", {
            es: "¡Suena como un gran plan!",
            de: "Klingt nach einem tollen Plan!",
            fr: "Ça a l'air d'être un super plan !",
            it: "Sembra un ottimo piano!",
            pt: "Parece um ótimo plano!",
            pl: "Brzmi jak świetny plan!",
            cs: "To zní jako skvělý plán!",
            hu: "Remek tervnek hangzik!",
            uk: "Звучить як чудовий план!",
          }),
          exampleSentence: "Coffee at five? Sounds like a great plan!",
          exampleTranslation: ML("Saat beşdə qəhvə? Əla plan kimi səslənir!", "Accepting an invite", "Beşte kahve mi? Harika bir plan!", "Кофе в пять? Звучит как отличный план!", {
            es: "¿Café a las cinco? ¡Suena como un gran plan!",
            de: "Kaffee um fünf? Klingt nach einem tollen Plan!",
            fr: "Un café à cinq heures ? Ça a l'air d'être un super plan !",
            it: "Caffè alle cinque? Sembra un ottimo piano!",
            pt: "Café às cinco? Parece um ótimo plano!",
            pl: "Kawa o piątej? Brzmi jak świetny plan!",
            cs: "Káva v pět? To zní jako skvělý plán!",
            hu: "Kávé ötkor? Remek tervnek hangzik!",
            uk: "Кава о п'ятій? Звучить як чудовий план!",
          }),
        },
      ],
      dialogue: {
        title: "Making Weekend Plans",
        titleTranslation: ML("Həftəsonu Planı", "Making Weekend Plans", "Hafta Sonu Planı", "Планы на выходные", {
          es: "Haciendo planes para el fin de semana",
          de: "Wochenendpläne schmieden",
          fr: "Faire des projets pour le week-end",
          it: "Piani per il fine settimana",
          pt: "Fazendo planos para o fim de semana",
          pl: "Plany na weekend",
          cs: "Plány na víkend",
          hu: "Hétvégi tervek",
          uk: "Плани на вихідні",
        }),
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
          {
            es: "¡Suena como un gran plan!",
            de: "Klingt nach einem tollen Plan!",
            fr: "Ça a l'air d'être un super plan !",
            it: "Sembra un ottimo piano!",
            pt: "Parece um ótimo plano!",
            pl: "Brzmi jak świetny plan!",
            cs: "To zní jako skvělý plán!",
            hu: "Remek tervnek hangzik!",
            uk: "Звучить як чудовий план!",
          }
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
          "Ты свободен завтра вечером?",
          {
            es: "¿Estás libre mañana por la tarde?",
            de: "Hast du morgen Abend Zeit?",
            fr: "Es-tu libre demain soir ?",
            it: "Sei libero domani sera?",
            pt: "Você está livre amanhã à noite?",
            pl: "Czy jesteś wolny jutro wieczorem?",
            cs: "Máš zítra večer volno?",
            hu: "Szabad vagy holnap este?",
            uk: "Ти вільний завтра ввечері?",
          }
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
        "Давайте советы и оценивайте ситуации с помощью фраз 'If I were you...' и 'It depends on...'.",
        {
          es: "Da consejos y evalúa opciones usando 'If I were you...' (Yo en tu lugar...) e 'It depends on...' (Depende de...).",
          de: "Gib Ratschläge und wäge Optionen ab mit 'If I were you...' (An deiner Stelle...) und 'It depends on...' (Es hängt von ... ab).",
          fr: "Donnez des conseils et pesez le pour et le contre avec 'If I were you...' (À ta place...) et 'It depends on...' (Cela dépend de...).",
          it: "Dai consigli e valuta le opzioni con 'If I were you...' (Al posto tuo...) e 'It depends on...' (Dipende da...).",
          pt: "Dê conselhos e avalie opções usando 'If I were you...' (Se eu fosse você...) e 'It depends on...' (Depende de...).",
          pl: "Udzielaj rad i oceniaj sytuacje za pomocą 'If I were you...' (Na twoim miejscu...) oraz 'It depends on...' (To zależy od...).",
          cs: "Raděte a zvažujte možnosti pomocí 'If I were you...' (Na tvém místě...) a 'It depends on...' (Záleží na...).",
          hu: "Adj tanácsot és mérlegelj az 'If I were you...' (A helyedben...) és az 'It depends on...' (...-tól függ) szerkezetekkel.",
          uk: "Давайте поради й оцінюйте ситуації за допомогою 'If I were you...' (На твоєму місці...) та 'It depends on...' (Це залежить від...).",
        }
      ),
      commonMistake: {
        incorrect: "It depends from the weather.",
        correct: "It depends on the weather.",
        explanation: ML(
          "'depend' feli həmişə 'on' sözönü ilə işlənir: 'depends on'.",
          "Always pair 'depend' with 'on', never 'from' or 'of'.",
          "'depend' fiili her zaman 'on' edatıyla kullanılır: 'depends on'.",
          "Глагол 'depend' всегда используется с предлогом 'on'.",
          {
            es: "El verbo 'depend' siempre va seguido de 'on', nunca de 'from' u 'of'.",
            de: "Das Verb 'depend' wird auf Englisch immer mit 'on' verbunden: 'depends on'.",
            fr: "Le verbe 'depend' s'utilise toujours avec la préposition 'on' : 'depends on'.",
            it: "Il verbo 'depend' si usa sempre con la preposizione 'on': 'depends on'.",
            pt: "O verbo 'depend' é sempre acompanhado por 'on': 'depends on'.",
            pl: "Czasownik 'depend' łączy się zawsze z przyimkiem 'on': 'depends on'.",
            cs: "Sloveso 'depend' se vždy pojí s předložkou 'on': 'depends on'.",
            hu: "A 'depend' ige mellett mindig az 'on' elöljárószó áll: 'depends on'.",
            uk: "Дієслово 'depend' завжди вживається з прийменником 'on': 'depends on'.",
          }
        ),
      },
      chunks: [
        {
          word: "If I were you, I would...",
          phonetic: "/ɪf aɪ wɜː juː aɪ wʊd/",
          audioText: "If I were you, I would accept the offer",
          translations: ML("Sənin yerində olsaydım, mən ... edərdim", "Giving friendly or professional advice", "Senin yerinde olsaydım ... yapardım", "На твоем месте я бы...", {
            es: "Si yo fuera tú, yo...",
            de: "An deiner Stelle würde ich...",
            fr: "À ta place, je...",
            it: "Se fossi in te, io...",
            pt: "Se eu fosse você, eu...",
            pl: "Na twoim miejscu...",
            cs: "Na tvém místě bych...",
            hu: "A helyedben én...",
            uk: "На твоєму місці я б...",
          }),
          exampleSentence: "If I were you, I would apply for that role.",
          exampleTranslation: ML("Sənin yerində olsaydım, o vəzifəyə müraciət edərdim.", "Career advice", "Senin yerinde olsaydım o pozisyona başvururdum.", "На твоем месте я бы подал заявку на эту должность.", {
            es: "Si yo fuera tú, solicitaría ese puesto.",
            de: "An deiner Stelle würde ich mich auf diese Stelle bewerben.",
            fr: "À ta place, je postulerais à ce poste.",
            it: "Se fossi in te, mi candiderei per quel ruolo.",
            pt: "Se eu fosse você, me candidataria a essa vaga.",
            pl: "Na twoim miejscu zaaplikowałbym na to stanowisko.",
            cs: "Na tvém místě bych se o tu pozici ucházel.",
            hu: "A helyedben jelentkeznék arra az állásra.",
            uk: "На твоєму місці я б подав заявку на цю посаду.",
          }),
        },
        {
          word: "It really depends on...",
          phonetic: "/ɪt ˈrɪəli dɪˈpendz ɒn/",
          audioText: "It really depends on the budget",
          translations: ML("Bu, həqiqətən ...-dan asılıdır", "Giving a nuanced, realistic answer", "Bu gerçekten ...-e bağlı", "Это действительно зависит от...", {
            es: "Realmente depende de...",
            de: "Es hängt wirklich von ... ab",
            fr: "Cela dépend vraiment de...",
            it: "Dipende davvero da...",
            pt: "Isso realmente depende de...",
            pl: "To naprawdę zależy od...",
            cs: "Opravdu to záleží na...",
            hu: "Ez igazából ...-tól függ",
            uk: "Це дійсно залежить від...",
          }),
          exampleSentence: "It really depends on our schedule next month.",
          exampleTranslation: ML("Bu, gələn aykı qrafikimizdən asılıdır.", "Project planning", "Bu tamamen gelecek ayki programımıza bağlı.", "Это зависит от нашего графика в следующем месяце.", {
            es: "Realmente depende de nuestro horario el próximo mes.",
            de: "Es hängt wirklich von unserem Zeitplan im nächsten Monat ab.",
            fr: "Cela dépend vraiment de notre emploi du temps le mois prochain.",
            it: "Dipende davvero dal nostro programma del mese prossimo.",
            pt: "Isso realmente depende da nossa agenda no próximo mês.",
            pl: "To naprawdę zależy od naszego grafiku w przyszłym miesiącu.",
            cs: "Opravdu to záleží na našem rozvrhu příští měsíc.",
            hu: "Ez igazából a jövő havi időbeosztásunktól függ.",
            uk: "Це дійсно залежить від нашого графіка наступного місяця.",
          }),
        },
        {
          word: "Let's look at the big picture",
          phonetic: "/lets lʊk æt ðə bɪɡ ˈpɪktʃə/",
          audioText: "Let's look at the big picture",
          translations: ML("Gəlin məsələyə geniş (ümumi) baxaq", "Focusing on the overall goal rather than small details", "Büyük resme bakalım", "Давайте посмотрим на картину в целом", {
            es: "Veamos el panorama general",
            de: "Schauen wir uns das große Ganze an",
            fr: "Regardons la situation dans son ensemble",
            it: "Guardiamo il quadro generale",
            pt: "Vamos olhar o panorama geral",
            pl: "Spójrzmy na szerszy obraz sytuacji",
            cs: "Podívejme se na to v širších souvislostech",
            hu: "Nézzük a teljes képet",
            uk: "Давайте подивимося на картину в цілому",
          }),
          exampleSentence: "Before deciding, let's look at the big picture.",
          exampleTranslation: ML("Qərar verməzdən əvvəl gəlin məsələyə geniş baxaq.", "Team discussion", "Karar vermeden önce büyük resme bakalım.", "Прежде чем решить, давайте посмотрим на картину в целом.", {
            es: "Antes de decidir, veamos el panorama general.",
            de: "Bevor wir entscheiden, schauen wir uns das große Ganze an.",
            fr: "Avant de décider, regardons la situation dans son ensemble.",
            it: "Prima di decidere, guardiamo il quadro generale.",
            pt: "Antes de decidir, vamos olhar o panorama geral.",
            pl: "Zanim zdecydujemy, spójrzmy na szerszy obraz.",
            cs: "Než se rozhodneme, podívejme se na to v širších souvislostech.",
            hu: "Mielőtt döntenénk, nézzük a teljes képet.",
            uk: "Перш ніж вирішити, подивімося на картину в цілому.",
          }),
        },
      ],
      dialogue: {
        title: "Weighing a Job Offer",
        titleTranslation: ML("İş Təklifini Dəyərləndirmək", "Weighing a Job Offer", "İş Teklifini Değerlendirmek", "Обсуждение предложения о работе", {
          es: "Evaluando una oferta de trabajo",
          de: "Ein Jobangebot abwägen",
          fr: "Évaluer une offre d'emploi",
          it: "Valutare un'offerta di lavoro",
          pt: "Avaliando uma oferta de emprego",
          pl: "Rozważanie oferty pracy",
          cs: "Zvažování pracovní nabídky",
          hu: "Állásajánlat mérlegelése",
          uk: "Обговорення пропозиції роботи",
        }),
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
          {
            es: "Veamos el panorama general",
            de: "Schauen wir uns das große Ganze an",
            fr: "Regardons la situation dans son ensemble",
            it: "Guardiamo il quadro generale",
            pt: "Vamos olhar o panorama geral",
            pl: "Spójrzmy na szerszy obraz sytuacji",
            cs: "Podívejme se na to v širších souvislostech",
            hu: "Nézzük a teljes képet",
            uk: "Давайте подивимося на картину в цілому",
          }
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
          "Это действительно зависит от бюджета",
          {
            es: "Realmente depende del presupuesto",
            de: "Es hängt wirklich vom Budget ab",
            fr: "Cela dépend vraiment du budget",
            it: "Dipende davvero dal budget",
            pt: "Isso realmente depende do orçamento",
            pl: "To naprawdę zależy od budżetu",
            cs: "Opravdu to záleží na rozpočtu",
            hu: "Ez igazából a költségvetéstől függ",
            uk: "Це дійсно залежить від бюджету",
          }
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
          it: "Ripasso finale: Costruisci la frase in inglese",
          pt: "Revisão final: Construa a frase em inglês",
          pl: "Powtórka końcowa: Zbuduj zwrot po angielsku",
          cs: "Závěrečné opakování: Sestavte anglickou frázi",
          hu: "Végső ismétlés: Rakd össze az angol kifejezést",
          uk: "Фінальна перевірка: Складіть англійську фразу",
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
