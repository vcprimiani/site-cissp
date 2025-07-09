import React, { useState } from 'react';
import { Play, Pause, Loader } from 'lucide-react';

interface PlayPauseButtonProps {
  onPlay: () => Promise<void>;
  onPause: () => void;
  isPlaying: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  onPlay,
  onPause,
  isPlaying,
  isLoading = false,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading || isProcessing) return;

    if (isPlaying) {
      onPause();
    } else {
      setIsProcessing(true);
      try {
        await onPlay();
      } catch (error) {
        console.error('Playback failed:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading || isProcessing}
      className={`
        flex items-center justify-center rounded-full border-2 transition-all duration-200
        ${sizeClasses[size]}
        ${disabled || isLoading || isProcessing
          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          : isPlaying
          ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200'
          : 'bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200'
        }
        ${className}
      `}
      title={isPlaying ? 'Pause audio' : 'Play audio'}
    >
      {isLoading || isProcessing ? (
        <Loader className={`${iconSizes[size]} animate-spin`} />
      ) : isPlaying ? (
        <Pause className={iconSizes[size]} />
      ) : (
        <Play className={`${iconSizes[size]} ml-0.5`} />
      )}
    </button>
  );
}; 