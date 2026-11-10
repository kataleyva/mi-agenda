import { useState } from 'react'
import { addMonths, fmt, monthGrid, todayKey } from '../lib/dates'
import { TaskCard } from '../components/TaskCard'
import { QuickAdd } from '../components/QuickAdd'
import { Icon } from '../components/Icon'
import { DropZone, sortTasks, type ViewProps } from './common'

const WD = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function MonthView({ store, catMap, onOpen, onToggle }: ViewProps) {
  const { state } = store
  const t = todayKey()
  const [anchor, setAnchor] = useState(t)
  const [selected, setSelected] = useState(t)
  const cells = monthGrid(anchor)
  const month = anchor.slice(0, 7)
  const selTasks = sortTasks(state.tasks.filter((x) => x.date === selected))

  return (
    <div className="view month">
      <header className="view-head">
        <div>
          <p className="eyebrow">Calendario</p>
          <h1>{fmt.monthYear(anchor)}</h1>
        </div>
        <div className="nav-btns">
          <button className="icon-btn" onClick={() => setAnchor(addMonths(anchor, -1))} aria-label="Mes anterior"><Icon name="left" /></button>
          <button className="btn btn-soft" onClick={() => { setAnchor(t); setSelected(t) }}>Hoy</button>
          <button className="icon-btn" onClick={() => setAnchor(addMonths(anchor, 1))} aria-label="Mes siguiente"><Icon name="right" /></button>
        </div>
      </header>

      <div className="month-layout">
        <div className="month-grid card">
          {WD.map((w) => <div key={w} className="wd">{w}</div>)}
          {cells.map((d) => {
            const tasks = sortTasks(state.tasks.filter((x) => x.date === d))
            const pend = tasks.filter((x) => !x.done)
            const allDone = tasks.length > 0 && pend.length === 0
            return (
              <DropZone key={d} date={d} onClick={() => setSelected(d)}
                className={`cell ${d.slice(0, 7) !== month ? 'other' : ''} ${d === t ? 'is-today' : ''} ${d === selected ? 'is-selected' : ''}`}>
                <div className="cell-num">{Number(d.slice(8))}{allDone && <span title="¡Todo hecho!"> ✨</span>}</div>
                <div className="cell-tasks">
                  {pend.slice(0, 3).map((x) => <TaskCard key={x.id} compact task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} />)}
                  {pend.length > 3 && <span className="more">+{pend.length - 3} más</span>}
                </div>
                <div className="cell-dots">
                  {pend.slice(0, 5).map((x) => <span key={x.id} className="dot" style={{ background: catMap.get(x.categoryId ?? '')?.color ?? '#C9B9A6' }} />)}
                </div>
              </DropZone>
            )
          })}
        </div>

        <aside className="card day-panel">
          <p className="eyebrow">{fmt.weekday(selected)}</p>
          <h2>{fmt.dayMonth(selected)}</h2>
          <QuickAdd compact categories={state.categories} defaultDate={selected} onAdd={store.addTask} placeholder="Añadir a este día…" />
          {selTasks.length === 0 ? <p className="muted">Sin tareas este día. 🍵</p> : (
            <div className="task-list">
              {selTasks.map((x) => <TaskCard key={x.id} task={x} category={catMap.get(x.categoryId ?? '')} onOpen={onOpen} onToggle={onToggle} />)}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
