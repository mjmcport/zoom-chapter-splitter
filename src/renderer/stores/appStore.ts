import { create } from 'zustand'
import type { AppState, Chapter, ParsedTranscript, VideoInfo, ExportSettings, LlmSettings, AppView } from '../types'

interface AppActions {
  setCurrentView: (view: AppView) => void
  setVideoPath: (path: string | null) => void
  setVttPath: (path: string | null) => void
  setVideoInfo: (info: VideoInfo | null) => void
  setTranscript: (transcript: ParsedTranscript | null) => void
  setChapters: (chapters: Chapter[]) => void
  updateChapter: (id: string, updates: Partial<Chapter>) => void
  addChapter: (chapter: Chapter) => void
  removeChapter: (id: string) => void
  setSelectedChapterId: (id: string | null) => void
  updateExportSettings: (settings: Partial<ExportSettings>) => void
  updateLlmSettings: (settings: Partial<LlmSettings>) => void
  setIsProcessing: (isProcessing: boolean) => void
  setProcessingProgress: (progress: { stage: string; percent: number } | null) => void
  setVideoElement: (el: HTMLVideoElement | null) => void
  seekTo: (time: number) => void
  reset: () => void
}

const defaultExportSettings: ExportSettings = {
  outputDirectory: '',
  fadeInType: 'fade',
  fadeInDuration: 1,
  fadeOutType: 'fade',
  fadeOutDuration: 1,
  titleCard: {
    enabled: true,
    duration: 3,
    backgroundColor: '#0a0a0f',
    textColor: '#ffffff',
    fontSize: 72,
    fontFamily: 'SF Pro Display, -apple-system, sans-serif'
  },
  useHardwareAcceleration: true,
  filenamePattern: '{index}_{title}'
}

const defaultLlmSettings: LlmSettings = {
  provider: 'openai',
  openaiModel: 'gpt-4.1',
  anthropicModel: 'claude-sonnet-4-20250514',
  hasOpenAiKey: false,
  hasAnthropicKey: false
}

const initialState: AppState = {
  currentView: 'import',
  videoPath: null,
  vttPath: null,
  videoInfo: null,
  transcript: null,
  chapters: [],
  selectedChapterId: null,
  exportSettings: defaultExportSettings,
  llmSettings: defaultLlmSettings,
  isProcessing: false,
  processingProgress: null,
  videoElement: null
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  setCurrentView: (view) => set({ currentView: view }),
  
  setVideoPath: (path) => set({ videoPath: path }),
  
  setVttPath: (path) => set({ vttPath: path }),
  
  setVideoInfo: (info) => set({ videoInfo: info }),
  
  setTranscript: (transcript) => set({ transcript }),
  
  setChapters: (chapters) => set({ chapters }),
  
  updateChapter: (id, updates) => set((state) => ({
    chapters: state.chapters.map((ch) =>
      ch.id === id ? { ...ch, ...updates } : ch
    )
  })),
  
  addChapter: (chapter) => set((state) => ({
    chapters: [...state.chapters, chapter].sort((a, b) => a.startTime - b.startTime)
  })),
  
  removeChapter: (id) => set((state) => ({
    chapters: state.chapters.filter((ch) => ch.id !== id),
    selectedChapterId: state.selectedChapterId === id ? null : state.selectedChapterId
  })),
  
  setSelectedChapterId: (id) => set({ selectedChapterId: id }),
  
  updateExportSettings: (settings) => set((state) => ({
    exportSettings: { ...state.exportSettings, ...settings }
  })),
  
  updateLlmSettings: (settings) => set((state) => ({
    llmSettings: { ...state.llmSettings, ...settings }
  })),
  
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  
  setVideoElement: (el) => set({ videoElement: el }),
  
  seekTo: (time) => {
    const state = get()
    if (state.videoElement) {
      state.videoElement.currentTime = time
      state.videoElement.play()
    }
  },
  
  reset: () => set(initialState)
}))
