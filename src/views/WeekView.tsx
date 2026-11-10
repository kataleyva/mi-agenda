import { useState } from 'react'
import { addDays, fmt, startOfWeek, todayKey, weekDays } from '../lib/dates'
import { TaskCard } from '../components/TaskCard'
import { QuickAdd } from '../components/QuickAdd'
import { Icon } from '../components/Icon'
import { DropZone, sortTasks, type ViewProps } from './common'

export function WeekView({ store, catMap, onOpen, onToggle }: ViewProps) {
  const { state } = store
  const t = todayKey()
  const [anchor, setAnchor] = useState(t)
  const days = weekDays(anchor)
  const someday = sortTasks(state.tasks.filter((x) => x.date === null && !x.done))
  const weekTotal = state.tasks.filter((x) => x.date && x.date >= days[0] && x.date <= days[6])
  const weekDone = weekTotal.filter((x) => x.done).length

  return (
    <div className="view week">
      <header className="view-head">
        <div>
          <p className="eyebrow">Semana · {weekDone} de {weekTotal.length} hechas</p>
          <h1>{fmt.dayMonth(days[0])} – {fmt.dayMonth(days[6])}</h1>
          <p className="muted">Arrastra las tareas entre días para moverlas de fecha.</p>
        </div>
        <div className="nav-btns">
          <button className="icon-btn" onClick={() => setAnchor(addDays(anchor, -7))} aria-label="Semana anterior"><Icon name="left" /></button>
          <button className="btn btn-soft" onClick={() => setAnchor(t)} disabled={startOfWeek(anchor) === startOfWeek(t)}>Esta semana</button>
          <button className="icon-btn" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Semana siguiente"><Icon name="right" /></button>
        </div>
      </header>

      <div className="week-grid">
        {days.map((d) => {
          const tasks = sortTasks(state.tasks.filter((x) => x.date === d))
          const doneN = tasks.filter((x) => x.done).length
          return (
            <DropZone key={d} date={d} className={`day-col ${d === t ? 'is-today' : ''} ${d < t ? 'is-past' : ''}`}>
              <div className="day-head">
                <span className="day-name">{fmt.weekdayShort(d)}</span>
                <span className="day-num">{Number(d.slice(8))}</span>
                {tasks.length > 0 && <span className="day-bar"><span style={{ width: `${(doneN / tasks.length) * 100}%` }} /></span>}
              </div>
              <div className="task-list">
                {tasks.map((x) => <TaskCard key={x.id} task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} />)}
              </div>
              <QuickAdd compact categories={state.categories} defaultDate={d} onAdd={store.addTask} placeholder="Añadir…" />
            </DropZone>
          )
        })}
      </div>

      <DropZone date={null} className="card someday">
        <div className="section-head">
          <h3>🌙 Algún día <span className="count">{someday.length}</span></h3>
          <span className="muted small">Suelta aquí lo que aún no tiene fecha</span>
        </div>
        <div className="someday-list">
          {someday.map((x) => <TaskCard key={x.id} task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} />)}
        </div>
      </DropZone>
    </div>
  )
}
