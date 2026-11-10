import { useMemo, useState } from 'react'
import type { Category, Task } from '../lib/types'
import { parseQuick } from '../lib/parse'
import { relativeLabel } from '../lib/dates'
import { Icon } from './Icon'

interface Props {
  categories: Category[]
  defaultDate: string | null
  defaultCategoryId?: string | null
  onAdd: (t: Partial<Task>) => void
  placeholder?: string
  compact?: boolean
}

export function QuickAdd({ categories, defaultDate, defaultCategoryId = null, onAdd, placeholder, compact }: Props) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseQuick(text, categories), [text, categories])
  const cat = categories.find((c) => c.id === parsed.categoryId)
  const hasHints = parsed.date !== undefined || parsed.time || cat || parsed.priority

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed.title) return
    onAdd({
      title: parsed.title,
      date: parsed.date === undefined ? defaultDate : parsed.date,
      time: parsed.time ?? null,
      categoryId: parsed.categoryId ?? defaultCategoryId,
      priority: parsed.priority ?? 'media',
    })
    setText('')
  }

  return (
    <form className={`quickadd ${compact ? 'compact' : ''}`} onSubmit={submit}>
      <span className="quickadd-plus"><Icon name="plus" /></span>
      <input value={text} onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? 'Agrega una tarea… ej: "Llamar a mamá mañana 18:00 #personal !alta"'}
        aria-label="Nueva tarea" />
      {hasHints && !compact && (
        <div className="quickadd-hints">
          {parsed.date !== undefined && <span className="hint">📅 {relativeLabel(parsed.date)}</span>}
          {parsed.time && <span className="hint">🕒 {parsed.time}</span>}
          {cat && <span className="hint" style={{ background: cat.color + '33' }}>{cat.emoji} {cat.name}</span>}
          {parsed.priority && <span className={`hint prio-${parsed.priority}`}>Prioridad {parsed.priority}</span>}
        </div>
      )}
      {!compact && <button className="btn btn-primary" type="submit" disabled={!parsed.title}>Agregar</button>}
    </form>
  )
}
