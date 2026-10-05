import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Jam } from '../../shared/jam'
import type { GameModule } from '../../shared/types'
import { DamDaman, type Kontrol } from './DamDaman'

let root: Root | null = null
let wadah: HTMLDivElement | null = null
let jam: Jam | null = null
const kontrol: Kontrol = {
  pasang(j) {
    jam = j
  },
  lepas(j) {
    if (jam === j) jam = null
  },
}

/** Dam-daman — papan bergaris (React + SVG), lawan komputer (AI di Web Worker) atau bergantian. */
const damDaman: GameModule = {
  id: 'dam-daman',
  modes: ['cpu', 'hotseat'],
  // Bisa dimainkan tegak maupun mendatar: panggung ikut berputar.
  orientation: 'any',
  // Pemain, giliran, dan tangkapan sudah tampil di panggung.
  hud: 'tombol',

  mount(el, opts) {
    // Root React sendiri per pemasangan, supaya "Ulang" bisa memasang yang baru
    // sementara root lama dilepas setelah render GameShell selesai.
    wadah = document.createElement('div')
    wadah.style.cssText = 'position:absolute;inset:0'
    el.appendChild(wadah)
    root = createRoot(wadah)
    root.render(createElement(DamDaman, { opsi: opts, host: el, kontrol }))
  },

  unmount() {
    jam?.hentikan()
    const r = root
    const w = wadah
    root = null
    wadah = null
    if (w) w.style.display = 'none'
    // Dipanggil dari efek React GameShell: lepaskan root di luar siklus render.
    setTimeout(() => {
      r?.unmount()
      w?.remove()
    }, 0)
  },

  pause() {
    jam?.jeda()
  },

  resume() {
    jam?.lanjut()
  },
}

export default damDaman
