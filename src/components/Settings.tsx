import { useRef, useState } from 'react'
import type { AppState, Category } from '../lib/types'
import type { Store } from '../lib/store'
import { uid } from '../lib/store'
import { CATEGORY_COLORS, EMOJIS } from '../lib/palette'
import { askNotificationPermission, notificationsSupported } from '../lib/alarms'
import { toast } from '../lib/toast'
import { Modal } from './Modal'
import { Icon } from './Icon'

export function Settings({ store, onClose }: { store: Store; onClose: () => void }) {
  const { state } = store
  const [editing, setEditing] = useState<Category | null>(null)
  const [perm, setPerm] = useState(notificationsSupported() ? Notification.permission : 'unsupported')
  const fileRef = useRef<HTMLInputElement>(null)
  const addRef = useRef<HTMLInputElement>(null)
  const [confirmAll, setConfirmAll] = useState(false)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mi-agenda-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as AppState
      if (!Array.isArray(data.tasks) || !Array.isArray(data.categories)) throw new Error()
      store.replaceAll({ ...data, version: 1, stats: data.stats ?? { points: 0, completedByDay: {} } })
      toast('Copia restaurada ✅', 'ok')
    } catch {
      toast('Ese archivo no parece una copia de Mi Agenda.', 'info')
    }
  }

  const addTasks = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as { categories?: Category[]; tasks?: AppState['tasks'] }
      if (!Array.isArray(data.tasks)) throw new Error()
      const existing = new Set(state.tasks.map((t) => t.id))
      const nuevas = data.tasks.filter((t) => t && t.id && t.title && !existing.has(t.id))
      store.importTasks(Array.isArray(data.categories) ? data.categories : [], nuevas)
      toast(nuevas.length ? `📥 ${nuevas.length} tareas agregadas a tu agenda` : 'Esas tareas ya estaban en tu agenda', 'ok')
    } catch {
      toast('No pude leer ese archivo de tareas.', 'info')
    }
  }

  return (
    <Modal title="Ajustes" onClose={onClose} wide>
      <div className="form">
        <label className="field">
          <span>¿Cómo te llamo?</span>
          <input value={state.userName} onChange={(e) => store.setUserName(e.target.value)} placeholder="Tu nombre" />
        </label>

        <div className="field">
          <span>Categorías</span>
          <div className="cat-list">
            {state.categories.map((c) => (
              <div key={c.id} className="cat-row" style={{ '--cat': c.color } as React.CSSProperties}>
                <span className="cat-dot">{c.emoji}</span>
                <span className="grow">{c.name}</span>
                <span className="muted small">{state.tasks.filter((t) => t.categoryId === c.id && !t.done).length} pendientes</span>
                <button className="btn btn-ghost sm" onClick={() => setEditing(c)}>Editar</button>
              </div>
            ))}
          </div>
          <button className="btn btn-soft" onClick={() => setEditing({ id: uid(), name: '', color: CATEGORY_COLORS[state.categories.length % CATEGORY_COLORS.length], emoji: '⭐' })}>
            <Icon name="plus" size={16} /> Nueva categoría
          </button>
        </div>

        {editing && (
          <div className="cat-editor">
            <div className="row">
              <input className="grow" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nombre de la categoría" autoFocus />
            </div>
            <div className="swatches">
              {CATEGORY_COLORS.map((c) => (
                <button key={c} className={`swatch ${editing.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setEditing({ ...editing, color: c })} aria-label={`Color ${c}`} />
              ))}
            </div>
            <div className="emojis">
              {EMOJIS.map((e) => (
                <button key={e} className={`emoji ${editing.emoji === e ? 'on' : ''}`} onClick={() => setEditing({ ...editing, emoji: e })}>{e}</button>
              ))}
            </div>
            <div className="row end">
              {state.categories.some((c) => c.id === editing.id) && (
                <button className="btn btn-danger" onClick={() => { store.deleteCategory(editing.id); setEditing(null) }}>Eliminar</button>
              )}
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary" disabled={!editing.name.trim()} onClick={() => { store.saveCategory({ ...editing, name: editing.name.trim() }); setEditing(null) }}>Guardar</button>
            </div>
          </div>
        )}

        <div className="field">
          <span>Notificaciones de alarmas</span>
          {perm === 'granted' && <p className="muted">✅ Activadas. Las alarmas suenan mientras la agenda esté abierta (puede estar en otra pestaña).</p>}
          {perm === 'denied' && <p className="muted">Bloqueadas en el navegador. Actívalas desde el candado 🔒 de la barra de direcciones. Mientras tanto, las alarmas suenan dentro de la app.</p>}
          {perm === 'default' && (
            <button className="btn btn-soft" onClick={async () => setPerm((await askNotificationPermission()) as NotificationPermission)}>
              <Icon name="bell" size={16} /> Activar notificaciones
            </button>
          )}
          {perm === 'unsupported' && <p className="muted">Este navegador no admite notificaciones; las alarmas suenan dentro de la app.</p>}
        </div>

        <div className="field">
          <span>Tus datos</span>
          <p className="muted">Todo se guarda en este navegador. <strong>Importar tareas</strong> agrega las de un archivo sin borrar nada; <strong>Restaurar copia</strong> reemplaza toda la agenda por la copia.</p>
          <div className="row wrap">
            <button className="btn btn-primary" onClick={() => addRef.current?.click()}>Importar tareas</button>
            <button className="btn btn-soft" onClick={exportData}>Descargar copia</button>
            <button className="btn btn-soft" onClick={() => fileRef.current?.click()}>Restaurar copia</button>
            <button className="btn btn-ghost" onClick={() => { store.clearDone(); toast('Tareas completadas archivadas', 'ok') }}>Borrar completadas</button>
            <button className="btn btn-danger" onClick={() => setConfirmAll(true)}>Borrar todas las tareas</button>
            <input ref={addRef} type="file" accept="application/json,.json" hidden onChange={(e) => { if (e.target.files?.[0]) addTasks(e.target.files[0]); e.target.value = '' }} />
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </div>
          {confirmAll && (
            <div className="cat-editor">
              <p><strong>¿Borrar las {state.tasks.length} tareas?</strong> Tus categorías, puntos y racha se conservan. Esto no se puede deshacer, así que si quieres, descarga una copia antes.</p>
              <div className="row end">
                <button className="btn btn-ghost" onClick={() => setConfirmAll(false)}>Cancelar</button>
                <button className="btn btn-danger" onClick={() => { store.clearAll(); setConfirmAll(false); toast('Agenda vacía. ¡Lista para empezar de cero! 🌱', 'ok') }}>Sí, borrar todo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
