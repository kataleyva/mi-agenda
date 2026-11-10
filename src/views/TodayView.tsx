import { useState } from 'react'
import { addDays, fmt, relativeLabel, todayKey } from '../lib/dates'
import { quoteOfDay, levelFor } from '../lib/quotes'
import { streak } from '../lib/store'
import { TaskCard } from '../components/TaskCard'
import { QuickAdd } from '../components/QuickAdd'
import { ProgressRing } from '../components/ProgressRing'
import { Icon } from '../components/Icon'
import { sortTasks, type ViewProps } from './common'
import { toast } from '../lib/toast'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Hola'
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function TodayView({ store, catMap, onOpen, onToggle }: ViewProps) {
  const { state } = store
  const t = todayKey()
  const [showDone, setShowDone] = useState(false)
  const today = sortTasks(state.tasks.filter((x) => x.date === t))
  const pending = today.filter((x) => !x.done)
  const done = today.filter((x) => x.done)
  const overdue = sortTasks(state.tasks.filter((x) => !x.done && x.date && x.date < t))
  const upcoming = [1, 2, 3].map((n) => addDays(t, n)).map((d) => ({ d, tasks: sortTasks(state.tasks.filter((x) => x.date === d && !x.done)) }))
  const pct = today.length ? done.length / today.length : 0
  const st = streak(state.stats.completedByDay)
  const lvl = levelFor(state.stats.points)
  const name = state.userName.trim()

  return (
    <div className="view today">
      <header className="hero">
        <div>
          <p className="eyebrow">{fmt.long(t)}</p>
          <h1>{greeting()}{name ? `, ${name}` : ''} <span className="wave">👋</span></h1>
          <p className="quote">“{quoteOfDay(t)}”</p>
        </div>
        <div className="hero-stats">
          <ProgressRing value={pct}>
            <strong>{done.length}/{today.length}</strong>
            <small>hoy</small>
          </ProgressRing>
          <div className="stat-stack">
            <div className="stat"><span className="stat-icon flame"><Icon name="flame" /></span><div><strong>{st} {st === 1 ? 'día' : 'días'}</strong><small>de racha</small></div></div>
            <div className="stat"><span className="stat-icon">{lvl.emoji}</span><div><strong>{lvl.name}</strong><small>{state.stats.points} puntos</small></div></div>
          </div>
        </div>
      </header>

      <QuickAdd categories={state.categories} defaultDate={t} onAdd={(p) => { store.addTask(p); toast('Tarea agregada ✨', 'ok') }} />

      <div className="today-grid">
        <section>
          {overdue.length > 0 && (
            <div className="card overdue-card">
              <div className="section-head">
                <h3>⏳ Atrasadas <span className="count">{overdue.length}</span></h3>
                <button className="btn btn-soft sm" onClick={() => { store.moveOverdueToToday(); toast('Todo listo para hoy 💪', 'ok') }}>
                  Pasar todas a hoy <Icon name="arrow" size={14} />
                </button>
              </div>
              <div className="task-list">
                {overdue.map((x) => <TaskCard key={x.id} task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} showDate />)}
              </div>
            </div>
          )}

          <div className="section-head">
            <h3>Para hoy <span className="count">{pending.length}</span></h3>
          </div>
          {pending.length === 0 ? (
            <div className="empty">
              <div className="empty-art">{today.length ? '🌻' : '🍃'}</div>
              <p><strong>{today.length ? '¡Terminaste todo lo de hoy!' : 'Tu día está libre'}</strong></p>
              <p className="muted">{today.length ? 'Tómate un respiro, te lo ganaste.' : 'Agrega algo arriba o disfruta el momento.'}</p>
            </div>
          ) : (
            <div className="task-list">
              {pending.map((x) => <TaskCard key={x.id} task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} />)}
            </div>
          )}
          {done.length > 0 && (
            <>
              <button className="link-btn" onClick={() => setShowDone((v) => !v)}>
                {showDone ? 'Ocultar' : 'Ver'} completadas ({done.length})
              </button>
              {showDone && (
                <div className="task-list">
                  {done.map((x) => <TaskCard key={x.id} task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} />)}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="card upcoming">
          <h3>Próximos días</h3>
          {upcoming.map(({ d, tasks }) => (
            <div key={d} className="up-day">
              <div className="up-label"><strong>{relativeLabel(d)}</strong><span className="muted small">{fmt.dayMonth(d)}</span></div>
              {tasks.length === 0 ? <p className="muted small">Nada por ahora</p> : (
                <ul>
                  {tasks.slice(0, 4).map((x) => {
                    const c = catMap.get(x.categoryId ?? '')
                    return (
                      <li key={x.id} onClick={() => onOpen(x)} style={{ '--cat': c?.color ?? '#C9B9A6' } as React.CSSProperties}>
                        <span className="dot" /> {x.title} {x.time && <span className="muted small">{x.time}</span>}
                      </li>
                    )
                  })}
                  {tasks.length > 4 && <li className="muted small">+{tasks.length - 4} más</li>}
                </ul>
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
