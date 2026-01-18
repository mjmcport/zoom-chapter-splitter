import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

export function getFfmpegPath(): string {
  // In development, use ffmpeg-static from node_modules
  // In production, use the bundled binary in resources
  
  if (app.isPackaged) {
    // Production: binary is in resources folder
    const resourcePath = join(process.resourcesPath, 'ffmpeg')
    if (existsSync(resourcePath)) {
      return resourcePath
    }
  }
  
  // Development: use ffmpeg-static
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ffmpegStatic = require('ffmpeg-static')
  return ffmpegStatic as string
}

export function getFfprobePath(): string {
  // ffprobe is typically in the same directory as ffmpeg
  const ffmpegPath = getFfmpegPath()
  const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1')
  
  if (existsSync(ffprobePath)) {
    return ffprobePath
  }
  
  // Fallback: try ffprobe-static or system ffprobe
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffprobeStatic = require('ffprobe-static')
    return ffprobeStatic.path
  } catch {
    return 'ffprobe' // Use system ffprobe
  }
}
