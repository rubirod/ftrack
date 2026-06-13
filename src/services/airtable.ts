import { getSettings, getBaseId } from './storage'
import type { LogEntry, NewLogEntry, SavedDish, DishInput } from '../types'

const API = 'https://api.airtable.com/v0'

// Имена полей в Airtable (кириллица).
export const LOG = {
  dish: 'Блюдо',
  date: 'Дата',
  time: 'Время',
  kcal: 'Ккал',
  protein: 'Белки',
  fat: 'Жиры',
  carbs: 'Углеводы',
  source: 'Источник',
} as const
export const SAVED = {
  name: 'Название',
  emoji: 'Эмодзи',
  kcal: 'Ккал',
  protein: 'Белки',
  fat: 'Жиры',
  carbs: 'Углеводы',
  uses: 'Использований',
} as const

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}
interface AirtableList {
  records: AirtableRecord[]
}

function headers(): Record<string, string> {
  const { airtableToken } = getSettings()
  return {
    Authorization: `Bearer ${airtableToken}`,
    'Content-Type': 'application/json',
  }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/${getBaseId()}/${path}`, {
    ...options,
    headers: headers(),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Airtable ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

// ---- маппинг записей в плоские объекты ----
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

function mapLog(r: AirtableRecord): LogEntry {
  const f = r.fields
  return {
    id: r.id,
    dish: str(f[LOG.dish]),
    date: str(f[LOG.date]),
    time: str(f[LOG.time]),
    calories: num(f[LOG.kcal]),
    protein: num(f[LOG.protein]),
    fat: num(f[LOG.fat]),
    carbs: num(f[LOG.carbs]),
    source: str(f[LOG.source]),
  }
}
function mapSaved(r: AirtableRecord): SavedDish {
  const f = r.fields
  return {
    id: r.id,
    name: str(f[SAVED.name]),
    emoji: str(f[SAVED.emoji]) || '🍽️',
    calories: num(f[SAVED.kcal]),
    protein: num(f[SAVED.protein]),
    fat: num(f[SAVED.fat]),
    carbs: num(f[SAVED.carbs]),
    uses: num(f[SAVED.uses]),
  }
}

// ---- Сохранённые блюда ----
export async function listSaved(): Promise<SavedDish[]> {
  const { savedTableId } = getSettings()
  const q = `sort%5B0%5D%5Bfield%5D=${encodeURIComponent(SAVED.uses)}&sort%5B0%5D%5Bdirection%5D=desc`
  const data = await req<AirtableList>(`${savedTableId}?${q}`)
  return data.records.map(mapSaved)
}

export async function createSaved(dish: DishInput): Promise<SavedDish> {
  const { savedTableId } = getSettings()
  const data = await req<AirtableRecord>(savedTableId, {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        [SAVED.name]: dish.name,
        [SAVED.emoji]: dish.emoji || '🍽️',
        [SAVED.kcal]: dish.calories,
        [SAVED.protein]: dish.protein,
        [SAVED.fat]: dish.fat,
        [SAVED.carbs]: dish.carbs,
        [SAVED.uses]: dish.uses || 0,
      },
    }),
  })
  return mapSaved(data)
}

export async function incrementSavedUses(id: string, current: number): Promise<void> {
  const { savedTableId } = getSettings()
  await req(`${savedTableId}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { [SAVED.uses]: (current || 0) + 1 } }),
  })
}

export async function deleteSaved(id: string): Promise<void> {
  const { savedTableId } = getSettings()
  await req(`${savedTableId}/${id}`, { method: 'DELETE' })
}

// ---- Лог питания ----
export async function listLogByDate(date: string): Promise<LogEntry[]> {
  const { logTableId } = getSettings()
  const formula = encodeURIComponent(`{${LOG.date}}="${date}"`)
  const q = `filterByFormula=${formula}&sort%5B0%5D%5Bfield%5D=${encodeURIComponent(LOG.time)}`
  const data = await req<AirtableList>(`${logTableId}?${q}`)
  return data.records.map(mapLog)
}

// Последние записи (для истории). Airtable отдаёт max 100 за страницу — для
// персонального дневника этого достаточно на ~месяц.
export async function listRecentLog(): Promise<LogEntry[]> {
  const { logTableId } = getSettings()
  const q = `sort%5B0%5D%5Bfield%5D=${encodeURIComponent(LOG.date)}&sort%5B0%5D%5Bdirection%5D=desc&pageSize=100`
  const data = await req<AirtableList>(`${logTableId}?${q}`)
  return data.records.map(mapLog)
}

export async function createLog(entry: NewLogEntry): Promise<LogEntry> {
  const { logTableId } = getSettings()
  const data = await req<AirtableRecord>(logTableId, {
    method: 'POST',
    body: JSON.stringify({
      // typecast: Airtable сам создаст опцию singleSelect «Источник»,
      // если её ещё нет (фото / сохранённое / вручную).
      typecast: true,
      fields: {
        [LOG.dish]: entry.dish,
        [LOG.date]: entry.date,
        [LOG.time]: entry.time,
        [LOG.kcal]: entry.calories,
        [LOG.protein]: entry.protein,
        [LOG.fat]: entry.fat,
        [LOG.carbs]: entry.carbs,
        [LOG.source]: entry.source,
      },
    }),
  })
  return mapLog(data)
}

export async function deleteLog(id: string): Promise<void> {
  const { logTableId } = getSettings()
  await req(`${logTableId}/${id}`, { method: 'DELETE' })
}
