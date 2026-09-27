import * as Phaser from 'phaser'
import { WARNA } from '../../app/tokens'
import type { GameModule, MountOptions } from '../../shared/types'
import { AdeganBakiak, kunciTekstur, type DataTim } from './AdeganBakiak'
import { gambarAnggota, susunTim, type Raut } from './tekstur'
import { LAJUR, LEBAR, TINGGI } from './tata'

interface Pasangan {
  wadah: HTMLDivElement
  game: Phaser.Game | null
  adegan: AdeganBakiak | null
  batal: boolean
  dijeda: boolean
}

let aktif: Pasangan | null = null
/** Pilihan Tim Kompak terakhir, supaya "Ulang dari awal" tidak perlu memilih lagi. */
let kompakTerakhir = false

/** Tunggu font token siap supaya teks kanvas tidak memakai font cadangan. */
function tungguFont() {
  const muat = ['800 40px "Baloo 2"', '700 40px "Baloo 2"', '700 30px "Nunito"'].map((f) => document.fonts.load(f).catch(() => []))
  return Promise.race([Promise.all(muat), new Promise((r) => setTimeout(r, 2500))])
}

async function siapkanTekstur(tim: DataTim[], resolusi: number, kepala: boolean) {
  const tinggi = Math.max(LAJUR[0].tinggiKarakter, LAJUR[1].tinggiKarakter) * resolusi
  const tugas: Promise<[string, HTMLCanvasElement]>[] = []
  tim.forEach((t, i) =>
    t.anggota.forEach((a, j) => {
      const raut: Raut[] = kepala ? ['jalan', 'kaget', 'senang', 'kepala'] : ['jalan', 'kaget', 'senang']
      for (const r of raut) {
        const h = r === 'kepala' ? 104 * resolusi : tinggi
        tugas.push(gambarAnggota(a, r, h).then((c) => [kunciTekstur(i, j, r), c]))
      }
    }),
  )
  return new Map(await Promise.all(tugas))
}

async function pasang(el: HTMLElement, opts: MountOptions, p: Pasangan) {
  const [a, b] = opts.players
  if (!a || !b) return
  const tim: [DataTim, DataTim] = [
    { pemain: a, anggota: susunTim(a), manusia: a.avatar !== 'cpu' },
    { pemain: b, anggota: susunTim(b), manusia: opts.mode !== 'cpu' && b.avatar !== 'cpu' },
  ]
  // Kanvas dirender lebih rapat di layar besar (PID, laptop) supaya tetap tajam; HP tetap 1x.
  const skalaPanggung = el.getBoundingClientRect().width / LEBAR || 1
  const resolusi = Math.min(1.5, Math.max(1, Math.round(skalaPanggung * (window.devicePixelRatio || 1) * 4) / 4))
  const [, kanvas] = await Promise.all([tungguFont(), siapkanTekstur(tim, resolusi, opts.mode === 'split')])
  if (p.batal) return

  const adegan = new AdeganBakiak({
    mode: opts.mode === 'split' ? 'split' : 'cpu',
    tim,
    kesulitan: opts.difficulty,
    resolusi,
    gerak: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    petunjukKeyboard: window.matchMedia('(pointer: fine)').matches,
    kompakAwal: kompakTerakhir,
    simpanKompak: (v) => {
      kompakTerakhir = v
    },
    kanvas,
    onFinish: opts.onFinish,
  })
  p.adegan = adegan
  if (p.dijeda) adegan.jeda()
  p.wadah.textContent = ''
  p.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: p.wadah,
    backgroundColor: WARNA.kayu,
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scale: { mode: Phaser.Scale.NONE, width: LEBAR * resolusi, height: TINGGI * resolusi, zoom: 1 / resolusi },
    scene: adegan,
  })
}

/** Bakiak — game ritme (Phaser 3): dua tim berlomba 25 meter mengikuti aba-aba. */
const bakiak: GameModule = {
  id: 'bakiak',
  modes: ['cpu', 'split'],
  orientation: 'landscape',
  // Nama tim dan jarak sudah tampil di panggung.
  hud: 'tombol',

  mount(el, opts) {
    const wadah = document.createElement('div')
    wadah.style.cssText =
      'position:absolute;inset:0;display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;' +
      'background:var(--kayu);color:var(--kertas-terang);font:800 40px var(--font-judul)'
    wadah.textContent = 'Menyiapkan lintasan…'
    el.appendChild(wadah)
    const p: Pasangan = { wadah, game: null, adegan: null, batal: false, dijeda: false }
    aktif = p
    pasang(el, opts, p).catch(() => {
      if (!p.batal) wadah.textContent = 'Lintasan gagal disiapkan. Keluar lalu coba lagi.'
    })
  },

  unmount() {
    const p = aktif
    aktif = null
    if (!p) return
    p.batal = true
    p.game?.destroy(true)
    p.wadah.remove()
  },

  pause() {
    if (!aktif) return
    aktif.dijeda = true
    aktif.adegan?.jeda()
  },

  resume() {
    if (!aktif) return
    aktif.dijeda = false
    aktif.adegan?.lanjut()
  },
}

export default bakiak
