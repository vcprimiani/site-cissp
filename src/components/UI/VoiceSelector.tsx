import React, { useState } from 'react';
import { Volume2, Settings } from 'lucide-react';
import { elevenLabsService, AVAILABLE_VOICES, Voice, VoiceSettings, DEFAULT_VOICE_SETTINGS } from '../../services/elevenlabs';

interface VoiceSelectorProps {
  onVoiceChange?: (voice: Voice) => void;
  onSettingsChange?: (settings: VoiceSettings) => void;
  className?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  onVoiceChange,
  onSettingsChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(AVAILABLE_VOICES[0]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  const handleVoiceChange = (voice: Voice) => {
    setSelectedVoice(voice);
    onVoiceChange?.(voice);
    setIsOpen(false);
  };

  const handleSettingsChange = (key: keyof VoiceSettings, value: number | boolean) => {
    const newSettings = { ...voiceSettings, [key]: value };
    setVoiceSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const testVoice = async () => {
    setIsLoading(true);
    try {
      await elevenLabsService.playSpeech(
        "Hello! This is a test of the voice settings. How does this sound?",
        selectedVoice.id,
        voiceSettings
      );
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 text-sm font-medium"
        disabled={isLoading}
      >
        <Volume2 className="w-4 h-4" />
        <span>{selectedVoice.name}</span>
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Voice Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Voice Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Voice
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {AVAILABLE_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice)}
                  className={`text-left p-2 rounded-lg border transition-all duration-200 ${
                    selectedVoice.id === voice.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{voice.name}</div>
                  {voice.description && (
                    <div className="text-xs text-gray-600">{voice.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stability: {voiceSettings.stability}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.stability}
                onChange={(e) => handleSettingsChange('stability', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Similarity Boost: {voiceSettings.similarity_boost}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.similarity_boost}
                onChange={(e) => handleSettingsChange('similarity_boost', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style: {voiceSettings.style}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.style}
                onChange={(e) => handleSettingsChange('style', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="speaker-boost"
                checked={voiceSettings.use_speaker_boost}
                onChange={(e) => handleSettingsChange('use_speaker_boost', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="speaker-boost" className="text-sm font-medium text-gray-700">
                Use Speaker Boost
              </label>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={testVoice}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Voice'}
          </button>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}; 