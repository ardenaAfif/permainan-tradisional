/**
 * Kendali sentuh satu tim: seret pelari langsung dengan jari, atau sentuh di
 * mana saja di area tim untuk joystick melayang. Masing-masing mengikuti satu
 * jari sendiri, jadi dua pemain bisa bermain bersamaan di PID (Duel Satu
 * Layar). Mouse juga bisa (tekan lalu seret). Koordinat = px panggung.
 */
import * as Phaser from 'phaser'
import { warnaAngka as w } from '../../app/tokens'
import type { Titik } from './lintasan'

export interface Area {
  x0: number
  y0: number
  lebar: number
  tinggi: number
}

export type ModeSentuh = 'joystick' | 'seret'

export class KendaliSentuh {
  readonly area: Area
  private warna: number
  private res: number
  private gfx: Phaser.GameObjects.Graphics
  private rBasis: number
  private istirahat: Titik
  private pusat: Titik
  private pointer: Phaser.Input.Pointer | null = null
  mode: ModeSentuh | null = null

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, area: Area, warna: number, res: number, rBasis: number) {
    this.area = area
    this.warna = warna
    this.res = res
    this.rBasis = rBasis
    this.istirahat = { x: area.x0 + rBasis + 40, y: area.y0 + area.tinggi - rBasis - 24 }
    this.pusat = { ...this.istirahat }
    this.gfx = scene.add.graphics().setDepth(900)
    layer.add(this.gfx)
    this.gambar()
  }

  get aktif() {
    return this.pointer !== null
  }

  berisi(t: Titik) {
    const a = this.area
    return t.x >= a.x0 && t.x <= a.x0 + a.lebar && t.y >= a.y0 && t.y <= a.y0 + a.tinggi
  }

  milik(p: Phaser.Input.Pointer) {
    return this.pointer !== null && p.id === this.pointer.id
  }

  /** Posisi jari sekarang di panggung. */
  jari(): Titik {
    const p = this.pointer
    return p ? { x: p.x / this.res, y: p.y / this.res } : { ...this.pusat }
  }

  /** Pointer mentah (untuk dikonversi ke dunia lewat kamera tim). */
  get pointerAktif() {
    return this.pointer
  }

  tekan(p: Phaser.Input.Pointer, mode: ModeSentuh) {
    if (this.pointer) return
    this.pointer = p
    this.mode = mode
    if (mode === 'joystick') {
      // Joystick melayang: basis di tempat jari menyentuh (tetap di dalam area).
      const t = this.jari()
      const a = this.area
      const tepi = this.rBasis * 0.75
      this.pusat = {
        x: Phaser.Math.Clamp(t.x, a.x0 + tepi, a.x0 + a.lebar - tepi),
        y: Phaser.Math.Clamp(t.y, a.y0 + tepi, a.y0 + a.tinggi - tepi),
      }
    }
    this.gambar()
  }

  lepas() {
    this.pointer = null
    this.mode = null
    this.pusat = { ...this.istirahat }
    this.gambar()
  }

  /** Arah joystick (panjang ≤ 1); nol jika tidak sedang memakai joystick. */
  vektor(): Titik {
    if (this.mode !== 'joystick') return { x: 0, y: 0 }
    const t = this.jari()
    const dx = t.x - this.pusat.x
    const dy = t.y - this.pusat.y
    const d = Math.hypot(dx, dy)
    const jangkau = this.rBasis * 0.85
    // Zona mati kecil supaya jari yang diam tidak membuat pelari merayap.
    const f = d < 6 ? 0 : Math.min(1, d / jangkau) / d
    return { x: dx * f, y: dy * f }
  }

  setTampil(v: boolean) {
    if (!v) this.lepas()
    this.gfx.setVisible(v)
  }

  /** Gambar ulang (dipanggil setiap frame saat aktif). */
  gambar() {
    const g = this.gfx.clear()
    if (this.mode === 'seret') {
      const t = this.jari()
      g.lineStyle(5, w('kertas-terang'), 0.9).strokeCircle(t.x, t.y, 30)
      g.lineStyle(3, this.warna, 0.9).strokeCircle(t.x, t.y, 22)
      return
    }
    const { x, y } = this.pusat
    const R = this.rBasis
    const aktif = this.mode === 'joystick'
    const redup = aktif ? 1 : 0.55
    g.fillStyle(w('tinta-gelap'), 0.26 * redup).fillCircle(x, y, R)
    g.lineStyle(4, w('kertas-terang'), 0.8 * redup).strokeCircle(x, y, R)
    g.fillStyle(w('kertas-terang'), 0.75 * redup)
    for (const [ax, ay] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const px = x + ax * (R - 16)
      const py = y + ay * (R - 16)
      const s = 9
      g.fillTriangle(px + ax * s, py + ay * s, px - ay * s - ax * 2, py + ax * s - ay * 2, px + ay * s - ax * 2, py - ax * s - ay * 2)
    }
    const v = this.vektor()
    const kx = x + v.x * R * 0.85
    const ky = y + v.y * R * 0.85
    const rk = R * 0.44
    g.fillStyle(w('tinta-gelap'), 0.3 * redup).fillCircle(kx, ky + 4, rk)
    g.fillStyle(this.warna, redup).fillCircle(kx, ky, rk)
    g.lineStyle(4, w('kertas-terang'), redup).strokeCircle(kx, ky, rk)
  }
}
