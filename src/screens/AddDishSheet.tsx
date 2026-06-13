import { useState, type ChangeEvent } from 'react'
import { useStore } from '../state/store'
import Sheet from '../components/Sheet'

interface Form {
  name: string
  emoji: string
  calories: string
  protein: string
  fat: string
  carbs: string
}

const EMPTY: Form = { name: '', emoji: '🍽️', calories: '', protein: '', fat: '', carbs: '' }

export default function AddDishSheet({ onClose }: { onClose: () => void }) {
  const { addDish, showToast } = useStore()
  const [v, setV] = useState<Form>(EMPTY)
  const set =
    (k: keyof Form) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setV({ ...v, [k]: e.target.value })

  async function save() {
    if (!v.name.trim()) {
      showToast('Введи название')
      return
    }
    const ok = await addDish({
      name: v.name.trim(),
      emoji: (v.emoji || '🍽️').slice(0, 2),
      calories: Math.round(Number(v.calories)) || 0,
      protein: Number(v.protein) || 0,
      fat: Number(v.fat) || 0,
      carbs: Number(v.carbs) || 0,
    })
    showToast(ok ? 'Блюдо добавлено' : 'Ошибка сохранения')
    if (ok) onClose()
  }

  return (
    <Sheet onClose={onClose}>
      <h2>Новое блюдо</h2>
      <div className="macro-row" style={{ gridTemplateColumns: '70px 1fr' }}>
        <div className="field">
          <label>Эмодзи</label>
          <input value={v.emoji} onChange={set('emoji')} maxLength={2} />
        </div>
        <div className="field">
          <label>Название</label>
          <input value={v.name} onChange={set('name')} placeholder="Например, Греческий салат" />
        </div>
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
      <button className="btn primary" onClick={save}>
        Сохранить блюдо
      </button>
      <button className="btn ghost" onClick={onClose}>
        Отмена
      </button>
    </Sheet>
  )
}
