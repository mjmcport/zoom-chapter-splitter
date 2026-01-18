import { useAppStore } from '../../stores/appStore'

export function TitleCardEditor() {
  const { exportSettings, updateExportSettings, videoPath } = useAppStore()
  const { titleCard } = exportSettings

  if (!videoPath) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">🎨</div>
        <h2 className="empty-state-title">No Video Imported</h2>
        <p className="empty-state-description">
          Import a video file first to configure title cards.
        </p>
      </div>
    )
  }

  const updateTitleCard = (updates: Partial<typeof titleCard>) => {
    updateExportSettings({
      titleCard: { ...titleCard, ...updates }
    })
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Title Card Settings</h3>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Enable Title Cards</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={titleCard.enabled}
                onChange={(e) => updateTitleCard({ enabled: e.target.checked })}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Duration (seconds)</label>
          <input
            type="number"
            className="input"
            value={titleCard.duration}
            onChange={(e) => updateTitleCard({ duration: Number(e.target.value) })}
            min={1}
            max={10}
            disabled={!titleCard.enabled}
          />
        </div>

        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="label">Background Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={titleCard.backgroundColor}
                onChange={(e) => updateTitleCard({ backgroundColor: e.target.value })}
                style={{ width: '48px', height: '38px', padding: '4px', cursor: 'pointer' }}
                disabled={!titleCard.enabled}
              />
              <input
                type="text"
                className="input"
                value={titleCard.backgroundColor}
                onChange={(e) => updateTitleCard({ backgroundColor: e.target.value })}
                disabled={!titleCard.enabled}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Text Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                value={titleCard.textColor}
                onChange={(e) => updateTitleCard({ textColor: e.target.value })}
                style={{ width: '48px', height: '38px', padding: '4px', cursor: 'pointer' }}
                disabled={!titleCard.enabled}
              />
              <input
                type="text"
                className="input"
                value={titleCard.textColor}
                onChange={(e) => updateTitleCard({ textColor: e.target.value })}
                disabled={!titleCard.enabled}
              />
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="label">Font Size</label>
          <input
            type="range"
            min={32}
            max={120}
            value={titleCard.fontSize}
            onChange={(e) => updateTitleCard({ fontSize: Number(e.target.value) })}
            style={{ width: '100%' }}
            disabled={!titleCard.enabled}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            <span>32px</span>
            <span>{titleCard.fontSize}px</span>
            <span>120px</span>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="label">Font Family</label>
          <select
            className="input"
            value={titleCard.fontFamily}
            onChange={(e) => updateTitleCard({ fontFamily: e.target.value })}
            disabled={!titleCard.enabled}
          >
            <option value="SF Pro Display, -apple-system, sans-serif">SF Pro Display (System)</option>
            <option value="Helvetica Neue, Helvetica, sans-serif">Helvetica Neue</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Menlo, monospace">Menlo (Monospace)</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '20px' }}>Preview</h3>
        <div
          style={{
            flex: 1,
            minHeight: '300px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: titleCard.enabled ? titleCard.backgroundColor : '#1a1a24',
            color: titleCard.enabled ? titleCard.textColor : '#666',
            fontSize: titleCard.enabled ? `${titleCard.fontSize * 0.5}px` : '24px',
            fontFamily: titleCard.fontFamily,
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '20px',
            transition: 'all var(--transition-normal)'
          }}
        >
          {titleCard.enabled ? 'Chapter Title' : 'Title Cards Disabled'}
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
          Each chapter will display its title for {titleCard.duration} seconds
        </p>
      </div>
    </div>
  )
}
