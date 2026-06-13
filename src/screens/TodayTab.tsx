import { useStore } from '../state/store'

export default function TodayTab() {
  const { today, removeEntry } = useStore()

  if (today.length === 0) {
    return (
      <div className="placeholder">
        Пока пусто.
        <br />
        Тапни сохранённое блюдо или сфотографируй еду — запись появится здесь.
      </div>
    )
  }

  const sorted = [...today].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  return (
    <div>
      {sorted.map((e) => (
        <div key={e.id} className={`entry ${e.pending ? 'pending' : ''}`}>
          <div className="main">
            <div className="title">{e.dish}</div>
            <div className="sub">
              {e.time} · Б {e.protein} · Ж {e.fat} · У {e.carbs}
              {e.pending ? ' · ⏳' : ''}
            </div>
          </div>
          <div className="kcal num">{e.calories}</div>
          <button className="del" onClick={() => removeEntry(e.id)} aria-label="Удалить">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
