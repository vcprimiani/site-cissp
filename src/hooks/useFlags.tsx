import React, { useState, useEffect, createContext, useContext } from 'react';
import { FlagService, FLAG_REASONS } from '../services/flagService';
import { useAuth } from './useAuth';
import { Question } from '../types';
import { supabase } from '../lib/supabase';

interface UseFlagsReturn {
  flaggedQuestionIds: string[];
  loading: boolean;
  error: string | null;
  flagQuestion: (questionId: string, reason: string, customReason?: string) => Promise<boolean>;
  unflagQuestion: (questionId: string) => Promise<boolean>;
  isQuestionFlagged: (questionId: string) => boolean;
  refreshFlags: () => Promise<void>;
}

// Create a context for flag state
interface FlagContextType {
  flaggedQuestionIds: string[];
  loading: boolean;
  error: string | null;
  flagQuestion: (questionId: string, reason: string, customReason?: string) => Promise<boolean>;
  unflagQuestion: (questionId: string) => Promise<boolean>;
  isQuestionFlagged: (questionId: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const FlagContext = createContext<FlagContextType | null>(null);

export const useFlags = (): UseFlagsReturn => {
  const context = useContext(FlagContext);
  if (!context) {
    throw new Error('useFlags must be used within a FlagProvider');
  }
  return context;
};

export const FlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's flagged questions
  const fetchUserFlags = async () => {
    if (!user) {
      setFlaggedQuestionIds([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get questions that this user has flagged
      const { data: questions, error: fetchError } = await supabase
        .from('questions')
        .select('id, flagged_by');

      if (fetchError) {
        throw fetchError;
      }

      // Filter questions that contain the current user's ID in flagged_by array
      const userFlaggedQuestions = (questions || [])
        .filter((q: any) => q.flagged_by && Array.isArray(q.flagged_by) && q.flagged_by.includes(user.id))
        .map((q: any) => q.id);
      
      setFlaggedQuestionIds(userFlaggedQuestions);
    } catch (err: any) {
      console.error('Error fetching user flags:', err);
      setError(err.message || 'Failed to fetch flags');
    } finally {
      setLoading(false);
    }
  };

  // Flag a question
  const flagQuestion = async (questionId: string, reason: string, customReason?: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to flag questions');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const success = await FlagService.flagQuestion({
        questionId,
        userId: user.id,
        reason,
        customReason
      });

      if (success) {
        // Update local state immediately for better UX
        setFlaggedQuestionIds(prev => [...prev, questionId]);
      }

      return success;
    } catch (err: any) {
      console.error('Error flagging question:', err);
      setError(err.message || 'Failed to flag question');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Unflag a question
  const unflagQuestion = async (questionId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to unflag questions');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const success = await FlagService.unflagQuestion({
        questionId,
        userId: user.id
      });

      if (success) {
        // Update local state immediately for better UX
        setFlaggedQuestionIds(prev => prev.filter(id => id !== questionId));
      }

      return success;
    } catch (err: any) {
      console.error('Error unflagging question:', err);
      setError(err.message || 'Failed to unflag question');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if a question is flagged by current user
  const isQuestionFlagged = (questionId: string): boolean => {
    return flaggedQuestionIds.includes(questionId);
  };

  // Refresh flags
  const refreshFlags = async () => {
    await fetchUserFlags();
  };

  // Fetch flags on mount and when user changes
  useEffect(() => {
    fetchUserFlags();
  }, [user]);

  const value: FlagContextType = {
    flaggedQuestionIds,
    loading,
    error,
    flagQuestion,
    unflagQuestion,
    isQuestionFlagged,
    refreshFlags
  };

  return (
    <FlagContext.Provider value={value}>
      {children}
    </FlagContext.Provider>
  );
}; 