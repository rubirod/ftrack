import { useState } from 'react'
import { useStore } from './state/store.jsx'
import Header from './components/Header.jsx'
import TabBar from './components/TabBar.jsx'
import BottomBar from './components/BottomBar.jsx'
import Toast from './components/Toast.jsx'
import TodayTab from './screens/TodayTab.jsx'
import SavedTab from './screens/SavedTab.jsx'
import HistoryTab from './screens/HistoryTab.jsx'
import SettingsSheet from './screens/SettingsSheet.jsx'
import PhotoSheet from './screens/PhotoSheet.jsx'
import AddDishSheet from './screens/AddDishSheet.jsx'

export default function App() {
  const { configured, online, sheet, setSheet } = useStore()
  const [tab, setTab] = useState('today')
  const [photoFile, setPhotoFile] = useState(null)

  function onPhoto(file) {
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
