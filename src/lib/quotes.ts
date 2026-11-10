export const QUOTES = [
  'Un paso pequeño también es avanzar. 🌱',
  'Hoy es un buen día para empezar por lo más sencillo.',
  'No tienes que hacerlo todo, solo lo siguiente.',
  'La constancia florece despacio, pero florece. 🌸',
  'Tu yo de mañana te lo va a agradecer.',
  'Hecho es mejor que perfecto.',
  'Respira, prioriza y avanza. ☕',
  'Cada tarea tachada es un regalo para ti.',
  'Lo importante primero; lo demás, después.',
  'Eres más capaz de lo que crees. ✨',
  'Organizar tu día es cuidar de ti.',
  'Las raíces fuertes crecen en silencio. 🌿',
]

export const CHEERS = [
  '¡Bien hecho! 🎉',
  '¡Una menos! 💪',
  '¡Vas con todo! 🌟',
  '¡Así se hace! 🌻',
  '¡Imparable! 🚀',
  '¡Qué orgullo! 🌈',
  '¡Sigue así! 🍃',
]

export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export function quoteOfDay(key: string): string {
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return QUOTES[h % QUOTES.length]
}

export const LEVELS = [
  { min: 0, name: 'Semilla', emoji: '🌰' },
  { min: 100, name: 'Brote', emoji: '🌱' },
  { min: 300, name: 'Hoja', emoji: '🍃' },
  { min: 600, name: 'Flor', emoji: '🌼' },
  { min: 1000, name: 'Árbol', emoji: '🌳' },
  { min: 1600, name: 'Bosque', emoji: '🌲' },
  { min: 2500, name: 'Montaña', emoji: '⛰️' },
]

export function levelFor(points: number) {
  let i = 0
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++
  const cur = LEVELS[i]
  const next = LEVELS[i + 1]
  const progress = next ? (points - cur.min) / (next.min - cur.min) : 1
  return { index: i, ...cur, next, progress }
}
