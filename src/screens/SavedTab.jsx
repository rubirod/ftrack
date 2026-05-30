import { useStore } from '../state/store.jsx'

export default function SavedTab({ onAddDish, onPicked }) {
  const { saved, useDish, removeDish } = useStore()

  function pick(dish) {
    useDish(dish)
    onPicked?.()
  }

  function del(e, dish) {
    e.stopPropagation()
    if (confirm(`Удалить «${dish.name}» из сохранённых?`)) removeDish(dish.id)
  }

  return (
    <div className="grid">
      {saved.map((d) => (
        <button key={d.id} className="card" onClick={() => pick(d)}>
          <span className="card-del" onClick={(e) => del(e, d)}>
            ×
          </span>
          <div className="emoji">{d.emoji}</div>
          <div className="name">{d.name}</div>
          <div className="kcal num">{d.calories} ккал</div>
          <div className="macros">
            Б {d.protein} · Ж {d.fat} · У {d.carbs}
          </div>
        </button>
      ))}
      <button className="card add" onClick={onAddDish} aria-label="Добавить блюдо">
        +
      </button>
    </div>
  )
}
