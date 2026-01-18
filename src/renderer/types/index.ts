export interface TranscriptCue {
  id: string
  startTime: number
  endTime: number
  text: string
  speaker?: string
}

export interface ParsedTranscript {
  cues: TranscriptCue[]
  duration: number
  rawText: string
}

export interface Chapter {
  id: string
  title: string
  startTime: number
  endTime: number
  confidence: number
  summary: string
}

export interface VideoInfo {
  duration: number
  width: number
  height: number
  codec: string
  fps: number
  bitrate: number
}

export interface TitleCardConfig {
  enabled: boolean
  duration: number
  backgroundColor: string
  textColor: string
  fontSize: number
  fontFamily: string
}

export type EffectType = 'none' | 'fade' | 'fade-white' | 'blur' | 'zoom'

export interface ExportSettings {
  outputDirectory: string
  fadeInType: EffectType
  fadeInDuration: number
  fadeOutType: EffectType
  fadeOutDuration: number
  titleCard: TitleCardConfig
  useHardwareAcceleration: boolean
  filenamePattern: string
}

export type OpenAIModel = 'gpt-4.1' | 'gpt-4.1-mini' | 'gpt-4.1-nano' | 'gpt-4o' | 'gpt-4o-mini' | 'o3' | 'o4-mini'
export type AnthropicModel = 'claude-sonnet-4-20250514' | 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229'

export interface LlmSettings {
  provider: 'openai' | 'anthropic'
  openaiModel: OpenAIModel
  anthropicModel: AnthropicModel
  hasOpenAiKey: boolean
  hasAnthropicKey: boolean
}

export type AppView = 'import' | 'chapters' | 'titlecard' | 'export'

export interface AppState {
  currentView: AppView
  videoPath: string | null
  vttPath: string | null
  videoInfo: VideoInfo | null
  transcript: ParsedTranscript | null
  chapters: Chapter[]
  selectedChapterId: string | null
  exportSettings: ExportSettings
  llmSettings: LlmSettings
  isProcessing: boolean
  processingProgress: { stage: string; percent: number } | null
  videoElement: HTMLVideoElement | null
}
