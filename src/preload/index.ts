import { contextBridge, ipcRenderer, webUtils } from 'electron'

export interface ElectronAPI {
  utils: {
    getFilePath: (file: File) => string
  }
  dialog: {
    openFile: (filters: { name: string; extensions: string[] }[]) => Promise<string | null>
    selectFolder: () => Promise<string | null>
  }
  vtt: {
    parse: (filePath: string) => Promise<{
      cues: Array<{
        id: string
        startTime: number
        endTime: number
        text: string
        speaker?: string
      }>
      duration: number
      rawText: string
    }>
  }
  keychain: {
    get: (service: string) => Promise<string | null>
    set: (service: string, key: string) => Promise<boolean>
    delete: (service: string) => Promise<boolean>
  }
  llm: {
    detectChapters: (transcript: string, provider: 'openai' | 'anthropic', model: string) => Promise<{
      chapters: Array<{
        title: string
        startTime: number
        endTime: number
        confidence: number
        summary: string
      }>
      processingTime: number
    }>
    onProgress: (callback: (progress: { stage: string; percent: number }) => void) => void
  }
  ffmpeg: {
    getVideoInfo: (filePath: string) => Promise<{
      duration: number
      width: number
      height: number
      codec: string
      fps: number
      bitrate: number
    }>
    exportChapter: (options: {
      inputPath: string
      outputPath: string
      startTime: number
      endTime: number
      fadeInType: 'none' | 'fade' | 'fade-white' | 'blur' | 'zoom'
      fadeInDuration: number
      fadeOutType: 'none' | 'fade' | 'fade-white' | 'blur' | 'zoom'
      fadeOutDuration: number
      titleCardBase64?: string
      titleCardDuration?: number
      useHardwareAcceleration: boolean
      width?: number
      height?: number
    }) => Promise<string>
    onProgress: (callback: (progress: { percent: number; timeProcessed: number }) => void) => void
  }
}

const electronAPI: ElectronAPI = {
  utils: {
    getFilePath: (file: File) => webUtils.getPathForFile(file)
  },
  dialog: {
    openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder')
  },
  vtt: {
    parse: (filePath) => ipcRenderer.invoke('vtt:parse', filePath)
  },
  keychain: {
    get: (service) => ipcRenderer.invoke('keychain:get', service),
    set: (service, key) => ipcRenderer.invoke('keychain:set', service, key),
    delete: (service) => ipcRenderer.invoke('keychain:delete', service)
  },
  llm: {
    detectChapters: (transcript, provider, model) => ipcRenderer.invoke('llm:detectChapters', transcript, provider, model),
    onProgress: (callback) => ipcRenderer.on('llm:progress', (_event, progress) => callback(progress))
  },
  ffmpeg: {
    getVideoInfo: (filePath) => ipcRenderer.invoke('ffmpeg:getVideoInfo', filePath),
    exportChapter: (options) => ipcRenderer.invoke('ffmpeg:exportChapter', options),
    onProgress: (callback) => ipcRenderer.on('ffmpeg:progress', (_event, progress) => callback(progress))
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
