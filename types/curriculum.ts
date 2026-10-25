export type LevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type UnitStatus = 'locked' | 'unlocked' | 'completed';

export type ExerciseType =
  | 'word_scramble'
  | 'listening_dictation'
  | 'multiple_choice'
  | 'fill_in_the_blank'
  | 'chat_dialogue';

export interface LocalizedString {
  az: string;
  en: string;
  tr?: string;
  ru?: string;
  [key: string]: string | undefined;
}

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  audioText: string;
  translations: LocalizedString;
  exampleSentence: string;
  exampleTranslation: LocalizedString;
}

export interface GrammarRule {
  id: string;
  title: LocalizedString;
  subtitle?: LocalizedString;
  explanation: LocalizedString;
  formula?: string; // e.g., "Subject + am/is/are + Verb-ing"
  examples: {
    english: string;
    translation: LocalizedString;
  }[];
  commonMistake?: {
    incorrect: string;
    correct: string;
    explanation: LocalizedString;
  };
}

export interface GradedStory {
  id: string;
  title: string;
  titleTranslation: LocalizedString;
  cefr: LevelId;
  wordCount: number;
  content: string; // The English short story
  sentenceTranslations?: Record<number, LocalizedString>;
  vocabularyHighlights: string[]; // words taught in this unit
}

export interface ExerciseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: LocalizedString;
}

export interface CurriculumExercise {
  id: string;
  type: ExerciseType;
  prompt: LocalizedString;
  instruction?: LocalizedString;
  audioPrompt?: string; // Sentence/word to speak if listening exercise
  sentenceToBuild?: string[]; // For word_scramble e.g. ["I", "am", "glad", "to", "meet", "you"]
  distractorWords?: string[]; // Fake words for word_scramble
  options?: ExerciseOption[]; // For multiple_choice & fill_in_the_blank
  correctSentence?: string;
  dialoguePartner?: {
    name: string;
    avatar?: string;
    message: string;
  };
  xpReward: number;
}

export interface CurriculumUnit {
  id: string;
  level: LevelId;
  order: number; // 1, 2, 3...
  title: LocalizedString;
  description: LocalizedString;
  estimatedMinutes: number;
  iconName: string; // Feather icon name e.g. "coffee", "smile", "sun"
  grammarRule: GrammarRule;
  vocabulary: VocabularyItem[];
  story: GradedStory;
  exercises: CurriculumExercise[];
  bossQuiz: CurriculumExercise[];
  xpReward: number;
}

export interface UserUnitProgress {
  unitId: string;
  levelId: LevelId;
  status: UnitStatus;
  score: number; // 0-100
  stars: number; // 0-3
  completedAt?: number;
  unlockedAt: number;
}

export interface CurriculumLevelSummary {
  id: LevelId;
  title: LocalizedString;
  description: LocalizedString;
  totalUnits: number;
  completedUnits: number;
  unlockedUnits: number;
  accentColor: string;
}
