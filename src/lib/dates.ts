const pad = (n: number) => String(n).padStart(2, '0')

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = () => toKey(new Date())

export function addDays(k: string, n: number): string {
  const d = fromKey(k)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function addMonths(k: string, n: number): string {
  const d = fromKey(k)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return toKey(d)
}

/** Lunes de la semana */
export function startOfWeek(k: string): string {
  const d = fromKey(k)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return toKey(d)
}

export function weekDays(k: string): string[] {
  const s = startOfWeek(k)
  return Array.from({ length: 7 }, (_, i) => addDays(s, i))
}

/** Celdas del calendario mensual (semanas completas, lunes a domingo) */
export function monthGrid(k: string): string[] {
  const d = fromKey(k)
  const first = toKey(new Date(d.getFullYear(), d.getMonth(), 1))
  const lastD = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const start = startOfWeek(first)
  const end = addDays(startOfWeek(toKey(lastD)), 6)
  const out: string[] = []
  for (let c = start; c <= end; c = addDays(c, 1)) out.push(c)
  return out
}

export function diffDays(a: string, b: string): number {
  return Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86400000)
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const fmt = {
  weekday: (k: string) => cap(fromKey(k).toLocaleDateString('es', { weekday: 'long' })),
  weekdayShort: (k: string) => cap(fromKey(k).toLocaleDateString('es', { weekday: 'short' }).replace('.', '')),
  dayMonth: (k: string) => fromKey(k).toLocaleDateString('es', { day: 'numeric', month: 'long' }),
  monthYear: (k: string) => cap(fromKey(k).toLocaleDateString('es', { month: 'long', year: 'numeric' })),
  long: (k: string) => cap(fromKey(k).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })),
}

export function relativeLabel(k: string | null): string {
  if (!k) return 'Algún día'
  const d = diffDays(k, todayKey())
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  if (d === -1) return 'Ayer'
  if (d === 2) return 'Pasado mañana'
  if (d > 2 && d < 7) return fmt.weekday(k)
  if (d < 0) return `Hace ${-d} días`
  return fmt.dayMonth(k)
}
