import { useState, useEffect } from 'react';
import { Question } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface UseQuestionsReturn {
  questions: Question[];
  loading: boolean;
  error: string | null;
  addQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => Promise<Question | null>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<boolean>;
  deleteQuestion: (id: string) => Promise<boolean>;
  refreshQuestions: () => Promise<void>;
}

export const useQuestions = (): UseQuestionsReturn => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from Supabase
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match our Question type
      const transformedQuestions: Question[] = (data || []).map(item => ({
        id: item.id,
        domain: item.domain,
        difficulty: item.difficulty as 'Easy' | 'Medium' | 'Hard',
        question: item.question,
        options: item.options as string[],
        correctAnswer: item.correct_answer,
        explanation: item.explanation,
        tags: item.tags as string[],
        createdBy: item.created_by,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        flagCount: item.flag_count || 0,
        flaggedBy: item.flagged_by || [],
        flagReasons: item.flag_reasons || [],
        isFlagged: item.is_flagged || false,
        flaggedAt: item.flagged_at ? new Date(item.flagged_at) : undefined,
        flagStatus: item.flag_status || 'pending'
      }));

      setQuestions(transformedQuestions);
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  // Add a new question
  const addQuestion = async (questionData: Omit<Question, 'id' | 'createdAt'>): Promise<Question | null> => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to add questions');
      }

      const { data, error: insertError } = await supabase
        .from('questions')
        .insert({
          domain: questionData.domain,
          difficulty: questionData.difficulty,
          question: questionData.question,
          options: questionData.options,
          correct_answer: questionData.correctAnswer,
          explanation: questionData.explanation,
          tags: questionData.tags,
          created_by: user.id,
          is_active: questionData.isActive
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Transform the returned data
      const newQuestion: Question = {
        id: data.id,
        domain: data.domain,
        difficulty: data.difficulty as 'Easy' | 'Medium' | 'Hard',
        question: data.question,
        options: data.options as string[],
        correctAnswer: data.correct_answer,
        explanation: data.explanation,
        tags: data.tags as string[],
        createdBy: data.created_by,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        flagCount: data.flag_count || 0,
        flaggedBy: data.flagged_by || [],
        flagReasons: data.flag_reasons || [],
        isFlagged: data.is_flagged || false,
        flaggedAt: data.flagged_at ? new Date(data.flagged_at) : undefined,
        flagStatus: data.flag_status || 'pending'
      };

      // Add to local state (it will be at the top due to created_at ordering)
      setQuestions(prev => [newQuestion, ...prev]);
      
      return newQuestion;
    } catch (err: any) {
      console.error('Error adding question:', err);
      setError(err.message || 'Failed to add question');
      return null;
    }
  };

  // Update a question
  const updateQuestion = async (id: string, updates: Partial<Question>): Promise<boolean> => {
    try {
      const updateData: any = {};
      
      if (updates.domain !== undefined) updateData.domain = updates.domain;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
      if (updates.question !== undefined) updateData.question = updates.question;
      if (updates.options !== undefined) updateData.options = updates.options;
      if (updates.correctAnswer !== undefined) updateData.correct_answer = updates.correctAnswer;
      if (updates.explanation !== undefined) updateData.explanation = updates.explanation;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error: updateError } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setQuestions(prev => prev.map(q => 
        q.id === id ? { ...q, ...updates } : q
      ));

      return true;
    } catch (err: any) {
      console.error('Error updating question:', err);
      setError(err.message || 'Failed to update question');
      return false;
    }
  };

  // Delete a question
  const deleteQuestion = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setQuestions(prev => prev.filter(q => q.id !== id));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting question:', err);
      setError(err.message || 'Failed to delete question');
      return false;
    }
  };

  // Refresh questions
  const refreshQuestions = async () => {
    await fetchQuestions();
  };

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      fetchQuestions();
    } else {
      setQuestions([]);
      setLoading(false);
    }
  }, [user]);

  return {
    questions,
    loading,
    error,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    refreshQuestions
  };
};