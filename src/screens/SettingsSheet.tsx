import { useState, type ChangeEvent } from 'react'
import { useStore } from '../state/store'
import Sheet from '../components/Sheet'
import type { Settings } from '../types'

export default function SettingsSheet({
  onClose,
  forced,
}: {
  onClose: () => void
  forced: boolean
}) {
  const { settings, updateSettings, wipe, showToast } = useStore()
  const [f, setF] = useState<Settings>(settings)
  const set =
    (k: keyof Settings) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setF({ ...f, [k]: e.target.value })

  function save() {
    updateSettings({ ...f, calorieTarget: Number(f.calorieTarget) || 2000 })
    showToast('Сохранено')
    onClose()
  }

  function doWipe() {
    if (confirm('Очистить ключи и настройки на этом устройстве? Данные в Airtable не тронутся.')) {
      wipe()
      onClose()
    }
  }

  return (
    <Sheet onClose={onClose} dismissable={!forced}>
      <h2>Настройки</h2>
      {forced && (
        <p className="hint">
          Введи ключи Airtable, чтобы начать. ANTHROPIC_API_KEY нужен только для анализа фото.
        </p>
      )}

      <div className="field">
        <label>ANTHROPIC_API_KEY (фото)</label>
        <input value={f.anthropicKey} onChange={set('anthropicKey')} placeholder="sk-ant-..." />
      </div>
      <div className="field">
        <label>AIRTABLE_TOKEN</label>
        <input value={f.airtableToken} onChange={set('airtableToken')} placeholder="pat..." />
      </div>
      <div className="field">
        <label>ID базы Airtable</label>
        <input value={f.baseId} onChange={set('baseId')} placeholder="app..." />
      </div>
      <div className="field">
        <label>ID таблицы «Лог питания»</label>
        <input value={f.logTableId} onChange={set('logTableId')} placeholder="tbl..." />
      </div>
      <div className="field">
        <label>ID таблицы «Сохранённые блюда»</label>
        <input value={f.savedTableId} onChange={set('savedTableId')} placeholder="tbl..." />
      </div>
      <div className="field">
        <label>Дневная норма, ккал</label>
        <input
          type="number"
          inputMode="numeric"
          value={f.calorieTarget}
          onChange={set('calorieTarget')}
        />
      </div>
      <p className="hint">
        Токен Airtable должен иметь доступ к указанной базе (data.records: read + write).
      </p>

      <button className="btn primary" onClick={save}>
        Сохранить
      </button>
      <button className="btn danger" onClick={doWipe}>
        Очистить данные
      </button>
    </Sheet>
  )
}
