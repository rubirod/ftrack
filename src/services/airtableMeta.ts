// Airtable Metadata API — список баз и таблиц для автоподтягивания при настройке.
// Работает с тем же PAT, что и data-API, но требует скоуп `schema.bases:read`.
// Бэкенд не нужен: эти GET-ручки CORS-friendly (в отличие от OAuth token-эндпоинта).
import type { BaseInfo, TableInfo } from '../types'

const META = 'https://api.airtable.com/v0/meta'

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

async function metaReq<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    // 403 здесь обычно = у токена нет скоупа schema.bases:read
    throw new Error(`Airtable meta ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

interface BasesResponse {
  bases: { id: string; name: string; permissionLevel?: string }[]
}
interface TablesResponse {
  tables: { id: string; name: string }[]
}

// Все базы, доступные токену (постранично — для личного аккаунта хватит первой).
export async function listBases(token: string): Promise<BaseInfo[]> {
  const data = await metaReq<BasesResponse>(`${META}/bases`, token)
  return data.bases.map((b) => ({ id: b.id, name: b.name }))
}

// Таблицы конкретной базы.
export async function listTables(token: string, baseId: string): Promise<TableInfo[]> {
  const data = await metaReq<TablesResponse>(`${META}/bases/${baseId}/tables`, token)
  return data.tables.map((t) => ({ id: t.id, name: t.name }))
}

// Эвристика подбора таблицы по имени (регистронезависимо, по подстроке).
export function guessTable(tables: TableInfo[], keywords: string[]): string {
  const lower = tables.map((t) => ({ id: t.id, name: t.name.toLowerCase() }))
  for (const kw of keywords) {
    const hit = lower.find((t) => t.name.includes(kw.toLowerCase()))
    if (hit) return hit.id
  }
  return ''
}
