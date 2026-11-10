import { useCallback, useEffect, useState } from 'react'
import type { AppState, Category, Task } from './types'
import { addDays, addMonths, todayKey } from './dates'

const KEY = 'mi-agenda:v1'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'trabajo', name: 'Trabajo', color: '#C96F4A', emoji: '💼' },
  { id: 'personal', name: 'Personal', color: '#9CAF88', emoji: '🌿' },
  { id: 'hogar', name: 'Hogar', color: '#E6C27A', emoji: '🏠' },
  { id: 'salud', name: 'Salud', color: '#E8B4C0', emoji: '💪' },
  { id: 'estudio', name: 'Estudio', color: '#B8A9D6', emoji: '📚' },
  { id: 'finanzas', name: 'Finanzas', color: '#A9C6D6', emoji: '💰' },
]

export function newTask(partial: Partial<Task>): Task {
  return {
    id: uid(),
    title: '',
    notes: '',
    date: todayKey(),
    time: null,
    categoryId: null,
    priority: 'media',
    alarm: null,
    alarmFired: false,
    repeat: 'nunca',
    subtasks: [],
    done: false,
    doneAt: null,
    createdAt: new Date().toISOString(),
    ...partial,
  }
}

function seed(): AppState {
  const t = todayKey()
  return {
    version: 1,
    userName: '',
    categories: DEFAULT_CATEGORIES,
    stats: { points: 0, completedByDay: {} },
    tasks: [
      newTask({ title: '¡Bienvenida! Toca esta tarea para ver sus detalles ✨', categoryId: 'personal', priority: 'baja',
        notes: 'Aquí puedes escribir notas, cambiar la fecha, poner una alarma o agregar subtareas.' }),
      newTask({ title: 'Arrastra esta tarea a otro día en la vista Semana', categoryId: 'personal' }),
      newTask({ title: 'Tomar 8 vasos de agua', categoryId: 'salud', repeat: 'diario', priority: 'baja' }),
      newTask({ title: 'Revisar correos importantes', categoryId: 'trabajo', time: '09:00', priority: 'alta', alarm: 10 }),
      newTask({ title: 'Planear las compras de la semana', categoryId: 'hogar', date: addDays(t, 1),
        subtasks: [{ id: uid(), title: 'Frutas y verduras', done: false }, { id: uid(), title: 'Café', done: false }] }),
      newTask({ title: 'Pagar tarjeta de crédito', categoryId: 'finanzas', date: addDays(t, 3), priority: 'alta' }),
      newTask({ title: 'Aprender algo nuevo', categoryId: 'estudio', date: null, priority: 'baja' }),
    ],
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as AppState
      if (s && Array.isArray(s.tasks)) return s
    }
  } catch {
    /* sin almacenamiento disponible */
  }
  return seed()
}

function nextDate(date: string, repeat: Task['repeat']): string {
  if (repeat === 'diario') return addDays(date, 1)
  if (repeat === 'semanal') return addDays(date, 7)
  return addMonths(date, 1)
}

export function useStore() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignorar */
    }
  }, [state])

  const addTask = useCallback((partial: Partial<Task>) => {
    const t = newTask(partial)
    setState((s) => ({ ...s, tasks: [...s.tasks, t] }))
    return t
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t
        const next = { ...t, ...patch }
        // Si cambia la fecha/hora/alarma, la alarma vuelve a estar pendiente
        if ('date' in patch || 'time' in patch || 'alarm' in patch) {
          next.alarmFired = false
          if (!('snoozeUntil' in patch)) next.snoozeUntil = null
        }
        return next
      }),
    }))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
  }, [])

  const toggleDone = useCallback((id: string) => {
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id)
      if (!task) return s
      const today = todayKey()
      const stats = { ...s.stats, completedByDay: { ...s.stats.completedByDay } }
      let tasks = s.tasks
      if (!task.done) {
        const pts = task.priority === 'alta' ? 15 : task.priority === 'media' ? 10 : 5
        stats.points += pts
        stats.completedByDay[today] = (stats.completedByDay[today] ?? 0) + 1
        tasks = tasks.map((t) => (t.id === id ? { ...t, done: true, doneAt: new Date().toISOString() } : t))
        if (task.repeat !== 'nunca' && task.date) {
          let nd = nextDate(task.date, task.repeat)
          while (nd < today) nd = nextDate(nd, task.repeat)
          tasks = [...tasks, newTask({ ...task, id: uid(), date: nd, done: false, doneAt: null, alarmFired: false,
            subtasks: task.subtasks.map((st) => ({ ...st, done: false })), createdAt: new Date().toISOString() })]
        }
      } else {
        const pts = task.priority === 'alta' ? 15 : task.priority === 'media' ? 10 : 5
        stats.points = Math.max(0, stats.points - pts)
        const local = task.doneAt ? toLocalKey(task.doneAt) : today
        if (stats.completedByDay[local]) stats.completedByDay[local] = Math.max(0, stats.completedByDay[local] - 1)
        tasks = tasks.map((t) => (t.id === id ? { ...t, done: false, doneAt: null } : t))
      }
      return { ...s, tasks, stats }
    })
  }, [])

  const moveOverdueToToday = useCallback(() => {
    const t = todayKey()
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((x) => (!x.done && x.date && x.date < t ? { ...x, date: t, alarmFired: false } : x)),
    }))
  }, [])

  const saveCategory = useCallback((c: Category) => {
    setState((s) => ({
      ...s,
      categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c],
    }))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      tasks: s.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
    }))
  }, [])

  const setUserName = useCallback((userName: string) => setState((s) => ({ ...s, userName })), [])
  const clearDone = useCallback(() => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => !t.done) })), [])
  const replaceAll = useCallback((next: AppState) => setState(next), [])

  return { state, addTask, updateTask, deleteTask, toggleDone, moveOverdueToToday, saveCategory, deleteCategory, setUserName, clearDone, replaceAll }
}

function toLocalKey(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function streak(completedByDay: Record<string, number>): number {
  let k = todayKey()
  if (!completedByDay[k]) k = addDays(k, -1)
  let n = 0
  while (completedByDay[k]) {
    n++
    k = addDays(k, -1)
  }
  return n
}

export type Store = ReturnType<typeof useStore>
