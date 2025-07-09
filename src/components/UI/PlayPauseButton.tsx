import React, { useState, useEffect } from 'react'
import { elevenLabsService } from '../../services/elevenlabs'
import { showToast } from '../../utils/toast'

interface PlayPauseButtonProps {
  text: string
  voiceId?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({ 
  text, 
  voiceId = '21m00Tcm4TlvDq8ikWAM',
  className = '',
  size = 'md'
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if this button's audio is currently playing
  useEffect(() => {
    const checkPlayingStatus = () => {
      setIsPlaying(elevenLabsService.isAudioPlaying())
    }

    // Check immediately
    checkPlayingStatus()

    // Set up interval to check status
    const interval = setInterval(checkPlayingStatus, 100)

    return () => clearInterval(interval)
  }, [])

  const handlePlayPause = async () => {
    try {
      setError(null)

      // If we have audio and it's playing, pause it
      if (audioBuffer && isPlaying) {
        elevenLabsService.pauseAudio()
        setIsPlaying(false)
        return
      }

      // If we have audio and it's paused, resume it
      if (audioBuffer && !isPlaying) {
        elevenLabsService.resumeAudio()
        setIsPlaying(true)
        return
      }

      // Generate new audio if we don't have it
      setIsLoading(true)
      const result = await elevenLabsService.generateSpeech(text, voiceId)

      if (result.error) {
        setError(result.error)
        showToast('error', `Failed to generate speech: ${result.error}`)
        return
      }

      if (result.audio) {
        setAudioBuffer(result.audio)
        await elevenLabsService.playAudio(result.audio)
        setIsPlaying(true)
        showToast('success', 'Playing audio')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8'
      case 'lg':
        return 'w-12 h-12'
      default:
        return 'w-10 h-10'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-5 h-5'
    }
  }

  return (
    <button
      onClick={handlePlayPause}
      disabled={isLoading}
      className={`
        ${getSizeClasses()}
        rounded-full
        bg-blue-600 hover:bg-blue-700 
        disabled:bg-gray-400 disabled:cursor-not-allowed
        text-white
        flex items-center justify-center
        transition-all duration-200
        shadow-lg hover:shadow-xl
        ${className}
      `}
      title={error ? `Error: ${error}` : isPlaying ? 'Pause' : 'Play'}
    >
      {isLoading ? (
        <div className={`${getIconSize()} animate-spin`}>
          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : isPlaying ? (
        <svg className={getIconSize()} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className={getIconSize()} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  )
}

export default PlayPauseButton 