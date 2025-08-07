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
  // Pagination
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
}

export const useQuestions = (): UseQuestionsReturn => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 100;

  // Fetch questions from Supabase with pagination
  const fetchQuestions = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);

      // First, get total count
      const { count, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      setTotalQuestions(count || 0);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));

      // Then fetch the page of questions
      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

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
        updatedAt: new Date(item.updated_at),
        flagCount: item.flag_count || 0,
        flaggedBy: item.flagged_by || [],
        flagReasons: item.flag_reasons || [],
        isFlagged: item.is_flagged || false,
        flaggedAt: item.flagged_at ? new Date(item.flagged_at) : undefined,
        flagStatus: item.flag_status || 'pending',
        
        // New fields from updated schema
        questionType: item.question_type,
        formatType: item.format_type,
        discriminationIndex: item.discrimination_index,
        distractorEffectiveness: item.distractor_effectiveness,
        usageCount: item.usage_count,
        correctAnswerRate: item.correct_answer_rate,
        averageResponseTime: item.average_response_time,
        lastUpdatedAt: item.last_updated_at ? new Date(item.last_updated_at) : undefined,
        updateReason: item.update_reason,
        sourceMaterials: item.source_materials,
        difficultyRating: item.difficulty_rating,
        complexityScore: item.complexity_score,
        isCrossDomain: item.is_cross_domain,
        domainPrimary: item.domain_primary,
        domainSecondary: item.domain_secondary,
        versionHistory: item.version_history,
        reviewStatus: item.review_status,
        reviewedBy: item.reviewed_by,
        reviewedAt: item.reviewed_at ? new Date(item.reviewed_at) : undefined,
        reviewNotes: item.review_notes,
        qualityIssues: item.quality_issues,
        improvementSuggestions: item.improvement_suggestions,
        lastCritiquedAt: item.last_critiqued_at ? new Date(item.last_critiqued_at) : undefined,
        critiqueCount: item.critique_count,
        autoImproved: item.auto_improved,
        improvementVersion: item.improvement_version,
        qualityScore: item.quality_score,
        citations: item.citations,
        crossDomainTags: item.cross_domain_tags
      }));

      setQuestions(transformedQuestions);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  // Pagination functions
  const goToPage = async (page: number) => {
    if (page >= 0 && page < totalPages) {
      await fetchQuestions(page);
    }
  };

  const nextPage = async () => {
    if (currentPage < totalPages - 1) {
      await fetchQuestions(currentPage + 1);
    }
  };

  const previousPage = async () => {
    if (currentPage > 0) {
      await fetchQuestions(currentPage - 1);
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
        updatedAt: new Date(data.updated_at),
        flagCount: data.flag_count || 0,
        flaggedBy: data.flagged_by || [],
        flagReasons: data.flag_reasons || [],
        isFlagged: data.is_flagged || false,
        flaggedAt: data.flagged_at ? new Date(data.flagged_at) : undefined,
        flagStatus: data.flag_status || 'pending',
        
        // New fields from updated schema
        questionType: data.question_type,
        formatType: data.format_type,
        discriminationIndex: data.discrimination_index,
        distractorEffectiveness: data.distractor_effectiveness,
        usageCount: data.usage_count,
        correctAnswerRate: data.correct_answer_rate,
        averageResponseTime: data.average_response_time,
        lastUpdatedAt: data.last_updated_at ? new Date(data.last_updated_at) : undefined,
        updateReason: data.update_reason,
        sourceMaterials: data.source_materials,
        difficultyRating: data.difficulty_rating,
        complexityScore: data.complexity_score,
        isCrossDomain: data.is_cross_domain,
        domainPrimary: data.domain_primary,
        domainSecondary: data.domain_secondary,
        versionHistory: data.version_history,
        reviewStatus: data.review_status,
        reviewedBy: data.reviewed_by,
        reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
        reviewNotes: data.review_notes,
        qualityIssues: data.quality_issues,
        improvementSuggestions: data.improvement_suggestions,
        lastCritiquedAt: data.last_critiqued_at ? new Date(data.last_critiqued_at) : undefined,
        critiqueCount: data.critique_count,
        autoImproved: data.auto_improved,
        improvementVersion: data.improvement_version,
        qualityScore: data.quality_score,
        citations: data.citations,
        crossDomainTags: data.cross_domain_tags
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
    await fetchQuestions(0);
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
    refreshQuestions,
    // Pagination
    currentPage,
    totalPages,
    totalQuestions,
    goToPage,
    nextPage,
    previousPage
  };
};