import { useEffect, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { fileToJpegBase64 } from '../services/image.js'
import { analyzePhoto } from '../services/anthropic.js'
import Sheet from '../components/Sheet.jsx'

const EMPTY = { name: '', calories: '', protein: '', fat: '', carbs: '' }

export default function PhotoSheet({ file, onClose, onAdded }) {
  const { addEntry, addDish, settings } = useStore()
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(true)
  const [err, setErr] = useState('')
  const [v, setV] = useState(EMPTY)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { base64, previewUrl } = await fileToJpegBase64(file)
        if (!alive) return
        setPreview(previewUrl)
        if (!settings.anthropicKey) {
          setErr('Не задан ANTHROPIC_API_KEY — заполни вручную.')
          setAnalyzing(false)
          return
        }
        const r = await analyzePhoto(base64)
        if (!alive) return
        setV({
          name: r.name,
          calories: r.calories,
          protein: r.protein,
          fat: r.fat,
          carbs: r.carbs,
        })
      } catch (e) {
        if (!alive) return
        console.error(e)
        setErr('Не удалось распознать, введи вручную.')
      } finally {
        if (alive) setAnalyzing(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [file, settings.anthropicKey])

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

      {analyzing ? (
        <div className="analyzing">
          <div className="spinner" /> Распознаю блюдо…
        </div>
      ) : (
        <>
          {err && <div className="err-text">{err}</div>}
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
          <button className="btn danger" onClick={onClose}>
            Отмена
          </button>
        </>
      )}
    </Sheet>
  )
}
