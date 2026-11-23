import { useCallback, useEffect, useState } from 'react';
import { SessionMinutes, UserProgress } from '../data/types';

const STORAGE_KEY = 'hsk12-study-progress-v1';

export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateStr(d);
}

const DEFAULT_PROGRESS: UserProgress = {
  streak: 0,
  lastStudyDate: null,
  studyDates: [],
  completedLessons: [],
  masteredAntonyms: [],
  reviewAntonyms: [],
  masteredRadicals: [],
  wrongQuizIds: [],
  solvedQuizIds: [],
  completedListening: [],
  completedSpeaking: [],
  completedReading: [],
  practicedWriting: [],
  completedSentences: [],
  completedPodcasts: [],
  sessionMinutes: 5,
  showPinyin: true,
  totalSessionsCompleted: 0,
};

function computeEffectiveStreak(progress: UserProgress): number {
  if (!progress.lastStudyDate) return 0;
  const today = getLocalDateStr();
  const yesterday = getYesterdayDateStr();
  if (progress.lastStudyDate === today || progress.lastStudyDate === yesterday) {
    return progress.streak;
  }
  return 0;
}

function loadInitialProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    const merged: UserProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      masteredAntonyms: Array.isArray(parsed.masteredAntonyms) ? parsed.masteredAntonyms : [],
      reviewAntonyms: Array.isArray(parsed.reviewAntonyms) ? parsed.reviewAntonyms : [],
      masteredRadicals: Array.isArray(parsed.masteredRadicals) ? parsed.masteredRadicals : [],
      wrongQuizIds: Array.isArray(parsed.wrongQuizIds) ? parsed.wrongQuizIds : [],
      solvedQuizIds: Array.isArray(parsed.solvedQuizIds) ? parsed.solvedQuizIds : [],
      completedListening: Array.isArray(parsed.completedListening) ? parsed.completedListening : [],
      completedSpeaking: Array.isArray(parsed.completedSpeaking) ? parsed.completedSpeaking : [],
      completedReading: Array.isArray(parsed.completedReading) ? parsed.completedReading : [],
      practicedWriting: Array.isArray(parsed.practicedWriting) ? parsed.practicedWriting : [],
      completedSentences: Array.isArray(parsed.completedSentences) ? parsed.completedSentences : [],
      completedPodcasts: Array.isArray(parsed.completedPodcasts) ? parsed.completedPodcasts : [],
      studyDates: Array.isArray(parsed.studyDates) ? parsed.studyDates : [],
    };
    return {
      ...merged,
      streak: computeEffectiveStreak(merged),
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function applyStudyToday(prev: UserProgress, incrementSession = false): UserProgress {
  const today = getLocalDateStr();
  const yesterday = getYesterdayDateStr();
  const alreadyStudiedToday = prev.lastStudyDate === today;
  let nextStreak = prev.streak;
  if (!alreadyStudiedToday) {
    nextStreak = prev.lastStudyDate === yesterday ? prev.streak + 1 : 1;
  }
  const nextDates = prev.studyDates.includes(today)
    ? prev.studyDates
    : [...prev.studyDates, today].slice(-60);

  return {
    ...prev,
    streak: nextStreak,
    lastStudyDate: today,
    studyDates: nextDates,
    totalSessionsCompleted: incrementSession
      ? prev.totalSessionsCompleted + 1
      : prev.totalSessionsCompleted,
  };
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(loadInitialProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  const recordStudyToday = useCallback((incrementSession = false) => {
    setProgress((prev) => applyStudyToday(prev, incrementSession));
  }, []);

  const toggleLessonComplete = useCallback((lessonId: string, forceComplete?: boolean) => {
    setProgress((prev) => {
      const exists = prev.completedLessons.includes(lessonId);
      const shouldAdd = forceComplete !== undefined ? forceComplete : !exists;
      if (shouldAdd && exists) return prev;
      if (!shouldAdd && !exists) return prev;

      const completedLessons = shouldAdd
        ? [...prev.completedLessons, lessonId]
        : prev.completedLessons.filter((id) => id !== lessonId);

      if (!shouldAdd) {
        return { ...prev, completedLessons };
      }
      return applyStudyToday({ ...prev, completedLessons }, false);
    });
  }, []);

  const markAntonym = useCallback((antonymId: string, status: 'mastered' | 'review') => {
    setProgress((prev) => {
      const masteredAntonyms =
        status === 'mastered'
          ? Array.from(new Set([...prev.masteredAntonyms, antonymId]))
          : prev.masteredAntonyms.filter((id) => id !== antonymId);
      const reviewAntonyms =
        status === 'review'
          ? Array.from(new Set([...prev.reviewAntonyms, antonymId]))
          : prev.reviewAntonyms.filter((id) => id !== antonymId);
      return { ...prev, masteredAntonyms, reviewAntonyms };
    });
  }, []);

  const markRadical = useCallback((radicalId: string, mastered: boolean) => {
    setProgress((prev) => {
      const masteredRadicals = mastered
        ? Array.from(new Set([...prev.masteredRadicals, radicalId]))
        : prev.masteredRadicals.filter((id) => id !== radicalId);
      return { ...prev, masteredRadicals };
    });
  }, []);

  const recordQuizAnswer = useCallback((quizId: string, isCorrect: boolean) => {
    setProgress((prev) => {
      if (isCorrect) {
        return {
          ...prev,
          solvedQuizIds: Array.from(new Set([...prev.solvedQuizIds, quizId])),
          wrongQuizIds: prev.wrongQuizIds.filter((id) => id !== quizId),
        };
      }
      return {
        ...prev,
        wrongQuizIds: Array.from(new Set([...prev.wrongQuizIds, quizId])),
      };
    });
  }, []);

  const markSkillItem = useCallback(
    (skill: 'listening' | 'speaking' | 'reading' | 'writing' | 'sentence' | 'podcast', id: string) => {
      setProgress((prev) => {
        const keyMap = {
          listening: 'completedListening',
          speaking: 'completedSpeaking',
          reading: 'completedReading',
          writing: 'practicedWriting',
          sentence: 'completedSentences',
          podcast: 'completedPodcasts',
        } as const;
        const field = keyMap[skill];
        const nextList = Array.from(new Set([...prev[field], id]));
        return applyStudyToday({ ...prev, [field]: nextList }, false);
      });
    },
    []
  );

  const setSessionMinutes = useCallback((minutes: SessionMinutes) => {
    setProgress((prev) => ({ ...prev, sessionMinutes: minutes }));
  }, []);

  const toggleShowPinyin = useCallback(() => {
    setProgress((prev) => ({ ...prev, showPinyin: !prev.showPinyin }));
  }, []);

  const importProgress = useCallback((jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<UserProgress>;
      if (!parsed || typeof parsed !== 'object') return false;
      const merged: UserProgress = {
        ...DEFAULT_PROGRESS,
        ...parsed,
        completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        masteredAntonyms: Array.isArray(parsed.masteredAntonyms) ? parsed.masteredAntonyms : [],
        reviewAntonyms: Array.isArray(parsed.reviewAntonyms) ? parsed.reviewAntonyms : [],
        masteredRadicals: Array.isArray(parsed.masteredRadicals) ? parsed.masteredRadicals : [],
        wrongQuizIds: Array.isArray(parsed.wrongQuizIds) ? parsed.wrongQuizIds : [],
        solvedQuizIds: Array.isArray(parsed.solvedQuizIds) ? parsed.solvedQuizIds : [],
        completedListening: Array.isArray(parsed.completedListening) ? parsed.completedListening : [],
        completedSpeaking: Array.isArray(parsed.completedSpeaking) ? parsed.completedSpeaking : [],
        completedReading: Array.isArray(parsed.completedReading) ? parsed.completedReading : [],
        practicedWriting: Array.isArray(parsed.practicedWriting) ? parsed.practicedWriting : [],
        completedSentences: Array.isArray(parsed.completedSentences) ? parsed.completedSentences : [],
        completedPodcasts: Array.isArray(parsed.completedPodcasts) ? parsed.completedPodcasts : [],
        studyDates: Array.isArray(parsed.studyDates) ? parsed.studyDates : [],
      };
      setProgress({
        ...merged,
        streak: computeEffectiveStreak(merged),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  return {
    progress,
    studiedToday: progress.lastStudyDate === getLocalDateStr(),
    recordStudyToday,
    toggleLessonComplete,
    markAntonym,
    markRadical,
    recordQuizAnswer,
    markSkillItem,
    setSessionMinutes,
    toggleShowPinyin,
    importProgress,
    resetProgress,
  };
}
