import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa para que funcione igual en GitHub Pages o en cualquier carpeta
export default defineConfig({
  base: './',
  plugins: [react()],
})
