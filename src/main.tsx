import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/tokens.css'
import './app/global.css'
import { App } from './app/App'
import { audio } from './shared/audio/AudioManager'
import './app/pwa' // menangkap tawaran pasang (beforeinstallprompt) sedini mungkin

// Cadangan untuk tautan langsung (tanpa lewat tombol Mulai): tap pertama membuka audio.
window.addEventListener('pointerdown', () => audio.buka(), { once: true, capture: true })

// Bunyi tap untuk semua tombol dan tautan, kecuali di arena game (game punya bunyinya sendiri).
document.addEventListener(
  'click',
  (e) => {
    const el = e.target instanceof Element ? e.target.closest('button:not(:disabled), a[href], [role="radio"]') : null
    if (el && !location.pathname.startsWith('/main/')) audio.sfx('tap')
  },
  { capture: true },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
