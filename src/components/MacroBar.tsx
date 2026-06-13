// Цели по макросам берём грубо из стандартного сплита 30/30/40 от 2000 ккал.
const TARGETS = { p: 150, f: 67, c: 200 }
const round = (n: number) => Math.round(n * 10) / 10

function Cell({
  label,
  value,
  target,
  color,
}: {
  label: string
  value: number
  target: number
  color: string
}) {
  const pct = Math.min(100, (value / target) * 100)
  return (
    <div className="macro">
      <div className="label">{label}</div>
      <div className="value">
        {round(value)}
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}> г</span>
      </div>
      <div className="bar">
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function MacroBar({ p, f, c }: { p: number; f: number; c: number }) {
  return (
    <div className="macrobar">
      <Cell label="Белки" value={p} target={TARGETS.p} color="var(--protein)" />
      <Cell label="Жиры" value={f} target={TARGETS.f} color="var(--fat)" />
      <Cell label="Углеводы" value={c} target={TARGETS.c} color="var(--carbs)" />
    </div>
  )
}
