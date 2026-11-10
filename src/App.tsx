import { useCallback, useMemo, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import confetti from 'canvas-confetti'
import { useStore } from './lib/store'
import type { Task, ViewName } from './lib/types'
import { relativeLabel, todayKey } from './lib/dates'
import { useAlarms } from './lib/alarms'
import { CHEERS, levelFor, pick } from './lib/quotes'
import { toast } from './lib/toast'
import { Icon } from './components/Icon'
import { TaskCard } from './components/TaskCard'
import { TaskModal } from './components/TaskModal'
import { Settings } from './components/Settings'
import { Toasts } from './components/Toasts'
import { TodayView } from './views/TodayView'
import { WeekView } from './views/WeekView'
import { MonthView } from './views/MonthView'
import { ListView } from './views/ListView'
import { ProgressView } from './views/ProgressView'
import type { ViewProps } from './views/common'

const CONFETTI = ['#C96F4A', '#E8A87C', '#E6C27A', '#9CAF88', '#A9C6D6', '#E8B4C0', '#B8A9D6']

const NAV: { id: ViewName; label: string; icon: string }[] = [
  { id: 'hoy', label: 'Hoy', icon: 'sun' },
  { id: 'semana', label: 'Semana', icon: 'week' },
  { id: 'mes', label: 'Calendario', icon: 'month' },
  { id: 'pendientes', label: 'Pendientes', icon: 'inbox' },
  { id: 'progreso', label: 'Progreso', icon: 'chart' },
]

function readView(): ViewName {
  try {
    const v = localStorage.getItem('mi-agenda:view') as ViewName | null
    if (v && NAV.some((n) => n.id === v)) return v
  } catch { /* nada */ }
  return 'hoy'
}

export default function App() {
  const store = useStore()
  const { state } = store
  const [view, setViewState] = useState<ViewName>(readView)
  const [openId, setOpenId] = useState<string | null>(null)
  const [settings, setSettings] = useState(false)
  const [dragTask, setDragTask] = useState<Task | null>(null)

  const setView = (v: ViewName) => {
    setViewState(v)
    try { localStorage.setItem('mi-agenda:view', v) } catch { /* nada */ }
  }

  const catMap = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories])
  const openTask = state.tasks.find((t) => t.id === openId) ?? null
  const t = todayKey()
  const todayPending = state.tasks.filter((x) => x.date === t && !x.done).length
  const overdue = state.tasks.filter((x) => !x.done && x.date && x.date < t).length

  useAlarms(
    state.tasks,
    (task) => store.updateTask(task.id, { alarmFired: true, snoozeUntil: null }),
    (task) => store.updateTask(task.id, { alarmFired: false, snoozeUntil: new Date(Date.now() + 10 * 60000).toISOString() }),
  )

  const onToggle = useCallback((task: Task, el: HTMLElement) => {
    const completing = !task.done
    const before = levelFor(state.stats.points)
    store.toggleDone(task.id)
    if (!completing) return
    const r = el.getBoundingClientRect()
    const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) confetti({ particleCount: 40, spread: 60, startVelocity: 25, origin, colors: CONFETTI, scalar: 0.8, ticks: 120 })

    const pts = task.priority === 'alta' ? 15 : task.priority === 'media' ? 10 : 5
    const after = levelFor(state.stats.points + pts)
    const remainingToday = state.tasks.filter((x) => x.date === t && !x.done && x.id !== task.id).length
    if (after.index > before.index) {
      toast(`¡Subiste a nivel ${after.emoji} ${after.name}!`, 'ok')
      if (!reduce) confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 }, colors: CONFETTI })
    } else if (task.date === t && remainingToday === 0) {
      toast('🌻 ¡Completaste todo lo de hoy! Eres increíble.', 'ok')
      if (!reduce) {
        confetti({ particleCount: 120, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: CONFETTI })
        confetti({ particleCount: 120, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: CONFETTI })
      }
    } else {
      toast(`${pick(CHEERS)} +${pts} puntos`, 'ok')
    }
    if (task.repeat !== 'nunca') toast('🔁 La siguiente repetición ya está en tu agenda', 'info')
  }, [state.stats.points, state.tasks, store, t])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )

  const onDragStart = (e: DragStartEvent) => setDragTask((e.active.data.current?.task as Task) ?? null)
  const onDragEnd = (e: DragEndEvent) => {
    setDragTask(null)
    const task = e.active.data.current?.task as Task | undefined
    const over = e.over?.id ? String(e.over.id) : null
    if (!task || !over?.startsWith('day:')) return
    const raw = over.slice(4)
    const date = raw === 'none' ? null : raw
    if (date === task.date) return
    const prev = task.date
    store.updateTask(task.id, { date })
    toast(`📅 “${task.title}” → ${relativeLabel(date)}`, 'info', { label: 'Deshacer', run: () => store.updateTask(task.id, { date: prev }) })
  }

  const props: ViewProps = { store, catMap, onOpen: (x) => setOpenId(x.id), onToggle }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragTask(null)}>
      <div className="app">
        <nav className="sidebar" aria-label="Secciones">
          <div className="brand">
            <span className="brand-logo">🌿</span>
            <span className="brand-name">Mi Agenda</span>
          </div>
          {NAV.map((n) => (
            <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)} aria-current={view === n.id ? 'page' : undefined}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
              {n.id === 'hoy' && todayPending > 0 && <span className="badge-n">{todayPending}</span>}
              {n.id === 'pendientes' && overdue > 0 && <span className="badge-n warn">{overdue}</span>}
            </button>
          ))}
          <div className="sidebar-foot">
            <button className="nav-item" onClick={() => setSettings(true)}>
              <Icon name="settings" size={20} /><span>Ajustes</span>
            </button>
          </div>
        </nav>

        <main className="main" key={view}>
          {view === 'hoy' && <TodayView {...props} />}
          {view === 'semana' && <WeekView {...props} />}
          {view === 'mes' && <MonthView {...props} />}
          {view === 'pendientes' && <ListView {...props} />}
          {view === 'progreso' && <ProgressView {...props} />}
        </main>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' }}>
        {dragTask && <TaskCard overlay task={dragTask} category={catMap.get(dragTask.categoryId ?? '')} onOpen={() => {}} onToggle={() => {}} />}
      </DragOverlay>

      {openTask && <TaskModal key={openTask.id} task={openTask} categories={state.categories} onSave={store.updateTask} onDelete={store.deleteTask} onToggle={(el) => onToggle(openTask, el)} onClose={() => setOpenId(null)} />}
      {settings && <Settings store={store} onClose={() => setSettings(false)} />}
      <Toasts />
    </DndContext>
  )
}
