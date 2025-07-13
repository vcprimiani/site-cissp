import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useRatings(questionIds: string[], userId: string | null) {
  const [ratings, setRatings] = useState<Record<string, 1 | -1 | 0>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !questionIds.length) return;
    setLoading(true);
    supabase
      .from('question_ratings')
      .select('question_id, rating')
      .eq('user_id', userId)
      .in('question_id', questionIds)
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, 1 | -1 | 0> = {};
          questionIds.forEach(qid => { map[qid] = 0; });
          data.forEach((r: any) => { map[r.question_id] = r.rating; });
          setRatings(map);
        }
        setLoading(false);
      });
  }, [userId, questionIds.join(',')]);

  const setRating = useCallback((questionId: string, rating: 1 | -1) => {
    setRatings(prev => ({ ...prev, [questionId]: rating }));
  }, []);

  return { ratings, setRating, loading };
} 