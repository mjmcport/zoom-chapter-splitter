import { useCallback, useState } from 'react'
import { useAppStore } from '../../stores/appStore'

interface DropZoneProps {
  type: 'video' | 'transcript'
  accepted: boolean
  filename?: string
  duration?: number
  cueCount?: number
}

export function DropZone({ type, accepted, filename, duration, cueCount }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const {
    setVideoPath,
    setVttPath,
    setVideoInfo,
    setTranscript
  } = useAppStore()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const filePath = window.electronAPI.utils.getFilePath(file)

    if (type === 'video') {
      if (!file.name.match(/\.(mp4|mov|m4v|webm)$/i)) {
        alert('Please drop a video file (MP4, MOV, M4V, or WebM)')
        return
      }
      await loadVideo(filePath)
    } else {
      if (!file.name.match(/\.vtt$/i)) {
        alert('Please drop a VTT transcript file')
        return
      }
      await loadTranscript(filePath)
    }
  }, [type])

  const handleClick = useCallback(async () => {
    const filters = type === 'video'
      ? [{ name: 'Video Files', extensions: ['mp4', 'mov', 'm4v', 'webm'] }]
      : [{ name: 'VTT Files', extensions: ['vtt'] }]

    const filePath = await window.electronAPI.dialog.openFile(filters)
    if (!filePath) return

    if (type === 'video') {
      await loadVideo(filePath)
    } else {
      await loadTranscript(filePath)
    }
  }, [type])

  const loadVideo = async (filePath: string) => {
    try {
      const info = await window.electronAPI.ffmpeg.getVideoInfo(filePath)
      setVideoPath(filePath)
      setVideoInfo(info)
    } catch (err) {
      console.error('Failed to load video:', err)
      alert('Failed to load video file')
    }
  }

  const loadTranscript = async (filePath: string) => {
    try {
      const parsed = await window.electronAPI.vtt.parse(filePath)
      setVttPath(filePath)
      setTranscript(parsed)
    } catch (err) {
      console.error('Failed to parse VTT:', err)
      alert('Failed to parse transcript file')
    }
  }

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (accepted) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>
          {type === 'video' ? '🎬' : '📝'}
        </div>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{filename}</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {type === 'video' && duration !== undefined && (
            <span>Duration: {formatDuration(duration)}</span>
          )}
          {type === 'transcript' && cueCount !== undefined && (
            <span>{cueCount} captions</span>
          )}
        </div>
        <button
          className="btn btn-secondary"
          style={{ marginTop: '16px' }}
          onClick={handleClick}
        >
          Replace
        </button>
      </div>
    )
  }

  return (
    <div
      className={`dropzone ${isDragOver ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="dropzone-icon">
        {type === 'video' ? '🎬' : '📝'}
      </div>
      <div className="dropzone-title">
        {type === 'video' ? 'Drop Video File' : 'Drop VTT Transcript'}
      </div>
      <div className="dropzone-subtitle">
        {type === 'video'
          ? 'MP4, MOV, M4V, or WebM'
          : 'Zoom transcript (.vtt)'}
      </div>
    </div>
  )
}
