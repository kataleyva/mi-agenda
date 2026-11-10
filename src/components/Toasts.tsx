import { useEffect, useState } from 'react'
import { onToast, type ToastMsg } from '../lib/toast'

export function Toasts() {
  const [items, setItems] = useState<ToastMsg[]>([])
  useEffect(
    () =>
      onToast((t) => {
        setItems((xs) => [...xs.slice(-3), t])
        setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), t.kind === 'alarm' ? 15000 : 3200)
      }),
    [],
  )
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <span>{t.text}</span>
          {t.action && (
            <button className="toast-action" onClick={() => { t.action!.run(); setItems((xs) => xs.filter((x) => x.id !== t.id)) }}>
              {t.action.label}
            </button>
          )}
          <button className="toast-close" aria-label="Cerrar" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>×</button>
        </div>
      ))}
    </div>
  )
}
