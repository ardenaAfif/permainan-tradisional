import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/tokens.css'
import './app/global.css'
import { App } from './app/App'
import { audio } from './shared/audio/AudioManager'
import './app/pwa' // menangkap tawaran pasang (beforeinstallprompt) sedini mungkin

// Cadangan untuk tautan langsung (tanpa lewat tombol Mulai): tap pertama membuka audio.
window.addEventListener('pointerdown', () => audio.buka(), { once: true, capture: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
