import { getSettings } from './storage.js'

const URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const SYSTEM =
  'Ты помощник по подсчёту КБЖУ. Пользователь присылает фото блюда и может ' +
  'уточнять детали текстом (размер порции, способ готовки, добавки). ' +
  'Оценивай КБЖУ для всей порции на фото с учётом всех уточнений. ' +
  'Если уточнений ещё нет — оценивай по типичной порции. ' +
  'Отвечай ТОЛЬКО валидным JSON без markdown в формате: ' +
  '{"reply":"короткий ответ пользователю на русском (1-2 фразы, что учёл/что уточнить)",' +
  '"name":"название блюда","calories":целое,"protein":число,"fat":число,"carbs":число}'

// Вытаскиваем JSON, даже если модель обернула его в ```json или добавила текст.
function parseResult(text) {
  let t = text.trim().replace(/```json\s*|```/g, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('no json')
  const obj = JSON.parse(t.slice(start, end + 1))
  return {
    reply: String(obj.reply || ''),
    name: String(obj.name || ''),
    calories: Math.round(Number(obj.calories) || 0),
    protein: Math.round((Number(obj.protein) || 0) * 10) / 10,
    fat: Math.round((Number(obj.fat) || 0) * 10) / 10,
    carbs: Math.round((Number(obj.carbs) || 0) * 10) / 10,
  }
}

// Многоходовой диалог: фото живёт в первом сообщении пользователя,
// дальше идут текстовые реплики. turns — [{ role, text }], где первая запись
// пользователя несёт исходный контекст (может быть пустым).
//
// Кэширование: фото пересылается на каждом ходу и стоит дорого в токенах,
// поэтому ставим cache_control на первое сообщение (system + image кэшируются
// и переиспользуются всеми последующими ходами) и второй, скользящий брейкпоинт
// на последнем сообщении (растущая история диалога). Кэш — префиксный: первый
// запрос пишет, остальные читают за ~0.1× цены.
export async function chatNutrition({ base64, turns }) {
  const { anthropicKey } = getSettings()
  if (!anthropicKey) throw new Error('Не задан ANTHROPIC_API_KEY')

  const messages = turns.map((t, i) => {
    if (i === 0 && t.role === 'user') {
      const content = [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
      ]
      content.push({ type: 'text', text: t.text || 'Оцени по фото.' })
      return { role: 'user', content }
    }
    return { role: t.role, content: [{ type: 'text', text: t.text }] }
  })

  // Брейкпоинт на последнем блоке сообщения (мутирует объект блока).
  const markLast = (msg) => {
    const block = msg.content[msg.content.length - 1]
    block.cache_control = { type: 'ephemeral' }
  }
  // 1) первое сообщение: кэшируем system + фото — стабильный префикс диалога
  markLast(messages[0])
  // 2) последнее сообщение: кэшируем накопленную историю (если это не то же)
  if (messages.length > 1) markLast(messages[messages.length - 1])

  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 500, system: SYSTEM, messages }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  // Для отладки: cache_read_input_tokens > 0 на втором+ ходе = кэш работает.
  if (data?.usage) {
    console.debug('anthropic usage', data.usage)
  }
  const text = data?.content?.[0]?.text || ''
  return parseResult(text)
}
