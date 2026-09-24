import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// PWA (vite-plugin-pwa) dipasang di tahap 7.
export default defineConfig({
  plugins: [react()],
})
