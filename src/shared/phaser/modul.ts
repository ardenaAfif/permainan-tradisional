/**
 * Kerangka GameModule untuk game Phaser: wadah + teks "menyiapkan", aset
 * disiapkan async, skala render untuk layar besar, jeda/lanjut, dan pelepasan.
 * Game cukup menyiapkan adegannya (lihat games/bakiak, games/kelereng).
 */
import * as Phaser from 'phaser'
import { WARNA } from '../../app/tokens'
import { STAGE_H, STAGE_W } from '../../app/stage/stageCoords'
import type { GameMode, GameModule, MountOptions, Orientasi } from '../types'

/** Adegan yang bisa dijeda GameShell (tab disembunyikan, HP diputar, tombol jeda). */
export interface AdeganJeda extends Phaser.Scene {
  jeda(): void
  lanjut(): void
}

export interface LingkunganPhaser {
  /** Skala render kanvas (1–1,5): lebih rapat di PID/laptop supaya tajam, HP tetap 1x. */
  resolusi: number
  /** false jika pemain meminta gerak dikurangi. */
  gerak: boolean
  /** Perangkat bermouse/keyboard: tampilkan petunjuk huruf. */
  keyboard: boolean
  /**
   * Panggung tegak (720x1280) saat dipasang; hanya untuk game orientasi 'any'.
   * Jika HP diputar, ukuran game berubah dan adegan menerima event 'resize'
   * dari this.scale (lebar/tinggi baru = this.scale.width / resolusi).
   */
  tegak: boolean
}

interface DefinisiModul {
  id: string
  modes: GameMode[]
  orientation: Orientasi
  hud?: GameModule['hud']
  physics?: Phaser.Types.Core.PhysicsConfig
  siapkan(opts: MountOptions, env: LingkunganPhaser): Promise<AdeganJeda>
}

interface Pasangan {
  wadah: HTMLDivElement
  pantau: ResizeObserver | null
  game: Phaser.Game | null
  adegan: AdeganJeda | null
  batal: boolean
  dijeda: boolean
}

/** Tunggu font token siap supaya teks kanvas tidak memakai font cadangan. */
function tungguFont() {
  const muat = ['800 40px "Baloo 2"', '700 40px "Baloo 2"', '700 30px "Nunito"'].map((f) => document.fonts.load(f).catch(() => []))
  return Promise.race([Promise.all(muat), new Promise((r) => setTimeout(r, 2500))])
}

/** Ukuran panggung (px panggung, sebelum diskalakan): 1280x720, atau 720x1280 bila tegak. */
function ukuranPanggung(el: HTMLElement, orientasi: Orientasi) {
  const tegak = orientasi === 'any' && el.offsetHeight > el.offsetWidth
  return { tegak, lebar: tegak ? STAGE_H : STAGE_W, tinggi: tegak ? STAGE_W : STAGE_H }
}

function hitungResolusi(el: HTMLElement) {
  const skalaPanggung = el.getBoundingClientRect().width / (el.offsetWidth || STAGE_W) || 1
  return Math.min(1.5, Math.max(1, Math.round(skalaPanggung * (window.devicePixelRatio || 1) * 4) / 4))
}

/** Jeda adegan (aman dipanggil di dalam create()). */
export function jedakanAdegan(scene: Phaser.Scene) {
  const st = scene.sys.getStatus()
  if (st === Phaser.Scenes.CREATING || st === Phaser.Scenes.RUNNING) scene.scene.pause()
}

/** Lanjutkan adegan; ukuran panggung bisa berubah selama jeda (HP diputar), jadi konversi sentuhan diperbarui. */
export function lanjutkanAdegan(scene: Phaser.Scene) {
  if (!scene.sys.isPaused()) return
  scene.scene.resume()
  scene.scale.refresh()
}

export function buatModulPhaser(def: DefinisiModul): GameModule {
  let aktif: Pasangan | null = null

  async function pasang(el: HTMLElement, opts: MountOptions, p: Pasangan) {
    const resolusi = hitungResolusi(el)
    const ukuran = ukuranPanggung(el, def.orientation)
    const env: LingkunganPhaser = {
      resolusi,
      gerak: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      keyboard: window.matchMedia('(pointer: fine)').matches,
      tegak: ukuran.tegak,
    }
    const [, adegan] = await Promise.all([tungguFont(), def.siapkan(opts, env)])
    if (p.batal) return
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
      scale: { mode: Phaser.Scale.NONE, width: ukuran.lebar * resolusi, height: ukuran.tinggi * resolusi, zoom: 1 / resolusi },
      ...(def.physics && { physics: def.physics }),
      scene: adegan,
    })
    // Game orientasi 'any': panggung berputar bersama HP, kanvas ikut berubah ukuran.
    if (def.orientation === 'any' && 'ResizeObserver' in window) {
      let lalu = ukuran.tegak
      p.pantau = new ResizeObserver(() => {
        const baru = ukuranPanggung(el, def.orientation)
        if (baru.tegak === lalu || !p.game) return
        lalu = baru.tegak
        p.game.scale.resize(baru.lebar * resolusi, baru.tinggi * resolusi)
      })
      p.pantau.observe(el)
    }
  }

  return {
    id: def.id,
    modes: def.modes,
    orientation: def.orientation,
    hud: def.hud,

    mount(el, opts) {
      const wadah = document.createElement('div')
      wadah.style.cssText =
        'position:absolute;inset:0;display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;' +
        'background:var(--kayu);color:var(--kertas-terang);font:800 40px var(--font-judul)'
      wadah.textContent = 'Menyiapkan permainan…'
      el.appendChild(wadah)
      const p: Pasangan = { wadah, pantau: null, game: null, adegan: null, batal: false, dijeda: false }
      aktif = p
      pasang(el, opts, p).catch(() => {
        if (!p.batal) wadah.textContent = 'Permainan gagal disiapkan. Keluar lalu coba lagi.'
      })
    },

    unmount() {
      const p = aktif
      aktif = null
      if (!p) return
      p.batal = true
      p.pantau?.disconnect()
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
}
