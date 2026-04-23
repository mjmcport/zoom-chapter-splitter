import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

export function getFfmpegPath(): string {
  // In production, use the bundled binary in resources folder
  if (app.isPackaged) {
    const resourcePath = join(process.resourcesPath, 'ffmpeg')
    if (existsSync(resourcePath)) {
      return resourcePath
    }
  }

  // Development: use ffmpeg-ffprobe-static from node_modules
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ffmpegStatic = require('ffmpeg-ffprobe-static')
  return ffmpegStatic.ffmpegPath
}

export function getFfprobePath(): string {
  // In production, use the bundled binary in resources folder
  if (app.isPackaged) {
    const resourcePath = join(process.resourcesPath, 'ffprobe')
    if (existsSync(resourcePath)) {
      return resourcePath
    }
  }

  // Development: use ffmpeg-ffprobe-static from node_modules
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ffmpegStatic = require('ffmpeg-ffprobe-static')
  return ffmpegStatic.ffprobePath
}
