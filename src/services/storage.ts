import type { Settings } from '../types'

// Локальное хранилище ключей и настроек под префиксом kcal_.
const PREFIX = 'kcal_'

const KEYS = {
  anthropicKey: 'anthropic_key',
  airtableToken: 'airtable_token',
  baseId: 'base_id',
  logTableId: 'log_table_id',
  savedTableId: 'saved_table_id',
  calorieTarget: 'calorie_target',
} as const

function read(key: string): string {
  return localStorage.getItem(PREFIX + key) || ''
}
function write(key: string, value: string | undefined): void {
  localStorage.setItem(PREFIX + key, value ?? '')
}

export function getSettings(): Settings {
  return {
    anthropicKey: read(KEYS.anthropicKey),
    airtableToken: read(KEYS.airtableToken),
    baseId: read(KEYS.baseId),
    logTableId: read(KEYS.logTableId),
    savedTableId: read(KEYS.savedTableId),
    calorieTarget: Number(read(KEYS.calorieTarget)) || 2000,
  }
}

export function saveSettings(s: Settings): void {
  write(KEYS.anthropicKey, s.anthropicKey?.trim())
  write(KEYS.airtableToken, s.airtableToken?.trim())
  write(KEYS.baseId, s.baseId?.trim())
  write(KEYS.logTableId, s.logTableId?.trim())
  write(KEYS.savedTableId, s.savedTableId?.trim())
  write(KEYS.calorieTarget, String(s.calorieTarget || 2000))
}

// Минимум для работы с Airtable. Фото-анализ опционален.
export function isConfigured(s: Settings = getSettings()): boolean {
  return !!(s.airtableToken && s.baseId && s.logTableId && s.savedTableId)
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k))
}

// Base ID вводится пользователем в настройках и хранится только в localStorage —
// в коде/репозитории идентификаторов нет.
export function getBaseId(): string {
  return read(KEYS.baseId)
}
