import { useAppStore } from '../../stores/appStore'
import type { AppView } from '../../types'

interface SidebarProps {
  onSettingsClick: () => void
}

const navItems: { id: AppView; label: string; icon: string }[] = [
  { id: 'import', label: 'Import', icon: '📁' },
  { id: 'chapters', label: 'Chapters', icon: '📋' },
  { id: 'titlecard', label: 'Title Card', icon: '🎨' },
  { id: 'export', label: 'Export', icon: '📤' }
]

export function Sidebar({ onSettingsClick }: SidebarProps) {
  const { currentView, setCurrentView, chapters, videoPath } = useAppStore()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">ZOOM SPLITTER</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
            disabled={!videoPath && item.id !== 'import'}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'chapters' && chapters.length > 0 && (
              <span className="nav-item-badge">{chapters.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={onSettingsClick}>
          <span className="nav-item-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
