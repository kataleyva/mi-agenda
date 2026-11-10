import { useState } from 'react'
import type { Category, Priority, Repeat, Task } from '../lib/types'
import { addDays, fmt, todayKey } from '../lib/dates'
import { ALARM_OPTIONS, askNotificationPermission } from '../lib/alarms'
import { uid } from '../lib/store'
import { toast } from '../lib/toast'
import { Modal } from './Modal'
import { Icon } from './Icon'

interface Props {
  task: Task
  categories: Category[]
  onSave: (id: string, patch: Partial<Task>) => void
  onDelete: (id: string) => void
  onToggle: (el: HTMLElement) => void
  onClose: () => void
}

export function TaskModal({ task, categories, onSave, onDelete, onToggle, onClose }: Props) {
  const [draft, setDraft] = useState<Task>(task)
  const [newSub, setNewSub] = useState('')
  const set = <K extends keyof Task>(k: K, v: Task[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const t = todayKey()

  const save = () => {
    if (!draft.title.trim()) return onClose()
    const patch: Partial<Task> = {}
    ;(Object.keys(draft) as (keyof Task)[]).forEach((k) => {
      if (JSON.stringify(draft[k]) !== JSON.stringify(task[k])) (patch as Record<string, unknown>)[k] = draft[k]
    })
    onSave(task.id, patch)
    onClose()
  }

  const setAlarm = async (v: number | null) => {
    set('alarm', v)
    if (v !== null) {
      const p = await askNotificationPermission()
      if (p === 'denied') toast('Las notificaciones están bloqueadas: la alarma sonará solo dentro de la app.', 'info')
      if (!draft.date) toast('Ponle una fecha para que la alarma pueda sonar.', 'info')
    }
  }

  const quickDates: [string, string | null][] = [
    ['Hoy', t],
    ['Mañana', addDays(t, 1)],
    ['En 3 días', addDays(t, 3)],
    ['Próx. semana', addDays(t, 7)],
    ['Algún día', null],
  ]

  return (
    <Modal title="Detalles de la tarea" onClose={save}>
      <div className="form">
        <input className="title-input" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="¿Qué hay que hacer?" />

        <div className="field">
          <span>Fecha</span>
          <div className="row wrap">
            <input type="date" value={draft.date ?? ''} onChange={(e) => set('date', e.target.value || null)} />
            {draft.date && (
              <div className="row">
                <button className="btn btn-soft sm" onClick={() => set('date', addDays(draft.date!, -1))} aria-label="Un día antes"><Icon name="left" size={14} /></button>
                <button className="btn btn-soft sm" onClick={() => set('date', addDays(draft.date!, 1))} aria-label="Un día después"><Icon name="right" size={14} /></button>
              </div>
            )}
          </div>
          <div className="pills">
            {quickDates.map(([l, v]) => (
              <button key={l} className={`pill ${draft.date === v ? 'on' : ''}`} onClick={() => set('date', v)}>{l}</button>
            ))}
          </div>
          {draft.date && <small className="muted">{fmt.long(draft.date)}</small>}
        </div>

        <div className="grid2">
          <div className="field">
            <span>Hora</span>
            <div className="row">
              <input type="time" value={draft.time ?? ''} onChange={(e) => set('time', e.target.value || null)} />
              {draft.time && <button className="btn btn-ghost sm" onClick={() => set('time', null)}>Quitar</button>}
            </div>
          </div>
          <label className="field">
            <span>Alarma 🔔</span>
            <select value={draft.alarm ?? ''} onChange={(e) => setAlarm(e.target.value === '' ? null : Number(e.target.value))}>
              {ALARM_OPTIONS.map((o) => <option key={String(o.value)} value={o.value ?? ''}>{o.label}</option>)}
            </select>
            {draft.alarm !== null && !draft.time && <small className="muted">Sin hora, suena a las 09:00.</small>}
          </label>
        </div>

        <div className="field">
          <span>Categoría</span>
          <div className="pills">
            <button className={`pill ${draft.categoryId === null ? 'on' : ''}`} onClick={() => set('categoryId', null)}>Sin categoría</button>
            {categories.map((c) => (
              <button key={c.id} className={`pill ${draft.categoryId === c.id ? 'on' : ''}`}
                style={{ '--pill': c.color } as React.CSSProperties} onClick={() => set('categoryId', c.id)}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <span>Prioridad</span>
            <div className="seg">
              {(['baja', 'media', 'alta'] as Priority[]).map((p) => (
                <button key={p} className={`seg-btn prio-${p} ${draft.priority === p ? 'on' : ''}`} onClick={() => set('priority', p)}>{p}</button>
              ))}
            </div>
          </div>
          <label className="field">
            <span>Repetir</span>
            <select value={draft.repeat} onChange={(e) => set('repeat', e.target.value as Repeat)}>
              <option value="nunca">No se repite</option>
              <option value="diario">Cada día</option>
              <option value="semanal">Cada semana</option>
              <option value="mensual">Cada mes</option>
            </select>
          </label>
        </div>

        <div className="field">
          <span>Subtareas</span>
          <ul className="subtasks">
            {draft.subtasks.map((s) => (
              <li key={s.id} className={s.done ? 'done' : ''}>
                <input type="checkbox" checked={s.done}
                  onChange={() => set('subtasks', draft.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))} />
                <span>{s.title}</span>
                <button className="icon-btn sm" aria-label="Quitar" onClick={() => set('subtasks', draft.subtasks.filter((x) => x.id !== s.id))}><Icon name="x" size={14} /></button>
              </li>
            ))}
          </ul>
          <form className="row" onSubmit={(e) => {
            e.preventDefault()
            if (!newSub.trim()) return
            set('subtasks', [...draft.subtasks, { id: uid(), title: newSub.trim(), done: false }])
            setNewSub('')
          }}>
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Agregar un paso…" />
            <button className="btn btn-soft" type="submit">Añadir</button>
          </form>
        </div>

        <label className="field">
          <span>Notas</span>
          <textarea rows={3} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Detalles, enlaces, ideas…" />
        </label>

        <div className="modal-foot">
          <button className="btn btn-danger" onClick={() => { onDelete(task.id); onClose(); toast('Tarea eliminada', 'info') }}>
            <Icon name="trash" size={16} /> Eliminar
          </button>
          <div className="row">
            <button className="btn btn-soft" onClick={(e) => { const el = e.currentTarget; save(); onToggle(el) }}>
              {task.done ? 'Marcar pendiente' : '✓ Hecha'}
            </button>
            <button className="btn btn-primary" onClick={save}>Guardar</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
