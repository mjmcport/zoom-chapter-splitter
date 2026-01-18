import { useState } from 'react'
import { useAppStore } from './stores/appStore'
import { Sidebar } from './components/Layout/Sidebar'
import { MainContent } from './components/Layout/MainContent'
import { SettingsModal } from './components/Settings/SettingsModal'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="app">
      <Sidebar onSettingsClick={() => setShowSettings(true)} />
      <MainContent />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
