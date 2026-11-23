export type LevelTag = 'HSK 1' | 'HSK 2' | 'HSK 1-2';

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
  sessionMinutes: SessionMinutes;
  showPinyin: boolean;
  totalSessionsCompleted: number;
}
