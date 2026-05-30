// Простая очередь записей, сделанных офлайн. Хранится в localStorage.
// MVP: записи кладутся сюда при ошибке сети и досылаются при flush().
import { createLog } from './airtable.js'

const KEY = 'kcal_offline_queue'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function enqueue(entry) {
  const items = read()
  items.push(entry)
  write(items)
}

export function pending() {
  return read().length
}

// Досылаем всё, что накопилось. Возвращает число успешно отправленных.
export async function flush() {
  const items = read()
  if (!items.length) return 0
  const remaining = []
  let sent = 0
  for (const entry of items) {
    try {
      await createLog(entry)
      sent++
    } catch {
      remaining.push(entry)
    }
  }
  write(remaining)
  return sent
}
