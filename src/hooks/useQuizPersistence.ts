import { useState, useEffect } from 'react';
import { Question } from '../types';

interface PersistedQuizState {
  questions: Question[];
  currentIndex: number;
  userAnswers: (number | null)[];
  selectedAnswer: number | null;
  showResult: boolean;
  startTime: number;
  questionStartTime: number;
  questionTimes: number[];
  elapsedTime: number;
  questionElapsedTime?: number;
  tallyCounts: number[];
  isActive: boolean;
  isEnhancedExplanation?: boolean;
  enhancedExplanation?: string | null;
  loadingEnhancedExplanation?: boolean;
  enhancedExplanationError?: string | null;
  textSize?: number;
}

const STORAGE_KEY = 'quiz-persistent-state';

export const useQuizPersistence = () => {
  const [persistedState, setPersistedState] = useState<PersistedQuizState | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only load if the quiz was active
        if (parsed.isActive) {
          setPersistedState(parsed);
        }
      } catch (error) {
        console.error('Error loading persisted quiz state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveQuizState = (state: Partial<PersistedQuizState>) => {
    const currentState = persistedState || {
      questions: [],
      currentIndex: 0,
      userAnswers: [],
      selectedAnswer: null,
      showResult: false,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      questionTimes: [],
      elapsedTime: 0,
      tallyCounts: [0, 0, 0, 0],
      keywords: [],
      showKeywords: false,
      isActive: true
    };

    const newState = { ...currentState, ...state };
    setPersistedState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const clearPersistedState = () => {
    setPersistedState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasPersistedQuiz = () => {
    return persistedState !== null && persistedState.isActive;
  };

  return {
    persistedState,
    saveQuizState,
    clearPersistedState,
    hasPersistedQuiz
  };
};