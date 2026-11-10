import { useDroppable } from '@dnd-kit/core'
import type { Category, Task } from '../lib/types'
import type { Store } from '../lib/store'

export interface ViewProps {
  store: Store
  catMap: Map<string, Category>
  onOpen: (t: Task) => void
  onToggle: (t: Task, el: HTMLElement) => void
}

const PRIO = { alta: 0, media: 1, baja: 2 }

export function sortTasks(ts: Task[]): Task[] {
  return [...ts].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if ((a.date ?? '9999') !== (b.date ?? '9999')) return (a.date ?? '9999') < (b.date ?? '9999') ? -1 : 1
    if ((a.time ?? '99') !== (b.time ?? '99')) return (a.time ?? '99') < (b.time ?? '99') ? -1 : 1
    if (PRIO[a.priority] !== PRIO[b.priority]) return PRIO[a.priority] - PRIO[b.priority]
    return a.createdAt < b.createdAt ? -1 : 1
  })
}

/** Zona donde se pueden soltar tareas para cambiarles la fecha */
export function DropZone({ date, className, children, onClick }: { date: string | null; className?: string; children: React.ReactNode; onClick?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date ?? 'none'}` })
  return (
    <div ref={setNodeRef} className={`${className ?? ''} ${isOver ? 'drop-over' : ''}`} onClick={onClick}>
      {children}
    </div>
  )
}
