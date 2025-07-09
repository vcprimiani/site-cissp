import React, { useState, useEffect } from 'react';
import { Volume2, Settings, Save, TestTube } from 'lucide-react';
import { elevenLabsService, AVAILABLE_VOICES, Voice, VoiceSettings as VoiceSettingsType, DEFAULT_VOICE_SETTINGS, GenerationStatus } from '../../services/elevenlabs';
import { useToast } from '../UI/Toast';

interface VoiceSettingsProps {
  className?: string;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ className = '' }) => {
  const [selectedVoice, setSelectedVoice] = useState<Voice>(AVAILABLE_VOICES[0]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>(DEFAULT_VOICE_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({ isGenerating: false });
  
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    // Subscribe to generation status updates
    const unsubscribe = elevenLabsService.onStatusUpdate((status) => {
      setGenerationStatus(status);
      
      if (status.error) {
        showError('Voice Generation Failed', status.error);
      } else if (status.isGenerating && status.progress === 100) {
        showSuccess('Voice Generated', 'Audio is ready to play');
      }
    });

    return unsubscribe;
  }, [showSuccess, showError]);

  const handleVoiceChange = (voice: Voice) => {
    setSelectedVoice(voice);
    setSaved(false);
    showInfo('Voice Changed', `Switched to ${voice.name}`);
  };

  const handleSettingsChange = (key: keyof VoiceSettingsType, value: number | boolean) => {
    const newSettings = { ...voiceSettings, [key]: value };
    setVoiceSettings(newSettings);
    setSaved(false);
  };

  const testVoice = async () => {
    if (generationStatus.isGenerating) {
      showError('Already Generating', 'Please wait for the current generation to complete');
      return;
    }

    setIsLoading(true);
    try {
      showInfo('Generating Voice', 'Creating audio with your selected settings...');
      await elevenLabsService.playSpeech(
        "Hello! This is a test of the voice settings. How does this sound?",
        selectedVoice.id,
        voiceSettings
      );
    } catch (error) {
      console.error('Voice test failed:', error);
      showError('Test Failed', 'Unable to generate test audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = () => {
    // Save to localStorage for persistence
    localStorage.setItem('elevenlabs-voice', JSON.stringify(selectedVoice));
    localStorage.setItem('elevenlabs-settings', JSON.stringify(voiceSettings));
    setSaved(true);
    showSuccess('Settings Saved', 'Your voice preferences have been saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Volume2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Voice Settings</h2>
          <p className="text-gray-600">Configure your text-to-speech preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Voice
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVAILABLE_VOICES.map((voice) => (
              <button
                key={voice.id}
                onClick={() => handleVoiceChange(voice)}
                className={`text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedVoice.id === voice.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold">{voice.name}</div>
                {voice.description && (
                  <div className="text-sm text-gray-600 mt-1">{voice.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Parameters</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stability: {voiceSettings.stability}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.stability}
              onChange={(e) => handleSettingsChange('stability', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Controls how consistent the voice sounds</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Similarity Boost: {voiceSettings.similarity_boost}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.similarity_boost}
              onChange={(e) => handleSettingsChange('similarity_boost', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Controls how similar the voice sounds to the original</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style: {voiceSettings.style}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.style}
              onChange={(e) => handleSettingsChange('style', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Controls the speaking style and emotion</p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="speaker-boost"
              checked={voiceSettings.use_speaker_boost}
              onChange={(e) => handleSettingsChange('use_speaker_boost', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="speaker-boost" className="text-sm font-medium text-gray-700">
              Use Speaker Boost
            </label>
            <p className="text-xs text-gray-500">Enhances voice clarity and quality</p>
          </div>
        </div>

        {/* Generation Status */}
        {generationStatus.isGenerating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">Generating Audio...</div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationStatus.progress || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-blue-700 mt-1">{generationStatus.progress || 0}% complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={testVoice}
            disabled={isLoading || generationStatus.isGenerating}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <TestTube className="w-5 h-5" />
            <span>
              {isLoading || generationStatus.isGenerating 
                ? 'Generating...' 
                : 'Test Voice'
              }
            </span>
          </button>
          
          <button
            onClick={saveSettings}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>{saved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Voice Settings Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Stability:</strong> Higher values = more consistent voice</li>
            <li>• <strong>Similarity Boost:</strong> Higher values = more similar to original voice</li>
            <li>• <strong>Style:</strong> Higher values = more expressive and emotional</li>
            <li>• <strong>Speaker Boost:</strong> Improves clarity for better comprehension</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 