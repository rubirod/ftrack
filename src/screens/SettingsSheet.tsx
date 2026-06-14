import { useState, type ChangeEvent } from 'react'
import { useStore } from '../state/store'
import { listBases, listTables, guessTable } from '../services/airtableMeta'
import Sheet from '../components/Sheet'
import type { Settings, BaseInfo, TableInfo } from '../types'

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

  // Состояние автоподтягивания через Metadata API.
  const [bases, setBases] = useState<BaseInfo[] | null>(null)
  const [tables, setTables] = useState<TableInfo[] | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [metaErr, setMetaErr] = useState('')
  const [manual, setManual] = useState(false)

  // Шаг 1: по токену тянем список баз.
  async function connect() {
    if (!f.airtableToken.trim()) {
      showToast('Введи токен')
      return
    }
    setConnecting(true)
    setMetaErr('')
    try {
      const list = await listBases(f.airtableToken.trim())
      setBases(list)
      if (list.length === 0) setMetaErr('Токену не доступна ни одна база.')
      // Если база уже выбрана ранее — сразу тянем её таблицы.
      if (f.baseId && list.some((b) => b.id === f.baseId)) {
        await loadTables(f.baseId)
      }
    } catch (e) {
      console.error(e)
      setMetaErr(
        'Не удалось получить список баз. Добавь токену право schema.bases:read или введи ID вручную.',
      )
      setManual(true)
    } finally {
      setConnecting(false)
    }
  }

  // Шаг 2: по выбранной базе тянем таблицы и угадываем нужные две.
  async function loadTables(baseId: string) {
    setTables(null)
    try {
      const list = await listTables(f.airtableToken.trim(), baseId)
      setTables(list)
      const log = f.logTableId || guessTable(list, ['лог пит', 'лог', 'питан', 'log'])
      const saved = f.savedTableId || guessTable(list, ['сохран', 'блюд', 'saved', 'dish'])
      setF((cur) => ({ ...cur, baseId, logTableId: log, savedTableId: saved }))
    } catch (e) {
      console.error(e)
      setMetaErr('Не удалось получить таблицы базы.')
    }
  }

  function onBaseChange(e: ChangeEvent<HTMLSelectElement>) {
    const baseId = e.target.value
    setF({ ...f, baseId })
    if (baseId) loadTables(baseId)
  }

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
          Вставь токен Airtable и нажми «Подключиться» — базу и таблицы подтянем сами.
          ANTHROPIC_API_KEY нужен только для анализа фото.
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

      <button className="btn ghost" onClick={connect} disabled={connecting} style={{ marginTop: 0 }}>
        {connecting ? 'Подключаюсь…' : 'Подключиться'}
      </button>

      {metaErr && <div className="err-text" style={{ marginTop: 10 }}>{metaErr}</div>}

      {/* Выбор базы из подтянутого списка */}
      {bases && bases.length > 0 && (
        <div className="field" style={{ marginTop: 12 }}>
          <label>База</label>
          <select className="select" value={f.baseId} onChange={onBaseChange}>
            <option value="">— выбери базу —</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Выбор двух таблиц (предзаполнены автоугадыванием) */}
      {tables && tables.length > 0 && (
        <>
          <div className="field">
            <label>Таблица «Лог питания»</label>
            <select
              className="select"
              value={f.logTableId}
              onChange={(e) => setF({ ...f, logTableId: e.target.value })}
            >
              <option value="">— выбери таблицу —</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Таблица «Сохранённые блюда»</label>
            <select
              className="select"
              value={f.savedTableId}
              onChange={(e) => setF({ ...f, savedTableId: e.target.value })}
            >
              <option value="">— выбери таблицу —</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Фолбэк: ручной ввод ID, если автоподтягивание недоступно */}
      <button
        className="link-btn"
        onClick={() => setManual((m) => !m)}
        type="button"
      >
        {manual ? 'Скрыть ручной ввод ID' : 'Ввести ID вручную'}
      </button>

      {manual && (
        <>
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
        </>
      )}

      <div className="field" style={{ marginTop: 12 }}>
        <label>Дневная норма, ккал</label>
        <input
          type="number"
          inputMode="numeric"
          value={f.calorieTarget}
          onChange={set('calorieTarget')}
        />
      </div>
      <p className="hint">
        Токен Airtable: права data.records (read + write) и schema.bases:read для списка баз.
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
