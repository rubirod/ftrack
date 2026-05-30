import { getSettings, getBaseId } from './storage.js'

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
}
export const SAVED = {
  name: 'Название',
  emoji: 'Эмодзи',
  kcal: 'Ккал',
  protein: 'Белки',
  fat: 'Жиры',
  carbs: 'Углеводы',
  uses: 'Использований',
}

function headers() {
  const { airtableToken } = getSettings()
  return {
    Authorization: `Bearer ${airtableToken}`,
    'Content-Type': 'application/json',
  }
}

async function req(path, options = {}) {
  const res = await fetch(`${API}/${getBaseId()}/${path}`, {
    ...options,
    headers: headers(),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Airtable ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

// ---- маппинг записей в плоские объекты ----
function mapLog(r) {
  const f = r.fields
  return {
    id: r.id,
    dish: f[LOG.dish] || '',
    date: f[LOG.date] || '',
    time: f[LOG.time] || '',
    calories: f[LOG.kcal] || 0,
    protein: f[LOG.protein] || 0,
    fat: f[LOG.fat] || 0,
    carbs: f[LOG.carbs] || 0,
    source: f[LOG.source] || '',
  }
}
function mapSaved(r) {
  const f = r.fields
  return {
    id: r.id,
    name: f[SAVED.name] || '',
    emoji: f[SAVED.emoji] || '🍽️',
    calories: f[SAVED.kcal] || 0,
    protein: f[SAVED.protein] || 0,
    fat: f[SAVED.fat] || 0,
    carbs: f[SAVED.carbs] || 0,
    uses: f[SAVED.uses] || 0,
  }
}

// ---- Сохранённые блюда ----
export async function listSaved() {
  const { savedTableId } = getSettings()
  const q = `sort%5B0%5D%5Bfield%5D=${encodeURIComponent(SAVED.uses)}&sort%5B0%5D%5Bdirection%5D=desc`
  const data = await req(`${savedTableId}?${q}`)
  return data.records.map(mapSaved)
}

export async function createSaved(dish) {
  const { savedTableId } = getSettings()
  const data = await req(savedTableId, {
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

export async function incrementSavedUses(id, current) {
  const { savedTableId } = getSettings()
  await req(`${savedTableId}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { [SAVED.uses]: (current || 0) + 1 } }),
  })
}

export async function deleteSaved(id) {
  const { savedTableId } = getSettings()
  await req(`${savedTableId}/${id}`, { method: 'DELETE' })
}

// ---- Лог питания ----
export async function listLogByDate(date) {
  const { logTableId } = getSettings()
  const formula = encodeURIComponent(`{${LOG.date}}="${date}"`)
  const q = `filterByFormula=${formula}&sort%5B0%5D%5Bfield%5D=${encodeURIComponent(LOG.time)}`
  const data = await req(`${logTableId}?${q}`)
  return data.records.map(mapLog)
}

// Последние записи (для истории). Airtable отдаёт max 100 за страницу — для
// персонального дневника этого достаточно на ~месяц.
export async function listRecentLog() {
  const { logTableId } = getSettings()
  const q = `sort%5B0%5D%5Bfield%5D=${encodeURIComponent(LOG.date)}&sort%5B0%5D%5Bdirection%5D=desc&pageSize=100`
  const data = await req(`${logTableId}?${q}`)
  return data.records.map(mapLog)
}

export async function createLog(entry) {
  const { logTableId } = getSettings()
  const data = await req(logTableId, {
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

export async function deleteLog(id) {
  const { logTableId } = getSettings()
  await req(`${logTableId}/${id}`, { method: 'DELETE' })
}
