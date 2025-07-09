import { supabase } from '../lib/supabase';

export interface Voice {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

// Popular ElevenLabs voices
export const AVAILABLE_VOICES: Voice[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Professional, clear, and engaging" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Warm and friendly" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Clear and articulate" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Josh", description: "Professional male voice" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Deep and authoritative" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", description: "Casual and approachable" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", description: "Strong and confident" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Dorothy", description: "Warm and motherly" },
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.5,
  style: 0.0,
  use_speaker_boost: true
};

class ElevenLabsService {
  private audioCache = new Map<string, string>();
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  async generateSpeech(
    text: string, 
    voiceId: string = "21m00Tcm4TlvDq8ikWAM",
    voiceSettings: VoiceSettings = DEFAULT_VOICE_SETTINGS
  ): Promise<string> {
    // Create cache key
    const cacheKey = `${voiceId}-${text.substring(0, 100)}`;
    
    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text,
          voice_id: voiceId,
          voice_settings: voiceSettings
        }
      });

      if (error) {
        console.error('ElevenLabs API error:', error);
        throw new Error(error.message || 'Failed to generate speech');
      }

      // Handle different response formats
      let audioData: ArrayBuffer;
      if (data instanceof ArrayBuffer) {
        audioData = data;
      } else if (data instanceof Uint8Array) {
        audioData = data.buffer;
      } else if (typeof data === 'string') {
        // Convert base64 to ArrayBuffer
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioData = bytes.buffer;
      } else {
        throw new Error('Unexpected response format from ElevenLabs API');
      }

      // Convert the audio data to a blob URL
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the result
      this.audioCache.set(cacheKey, audioUrl);
      
      return audioUrl;
    } catch (error) {
      console.error('Speech generation failed:', error);
      throw error;
    }
  }

  async playSpeech(
    text: string, 
    voiceId: string = "21m00Tcm4TlvDq8ikWAM",
    voiceSettings: VoiceSettings = DEFAULT_VOICE_SETTINGS
  ): Promise<void> {
    // Stop any currently playing audio
    this.stopSpeech();

    try {
      const audioUrl = await this.generateSpeech(text, voiceId, voiceSettings);
      
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isPlaying = true;

      audio.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        this.isPlaying = false;
        this.currentAudio = null;
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play speech:', error);
      this.isPlaying = false;
      this.currentAudio = null;
      throw error;
    }
  }

  stopSpeech(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentVoice(): Voice {
    return AVAILABLE_VOICES[0]; // Default to Rachel
  }

  getAvailableVoices(): Voice[] {
    return AVAILABLE_VOICES;
  }

  // Clean up cached audio URLs to prevent memory leaks
  clearCache(): void {
    this.audioCache.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.audioCache.clear();
  }
}

export const elevenLabsService = new ElevenLabsService(); 