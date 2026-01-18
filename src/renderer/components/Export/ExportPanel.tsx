import { useState, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import type { Chapter } from '../../types'

interface ExportProgress {
  chapterId: string
  percent: number
  status: 'pending' | 'processing' | 'complete' | 'error'
  error?: string
}

function generateTitleCardBase64(
  text: string,
  config: {
    width: number
    height: number
    backgroundColor: string
    textColor: string
    fontSize: number
    fontFamily: string
  }
): string {
  const canvas = document.createElement('canvas')
  canvas.width = config.width
  canvas.height = config.height
  const ctx = canvas.getContext('2d')!
  
  ctx.fillStyle = config.backgroundColor
  ctx.fillRect(0, 0, config.width, config.height)
  
  ctx.fillStyle = config.textColor
  ctx.font = `bold ${config.fontSize}px ${config.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  const maxWidth = config.width * 0.8
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  
  const lineHeight = config.fontSize * 1.2
  const startY = config.height / 2 - ((lines.length - 1) * lineHeight) / 2
  
  lines.forEach((line, i) => {
    ctx.fillText(line, config.width / 2, startY + i * lineHeight)
  })
  
  return canvas.toDataURL('image/png')
}

export function ExportPanel() {
  const {
    videoPath,
    videoInfo,
    chapters,
    exportSettings,
    updateExportSettings
  } = useAppStore()

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress[]>([])

  const handleSelectFolder = useCallback(async () => {
    const folder = await window.electronAPI.dialog.selectFolder()
    if (folder) {
      updateExportSettings({ outputDirectory: folder })
    }
  }, [updateExportSettings])

  const exportChapters = useCallback(async (chaptersToExport: Chapter[]) => {
    if (!videoPath || !exportSettings.outputDirectory) {
      alert('Please select an output folder first')
      return
    }

    setIsExporting(true)
    setExportProgress(
      chaptersToExport.map((ch) => ({
        chapterId: ch.id,
        percent: 0,
        status: 'pending' as const
      }))
    )

    for (const chapter of chaptersToExport) {
      const chapterIndex = chapters.findIndex(c => c.id === chapter.id)
      
      setExportProgress((prev) =>
        prev.map((p) =>
          p.chapterId === chapter.id ? { ...p, status: 'processing' } : p
        )
      )

      const sanitizedTitle = chapter.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
      const filename = exportSettings.filenamePattern
        .replace('{index}', String(chapterIndex + 1).padStart(2, '0'))
        .replace('{title}', sanitizedTitle)

      const outputPath = `${exportSettings.outputDirectory}/${filename}.mp4`

      let titleCardBase64: string | undefined
      if (exportSettings.titleCard.enabled) {
        titleCardBase64 = generateTitleCardBase64(chapter.title, {
          width: videoInfo?.width || 1920,
          height: videoInfo?.height || 1080,
          backgroundColor: exportSettings.titleCard.backgroundColor,
          textColor: exportSettings.titleCard.textColor,
          fontSize: exportSettings.titleCard.fontSize,
          fontFamily: exportSettings.titleCard.fontFamily
        })
      }

      try {
        window.electronAPI.ffmpeg.onProgress((progress) => {
          setExportProgress((prev) =>
            prev.map((p) =>
              p.chapterId === chapter.id ? { ...p, percent: progress.percent } : p
            )
          )
        })

        await window.electronAPI.ffmpeg.exportChapter({
          inputPath: videoPath,
          outputPath,
          startTime: chapter.startTime,
          endTime: chapter.endTime,
          fadeInType: exportSettings.fadeInType,
          fadeInDuration: exportSettings.fadeInDuration,
          fadeOutType: exportSettings.fadeOutType,
          fadeOutDuration: exportSettings.fadeOutDuration,
          titleCardBase64,
          titleCardDuration: exportSettings.titleCard.enabled ? exportSettings.titleCard.duration : undefined,
          useHardwareAcceleration: exportSettings.useHardwareAcceleration,
          width: videoInfo?.width,
          height: videoInfo?.height
        })

        setExportProgress((prev) =>
          prev.map((p) =>
            p.chapterId === chapter.id ? { ...p, status: 'complete', percent: 100 } : p
          )
        )
      } catch (err) {
        console.error('Export failed:', err)
        setExportProgress((prev) =>
          prev.map((p) =>
            p.chapterId === chapter.id
              ? { ...p, status: 'error', error: String(err) }
              : p
          )
        )
      }
    }

    setIsExporting(false)
  }, [videoPath, videoInfo, chapters, exportSettings])

  const handleExportAll = useCallback(() => {
    console.log('Export All - chapters:', chapters.map(c => ({ id: c.id, title: c.title, startTime: c.startTime, endTime: c.endTime })))
    exportChapters(chapters)
  }, [chapters, exportChapters])

  const handleExportSingle = useCallback((chapter: Chapter) => {
    console.log('Export Single - chapter:', { id: chapter.id, title: chapter.title, startTime: chapter.startTime, endTime: chapter.endTime })
    exportChapters([chapter])
  }, [exportChapters])

  if (!videoPath || chapters.length === 0) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">📤</div>
        <h2 className="empty-state-title">Nothing to Export</h2>
        <p className="empty-state-description">
          {!videoPath
            ? 'Import a video file first.'
            : 'Create some chapters to export.'}
        </p>
      </div>
    )
  }

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const totalDuration = chapters.reduce(
    (sum, ch) => sum + (ch.endTime - ch.startTime),
    0
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Export Settings</h3>

        <div className="form-group">
          <label className="label">Output Folder</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input"
              value={exportSettings.outputDirectory}
              readOnly
              placeholder="Select output folder..."
            />
            <button className="btn btn-secondary" onClick={handleSelectFolder}>
              Browse
            </button>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="label">Intro Effect</label>
            <select
              className="input"
              value={exportSettings.fadeInType}
              onChange={(e) => updateExportSettings({ fadeInType: e.target.value as any })}
            >
              <option value="none">None</option>
              <option value="fade">Fade from Black</option>
              <option value="fade-white">Fade from White</option>
              <option value="blur">Blur (Focus Pull)</option>
              <option value="zoom">Zoom Out</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Intro Duration (s)</label>
            <input
              type="number"
              className="input"
              value={exportSettings.fadeInDuration}
              onChange={(e) => updateExportSettings({ fadeInDuration: Number(e.target.value) })}
              min={0}
              max={5}
              step={0.5}
              disabled={exportSettings.fadeInType === 'none'}
            />
          </div>
        </div>

        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="label">Outro Effect</label>
            <select
              className="input"
              value={exportSettings.fadeOutType}
              onChange={(e) => updateExportSettings({ fadeOutType: e.target.value as any })}
            >
              <option value="none">None</option>
              <option value="fade">Fade to Black</option>
              <option value="fade-white">Fade to White</option>
              <option value="blur">Blur (Focus Pull)</option>
              <option value="zoom">Zoom In</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Outro Duration (s)</label>
            <input
              type="number"
              className="input"
              value={exportSettings.fadeOutDuration}
              onChange={(e) => updateExportSettings({ fadeOutDuration: Number(e.target.value) })}
              min={0}
              max={5}
              step={0.5}
              disabled={exportSettings.fadeOutType === 'none'}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="label">Filename Pattern</label>
          <input
            type="text"
            className="input"
            value={exportSettings.filenamePattern}
            onChange={(e) => updateExportSettings({ filenamePattern: e.target.value })}
            placeholder="{index}_{title}"
          />
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Use {'{index}'} for chapter number and {'{title}'} for chapter title
          </span>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Use Hardware Acceleration</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={exportSettings.useHardwareAcceleration}
                onChange={(e) =>
                  updateExportSettings({ useHardwareAcceleration: e.target.checked })
                }
              />
              <span className="switch-slider" />
            </label>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            Uses macOS VideoToolbox for faster encoding
          </span>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3>Export Summary</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              {chapters.length} chapters, {formatDuration(totalDuration)} total
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportAll}
            disabled={isExporting || !exportSettings.outputDirectory}
            style={{ minWidth: '140px' }}
          >
            {isExporting ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px' }} />
                Exporting...
              </>
            ) : (
              'Export All'
            )}
          </button>
        </div>

        <div className="chapter-list">
          {chapters.map((chapter, index) => {
            const progress = exportProgress.find((p) => p.chapterId === chapter.id)
            
            return (
              <div
                key={chapter.id}
                className="chapter-item"
                style={{ cursor: 'default' }}
              >
                <div className="chapter-index">
                  {progress?.status === 'complete' && '✓'}
                  {progress?.status === 'error' && '✗'}
                  {progress?.status === 'processing' && (
                    <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  )}
                  {(!progress || progress.status === 'pending') && index + 1}
                </div>
                <div className="chapter-info" style={{ flex: 1 }}>
                  <div className="chapter-title">{chapter.title}</div>
                  <div className="chapter-time">
                    {formatDuration(chapter.endTime - chapter.startTime)}
                  </div>
                  {progress?.status === 'processing' && (
                    <div className="progress-bar" style={{ marginTop: '8px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  )}
                  {progress?.status === 'error' && (
                    <div style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>
                      Export failed
                    </div>
                  )}
                </div>
                <div className="chapter-actions">
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => handleExportSingle(chapter)}
                    disabled={isExporting || !exportSettings.outputDirectory}
                    title="Export this chapter"
                  >
                    {progress?.status === 'processing' ? (
                      <span className="spinner" style={{ width: '12px', height: '12px' }} />
                    ) : progress?.status === 'complete' ? (
                      '✓'
                    ) : (
                      'Export'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
