import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { useFlags } from '../../hooks/useFlags';
import { FlagModal } from './FlagModal';

interface FlagButtonProps {
  questionId: string;
  questionText: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FlagButton: React.FC<FlagButtonProps> = ({
  questionId,
  questionText,
  className = '',
  size = 'md'
}) => {
  const [showFlagModal, setShowFlagModal] = useState(false);
  const { isQuestionFlagged, flagQuestion, unflagQuestion, loading: flagsLoading } = useFlags();
  const isFlagged = isQuestionFlagged(questionId);

  const handleFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFlagged) {
      unflagQuestion(questionId);
    } else {
      setShowFlagModal(true);
    }
  };

  const handleFlagSubmit = async (reason: string, customReason?: string) => {
    try {
      await flagQuestion(questionId, reason, customReason);
    } catch (error) {
      console.error('Error flagging question:', error);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <>
      <button
        className={`rounded-full shadow border border-gray-200 transition-colors ${
          isFlagged
            ? 'bg-red-100 border-red-400 ring-2 ring-red-300 shadow-lg'
            : 'bg-white hover:bg-red-50'
        } ${sizeClasses[size]} ${className}`}
        aria-label={isFlagged ? 'Remove flag' : 'Flag question'}
        onClick={handleFlagClick}
        disabled={flagsLoading}
        title={isFlagged ? 'Remove flag' : 'Flag this question'}
      >
        <Flag
          className={`transition-colors ${iconSizes[size]} ${
            isFlagged ? 'text-red-700 fill-red-400' : 'text-gray-400'
          }`}
          fill={isFlagged ? 'currentColor' : 'none'}
        />
      </button>

      <FlagModal
        isOpen={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        onFlag={handleFlagSubmit}
        questionText={questionText}
        loading={flagsLoading}
      />
    </>
  );
}; 