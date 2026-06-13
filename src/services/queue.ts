// Простая очередь записей, сделанных офлайн. Хранится в localStorage.
// MVP: записи кладутся сюда при ошибке сети и досылаются при flush().
import { createLog } from './airtable'
import type { NewLogEntry } from '../types'

const KEY = 'kcal_offline_queue'

function read(): NewLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as NewLogEntry[]
  } catch {
    return []
  }
}
function write(items: NewLogEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function enqueue(entry: NewLogEntry): void {
  const items = read()
  items.push(entry)
  write(items)
}

export function pending(): number {
  return read().length
}

// Досылаем всё, что накопилось. Возвращает число успешно отправленных.
export async function flush(): Promise<number> {
  const items = read()
  if (!items.length) return 0
  const remaining: NewLogEntry[] = []
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
