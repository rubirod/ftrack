const TABS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'saved', label: 'Сохранённые' },
  { id: 'history', label: 'История' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
