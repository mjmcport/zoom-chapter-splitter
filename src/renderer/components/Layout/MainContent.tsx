import { useAppStore } from '../../stores/appStore'
import { DropZone } from '../Import/DropZone'
import { ChapterList } from '../Chapters/ChapterList'
import { TitleCardEditor } from '../TitleCard/TitleCardEditor'
import { ExportPanel } from '../Export/ExportPanel'
import { VideoPlayer } from '../VideoPlayer/VideoPlayer'

const viewTitles: Record<string, string> = {
  import: 'Import Files',
  chapters: 'Edit Chapters',
  titlecard: 'Title Card',
  export: 'Export Videos'
}

export function MainContent() {
  const { currentView, videoPath } = useAppStore()

  return (
    <main className="main-content">
      <header className="content-header">
        <h1>{viewTitles[currentView]}</h1>
      </header>

      <div className="content-body">
        {currentView === 'import' && <ImportView />}
        {currentView === 'chapters' && <ChaptersView />}
        {currentView === 'titlecard' && <TitleCardEditor />}
        {currentView === 'export' && <ExportPanel />}
      </div>
    </main>
  )
}

function ImportView() {
  const { videoPath, videoInfo, vttPath, transcript } = useAppStore()

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <DropZone
          type="video"
          accepted={videoPath !== null}
          filename={videoPath?.split('/').pop()}
          duration={videoInfo?.duration}
        />
        <DropZone
          type="transcript"
          accepted={vttPath !== null}
          filename={vttPath?.split('/').pop()}
          cueCount={transcript?.cues.length}
        />
      </div>

      {videoPath && <VideoPlayer />}
    </div>
  )
}

function ChaptersView() {
  const { videoPath, chapters } = useAppStore()

  if (!videoPath) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">📁</div>
        <h2 className="empty-state-title">No Video Imported</h2>
        <p className="empty-state-description">
          Import a video and transcript file first to start editing chapters.
        </p>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <VideoPlayer />
        <ChapterList />
      </div>
    </div>
  )
}
