import { supabase } from '../lib/supabase';
import { FlagReason, FlagHistory } from '../types';

// Predefined flag reasons
export const FLAG_REASONS: FlagReason[] = [
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Contains offensive, inappropriate, or unsuitable content'
  },
  {
    value: 'incorrect',
    label: 'Incorrect Information',
    description: 'Contains factually incorrect information or wrong answers'
  },
  {
    value: 'unclear',
    label: 'Unclear or Confusing',
    description: 'Question is poorly worded, ambiguous, or confusing'
  },
  {
    value: 'duplicate',
    label: 'Duplicate Question',
    description: 'This question already exists in the database'
  },
  {
    value: 'spam',
    label: 'Spam or Irrelevant',
    description: 'Not related to CISSP or cybersecurity topics'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above'
  }
];

export interface FlagQuestionParams {
  questionId: string;
  userId: string;
  reason: string;
  customReason?: string;
}

export interface UnflagQuestionParams {
  questionId: string;
  userId: string;
}

export interface UpdateFlagStatusParams {
  questionId: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  adminUserId: string;
}

export class FlagService {
  // Flag a question
  static async flagQuestion({ questionId, userId, reason, customReason }: FlagQuestionParams): Promise<boolean> {
    try {
      console.log('Flagging question:', { questionId, userId, reason, customReason });
      
      // Get current question data
      const { data: question, error: fetchError } = await supabase
        .from('questions')
        .select('flagged_by, flag_reasons')
        .eq('id', questionId)
        .single();

      console.log('Current question data:', question);

      if (fetchError) {
        throw fetchError;
      }

      // Check if user already flagged this question
      const currentFlaggedBy = question.flagged_by || [];
      if (currentFlaggedBy.includes(userId)) {
        throw new Error('You have already flagged this question');
      }

      // Add user to flagged_by array
      const newFlaggedBy = [...currentFlaggedBy, userId];
      
      // Add reason to flag_reasons array
      const currentReasons = question.flag_reasons || [];
      const finalReason = customReason || reason;
      const newReasons = [...currentReasons, finalReason];

      // Update question with new flag data
      console.log('Updating question with new flag data:', { newFlaggedBy, newReasons });
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          flagged_by: newFlaggedBy,
          flag_reasons: newReasons
        })
        .eq('id', questionId);

      console.log('Update result:', { updateError });

      if (updateError) {
        throw updateError;
      }

      // Add to flag history
      await this.addFlagHistory({
        questionId,
        userId,
        action: 'flag',
        reason: finalReason
      });

      return true;
    } catch (error: any) {
      console.error('Error flagging question:', error);
      throw error;
    }
  }

  // Unflag a question
  static async unflagQuestion({ questionId, userId }: UnflagQuestionParams): Promise<boolean> {
    try {
      // Get current question data
      const { data: question, error: fetchError } = await supabase
        .from('questions')
        .select('flagged_by, flag_reasons')
        .eq('id', questionId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Check if user has flagged this question
      const currentFlaggedBy = question.flagged_by || [];
      if (!currentFlaggedBy.includes(userId)) {
        throw new Error('You have not flagged this question');
      }

      // Remove user from flagged_by array
      const newFlaggedBy = currentFlaggedBy.filter((id: string) => id !== userId);
      
      // Remove user's reason from flag_reasons array (simplified - removes first occurrence)
      const currentReasons = question.flag_reasons || [];
      const newReasons = currentReasons.slice(1); // Remove first reason (simplified approach)

      // Update question
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          flagged_by: newFlaggedBy,
          flag_reasons: newReasons
        })
        .eq('id', questionId);

      if (updateError) {
        throw updateError;
      }

      // Add to flag history
      await this.addFlagHistory({
        questionId,
        userId,
        action: 'unflag'
      });

      return true;
    } catch (error: any) {
      console.error('Error unflagging question:', error);
      throw error;
    }
  }

  // Update flag status (admin only)
  static async updateFlagStatus({ questionId, status, adminUserId }: UpdateFlagStatusParams): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          flag_status: status
        })
        .eq('id', questionId);

      if (updateError) {
        throw updateError;
      }

      // Add to flag history
      await this.addFlagHistory({
        questionId,
        userId: adminUserId,
        action: status === 'dismissed' ? 'dismiss' : status === 'actioned' ? 'action' : 'review'
      });

      return true;
    } catch (error: any) {
      console.error('Error updating flag status:', error);
      throw error;
    }
  }

  // Get flagged questions
  static async getFlaggedQuestions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_flagged', true)
        .order('flag_count', { ascending: false })
        .order('flagged_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching flagged questions:', error);
      throw error;
    }
  }

  // Get flag history for a question
  static async getFlagHistory(questionId: string): Promise<FlagHistory[]> {
    try {
      const { data, error } = await supabase
        .from('question_flag_history')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        questionId: item.question_id,
        userId: item.user_id,
        action: item.action,
        reason: item.reason,
        createdAt: new Date(item.created_at)
      }));
    } catch (error: any) {
      console.error('Error fetching flag history:', error);
      throw error;
    }
  }

  // Add entry to flag history
  private static async addFlagHistory({
    questionId,
    userId,
    action,
    reason
  }: {
    questionId: string;
    userId: string;
    action: 'flag' | 'unflag' | 'review' | 'dismiss' | 'action';
    reason?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('question_flag_history')
        .insert({
          question_id: questionId,
          user_id: userId,
          action,
          reason
        });

      if (error) {
        console.error('Error adding flag history:', error);
      }
    } catch (error: any) {
      console.error('Error adding flag history:', error);
    }
  }
} 