import { supabase } from '../lib/supabase'

interface VoiceSettings {
  stability?: number
  similarity_boost?: number
  style?: number
  use_speaker_boost?: boolean
}

interface ElevenLabsResponse {
  audio?: ArrayBuffer
  error?: string
}

class ElevenLabsService {
  private audioCache = new Map<string, ArrayBuffer>()
  private currentAudio: HTMLAudioElement | null = null
  private isPlaying = false

  async generateSpeech(
    text: string,
    voiceId: string = '21m00Tcm4TlvDq8ikWAM',
    modelId: string = 'eleven_monolingual_v1',
    voiceSettings?: VoiceSettings
  ): Promise<ElevenLabsResponse> {
    try {
      // Create cache key
      const cacheKey = `${text}-${voiceId}-${modelId}-${JSON.stringify(voiceSettings)}`
      
      // Check cache first
      if (this.audioCache.has(cacheKey)) {
        console.log('Using cached audio')
        return { audio: this.audioCache.get(cacheKey)! }
      }

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text,
          voice_id: voiceId,
          model_id: modelId,
          voice_settings: voiceSettings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      })

      if (error) {
        console.error('ElevenLabs API error:', error)
        return { error: error.message || 'Failed to generate speech' }
      }

      if (data instanceof ArrayBuffer) {
        // Cache the audio
        this.audioCache.set(cacheKey, data)
        return { audio: data }
      } else {
        return { error: 'Invalid response format' }
      }
    } catch (error) {
      console.error('ElevenLabs service error:', error)
      return { error: 'Failed to generate speech' }
    }
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stopAudio()
      
      // Create new audio element
      const audio = new Audio()
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      audio.src = URL.createObjectURL(blob)
      
      this.currentAudio = audio
      this.isPlaying = true
      
      // Clean up blob URL when audio ends
      audio.onended = () => {
        this.isPlaying = false
        this.currentAudio = null
        URL.revokeObjectURL(audio.src)
      }
      
      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      this.isPlaying = false
      this.currentAudio = null
      throw error
    }
  }

  pauseAudio(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause()
      this.isPlaying = false
    }
  }

  resumeAudio(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play()
      this.isPlaying = true
    }
  }

  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.isPlaying = false
      this.currentAudio = null
    }
  }

  isAudioPlaying(): boolean {
    return this.isPlaying
  }

  togglePlayPause(audioBuffer: ArrayBuffer): Promise<void> {
    if (this.isPlaying) {
      this.pauseAudio()
      return Promise.resolve()
    } else {
      return this.playAudio(audioBuffer)
    }
  }

  clearCache(): void {
    this.audioCache.clear()
  }

  getCacheSize(): number {
    return this.audioCache.size
  }
}

export const elevenLabsService = new ElevenLabsService() 