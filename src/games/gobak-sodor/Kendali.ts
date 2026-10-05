/**
 * Kendali sentuh Gobak Sodor di panel samping: joystick virtual (penyerang /
 * penjaga) dan slider sodor (Duel Satu Layar). Masing-masing mengikuti satu
 * jari sendiri, jadi dua pemain bisa memakai kendalinya bersamaan di PID.
 * Mouse juga bisa (tekan lalu seret).
 */
import * as Phaser from 'phaser'
import { warnaAngka as w } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'
import type { Titik } from './aturan'

export interface Kotak {
  x0: number
  y0: number
  lebar: number
  tinggi: number
}

const R_BASIS = 94
const R_TOMBOL = 44

/** Posisi pointer di koordinat panggung (kamera di-zoom sesuai resolusi). */
function titikPanggung(scene: Phaser.Scene, p: Phaser.Input.Pointer): Titik {
  const t = scene.cameras.main.getWorldPoint(p.x, p.y)
  return { x: t.x, y: t.y }
}

export type Sumbu = 'xy' | 'x' | 'y'

export class Joystick {
  private scene: Phaser.Scene
  private k: Kotak
  private warna: number
  private gfx: Phaser.GameObjects.Graphics
  private label: Phaser.GameObjects.Text
  private zona: Phaser.GameObjects.Zone
  private id: number | null = null
  private pusat: Titik
  private istirahat: Titik
  private sumbu: Sumbu = 'xy'
  /** Arah dorongan, panjang ≤ 1. */
  vektor: Titik = { x: 0, y: 0 }

  constructor(scene: Phaser.Scene, k: Kotak, warna: number, res: number) {
    this.scene = scene
    this.k = k
    this.warna = warna
    this.istirahat = { x: k.x0 + k.lebar / 2, y: k.y0 + k.tinggi / 2 + 16 }
    this.pusat = { ...this.istirahat }
    this.gfx = scene.add.graphics().setDepth(1001)
    this.label = teks(scene, this.istirahat.x, k.y0 + 14, '', { ukuran: 30, garis: 'tinta-gelap', tebalGaris: 6 }, res).setDepth(1001)
    this.zona = scene.add.zone(k.x0, k.y0, k.lebar, k.tinggi).setOrigin(0).setInteractive().setDepth(1000)
    this.zona.on('pointerdown', (p: Phaser.Input.Pointer) => this.tekan(p))
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => p.id === this.id && this.geser(p))
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => p.id === this.id && this.lepas())
    scene.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => p.id === this.id && this.lepas())
    this.gambar()
  }

  get aktif() {
    return this.id !== null
  }

  setLabel(isi: string) {
    this.label.setText(isi)
  }

  setSumbu(s: Sumbu) {
    if (s === this.sumbu) return
    this.sumbu = s
    this.gambar()
  }

  setTampil(v: boolean) {
    if (!v) this.lepas()
    this.gfx.setVisible(v)
    this.label.setVisible(v)
    if (this.zona.input) this.zona.input.enabled = v
  }

  lepas() {
    this.id = null
    this.vektor = { x: 0, y: 0 }
    this.pusat = { ...this.istirahat }
    this.gambar()
  }

  private tekan(p: Phaser.Input.Pointer) {
    if (this.id !== null) return
    this.id = p.id
    // Joystick melayang: basis pindah ke tempat jari menyentuh (tetap di dalam panel).
    const t = titikPanggung(this.scene, p)
    const k = this.k
    const tepi = R_BASIS * 0.7
    this.pusat = {
      x: Phaser.Math.Clamp(t.x, k.x0 + tepi, k.x0 + k.lebar - tepi),
      y: Phaser.Math.Clamp(t.y, k.y0 + tepi, k.y0 + k.tinggi - tepi),
    }
    this.geser(p)
  }

  private geser(p: Phaser.Input.Pointer) {
    const t = titikPanggung(this.scene, p)
    let dx = t.x - this.pusat.x
    let dy = t.y - this.pusat.y
    if (this.sumbu === 'x') dy = 0
    if (this.sumbu === 'y') dx = 0
    const d = Math.hypot(dx, dy)
    const jangkau = R_BASIS * 0.8
    // Zona mati kecil supaya jari yang diam tidak membuat karakter merayap.
    const f = d < 8 ? 0 : Math.min(1, d / jangkau) / (d || 1)
    this.vektor = { x: dx * f, y: dy * f }
    this.gambar()
  }

  private gambar() {
    const g = this.gfx.clear()
    const { x, y } = this.pusat
    g.fillStyle(w('tinta-gelap'), 0.28).fillCircle(x, y, R_BASIS)
    g.lineStyle(5, w('kertas-terang'), this.aktif ? 0.85 : 0.55).strokeCircle(x, y, R_BASIS)
    // Panah arah yang bisa dipakai.
    g.fillStyle(w('kertas-terang'), 0.8)
    const panah = (ax: number, ay: number) => {
      const px = x + ax * (R_BASIS - 18)
      const py = y + ay * (R_BASIS - 18)
      const s = 11
      g.fillTriangle(px + ax * s, py + ay * s, px - ay * s - ax * 2, py + ax * s - ay * 2, px + ay * s - ax * 2, py - ax * s - ay * 2)
    }
    if (this.sumbu !== 'y') {
      panah(-1, 0)
      panah(1, 0)
    }
    if (this.sumbu !== 'x') {
      panah(0, -1)
      panah(0, 1)
    }
    const kx = x + this.vektor.x * R_BASIS * 0.8
    const ky = y + this.vektor.y * R_BASIS * 0.8
    g.fillStyle(w('tinta-gelap'), 0.35).fillCircle(kx, ky + 5, R_TOMBOL)
    g.fillStyle(this.warna).fillCircle(kx, ky, R_TOMBOL)
    g.lineStyle(5, w('kertas-terang')).strokeCircle(kx, ky, R_TOMBOL)
  }
}

/**
 * Slider tegak untuk penjaga sodor: geser jempol ke atas/bawah, sodor berlari
 * ke titik yang sama di garis tengah. Tanda garis jaga di rel = peta mini.
 */
export class SliderSodor {
  private scene: Phaser.Scene
  private warna: number
  private gfx: Phaser.GameObjects.Graphics
  private judul: Phaser.GameObjects.Text
  private zona: Phaser.GameObjects.Zone
  private id: number | null = null
  private relAtas: number
  private relBawah: number
  private x: number
  private yMin: number
  private yMax: number
  private garisY: readonly number[]
  private posisi = 0
  /** y sodor yang dituju (null = belum disentuh). */
  tujuan: number | null = null

  constructor(scene: Phaser.Scene, k: Kotak, warna: number, res: number, batas: [number, number], garisY: readonly number[]) {
    this.scene = scene
    this.warna = warna
    this.x = k.x0 + k.lebar / 2
    this.relAtas = k.y0 + 66
    this.relBawah = k.y0 + k.tinggi - 30
    ;[this.yMin, this.yMax] = batas
    this.garisY = garisY
    this.posisi = (this.yMin + this.yMax) / 2
    this.gfx = scene.add.graphics().setDepth(1001)
    this.judul = teks(scene, this.x, k.y0 + 14, '', { ukuran: 30, garis: 'tinta-gelap', tebalGaris: 6 }, res).setDepth(1001)
    this.zona = scene.add.zone(k.x0, k.y0, k.lebar, k.tinggi).setOrigin(0).setInteractive().setDepth(1000)
    this.zona.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.id !== null) return
      this.id = p.id
      this.geser(p)
    })
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => p.id === this.id && this.geser(p))
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => p.id === this.id && this.lepas())
    scene.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => p.id === this.id && this.lepas())
    this.gambar()
  }

  setLabel(isi: string) {
    this.judul.setText(isi)
  }

  setTampil(v: boolean) {
    if (!v) this.lepas()
    this.gfx.setVisible(v)
    this.judul.setVisible(v)
    if (this.zona.input) this.zona.input.enabled = v
  }

  /** Posisi sodor sekarang (y lapangan), untuk jempol slider. */
  setPosisi(y: number) {
    if (Math.abs(y - this.posisi) < 0.5) return
    this.posisi = y
    this.gambar()
  }

  lepas() {
    this.id = null
    this.gambar()
  }

  /** Lupakan tujuan (mis. sodor digerakkan dengan keyboard). */
  batal() {
    this.tujuan = null
    this.gambar()
  }

  private keRel(y: number) {
    return this.relBawah - ((this.yMax - y) / (this.yMax - this.yMin)) * (this.relBawah - this.relAtas)
  }

  private geser(p: Phaser.Input.Pointer) {
    const t = titikPanggung(this.scene, p)
    const f = Phaser.Math.Clamp((t.y - this.relAtas) / (this.relBawah - this.relAtas), 0, 1)
    this.tujuan = this.yMin + f * (this.yMax - this.yMin)
    this.gambar()
  }

  private gambar() {
    const g = this.gfx.clear()
    const x = this.x
    g.fillStyle(w('tinta-gelap'), 0.3).fillRoundedRect(x - 20, this.relAtas - 20, 40, this.relBawah - this.relAtas + 40, 20)
    g.lineStyle(4, w('kertas-terang'), 0.6).strokeRoundedRect(x - 20, this.relAtas - 20, 40, this.relBawah - this.relAtas + 40, 20)
    // Garis jaga sebagai tanda di rel.
    g.lineStyle(5, w('kertas-terang'), 0.85)
    for (const gy of this.garisY) {
      const y = this.keRel(gy)
      g.lineBetween(x - 34, y, x - 22, y)
      g.lineBetween(x + 22, y, x + 34, y)
    }
    if (this.tujuan !== null) {
      g.lineStyle(4, w('cahaya-kelir'), 0.9).strokeCircle(x, this.keRel(this.tujuan), 20)
    }
    const y = this.keRel(this.posisi)
    g.fillStyle(w('tinta-gelap'), 0.35).fillRoundedRect(x - 46, y - 22 + 5, 92, 44, 18)
    g.fillStyle(this.warna).fillRoundedRect(x - 46, y - 22, 92, 44, 18)
    g.lineStyle(this.id !== null ? 6 : 4, w(this.id !== null ? 'cahaya-kelir' : 'kertas-terang')).strokeRoundedRect(x - 46, y - 22, 92, 44, 18)
    g.fillStyle(w('kertas-terang'), 0.9)
    g.fillTriangle(x, y - 14, x - 9, y - 4, x + 9, y - 4)
    g.fillTriangle(x, y + 14, x - 9, y + 4, x + 9, y + 4)
  }
}
