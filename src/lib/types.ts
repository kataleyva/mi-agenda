export type Priority = 'baja' | 'media' | 'alta'
export type Repeat = 'nunca' | 'diario' | 'semanal' | 'mensual'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes: string
  /** YYYY-MM-DD, o null si está en "Algún día" */
  date: string | null
  /** HH:MM opcional */
  time: string | null
  categoryId: string | null
  priority: Priority
  /** minutos antes de la hora (o del inicio del día si no hay hora); null = sin alarma */
  alarm: number | null
  alarmFired: boolean
  /** ISO: si se pospuso, cuándo vuelve a sonar */
  snoozeUntil?: string | null
  repeat: Repeat
  subtasks: Subtask[]
  done: boolean
  doneAt: string | null
  createdAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  emoji: string
}

export interface Stats {
  points: number
  /** fecha YYYY-MM-DD -> tareas completadas ese día */
  completedByDay: Record<string, number>
}

export interface AppState {
  tasks: Task[]
  categories: Category[]
  stats: Stats
  userName: string
  version: 1
}

export type ViewName = 'hoy' | 'semana' | 'mes' | 'pendientes' | 'progreso'
