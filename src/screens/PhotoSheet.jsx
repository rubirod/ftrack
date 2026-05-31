import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { fileToJpegBase64 } from '../services/image.js'
import { chatNutrition } from '../services/anthropic.js'
import Sheet from '../components/Sheet.jsx'

const EMPTY = { name: '', calories: '', protein: '', fat: '', carbs: '' }

export default function PhotoSheet({ file, onClose, onAdded }) {
  const { addEntry, addDish, settings } = useStore()
  const [preview, setPreview] = useState(null)
  const [base64, setBase64] = useState(null)
  const [prepping, setPrepping] = useState(true)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', text }
  const [estimated, setEstimated] = useState(false)
  const [v, setV] = useState(EMPTY)
  const [input, setInput] = useState('')
  const chatRef = useRef(null)

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const hasKey = !!settings.anthropicKey

  // Подготовка фото (ресайз + JPEG). API не вызываем — ждём контекст.
  useEffect(() => {
    let alive = true
    fileToJpegBase64(file)
      .then(({ base64, previewUrl }) => {
        if (!alive) return
        setBase64(base64)
        setPreview(previewUrl)
        if (!hasKey) setErr('Не задан ANTHROPIC_API_KEY — заполни поля вручную.')
      })
      .catch(() => alive && setErr('Не удалось прочитать изображение, введи вручную.'))
      .finally(() => alive && setPrepping(false))
    return () => {
      alive = false
    }
  }, [file, hasKey])

  // Автоскролл чата вниз при новых сообщениях.
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight })
  }, [messages, sending])

  async function send(text) {
    if (sending || !base64 || !hasKey) return
    const userTurn = { role: 'user', text }
    const history = [...messages, userTurn]
    setMessages(history)
    setInput('')
    setSending(true)
    setErr('')
    try {
      const r = await chatNutrition({ base64, turns: history })
      setMessages((cur) => [...cur, { role: 'assistant', text: r.reply || 'Готово.' }])
      setV({ name: r.name, calories: r.calories, protein: r.protein, fat: r.fat, carbs: r.carbs })
      setEstimated(true)
    } catch (e) {
      console.error(e)
      setErr('Не удалось распознать. Уточни ещё раз или введи вручную.')
      setEstimated(true) // открываем поля для ручного ввода
    } finally {
      setSending(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    const t = input.trim()
    if (t) send(t)
  }

  function toEntry() {
    return {
      dish: v.name || 'Блюдо',
      calories: v.calories,
      protein: v.protein,
      fat: v.fat,
      carbs: v.carbs,
      source: 'фото',
    }
  }

  function add() {
    addEntry(toEntry())
    onAdded()
  }

  async function addAndSave() {
    addEntry(toEntry())
    await addDish({
      name: v.name || 'Блюдо',
      emoji: '🍽️',
      calories: Math.round(Number(v.calories)) || 0,
      protein: Number(v.protein) || 0,
      fat: Number(v.fat) || 0,
      carbs: Number(v.carbs) || 0,
    })
    onAdded()
  }

  return (
    <Sheet onClose={onClose}>
      <h2>Анализ фото</h2>
      {preview && <img className="preview-img" src={preview} alt="" />}

      {/* Чат с моделью */}
      {hasKey && (messages.length > 0 || sending) && (
        <div className="chat" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
              {m.text}
            </div>
          ))}
          {sending && <div className="bubble ai typing">Считаю…</div>}
        </div>
      )}

      {err && <div className="err-text">{err}</div>}

      {/* Подсказка-приглашение к контексту до первой оценки */}
      {hasKey && !estimated && !sending && messages.length === 0 && (
        <p className="hint">
          Опиши блюдо или порцию (например «полная тарелка, жарено на масле») — или сразу оцени по
          фото.
        </p>
      )}

      {/* Поле ввода контекста */}
      {hasKey && (
        <form className="chat-input" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={estimated ? 'Уточнить…' : 'Опиши блюдо или порцию'}
            disabled={prepping || sending}
          />
          <button type="submit" disabled={prepping || sending || !input.trim()} aria-label="Отправить">
            ↑
          </button>
        </form>
      )}

      {/* Кнопка первой оценки без текста */}
      {hasKey && !estimated && (
        <button
          className="btn ghost"
          onClick={() => send('')}
          disabled={prepping || sending}
          style={{ marginTop: 0 }}
        >
          Оценить по фото
        </button>
      )}

      {/* Сводка КБЖУ + редактируемые поля после первой оценки (или сразу без ключа) */}
      {(estimated || !hasKey) && (
        <>
          <div className="macro-summary">
            <span className="k">{v.calories || 0} ккал</span>
            <span className="m">
              Б {v.protein || 0} · Ж {v.fat || 0} · У {v.carbs || 0}
            </span>
          </div>
          <div className="field">
            <label>Название</label>
            <input value={v.name} onChange={set('name')} placeholder="Название блюда" />
          </div>
          <div className="field">
            <label>Ккал</label>
            <input type="number" inputMode="numeric" value={v.calories} onChange={set('calories')} />
          </div>
          <div className="macro-row">
            <div className="field">
              <label>Белки</label>
              <input type="number" inputMode="decimal" value={v.protein} onChange={set('protein')} />
            </div>
            <div className="field">
              <label>Жиры</label>
              <input type="number" inputMode="decimal" value={v.fat} onChange={set('fat')} />
            </div>
            <div className="field">
              <label>Углеводы</label>
              <input type="number" inputMode="decimal" value={v.carbs} onChange={set('carbs')} />
            </div>
          </div>

          <button className="btn primary" onClick={add}>
            Добавить в лог
          </button>
          <button className="btn ghost" onClick={addAndSave}>
            Добавить + сохранить блюдо
          </button>
        </>
      )}

      <button className="btn danger" onClick={onClose}>
        Отмена
      </button>
    </Sheet>
  )
}
