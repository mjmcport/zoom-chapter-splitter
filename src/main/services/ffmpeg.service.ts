import ffmpeg from 'fluent-ffmpeg'
import { getFfmpegPath, getFfprobePath } from '../utils/ffmpeg-path'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

ffmpeg.setFfmpegPath(getFfmpegPath())
ffmpeg.setFfprobePath(getFfprobePath())

export interface VideoInfo {
  duration: number
  width: number
  height: number
  codec: string
  fps: number
  bitrate: number
}

export type EffectType = 'none' | 'fade' | 'fade-white' | 'blur' | 'zoom'

export interface ExportOptions {
  inputPath: string
  outputPath: string
  startTime: number
  endTime: number
  fadeInType: EffectType
  fadeInDuration: number
  fadeOutType: EffectType
  fadeOutDuration: number
  titleCardBase64?: string
  titleCardDuration?: number
  useHardwareAcceleration: boolean
  width?: number
  height?: number
}

type ProgressCallback = (progress: { percent: number; timeProcessed: number }) => void

export class FfmpegService {
  async getVideoInfo(filePath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: Error | null, metadata: any) => {
        if (err) {
          reject(err)
          return
        }
        
        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video')
        if (!videoStream) {
          reject(new Error('No video stream found'))
          return
        }
        
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 1920,
          height: videoStream.height || 1080,
          codec: videoStream.codec_name || 'unknown',
          fps: this.parseFps(videoStream.r_frame_rate),
          bitrate: parseInt(String(metadata.format.bit_rate)) || 8000000
        })
      })
    })
  }

  private parseFps(frameRate?: string): number {
    if (!frameRate) return 30
    const [num, den] = frameRate.split('/').map(Number)
    return den ? num / den : num
  }

  async exportChapter(
    options: ExportOptions,
    onProgress?: ProgressCallback
  ): Promise<string> {
    const duration = options.endTime - options.startTime
    let titleCardPath: string | null = null
    
    console.log('Export options received:', JSON.stringify({
      inputPath: options.inputPath,
      outputPath: options.outputPath,
      startTime: options.startTime,
      endTime: options.endTime,
      duration,
      fadeInType: options.fadeInType,
      fadeOutType: options.fadeOutType,
      hasTitleCard: !!options.titleCardBase64,
      titleCardDuration: options.titleCardDuration,
      width: options.width,
      height: options.height
    }, null, 2))
    
    try {
      if (options.titleCardBase64) {
        titleCardPath = await this.saveTitleCardFromBase64(options.titleCardBase64)
        console.log('Title card saved to:', titleCardPath)
      }
      
      return await this.runExport(options, duration, titleCardPath, onProgress)
    } finally {
      if (titleCardPath) {
        await unlink(titleCardPath).catch(() => {})
      }
    }
  }

  private async saveTitleCardFromBase64(base64Data: string): Promise<string> {
    const base64Image = base64Data.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Image, 'base64')
    const tempPath = join(tmpdir(), `title-card-${Date.now()}.png`)
    await writeFile(tempPath, buffer)
    return tempPath
  }

  private runExport(
    options: ExportOptions,
    duration: number,
    titleCardPath: string | null,
    onProgress?: ProgressCallback
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const videoFilters = this.buildVideoFilters(options, duration)
      const audioFilters = this.buildAudioFilters(options, duration)
      
      let command = ffmpeg()
      
      const titleCardDuration = options.titleCardDuration || 3
      const w = options.width || 1920
      const h = options.height || 1080
      
      console.log('Building FFmpeg command:', {
        titleCardPath,
        titleCardDuration,
        inputPath: options.inputPath,
        startTime: options.startTime,
        duration,
        width: w,
        height: h,
        videoFilters,
        audioFilters
      })

      if (titleCardPath) {
        const complexFilterArray = [
          `[0:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p,fade=t=in:st=0:d=0.5,fade=t=out:st=${titleCardDuration - 0.5}:d=0.5[title]`,
          `anullsrc=channel_layout=stereo:sample_rate=48000:duration=${titleCardDuration}[silence]`,
          `[1:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p${videoFilters !== 'null' ? ',' + videoFilters : ''}[main]`,
          `[1:a]${audioFilters}[mainaudio]`,
          `[title][silence][main][mainaudio]concat=n=2:v=1:a=1[outv][outa]`
        ]
        console.log('Complex filter:', complexFilterArray.join('; '))
        
        command = command
          .input(titleCardPath)
          .inputOptions(['-loop', '1', '-t', String(titleCardDuration)])
          .input(options.inputPath)
          .inputOptions(['-ss', String(options.startTime), '-t', String(duration)])
          .complexFilter(complexFilterArray)
          .outputOptions(['-map', '[outv]', '-map', '[outa]'])
      } else {
        command = command
          .input(options.inputPath)
          .inputOptions(['-ss', String(options.startTime), '-t', String(duration)])
          .videoFilters(videoFilters)
          .audioFilters(audioFilters)
      }
      
      const outputOptions = ['-c:a', 'aac', '-b:a', '192k']
      
      if (options.useHardwareAcceleration) {
        outputOptions.push('-c:v', 'h264_videotoolbox', '-b:v', '8M')
      } else {
        outputOptions.push('-c:v', 'libx264', '-crf', '23', '-preset', 'medium')
      }
      
      command
        .outputOptions(outputOptions)
        .output(options.outputPath)
        .on('start', (cmdLine: string) => {
          console.log('FFmpeg command:', cmdLine)
        })
        .on('progress', (progress: any) => {
          onProgress?.({
            percent: progress.percent || 0,
            timeProcessed: this.parseTimemark(progress.timemark)
          })
        })
        .on('end', () => resolve(options.outputPath))
        .on('error', (err: Error) => {
          console.error('FFmpeg error:', err.message)
          reject(err)
        })
        .run()
    })
  }

  private buildVideoFilters(options: ExportOptions, duration: number): string {
    const filters: string[] = []
    const d = options.fadeInDuration
    const outStart = duration - options.fadeOutDuration
    const outD = options.fadeOutDuration
    
    switch (options.fadeInType) {
      case 'fade':
        if (d > 0) filters.push(`fade=t=in:st=0:d=${d}`)
        break
      case 'fade-white':
        if (d > 0) filters.push(`fade=t=in:st=0:d=${d}:c=white`)
        break
      case 'blur':
        if (d > 0) filters.push(`boxblur=luma_radius='max(0,20-20*t/${d})':enable='lt(t,${d})'`)
        break
      case 'zoom':
        if (d > 0) filters.push(`zoompan=z='if(lt(on,${d}*25),1.5-0.5*on/(${d}*25),1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${options.width || 1920}x${options.height || 1080}`)
        break
    }
    
    switch (options.fadeOutType) {
      case 'fade':
        if (outD > 0) filters.push(`fade=t=out:st=${outStart}:d=${outD}`)
        break
      case 'fade-white':
        if (outD > 0) filters.push(`fade=t=out:st=${outStart}:d=${outD}:c=white`)
        break
      case 'blur':
        if (outD > 0) filters.push(`boxblur=luma_radius='max(0,20*(t-${outStart})/${outD})':enable='gte(t,${outStart})'`)
        break
      case 'zoom':
        if (outD > 0) filters.push(`zoompan=z='if(gte(on,${outStart}*25),1+0.5*(on-${outStart}*25)/(${outD}*25),1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${options.width || 1920}x${options.height || 1080}`)
        break
    }
    
    return filters.length > 0 ? filters.join(',') : 'null'
  }

  private buildAudioFilters(options: ExportOptions, duration: number): string {
    const filters: string[] = []
    
    if (options.fadeInType !== 'none' && options.fadeInDuration > 0) {
      filters.push(`afade=t=in:st=0:d=${options.fadeInDuration}`)
    }
    
    if (options.fadeOutType !== 'none' && options.fadeOutDuration > 0) {
      const fadeOutStart = duration - options.fadeOutDuration
      filters.push(`afade=t=out:st=${fadeOutStart}:d=${options.fadeOutDuration}`)
    }
    
    return filters.length > 0 ? filters.join(',') : 'anull'
  }

  private parseTimemark(timemark?: string): number {
    if (!timemark) return 0
    const parts = timemark.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }
}
