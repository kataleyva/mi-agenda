export type ToastKind = 'ok' | 'info' | 'alarm'
export interface ToastMsg {
  id: number
  text: string
  kind: ToastKind
  action?: { label: string; run: () => void }
}

type Listener = (t: ToastMsg) => void
const listeners = new Set<Listener>()
let n = 0

export function toast(text: string, kind: ToastKind = 'info', action?: ToastMsg['action']) {
  const t = { id: ++n, text, kind, action }
  listeners.forEach((l) => l(t))
}

export function onToast(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
