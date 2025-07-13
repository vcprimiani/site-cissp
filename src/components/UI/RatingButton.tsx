import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader } from 'lucide-react';
import { useRatings } from '../../hooks/useRatings';
import { showToast } from '../../utils/toast';
import { setQuestionRating, getQuestionRatingAggregate } from '../../services/flagService';

interface RatingButtonProps {
  questionId: string;
  userId: string;
}

export const RatingButton: React.FC<RatingButtonProps> = ({ questionId, userId }) => {
  const { ratings, setRating } = useRatings([questionId], userId);
  const [loading, setLoading] = useState<1 | -1 | null>(null);
  const [ratingCounts, setRatingCounts] = useState<{ up: number; down: number }>({ up: 0, down: 0 });

  React.useEffect(() => {
    if (!questionId) return;
    getQuestionRatingAggregate(questionId).then(setRatingCounts);
  }, [questionId]);

  const handleThumb = async (val: 1 | -1) => {
    if (!userId) {
      showToast('error', 'No user found. Please log in.');
      return;
    }
    setLoading(val);
    try {
      const success = await setQuestionRating(questionId, userId, val);
      if (!success) {
        showToast('error', 'Failed to save your rating. Please try again.');
        setLoading(null);
        return;
      }
      setRating(questionId, val);
      getQuestionRatingAggregate(questionId).then(setRatingCounts);
    } catch (error) {
      showToast('error', 'Error saving your rating. Please check your connection or permissions.');
    } finally {
      setLoading(null);
    }
  };

  const currentRating = ratings[questionId];

  // Aggregate rating calculation
  const totalVotes = ratingCounts.up + ratingCounts.down;
  const aggregateScore = totalVotes === 0 ? 3 : 3 + ((ratingCounts.up - ratingCounts.down) / totalVotes) * 2;
  const clampedScore = Math.max(1, Math.min(5, aggregateScore));

  // Adjusted emoji/label logic
  let emoji = '🤔';
  let vibeLabel = 'Not enough votes yet';
  if (totalVotes > 1) {
    if (clampedScore <= 1.5) {
      emoji = '😡';
      vibeLabel = 'Hated by most users';
    } else if (clampedScore <= 3.5) {
      emoji = '🤔';
      vibeLabel = 'Mixed/Neutral';
    } else if (clampedScore < 5) {
      emoji = '🙂';
      vibeLabel = 'Liked by most users';
    } else {
      emoji = '🤩';
      vibeLabel = 'Loved by most users';
    }
  }

  return (
    <div className="w-full flex items-center space-x-2 mt-2">
      <button
        className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-300 border border-transparent ${
          currentRating === 1
            ? 'bg-green-100 text-green-700 font-bold border-green-300 shadow'
            : 'hover:bg-green-50 text-gray-700'
        } ${loading === 1 ? 'opacity-60 cursor-wait' : ''}`}
        onClick={() => handleThumb(1)}
        aria-label="Thumbs Up"
        disabled={loading !== null}
        title={currentRating === 1 ? 'You liked this question' : 'Like this question'}
      >
        {loading === 1 ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <ThumbsUp className="w-5 h-5" />
        )}
        <span className="text-xs">{ratingCounts.up}</span>
      </button>
      <button
        className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-300 border border-transparent ${
          currentRating === -1
            ? 'bg-red-100 text-red-700 font-bold border-red-300 shadow'
            : 'hover:bg-red-50 text-gray-700'
        } ${loading === -1 ? 'opacity-60 cursor-wait' : ''}`}
        onClick={() => handleThumb(-1)}
        aria-label="Thumbs Down"
        disabled={loading !== null}
        title={currentRating === -1 ? 'You disliked this question' : 'Dislike this question'}
      >
        {loading === -1 ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <ThumbsDown className="w-5 h-5" />
        )}
        <span className="text-xs">{ratingCounts.down}</span>
      </button>
      {/* Aggregate rating display */}
      <div className="flex items-center ml-2 group cursor-default" title={`${vibeLabel} (${clampedScore.toFixed(1)}/5 · ${totalVotes} vote${totalVotes === 1 ? '' : 's'})`}>
        <span className="text-2xl mr-1">{emoji}</span>
        <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">{clampedScore.toFixed(1)}/5 · {totalVotes} vote{totalVotes === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}; 