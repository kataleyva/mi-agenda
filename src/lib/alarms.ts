import { useEffect, useRef } from 'react'
import type { Task } from './types'
import { fromKey } from './dates'
import { toast } from './toast'

export const ALARM_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Sin alarma' },
  { value: 0, label: 'A la hora' },
  { value: 5, label: '5 min antes' },
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
]

export function alarmLabel(v: number | null) {
  return ALARM_OPTIONS.find((o) => o.value === v)?.label ?? `${v} min antes`
}

/** Momento exacto en que suena la alarma */
export function alarmTime(t: Task): Date | null {
  if (t.alarm === null || !t.date) return null
  const d = fromKey(t.date)
  const [h, m] = (t.time ?? '09:00').split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return new Date(d.getTime() - t.alarm * 60000)
}

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function askNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'default') return Notification.requestPermission()
  return Notification.permission
}

function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const notes = [659.25, 783.99, 1046.5]
    notes.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t0 = ctx.currentTime + i * 0.18
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(0.25, t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6)
      o.connect(g).connect(ctx.destination)
      o.start(t0)
      o.stop(t0 + 0.65)
    })
    setTimeout(() => ctx.close(), 1500)
  } catch {
    /* sin audio */
  }
}

/** Revisa cada 15 s si alguna alarma debe sonar */
export function useAlarms(tasks: Task[], onFire: (t: Task) => void, onSnooze: (t: Task) => void) {
  const ref = useRef({ tasks, onFire, onSnooze })
  ref.current = { tasks, onFire, onSnooze }

  useEffect(() => {
    const check = () => {
      const now = Date.now()
      for (const t of ref.current.tasks) {
        if (t.done || t.alarmFired) continue
        const at = t.snoozeUntil ? new Date(t.snoozeUntil) : alarmTime(t)
        // Suena si ya llegó la hora (y no hace más de 12 h, para no avisar de cosas muy viejas)
        if (!at || at.getTime() > now || now - at.getTime() > 12 * 3600000) continue
        ref.current.onFire(t)
        const body = t.time ? `A las ${t.time}` : 'Para hoy'
        chime()
        toast(`⏰ ${t.title} · ${body}`, 'alarm', { label: 'Posponer 10 min', run: () => ref.current.onSnooze(t) })
        if (notificationsSupported() && Notification.permission === 'granted') {
          try {
            new Notification(`⏰ ${t.title}`, { body, icon: '/favicon.svg', tag: t.id })
          } catch {
            /* algunos navegadores móviles solo permiten notificar desde un service worker */
          }
        }
      }
    }
    check()
    const id = setInterval(check, 15000)
    return () => clearInterval(id)
  }, [])
}
