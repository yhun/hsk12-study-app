export type LevelTag = 'HSK 1' | 'HSK 2' | 'HSK 1-2';

export type SkillMode = 'listening' | 'speaking' | 'reading' | 'writing';

export interface Example {
  zh: string;
  pinyin: string;
  th: string;
  note?: string;
}

export interface MiniQuestion {
  id: string;
  prompt: string;
  zh?: string;
  pinyin?: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  stage: number;
  stageTitle: string;
  order: number;
  title: string;
  subtitle: string;
  level: LevelTag;
  pdfPages: string;
  estimatedMinutes: number;
  summary: string;
  structures: string[];
  points: string[];
  examples: Example[];
  examTip: string;
  miniQuiz: MiniQuestion[];
}

export interface AntonymWord {
  zh: string;
  pinyin: string;
  th: string;
}

export interface AntonymPair {
  id: string;
  page: number;
  left: AntonymWord;
  right: AntonymWord;
}

export interface RadicalExample {
  zh: string;
  pinyin: string;
  th: string;
  formula?: string;
}

export interface RadicalItem {
  id: string;
  page: number;
  radical: string;
  nameZh: string;
  pinyin: string;
  meaningTh: string;
  examples: RadicalExample[];
}

export type QuizCategory = 'HSK 1' | 'HSK 2' | 'trap';

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  topic: string;
  pdfPage: string;
  prompt: string;
  zh?: string;
  pinyin?: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ListeningItem {
  id: string;
  level: 'HSK 1' | 'HSK 2';
  pdfPage: string;
  topic: string;
  zh: string;
  pinyin: string;
  th: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface SpeakingItem {
  id: string;
  level: 'HSK 1' | 'HSK 2';
  pdfPage: string;
  zh: string;
  pinyin: string;
  th: string;
  focusTip: string;
}

export interface ReadingLine {
  speaker?: string;
  zh: string;
  pinyin: string;
  th: string;
}

export interface ReadingQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  level: 'HSK 1' | 'HSK 2';
  pdfPages: string;
  lines: ReadingLine[];
  vocabHints: AntonymWord[];
  questions: ReadingQuestion[];
}

export interface WritingChar {
  id: string;
  char: string;
  pinyin: string;
  th: string;
  radical: string;
  strokeTip: string;
  exampleWord: AntonymWord;
  pdfPage: string;
}

export interface SentenceBuilderItem {
  id: string;
  level: 'HSK 1' | 'HSK 2';
  pdfPage: string;
  th: string;
  tokens: string[];
  pinyin: string;
  explanation: string;
}

export type SessionMinutes = 3 | 5 | 10 | 15;

export interface UserProgress {
  streak: number;
  lastStudyDate: string | null;
  studyDates: string[];
  completedLessons: string[];
  masteredAntonyms: string[];
  reviewAntonyms: string[];
  masteredRadicals: string[];
  wrongQuizIds: string[];
  solvedQuizIds: string[];
  completedListening: string[];
  completedSpeaking: string[];
  completedReading: string[];
  practicedWriting: string[];
  completedSentences: string[];
  sessionMinutes: SessionMinutes;
  showPinyin: boolean;
  totalSessionsCompleted: number;
}
