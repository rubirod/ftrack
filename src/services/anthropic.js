import { getSettings } from './storage.js'

const URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const PROMPT =
  'Оцени КБЖУ этого блюда для типичной порции на фото. ' +
  'Ответь ТОЛЬКО JSON без markdown: ' +
  '{"name":"название","calories":число,"protein":число,"fat":число,"carbs":число}'

// Вытаскиваем JSON, даже если модель обернула его в ```json или добавила текст.
function parseResult(text) {
  let t = text.trim().replace(/```json\s*|```/g, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('no json')
  const obj = JSON.parse(t.slice(start, end + 1))
  return {
    name: String(obj.name || ''),
    calories: Math.round(Number(obj.calories) || 0),
    protein: Math.round((Number(obj.protein) || 0) * 10) / 10,
    fat: Math.round((Number(obj.fat) || 0) * 10) / 10,
    carbs: Math.round((Number(obj.carbs) || 0) * 10) / 10,
  }
}

export async function analyzePhoto(base64) {
  const { anthropicKey } = getSettings()
  if (!anthropicKey) throw new Error('Не задан ANTHROPIC_API_KEY')

  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = data?.content?.[0]?.text || ''
  return parseResult(text)
}
