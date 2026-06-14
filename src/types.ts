// Общие типы приложения.

export interface Settings {
  anthropicKey: string
  airtableToken: string
  baseId: string
  logTableId: string
  savedTableId: string
  calorieTarget: number
}

export interface LogEntry {
  id: string
  dish: string
  date: string
  time: string
  calories: number
  protein: number
  fat: number
  carbs: number
  source: string
  pending?: boolean
}

// Запись лога без серверного id (для создания / офлайн-очереди).
export type NewLogEntry = Omit<LogEntry, 'id' | 'pending'>

export interface SavedDish {
  id: string
  name: string
  emoji: string
  calories: number
  protein: number
  fat: number
  carbs: number
  uses: number
}

// Блюдо для создания в «Сохранённых» (id присваивает Airtable).
export type DishInput = Omit<SavedDish, 'id' | 'uses'> & { uses?: number }

// Поля макросов в формах могут временно содержать строки из input.
export interface AddEntryInput {
  dish: string
  calories: number | string
  protein: number | string
  fat: number | string
  carbs: number | string
  source: string
}

export interface NutritionResult {
  reply: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export type SheetKind = null | 'settings' | 'photo' | 'addDish'
export type TabKind = 'today' | 'saved' | 'history'

// Metadata API: краткая инфа о базе и таблице для автоподтягивания.
export interface BaseInfo {
  id: string
  name: string
}
export interface TableInfo {
  id: string
  name: string
}
