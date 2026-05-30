import { useEffect, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { listRecentLog } from '../services/airtable.js'
import { shortDate, humanDate } from '../lib/date.js'
import Sheet from '../components/Sheet.jsx'

export default function HistoryTab() {
  const { settings } = useStore()
  const [days, setDays] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let alive = true
    listRecentLog()
      .then((rows) => {
        if (!alive) return
        // группируем по дате
        const byDate = {}
        for (const r of rows) {
          ;(byDate[r.date] ||= []).push(r)
        }
        const list = Object.keys(byDate)
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 30)
          .map((date) => ({
            date,
            entries: byDate[date],
            kcal: byDate[date].reduce((s, e) => s + (e.calories || 0), 0),
          }))
        setDays(list)
      })
      .catch(() => setDays([]))
    return () => {
      alive = false
    }
  }, [])

  if (days === null) return <div className="placeholder">Загрузка…</div>
  if (days.length === 0) return <div className="placeholder">Истории пока нет.</div>

  return (
    <div>
      {days.map((d) => (
        <button
          key={d.date}
          className="hist-row"
          style={{ display: 'block', width: '100%', textAlign: 'left' }}
          onClick={() => setOpen(d)}
        >
          <div className="top">
            <span>{shortDate(d.date)}</span>
            <span className="k num">{d.kcal} ккал</span>
          </div>
          <div className="hist-bar">
            <span style={{ width: `${Math.min(100, (d.kcal / settings.calorieTarget) * 100)}%` }} />
          </div>
        </button>
      ))}

      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <h2>{humanDate(open.date)}</h2>
          {[...open.entries]
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            .map((e) => (
              <div key={e.id} className="entry">
                <div className="main">
                  <div className="title">{e.dish}</div>
                  <div className="sub">
                    {e.time} · Б {e.protein} · Ж {e.fat} · У {e.carbs}
                  </div>
                </div>
                <div className="kcal num">{e.calories}</div>
              </div>
            ))}
          <button className="btn ghost" onClick={() => setOpen(null)}>
            Закрыть
          </button>
        </Sheet>
      )}
    </div>
  )
}
