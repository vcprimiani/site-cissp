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

export interface GenerationStatus {
  isGenerating: boolean;
  progress?: number;
  error?: string;
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
  private generationStatus: GenerationStatus = { isGenerating: false };
  private statusCallbacks: ((status: GenerationStatus) => void)[] = [];

  // Subscribe to generation status updates
  onStatusUpdate(callback: (status: GenerationStatus) => void) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  private updateStatus(status: Partial<GenerationStatus>) {
    this.generationStatus = { ...this.generationStatus, ...status };
    this.statusCallbacks.forEach(callback => callback(this.generationStatus));
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.details) return error.details;
    return 'An unexpected error occurred';
  }

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
      this.updateStatus({ isGenerating: true, progress: 0, error: undefined });
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        const currentProgress = this.generationStatus.progress || 0;
        if (currentProgress < 90) {
          this.updateStatus({ progress: currentProgress + 10 });
        }
      }, 200);

      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text,
          voice_id: voiceId,
          voice_settings: voiceSettings
        }
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('ElevenLabs API error:', error);
        const errorMessage = this.getErrorMessage(error);
        this.updateStatus({ 
          isGenerating: false, 
          error: errorMessage,
          progress: undefined 
        });
        throw new Error(errorMessage);
      }

      this.updateStatus({ progress: 100 });

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
        const errorMessage = 'Unexpected response format from ElevenLabs API';
        this.updateStatus({ 
          isGenerating: false, 
          error: errorMessage,
          progress: undefined 
        });
        throw new Error(errorMessage);
      }

      // Convert the audio data to a blob URL
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the result
      this.audioCache.set(cacheKey, audioUrl);
      
      this.updateStatus({ isGenerating: false, progress: undefined, error: undefined });
      return audioUrl;
    } catch (error) {
      console.error('Speech generation failed:', error);
      const errorMessage = this.getErrorMessage(error);
      this.updateStatus({ 
        isGenerating: false, 
        error: errorMessage,
        progress: undefined 
      });
      throw error;
    }
  }

  async playSpeech(
    text: string, 
    voiceId: string = "21m00Tcm4TlvDq8ikWAM",
    voiceSettings: VoiceSettings = DEFAULT_VOICE_SETTINGS
  ): Promise<void> {
    // If already playing, pause it
    if (this.isPlaying && this.currentAudio) {
      this.pauseSpeech();
      return;
    }

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

  pauseSpeech(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
  }

  resumeSpeech(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
      this.isPlaying = true;
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

  getGenerationStatus(): GenerationStatus {
    return this.generationStatus;
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