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
  private currentUtterance: SpeechSynthesisUtterance | null = null

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

      console.log('Calling ElevenLabs function with text:', text.substring(0, 50) + '...')
      
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
        }
      })

      if (error) {
        console.error('ElevenLabs API error:', error)
        // Fallback to browser speech synthesis
        console.log('Falling back to browser speech synthesis')
        return { error: 'Using browser speech synthesis as fallback' }
      }

      if (data instanceof ArrayBuffer) {
        console.log('Successfully received audio, size:', data.byteLength, 'bytes')
        // Cache the audio
        this.audioCache.set(cacheKey, data)
        return { audio: data }
      } else {
        console.error('Invalid response format:', typeof data)
        return { error: 'Using browser speech synthesis as fallback' }
      }
    } catch (error) {
      console.error('ElevenLabs service error:', error)
      return { error: 'Using browser speech synthesis as fallback' }
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

  async playTextWithFallback(text: string): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stopAudio()
      
      // Try ElevenLabs first
      const result = await this.generateSpeech(text)
      
      if (result.audio) {
        // Use ElevenLabs audio
        await this.playAudio(result.audio)
      } else {
        // Fallback to browser speech synthesis
        console.log('Using browser speech synthesis for:', text.substring(0, 50) + '...')
        this.playWithBrowserSpeech(text)
      }
    } catch (error) {
      console.error('Error playing text:', error)
      // Final fallback to browser speech
      this.playWithBrowserSpeech(text)
    }
  }

  private playWithBrowserSpeech(text: string): void {
    // Stop any current speech
    if (this.currentUtterance) {
      window.speechSynthesis.cancel()
    }
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => {
      this.isPlaying = false
      this.currentUtterance = null
    }
    utterance.onerror = () => {
      this.isPlaying = false
      this.currentUtterance = null
    }
    
    this.currentUtterance = utterance
    this.isPlaying = true
    window.speechSynthesis.speak(utterance)
  }

  pauseAudio(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause()
      this.isPlaying = false
    } else if (this.currentUtterance && this.isPlaying) {
      window.speechSynthesis.pause()
      this.isPlaying = false
    }
  }

  resumeAudio(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play()
      this.isPlaying = true
    } else if (this.currentUtterance && !this.isPlaying) {
      window.speechSynthesis.resume()
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
    if (this.currentUtterance) {
      window.speechSynthesis.cancel()
      this.isPlaying = false
      this.currentUtterance = null
    }
  }

  isAudioPlaying(): boolean {
    return this.isPlaying
  }

  async togglePlayPause(text: string): Promise<void> {
    if (this.isPlaying) {
      this.pauseAudio()
      return Promise.resolve()
    } else {
      return this.playTextWithFallback(text)
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