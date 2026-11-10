import { useState } from 'react'
import { addDays, startOfWeek, todayKey } from '../lib/dates'
import type { Task } from '../lib/types'
import { TaskCard } from '../components/TaskCard'
import { QuickAdd } from '../components/QuickAdd'
import { Icon } from '../components/Icon'
import { DropZone, sortTasks, type ViewProps } from './common'

type Status = 'pendientes' | 'hechas' | 'todas'
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function ListView({ store, catMap, onOpen, onToggle }: ViewProps) {
  const { state } = store
  const t = todayKey()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | 'all'>('all')
  const [status, setStatus] = useState<Status>('pendientes')

  const filtered = sortTasks(
    state.tasks.filter((x) =>
      (status === 'todas' || (status === 'hechas' ? x.done : !x.done)) &&
      (cat === 'all' || x.categoryId === cat) &&
      (!q || norm(x.title + ' ' + x.notes).includes(norm(q))),
    ),
  )

  const endWeek = addDays(startOfWeek(t), 6)
  const groups: { key: string; title: string; drop: string | null | undefined; items: Task[] }[] = [
    { key: 'over', title: '⏳ Atrasadas', drop: undefined, items: filtered.filter((x) => x.date && x.date < t) },
    { key: 'today', title: '☀️ Hoy', drop: t, items: filtered.filter((x) => x.date === t) },
    { key: 'tom', title: '🌤 Mañana', drop: addDays(t, 1), items: filtered.filter((x) => x.date === addDays(t, 1)) },
    { key: 'week', title: '🗓 Resto de la semana', drop: undefined, items: filtered.filter((x) => x.date && x.date > addDays(t, 1) && x.date <= endWeek) },
    { key: 'later', title: '🔭 Más adelante', drop: undefined, items: filtered.filter((x) => x.date && x.date > endWeek && x.date > addDays(t, 1)) },
    { key: 'some', title: '🌙 Algún día', drop: null, items: filtered.filter((x) => !x.date) },
  ]

  return (
    <div className="view list">
      <header className="view-head">
        <div>
          <p className="eyebrow">Todos mis pendientes</p>
          <h1>{state.tasks.filter((x) => !x.done).length} cosas por hacer</h1>
        </div>
      </header>

      <QuickAdd categories={state.categories} defaultDate={null} defaultCategoryId={cat === 'all' ? null : cat} onAdd={store.addTask}
        placeholder='Anota algo… ej: "Pagar luz el viernes #finanzas"' />

      <div className="filters">
        <label className="search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" />
        </label>
        <div className="seg">
          {(['pendientes', 'hechas', 'todas'] as Status[]).map((s) => (
            <button key={s} className={`seg-btn ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)}>{s}</button>
          ))}
        </div>
      </div>
      <div className="pills">
        <button className={`pill ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>Todas</button>
        {state.categories.map((c) => {
          const n = state.tasks.filter((x) => x.categoryId === c.id && !x.done).length
          return (
            <button key={c.id} className={`pill ${cat === c.id ? 'on' : ''}`} style={{ '--pill': c.color } as React.CSSProperties} onClick={() => setCat(c.id)}>
              {c.emoji} {c.name} <span className="pill-count">{n}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <div className="empty-art">🌾</div>
          <p><strong>Nada por aquí</strong></p>
          <p className="muted">Prueba con otro filtro o agrega una tarea nueva.</p>
        </div>
      )}

      <div className="groups">
        {groups.filter((g) => g.items.length > 0 || (g.drop !== undefined && filtered.length > 0)).map((g) => {
          const body = (
            <>
              <div className="section-head"><h3>{g.title} <span className="count">{g.items.length}</span></h3></div>
              <div className="task-list">
                {g.items.map((x) => <TaskCard key={x.id} task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} showDate={g.key !== 'today' && g.key !== 'tom'} />)}
                {g.items.length === 0 && <p className="muted small drop-hint">Arrastra aquí para mover</p>}
              </div>
            </>
          )
          return g.drop !== undefined
            ? <DropZone key={g.key} date={g.drop} className="group">{body}</DropZone>
            : <div key={g.key} className="group">{body}</div>
        })}
      </div>
    </div>
  )
}
