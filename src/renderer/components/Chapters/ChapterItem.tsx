import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import type { Chapter } from '../../types'

interface ChapterItemProps {
  chapter: Chapter
  index: number
}

export function ChapterItem({ chapter, index }: ChapterItemProps) {
  const { selectedChapterId, setSelectedChapterId, updateChapter, removeChapter, seekTo } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chapter.title)
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')

  const isSelected = selectedChapterId === chapter.id

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const parseTime = (timeStr: string): number | null => {
    const parts = timeStr.split(':').map(Number)
    if (parts.some(isNaN)) return null
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 1) return parts[0]
    return null
  }

  useEffect(() => {
    setEditStartTime(formatTime(chapter.startTime))
    setEditEndTime(formatTime(chapter.endTime))
  }, [chapter.startTime, chapter.endTime])

  const adjustTime = (field: 'startTime' | 'endTime', delta: number) => {
    const newValue = Math.max(0, chapter[field] + delta)
    updateChapter(chapter.id, { [field]: newValue })
  }

  const handleTitleSave = () => {
    updateChapter(chapter.id, { title: editTitle })
    setIsEditing(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(chapter.title)
      setIsEditing(false)
    }
  }

  const handleTimeBlur = (field: 'startTime' | 'endTime') => {
    const timeStr = field === 'startTime' ? editStartTime : editEndTime
    const parsed = parseTime(timeStr)
    if (parsed !== null && parsed >= 0) {
      updateChapter(chapter.id, { [field]: parsed })
    } else {
      if (field === 'startTime') setEditStartTime(formatTime(chapter.startTime))
      else setEditEndTime(formatTime(chapter.endTime))
    }
  }

  const handleTimeKeyDown = (e: React.KeyboardEvent, field: 'startTime' | 'endTime') => {
    if (e.key === 'Enter') {
      handleTimeBlur(field)
      ;(e.target as HTMLInputElement).blur()
    } else if (e.key === 'Escape') {
      if (field === 'startTime') setEditStartTime(formatTime(chapter.startTime))
      else setEditEndTime(formatTime(chapter.endTime))
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div
      className={`chapter-item ${isSelected ? 'selected' : ''}`}
      onClick={() => setSelectedChapterId(chapter.id)}
    >
      <div className="chapter-index">{index + 1}</div>

      <div className="chapter-info">
        {isEditing ? (
          <input
            className="input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="chapter-title"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit"
          >
            {chapter.title}
          </div>
        )}

        <div className="chapter-time">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              onClick={(e) => { e.stopPropagation(); adjustTime('startTime', -5) }}
            >
              -5s
            </button>
            <input
              className="input"
              style={{ width: '85px', padding: '4px 6px', fontSize: '12px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              onBlur={() => handleTimeBlur('startTime')}
              onKeyDown={(e) => handleTimeKeyDown(e, 'startTime')}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="btn btn-ghost"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              onClick={(e) => { e.stopPropagation(); adjustTime('startTime', 5) }}
            >
              +5s
            </button>
          </span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>→</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              onClick={(e) => { e.stopPropagation(); adjustTime('endTime', -5) }}
            >
              -5s
            </button>
            <input
              className="input"
              style={{ width: '85px', padding: '4px 6px', fontSize: '12px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              onBlur={() => handleTimeBlur('endTime')}
              onKeyDown={(e) => handleTimeKeyDown(e, 'endTime')}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="btn btn-ghost"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              onClick={(e) => { e.stopPropagation(); adjustTime('endTime', 5) }}
            >
              +5s
            </button>
          </span>
        </div>
      </div>

      <div className="chapter-actions">
        <button
          className="btn btn-ghost btn-icon"
          onClick={(e) => {
            e.stopPropagation()
            seekTo(chapter.startTime)
          }}
          title="Preview chapter"
        >
          ▶️
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          title="Edit title"
        >
          ✏️
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Delete this chapter?')) {
              removeChapter(chapter.id)
            }
          }}
          title="Delete chapter"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
