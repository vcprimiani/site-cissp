import { useState, useEffect } from 'react';
import { Question } from '../types';

interface SessionTracker {
  usedQuestionIds: Set<string>;
  sessionStartTime: Date;
  questionsAsked: number;
}

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

  // Filter out questions that have been used in this session
  const getAvailableQuestions = (allQuestions: Question[]): Question[] => {
    return allQuestions.filter(q => !sessionData.usedQuestionIds.has(q.id));
  };

  // Mark questions as used
  const markQuestionsAsUsed = (questions: Question[]) => {
    setSessionData(prev => ({
      ...prev,
      usedQuestionIds: new Set([...prev.usedQuestionIds, ...questions.map(q => q.id)]),
      questionsAsked: prev.questionsAsked + questions.length
    }));
  };

  // Reset the session
  const resetSession = () => {
    setSessionData({
      usedQuestionIds: new Set<string>(),
      sessionStartTime: new Date(),
      questionsAsked: 0
    });
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
    getSessionStats,
    sessionData
  };
};