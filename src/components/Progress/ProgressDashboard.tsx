import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface ProgressStats {
  totalAnswered: number;
  correct: number;
  accuracy: number;
  recent: Array<{ question_id: string; answered_at: string; is_correct: boolean }>;
}

export const ProgressDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch session-level quiz progress entries
        const { data, error } = await supabase
          .from('quiz_progress')
          .select('timestamp, results')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });
        if (error) {
          setError('Failed to fetch progress.');
          showToast('error', 'Failed to fetch progress.');
          console.error('Progress fetch error:', error);
          setLoading(false);
          return;
        }

        // Aggregate stats from results.questionResults
        let totalAnswered = 0;
        let correct = 0;
        const recent: Array<{ question_id: string; answered_at: string; is_correct: boolean }> = [];

        for (const session of data as any[]) {
          const sessionTimestamp = session.timestamp;
          const questionResults = session.results?.questionResults || [];
          totalAnswered += Array.isArray(questionResults) ? questionResults.length : 0;
          for (const qr of questionResults) {
            if (qr?.isCorrect) correct += 1;
          }
        }

        // Build recent items (up to 10) from latest sessions first
        outer: for (const session of data as any[]) {
          const sessionTimestamp = session.timestamp;
          const questionResults = session.results?.questionResults || [];
          for (const qr of questionResults) {
            const questionId = qr?.question?.id || 'unknown';
            const isCorrect = !!qr?.isCorrect;
            recent.push({ question_id: questionId, answered_at: sessionTimestamp, is_correct: isCorrect });
            if (recent.length >= 10) break outer;
          }
        }

        const accuracy = totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;
        setStats({ totalAnswered, correct, accuracy, recent });
      } catch (err) {
        setError('Unexpected error fetching progress.');
        showToast('error', 'Unexpected error fetching progress.');
        console.error('Progress fetch exception:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProgress();
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Your Quiz Progress</h2>
      {loading && <div className="text-gray-500">Loading progress...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {stats && (
        <>
          <div className="mb-4">
            <div className="text-lg font-semibold">Total Questions Answered: <span className="text-blue-700">{stats.totalAnswered}</span></div>
            <div className="text-lg font-semibold">Correct Answers: <span className="text-green-700">{stats.correct}</span></div>
            <div className="text-lg font-semibold">Accuracy: <span className="text-purple-700">{stats.accuracy.toFixed(1)}%</span></div>
          </div>
          <div>
            <div className="font-semibold mb-2">Recent Activity:</div>
            <ul className="space-y-1">
              {stats.recent.map((item, idx) => (
                <li key={item.question_id + idx} className="flex items-center text-sm">
                  <span className={`mr-2 ${item.is_correct ? 'text-green-600' : 'text-red-600'}`}>{item.is_correct ? '✔️' : '❌'}</span>
                  <span className="mr-2">Question ID: {item.question_id}</span>
                  <span className="text-gray-400">{new Date(item.answered_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {!loading && !stats && !error && (
        <div className="text-gray-500">No progress data found.</div>
      )}
    </div>
  );
};