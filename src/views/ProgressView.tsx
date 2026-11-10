import { addDays, fmt, todayKey } from '../lib/dates'
import { LEVELS, levelFor } from '../lib/quotes'
import { streak } from '../lib/store'
import type { ViewProps } from './common'

export function ProgressView({ store }: ViewProps) {
  const { state } = store
  const t = todayKey()
  const lvl = levelFor(state.stats.points)
  const st = streak(state.stats.completedByDay)
  const days = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13))
  const counts = days.map((d) => state.stats.completedByDay[d] ?? 0)
  const max = Math.max(3, ...counts)
  const totalDone = Object.values(state.stats.completedByDay).reduce((a, b) => a + b, 0)
  const best = Math.max(0, ...Object.values(state.stats.completedByDay))
  const pendingByCat = state.categories.map((c) => ({ c, n: state.tasks.filter((x) => !x.done && x.categoryId === c.id).length })).filter((x) => x.n > 0)
  const totalPend = pendingByCat.reduce((a, b) => a + b.n, 0)

  const badges = [
    { e: '🌱', n: 'Primer paso', d: 'Completa tu primera tarea', ok: totalDone >= 1 },
    { e: '🔥', n: 'En racha', d: '3 días seguidos', ok: st >= 3 },
    { e: '🌟', n: 'Semana perfecta', d: '7 días seguidos', ok: st >= 7 },
    { e: '🐝', n: 'Día productivo', d: '5 tareas en un día', ok: best >= 5 },
    { e: '🏔', n: 'Constancia', d: '50 tareas completadas', ok: totalDone >= 50 },
    { e: '🗂', n: 'Organizada', d: 'Crea 8 categorías', ok: state.categories.length >= 8 },
  ]

  return (
    <div className="view progress">
      <header className="view-head">
        <div>
          <p className="eyebrow">Tu progreso</p>
          <h1>Mira todo lo que has logrado</h1>
        </div>
      </header>

      <div className="progress-grid">
        <div className="card level-card">
          <div className="level-emoji">{lvl.emoji}</div>
          <div className="grow">
            <p className="eyebrow">Nivel {lvl.index + 1}</p>
            <h2>{lvl.name}</h2>
            <div className="bar"><span style={{ width: `${lvl.progress * 100}%` }} /></div>
            <p className="muted small">
              {lvl.next ? `${lvl.next.min - state.stats.points} puntos para ${lvl.next.emoji} ${lvl.next.name}` : '¡Llegaste a la cima! ⛰️'}
            </p>
          </div>
        </div>

        <div className="card kpis">
          <div><strong>{st}</strong><small>{st === 1 ? 'día' : 'días'} de racha 🔥</small></div>
          <div><strong>{totalDone}</strong><small>tareas hechas</small></div>
          <div><strong>{state.stats.points}</strong><small>puntos</small></div>
        </div>

        <div className="card chart-card">
          <h3>Últimos 14 días</h3>
          <div className="bars" role="img" aria-label="Tareas completadas por día">
            {days.map((d, i) => (
              <div key={d} className={`bar-col ${d === t ? 'is-today' : ''}`} title={`${fmt.dayMonth(d)}: ${counts[i]}`}>
                <span className="bar-val">{counts[i] || ''}</span>
                <span className="bar-fill" style={{ height: `${(counts[i] / max) * 100}%` }} />
                <span className="bar-label">{fmt.weekdayShort(d).slice(0, 1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Pendientes por categoría</h3>
          {totalPend === 0 ? <p className="muted">¡No tienes pendientes con categoría! 🎉</p> : (
            <>
              <div className="stack-bar">
                {pendingByCat.map(({ c, n }) => <span key={c.id} style={{ width: `${(n / totalPend) * 100}%`, background: c.color }} title={`${c.name}: ${n}`} />)}
              </div>
              <ul className="legend">
                {pendingByCat.map(({ c, n }) => <li key={c.id}><span className="dot" style={{ background: c.color }} /> {c.emoji} {c.name} <strong>{n}</strong></li>)}
              </ul>
            </>
          )}
        </div>

        <div className="card badges-card">
          <h3>Logros</h3>
          <div className="badges">
            {badges.map((b) => (
              <div key={b.n} className={`badge ${b.ok ? 'ok' : ''}`}>
                <span className="badge-e">{b.e}</span>
                <strong>{b.n}</strong>
                <small>{b.d}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Camino de niveles</h3>
          <div className="level-path">
            {LEVELS.map((l, i) => (
              <div key={l.name} className={`lp ${i <= lvl.index ? 'ok' : ''}`}>
                <span>{l.emoji}</span><small>{l.name}</small>
              </div>
            ))}
          </div>
          <p className="muted small">Ganas 5, 10 o 15 puntos por tarea según su prioridad.</p>
        </div>
      </div>
    </div>
  )
}
