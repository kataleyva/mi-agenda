import { useDraggable } from '@dnd-kit/core'
import { useState } from 'react'
import type { Category, Task } from '../lib/types'
import { relativeLabel, todayKey } from '../lib/dates'
import { Icon } from './Icon'

interface Props {
  task: Task
  category?: Category
  onToggle: (t: Task, el: HTMLElement) => void
  onOpen: (t: Task) => void
  showDate?: boolean
  compact?: boolean
  overlay?: boolean
}

export function TaskCard({ task, category, onToggle, onOpen, showDate, compact, overlay }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `task:${task.id}`, data: { task }, disabled: overlay })
  const [popping, setPopping] = useState(false)
  const overdue = !task.done && task.date !== null && task.date < todayKey()
  const subDone = task.subtasks.filter((s) => s.done).length
  const color = category?.color ?? '#C9B9A6'

  return (
    <div
      ref={setNodeRef}
      className={`task ${task.done ? 'done' : ''} ${compact ? 'compact' : ''} ${isDragging ? 'dragging' : ''} ${overlay ? 'overlay' : ''} ${popping ? 'pop' : ''}`}
      style={{ '--cat': color } as React.CSSProperties}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(task) }}
    >
      <button
        className="check"
        aria-label={task.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          if (!task.done) {
            setPopping(true)
            setTimeout(() => setPopping(false), 500)
          }
          onToggle(task, e.currentTarget)
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="task-body">
        <div className="task-title">
          {task.priority === 'alta' && !task.done && <span className="prio-flag" title="Prioridad alta">●</span>}
          {task.title}
        </div>
        {!compact && (
          <div className="task-meta">
            {category && <span title={category.name} className="chip" style={{ background: color + '30', color: 'var(--ink)' }}>{category.emoji}<span className="chip-name"> {category.name}</span></span>}
            {showDate && <span className={`meta ${overdue ? 'overdue' : ''}`}>📅 {relativeLabel(task.date)}</span>}
            {task.time && <span className="meta"><Icon name="clock" size={13} /> {task.time}</span>}
            {task.alarm !== null && <span className="meta" title="Tiene alarma"><Icon name="bell" size={13} /></span>}
            {task.repeat !== 'nunca' && <span className="meta" title={`Se repite: ${task.repeat}`}><Icon name="repeat" size={13} /> {task.repeat}</span>}
            {task.subtasks.length > 0 && <span className="meta">☑ {subDone}/{task.subtasks.length}</span>}
          </div>
        )}
        {compact && task.time && <div className="task-meta"><span className="meta">{task.time}</span></div>}
      </div>
    </div>
  )
}
