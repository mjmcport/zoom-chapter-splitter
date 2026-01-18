import { useRef, useEffect, useState, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { videoPath, chapters, selectedChapterId, setSelectedChapterId, setVideoElement } = useAppStore()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Register video element with store for cross-component seeking
  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef.current)
    }
    return () => setVideoElement(null)
  }, [setVideoElement])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }, [])

  const seek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(time, video.duration))
  }, [])

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seek(percent * duration)
  }, [duration, seek])

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const videoSrc = videoPath ? `media://${encodeURIComponent(videoPath)}` : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="video-player">
        <video
          ref={videoRef}
          src={videoSrc}
          onClick={togglePlayPause}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn btn-secondary btn-icon" onClick={togglePlayPause}>
          {isPlaying ? '⏸' : '▶️'}
        </button>

        <button className="btn btn-ghost btn-icon" onClick={() => seek(currentTime - 5)}>
          -5s
        </button>
        <button className="btn btn-ghost btn-icon" onClick={() => seek(currentTime + 5)}>
          +5s
        </button>

        <div
          className="timeline"
          style={{ flex: 1 }}
          onClick={handleTimelineClick}
        >
          <div
            className="timeline-progress"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className={`timeline-chapter ${selectedChapterId === chapter.id ? 'selected' : ''}`}
              style={{
                left: `${(chapter.startTime / duration) * 100}%`,
                width: `${((chapter.endTime - chapter.startTime) / duration) * 100}%`
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedChapterId(chapter.id)
                seek(chapter.startTime)
              }}
              title={chapter.title}
            />
          ))}
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text-secondary)', minWidth: '100px' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
