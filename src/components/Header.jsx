import { useStore } from '../state/store.jsx'
import { humanDate } from '../lib/date.js'
import MacroBar from './MacroBar.jsx'

export default function Header() {
  const { date, today, settings, setSheet } = useStore()
  const totals = today.reduce(
    (a, e) => ({
      kcal: a.kcal + (e.calories || 0),
      p: a.p + (e.protein || 0),
      f: a.f + (e.fat || 0),
      c: a.c + (e.carbs || 0),
    }),
    { kcal: 0, p: 0, f: 0, c: 0 },
  )

  return (
    <header className="header">
      <div className="header-top">
        <div>
          <div className="header-date">{humanDate(date)}</div>
          <div className="kcal-big num">
            {totals.kcal}
            <span className="unit">ккал</span>
          </div>
          <div className="kcal-target">цель {settings.calorieTarget}</div>
        </div>
        <button className="icon-btn" onClick={() => setSheet('settings')} aria-label="Настройки">
          ⚙️
        </button>
      </div>
      <MacroBar p={totals.p} f={totals.f} c={totals.c} />
    </header>
  )
}
