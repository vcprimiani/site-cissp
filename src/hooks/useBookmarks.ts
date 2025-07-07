import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch bookmarks for the current user
  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarkedIds([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('bookmarks')
      .select('question_id')
      .eq('user_id', user.id);
    if (!error && data) {
      setBookmarkedIds(data.map((row: any) => row.question_id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Add a bookmark
  const addBookmark = async (questionId: string) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('bookmarks')
      .insert([{ user_id: user.id, question_id: questionId }]);
    if (!error) {
      setBookmarkedIds((prev) => [...prev, questionId]);
    }
    setLoading(false);
  };

  // Remove a bookmark
  const removeBookmark = async (questionId: string) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', questionId);
    if (!error) {
      setBookmarkedIds((prev) => prev.filter((id) => id !== questionId));
    }
    setLoading(false);
  };

  // Toggle bookmark
  const toggleBookmark = async (questionId: string) => {
    if (bookmarkedIds.includes(questionId)) {
      await removeBookmark(questionId);
    } else {
      await addBookmark(questionId);
    }
  };

  return {
    bookmarkedIds,
    loading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    fetchBookmarks,
  };
} 