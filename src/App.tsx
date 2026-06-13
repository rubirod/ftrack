import { useState } from 'react'
import { useStore } from './state/store'
import Header from './components/Header'
import TabBar from './components/TabBar'
import BottomBar from './components/BottomBar'
import Toast from './components/Toast'
import TodayTab from './screens/TodayTab'
import SavedTab from './screens/SavedTab'
import HistoryTab from './screens/HistoryTab'
import SettingsSheet from './screens/SettingsSheet'
import PhotoSheet from './screens/PhotoSheet'
import AddDishSheet from './screens/AddDishSheet'
import type { TabKind } from './types'

export default function App() {
  const { configured, online, sheet, setSheet } = useStore()
  const [tab, setTab] = useState<TabKind>('today')
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  function onPhoto(file: File) {
    setPhotoFile(file)
    setSheet('photo')
  }
  function closePhoto() {
    setPhotoFile(null)
    setSheet(null)
  }

  return (
    <div className="app">
      {!online && <div className="offline-banner">Нет сети — записи отправятся позже</div>}
      <Header />
      <TabBar active={tab} onChange={setTab} />

      <main className="scroll">
        {tab === 'today' && <TodayTab />}
        {tab === 'saved' && (
          <SavedTab onAddDish={() => setSheet('addDish')} onPicked={() => setTab('today')} />
        )}
        {tab === 'history' && <HistoryTab />}
      </main>

      <BottomBar onPhoto={onPhoto} />
      <Toast />

      {/* Настройки: принудительно при старте, если не сконфигурировано */}
      {(sheet === 'settings' || !configured) && (
        <SettingsSheet onClose={() => setSheet(null)} forced={!configured} />
      )}
      {sheet === 'addDish' && configured && <AddDishSheet onClose={() => setSheet(null)} />}
      {sheet === 'photo' && photoFile && (
        <PhotoSheet
          file={photoFile}
          onClose={closePhoto}
          onAdded={() => {
            closePhoto()
            setTab('today')
          }}
        />
      )}
    </div>
  )
}
