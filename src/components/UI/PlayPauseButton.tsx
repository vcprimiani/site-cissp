import React, { useState, useEffect } from 'react';
import { Play, Pause, Loader, AlertCircle } from 'lucide-react';
import { elevenLabsService, GenerationStatus } from '../../services/elevenlabs';

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
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({ isGenerating: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to generation status updates
    const unsubscribe = elevenLabsService.onStatusUpdate((status) => {
      setGenerationStatus(status);
      if (status.error) {
        setError(status.error);
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    });

    return unsubscribe;
  }, []);

  const handleClick = async () => {
    if (disabled || isLoading || isProcessing || generationStatus.isGenerating) return;

    if (isPlaying) {
      // If currently playing, pause it
      onPause();
    } else {
      // If not playing, start playing
      setIsProcessing(true);
      setError(null);
      try {
        await onPlay();
      } catch (error) {
        console.error('Playback failed:', error);
        setError('Failed to play audio. Please try again.');
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

  const isGenerating = generationStatus.isGenerating;
  const progress = generationStatus.progress || 0;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading || isProcessing || isGenerating}
        className={`
          flex items-center justify-center rounded-full border-2 transition-all duration-200
          ${sizeClasses[size]}
          ${disabled || isLoading || isProcessing || isGenerating
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : isPlaying
            ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200'
            : 'bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200'
          }
          ${className}
        `}
        title={
          isGenerating 
            ? `Generating audio... ${progress}%`
            : isPlaying 
            ? 'Pause audio' 
            : 'Play audio'
        }
      >
        {isGenerating ? (
          <div className="relative">
            <Loader className={`${iconSizes[size]} animate-spin`} />
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${(progress / 100) * 88} 88`}
                strokeLinecap="round"
                className="text-blue-500"
              />
            </svg>
          </div>
        ) : error ? (
          <AlertCircle className={`${iconSizes[size]} text-red-500`} />
        ) : isLoading || isProcessing ? (
          <Loader className={`${iconSizes[size]} animate-spin`} />
        ) : isPlaying ? (
          <Pause className={iconSizes[size]} />
        ) : (
          <Play className={`${iconSizes[size]} ml-0.5`} />
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-700 max-w-xs z-10">
          {error}
        </div>
      )}

      {/* Generation progress tooltip */}
      {isGenerating && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-xs text-blue-700 z-10">
          Generating audio... {progress}%
        </div>
      )}
    </div>
  );
}; 