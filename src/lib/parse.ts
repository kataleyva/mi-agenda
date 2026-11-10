import type { Category, Priority } from './types'
import { addDays, todayKey, fromKey, toKey } from './dates'

export interface Parsed {
  title: string
  date?: string | null
  time?: string | null
  categoryId?: string
  priority?: Priority
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Entiende frases como:
 *  "Llamar a mamá mañana 18:00 #familia !alta"
 *  "Pagar luz el viernes", "Comprar pan hoy", "Leer algún día"
 */
export function parseQuick(input: string, categories: Category[]): Parsed {
  let text = ` ${input.trim()} `
  const out: Parsed = { title: '' }

  // Categoría: #nombre
  text = text.replace(/\s#([\p{L}\d_-]+)/gu, (m, name: string) => {
    const c = categories.find((c) => norm(c.name).startsWith(norm(name)))
    if (c) {
      out.categoryId = c.id
      return ' '
    }
    return m
  })

  // Prioridad: !alta !media !baja o !!! / !!
  text = text.replace(/\s!(alta|media|baja|!{1,2})(?=\s)/giu, (_m, p: string) => {
    const v = p.toLowerCase()
    out.priority = v === 'alta' || v === '!!' ? 'alta' : v === 'media' || v === '!' ? 'media' : 'baja'
    return ' '
  })

  // Hora: 18:00, 9:30, a las 5pm, 7am
  text = text.replace(/\s(?:a las\s)?(\d{1,2})(?::(\d{2}))?\s?(am|pm|hrs|h)?(?=\s)/giu, (m, h: string, mm: string | undefined, suf: string | undefined) => {
    if (!mm && !suf) return m
    let hour = Number(h)
    const s = suf?.toLowerCase()
    if (s === 'pm' && hour < 12) hour += 12
    if (s === 'am' && hour === 12) hour = 0
    if (hour > 23 || Number(mm ?? 0) > 59) return m
    out.time = `${String(hour).padStart(2, '0')}:${mm ?? '00'}`
    return ' '
  })

  // Fechas
  const t = todayKey()
  const rules: [RegExp, () => string | null][] = [
    [/\spasado\s+mañana(?=\s)/iu, () => addDays(t, 2)],
    [/\smañana(?=\s)/iu, () => addDays(t, 1)],
    [/\shoy(?=\s)/iu, () => t],
    [/\salg[uú]n\s+d[ií]a(?=\s)/iu, () => null],
    [/\s(?:la\s)?pr[oó]xima\s+semana(?=\s)/iu, () => addDays(t, 7)],
  ]
  for (const [re, fn] of rules) {
    if (re.test(text)) {
      out.date = fn()
      text = text.replace(re, ' ')
      break
    }
  }
  if (out.date === undefined) {
    text = text.replace(/\s(?:el\s)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)(?=\s)/iu, (_m, day: string) => {
      const target = WEEKDAYS.indexOf(norm(day))
      const now = fromKey(t)
      let delta = (target - now.getDay() + 7) % 7
      if (delta === 0) delta = 7
      now.setDate(now.getDate() + delta)
      out.date = toKey(now)
      return ' '
    })
  }
  if (out.date === undefined) {
    // 25/12 o 25/12/2026
    text = text.replace(/\s(?:el\s)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/u, (m, d: string, mo: string, y: string | undefined) => {
      const now = new Date()
      let year = y ? Number(y.length === 2 ? `20${y}` : y) : now.getFullYear()
      const dt = new Date(year, Number(mo) - 1, Number(d))
      if (isNaN(dt.getTime()) || dt.getDate() !== Number(d)) return m
      if (!y && toKey(dt) < t) {
        year += 1
        dt.setFullYear(year)
      }
      out.date = toKey(dt)
      return ' '
    })
  }

  out.title = text.replace(/\s+/g, ' ').trim()
  return out
}
