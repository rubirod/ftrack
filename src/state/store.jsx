import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as at from '../services/airtable.js'
import * as queue from '../services/queue.js'
import { getSettings, saveSettings, isConfigured, clearAll } from '../services/storage.js'
import { todayStr, nowTime } from '../lib/date.js'
import { DEFAULT_DISHES } from '../lib/defaults.js'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

let tmpId = 0
const nextTmp = () => `tmp_${++tmpId}`

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(getSettings)
  const [configured, setConfigured] = useState(() => isConfigured())
  const [date] = useState(todayStr())
  const [today, setToday] = useState([])
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [toast, setToast] = useState(null)
  const [sheet, setSheet] = useState(null) // null | 'settings' | 'photo' | 'addDish'
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
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
    async ({ dish, calories, protein, fat, carbs, source }) => {
      const entry = {
        dish,
        date: todayStr(),
        time: nowTime(),
        calories: Math.round(calories) || 0,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        carbs: Number(carbs) || 0,
        source,
      }
      const tmp = { ...entry, id: nextTmp(), pending: true }
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

  const removeEntry = useCallback(async (id) => {
    setToday((cur) => cur.filter((e) => e.id !== id))
    if (String(id).startsWith('tmp_')) return
    try {
      await at.deleteLog(id)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ---- использование сохранённого блюда ----
  const useDish = useCallback(
    async (dish) => {
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
  const addDish = useCallback(async (dish) => {
    try {
      const created = await at.createSaved({ ...dish, uses: 0 })
      setSaved((cur) => [...cur, created].sort((a, b) => b.uses - a.uses))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }, [])

  const removeDish = useCallback(async (id) => {
    setSaved((cur) => cur.filter((d) => d.id !== id))
    try {
      await at.deleteSaved(id)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ---- настройки ----
  const updateSettings = useCallback((s) => {
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

  const value = {
    settings, configured, date, today, saved, loading, online, toast, sheet,
    setSheet, showToast, refresh,
    addEntry, removeEntry, useDish, addDish, removeDish,
    updateSettings, wipe,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
