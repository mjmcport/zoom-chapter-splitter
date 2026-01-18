import { useAppStore } from '../../stores/appStore'
import { ChapterItem } from './ChapterItem'

const effectLabels: Record<string, string> = {
  'none': 'None',
  'fade': 'Fade (Black)',
  'fade-white': 'Fade (White)',
  'blur': 'Blur',
  'zoom': 'Zoom'
}

function EffectsSummary() {
  const { exportSettings } = useAppStore()
  const { fadeInType, fadeInDuration, fadeOutType, fadeOutDuration, titleCard } = exportSettings

  const introLabel = fadeInType === 'none' ? 'None' : `${effectLabels[fadeInType]} ${fadeInDuration}s`
  const outroLabel = fadeOutType === 'none' ? 'None' : `${effectLabels[fadeOutType]} ${fadeOutDuration}s`

  return (
    <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Effects:
        </span>
        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ opacity: 0.7 }}>▶</span> Intro: {introLabel}
        </span>
        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ opacity: 0.7 }}>◼</span> Outro: {outroLabel}
        </span>
        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ opacity: 0.7 }}>{titleCard.enabled ? '✓' : '✗'}</span>
          Title Card: {titleCard.enabled ? `${titleCard.duration}s` : 'Off'}
        </span>
      </div>
    </div>
  )
}

export function ChapterList() {
  const {
    chapters,
    transcript,
    llmSettings,
    isProcessing,
    processingProgress,
    setChapters,
    setIsProcessing,
    setProcessingProgress,
    addChapter
  } = useAppStore()

  const handleDetectChapters = async () => {
    if (!transcript) {
      alert('Please import a transcript file first')
      return
    }

    if (!llmSettings.hasOpenAiKey && !llmSettings.hasAnthropicKey) {
      alert('Please configure an API key in Settings first')
      return
    }

    const provider = llmSettings.provider
    const model = provider === 'openai' ? llmSettings.openaiModel : llmSettings.anthropicModel

    setIsProcessing(true)
    setProcessingProgress({ stage: 'Starting...', percent: 0 })

    try {
      window.electronAPI.llm.onProgress((progress) => {
        setProcessingProgress(progress)
      })

      const result = await window.electronAPI.llm.detectChapters(
        transcript.rawText,
        provider,
        model
      )

      const chaptersWithIds = result.chapters.map((ch, i) => ({
        ...ch,
        id: `chapter-${Date.now()}-${i}`
      }))

      setChapters(chaptersWithIds)
    } catch (err) {
      console.error('Chapter detection failed:', err)
      alert('Failed to detect chapters. Please check your API key and try again.')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(null)
    }
  }

  const handleAddChapter = () => {
    const lastChapter = chapters[chapters.length - 1]
    const startTime = lastChapter ? lastChapter.endTime : 0

    addChapter({
      id: `chapter-${Date.now()}`,
      title: 'New Chapter',
      startTime,
      endTime: startTime + 300,
      confidence: 1,
      summary: ''
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {chapters.length} Chapters
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleAddChapter}
          >
            + Add Chapter
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDetectChapters}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px' }} />
                Detecting...
              </>
            ) : (
              'Auto-Detect with AI'
            )}
          </button>
        </div>
      </div>

      {isProcessing && processingProgress && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px' }}>{processingProgress.stage}</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {Math.round(processingProgress.percent)}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${processingProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {chapters.length === 0 && !isProcessing ? (
        <div className="empty-state" style={{ padding: '40px' }}>
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No Chapters Yet</h3>
          <p className="empty-state-description">
            Click "Auto-Detect with AI" to analyze your transcript and suggest chapters,
            or add them manually.
          </p>
        </div>
      ) : (
        <>
          <EffectsSummary />
          <div className="chapter-list">
            {chapters.map((chapter, index) => (
              <ChapterItem key={chapter.id} chapter={chapter} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
