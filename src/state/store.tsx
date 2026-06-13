import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import * as at from '../services/airtable'
import * as queue from '../services/queue'
import { getSettings, saveSettings, isConfigured, clearAll } from '../services/storage'
import { todayStr, nowTime } from '../lib/date'
import { DEFAULT_DISHES } from '../lib/defaults'
import type {
  Settings,
  LogEntry,
  SavedDish,
  DishInput,
  AddEntryInput,
  SheetKind,
} from '../types'

interface Store {
  settings: Settings
  configured: boolean
  date: string
  today: LogEntry[]
  saved: SavedDish[]
  loading: boolean
  online: boolean
  toast: string | null
  sheet: SheetKind
  setSheet: (s: SheetKind) => void
  showToast: (msg: string) => void
  refresh: () => Promise<void>
  addEntry: (input: AddEntryInput) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  useDish: (dish: SavedDish) => Promise<void>
  addDish: (dish: DishInput) => Promise<boolean>
  removeDish: (id: string) => Promise<void>
  updateSettings: (s: Settings) => void
  wipe: () => void
}

const StoreCtx = createContext<Store | null>(null)

export function useStore(): Store {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore вне StoreProvider')
  return ctx
}

let tmpId = 0
const nextTmp = () => `tmp_${++tmpId}`

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(getSettings)
  const [configured, setConfigured] = useState<boolean>(() => isConfigured())
  const [date] = useState<string>(todayStr())
  const [today, setToday] = useState<LogEntry[]>([])
  const [saved, setSaved] = useState<SavedDish[]>([])
  const [loading, setLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [toast, setToast] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetKind>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }, [])

  // ---- начальная загрузка ----
  const refresh = useCallback(async () => {
    if (!isConfigured()) return
    setLoading(true)
    try {
      let dishes = await at.listSaved()
      // Предзаполнение дефолтов, если таблица пуста.
      if (dishes.length === 0) {
        await Promise.all(DEFAULT_DISHES.map((d) => at.createSaved(d)))
        dishes = await at.listSaved()
      }
      setSaved(dishes)
      const log = await at.listLogByDate(todayStr())
      setToday(log)
    } catch (e) {
      showToast('Ошибка загрузки')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (configured) refresh()
  }, [configured, refresh])

  // ---- сеть / офлайн-очередь ----
  useEffect(() => {
    const goOnline = async () => {
      setOnline(true)
      const sent = await queue.flush().catch(() => 0)
      if (sent > 0) {
        showToast(`Досланы записи: ${sent}`)
        refresh()
      }
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [showToast, refresh])

  // ---- добавление записи в лог (оптимистично) ----
  const addEntry = useCallback(
    async ({ dish, calories, protein, fat, carbs, source }: AddEntryInput) => {
      const entry = {
        dish,
        date: todayStr(),
        time: nowTime(),
        calories: Math.round(Number(calories)) || 0,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        carbs: Number(carbs) || 0,
        source,
      }
      const tmp: LogEntry = { ...entry, id: nextTmp(), pending: true }
      setToday((cur) => [...cur, tmp])
      showToast(`+${entry.calories} ккал`)

      try {
        const created = await at.createLog(entry)
        setToday((cur) => cur.map((e) => (e.id === tmp.id ? created : e)))
      } catch (e) {
        // нет сети — в очередь, запись остаётся помеченной как pending
        queue.enqueue(entry)
        console.warn('Запись в очереди офлайн', e)
      }
    },
    [showToast],
  )

  const removeEntry = useCallback(async (id: string) => {
    setToday((cur) => cur.filter((e) => e.id !== id))
    if (id.startsWith('tmp_')) return
    try {
      await at.deleteLog(id)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ---- использование сохранённого блюда ----
  const useDish = useCallback(
    async (dish: SavedDish) => {
      await addEntry({
        dish: dish.name,
        calories: dish.calories,
        protein: dish.protein,
        fat: dish.fat,
        carbs: dish.carbs,
        source: 'сохранённое',
      })
      // инкремент счётчика — фоном, оптимистично
      setSaved((cur) =>
        [...cur.map((d) => (d.id === dish.id ? { ...d, uses: d.uses + 1 } : d))].sort(
          (a, b) => b.uses - a.uses,
        ),
      )
      at.incrementSavedUses(dish.id, dish.uses).catch((e) => console.error(e))
    },
    [addEntry],
  )

  // ---- сохранённые блюда ----
  const addDish = useCallback(async (dish: DishInput): Promise<boolean> => {
    try {
      const created = await at.createSaved({ ...dish, uses: 0 })
      setSaved((cur) => [...cur, created].sort((a, b) => b.uses - a.uses))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }, [])

  const removeDish = useCallback(async (id: string) => {
    setSaved((cur) => cur.filter((d) => d.id !== id))
    try {
      await at.deleteSaved(id)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ---- настройки ----
  const updateSettings = useCallback((s: Settings) => {
    saveSettings(s)
    setSettings(getSettings())
    setConfigured(isConfigured())
  }, [])

  const wipe = useCallback(() => {
    clearAll()
    setSettings(getSettings())
    setConfigured(false)
    setSaved([])
    setToday([])
  }, [])

  const value: Store = {
    settings, configured, date, today, saved, loading, online, toast, sheet,
    setSheet, showToast, refresh,
    addEntry, removeEntry, useDish, addDish, removeDish,
    updateSettings, wipe,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
