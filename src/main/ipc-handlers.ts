import { ipcMain, dialog, BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { VttParserService } from './services/vtt-parser.service'
import { KeychainService } from './services/keychain.service'
import { LlmService } from './services/llm.service'
import { FfmpegService, ExportOptions } from './services/ffmpeg.service'
import { readFile, writeFile } from 'fs/promises'

const vttParser = new VttParserService()
const keychainService = new KeychainService()
const llmService = new LlmService(keychainService)
const ffmpegService = new FfmpegService()

export function registerIpcHandlers(): void {
  ipcMain.handle('dialog:openFile', async (_: IpcMainInvokeEvent, filters: { name: string; extensions: string[] }[]) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:showSaveDialog', async (_: IpcMainInvokeEvent, filters: { name: string; extensions: string[] }[]) => {
    const result = await dialog.showSaveDialog({
      filters
    })
    if (result.canceled) return null
    return result.filePath
  })

  ipcMain.handle('fs:readFile', async (_: IpcMainInvokeEvent, filePath: string) => {
    return readFile(filePath, 'utf-8')
  })

  ipcMain.handle('fs:writeFile', async (_: IpcMainInvokeEvent, filePath: string, content: string) => {
    return writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('vtt:parse', async (_: IpcMainInvokeEvent, filePath: string) => {
    const content = await readFile(filePath, 'utf-8')
    return vttParser.parse(content)
  })

  ipcMain.handle('keychain:get', async (_: IpcMainInvokeEvent, service: string) => {
    return keychainService.getKey(service)
  })

  ipcMain.handle('keychain:set', async (_: IpcMainInvokeEvent, service: string, key: string) => {
    return keychainService.setKey(service, key)
  })

  ipcMain.handle('keychain:delete', async (_: IpcMainInvokeEvent, service: string) => {
    return keychainService.deleteKey(service)
  })

  ipcMain.handle('llm:detectChapters', async (event: IpcMainInvokeEvent, transcript: string, provider: 'openai' | 'anthropic', model: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return llmService.detectChapters(transcript, provider, model, (progress: { stage: string; percent: number }) => {
      window?.webContents.send('llm:progress', progress)
    })
  })

  ipcMain.handle('ffmpeg:getVideoInfo', async (_: IpcMainInvokeEvent, filePath: string) => {
    return ffmpegService.getVideoInfo(filePath)
  })

  ipcMain.handle('ffmpeg:exportChapter', async (event: IpcMainInvokeEvent, options: ExportOptions) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return ffmpegService.exportChapter(options, (progress: { percent: number; timeProcessed: number }) => {
      window?.webContents.send('ffmpeg:progress', progress)
    })
  })
}
