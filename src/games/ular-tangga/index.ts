import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { GameModule } from '../../shared/types'
import { UlarTangga, type Kontrol } from './UlarTangga'

let root: Root | null = null
let wadah: HTMLDivElement | null = null
const kontrol: Kontrol = { jam: null }

/** Ular Tangga — game pilot (React + SVG). */
const ularTangga: GameModule = {
  id: 'ular-tangga',
  modes: ['cpu', 'hotseat'],
  orientation: 'landscape',
  // Pemain, giliran, dan posisi sudah tampil di panggung.
  hud: 'tombol',

  mount(el, opts) {
    // Root React sendiri per pemasangan, supaya "Ulang" bisa memasang yang baru
    // sementara root lama dilepas setelah render GameShell selesai.
    wadah = document.createElement('div')
    wadah.style.cssText = 'position:absolute;inset:0'
    el.appendChild(wadah)
    root = createRoot(wadah)
    root.render(createElement(UlarTangga, { opsi: opts, host: el, kontrol }))
  },

  unmount() {
    kontrol.jam?.hentikan()
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
    kontrol.jam?.jeda()
  },

  resume() {
    kontrol.jam?.lanjut()
  },
}

export default ularTangga
