import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Pide al navegador que no borre los datos de la agenda para liberar espacio
try {
  navigator.storage?.persist?.()
} catch {
  /* no disponible */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
