import { useState, useEffect } from 'react';
import { Question } from '../types';

interface SessionTracker {
  usedQuestionIds: Set<string>;
  sessionStartTime: Date;
  questionsAsked: number;
}

// Persistent history key
const HISTORY_KEY = 'quiz-history-ids';

// Load persistent history from localStorage
const getHistory = (): Set<string> => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
};

// Save persistent history to localStorage
const saveHistory = (ids: Set<string>) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(Array.from(ids)));
};

export const useSessionTracker = () => {
  const [sessionData, setSessionData] = useState<SessionTracker>(() => {
    // Try to load existing session data
    const stored = localStorage.getItem('quiz-session-tracker');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          usedQuestionIds: new Set(parsed.usedQuestionIds || []),
          sessionStartTime: new Date(parsed.sessionStartTime || Date.now()),
          questionsAsked: parsed.questionsAsked || 0
        };
      } catch (error) {
        console.error('Error loading session data:', error);
      }
    }
    
    return {
      usedQuestionIds: new Set<string>(),
      sessionStartTime: new Date(),
      questionsAsked: 0
    };
  });

  // Save session data to localStorage whenever it changes
  useEffect(() => {
    const dataToStore = {
      usedQuestionIds: Array.from(sessionData.usedQuestionIds),
      sessionStartTime: sessionData.sessionStartTime.toISOString(),
      questionsAsked: sessionData.questionsAsked
    };
    localStorage.setItem('quiz-session-tracker', JSON.stringify(dataToStore));
  }, [sessionData]);

  // Filter out questions that have been used in this session or history
  const getAvailableQuestions = (allQuestions: Question[]): Question[] => {
    const history = getHistory();
    return allQuestions.filter(q => !sessionData.usedQuestionIds.has(q.id) && !history.has(q.id));
  };

  // Mark questions as used (session and history)
  const markQuestionsAsUsed = (questions: Question[]) => {
    setSessionData(prev => ({
      ...prev,
      usedQuestionIds: new Set([...prev.usedQuestionIds, ...questions.map(q => q.id)]),
      questionsAsked: prev.questionsAsked + questions.length
    }));
    // Update persistent history
    const history = getHistory();
    questions.forEach(q => history.add(q.id));
    saveHistory(history);
  };

  // Reset the session
  const resetSession = () => {
    setSessionData({
      usedQuestionIds: new Set<string>(),
      sessionStartTime: new Date(),
      questionsAsked: 0
    });
  };

  // Reset persistent history
  const resetHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
  };

  // Get session statistics
  const getSessionStats = () => ({
    questionsUsed: sessionData.usedQuestionIds.size,
    questionsAsked: sessionData.questionsAsked,
    sessionDuration: Date.now() - sessionData.sessionStartTime.getTime(),
    sessionStartTime: sessionData.sessionStartTime
  });

  return {
    getAvailableQuestions,
    markQuestionsAsUsed,
    resetSession,
    resetHistory,
    getSessionStats,
    sessionData
  };
};