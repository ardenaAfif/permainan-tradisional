/**
 * Tombol besar di papan kontrol. Tekanan dibaca adegan lewat data 'tombol' di
 * zona (satu penangan pointerdown untuk seluruh panggung); kelas ini hanya
 * menggambar keadaan tertekan/redup. Beberapa jari bisa menekan bersamaan.
 */
import type * as Phaser from 'phaser'
import { warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'

const TEBAL = 10

export interface OpsiTombol {
  aksi: string
  x: number
  y: number
  lebar: number
  tinggi: number
  warna: NamaWarna
  warnaGelap: NamaWarna
  label: string
  warnaLabel?: NamaWarna
  /** Gambar kecil di kiri label (digambar relatif ke titik tengah ikon). */
  ikon?: (g: Phaser.GameObjects.Graphics) => void
  /** Petunjuk keyboard di pojok (hanya di perangkat bermouse/keyboard). */
  huruf?: string
  resolusi: number
}

export class Tombol {
  readonly aksi: string
  private o: OpsiTombol
  private gfx: Phaser.GameObjects.Graphics
  private isi: Phaser.GameObjects.Container
  private zona: Phaser.GameObjects.Zone
  private ditekan = new Set<number>()
  private redup = false

  constructor(scene: Phaser.Scene, o: OpsiTombol, kedalaman: number) {
    this.o = o
    this.aksi = o.aksi
    const { x, y, lebar, tinggi, resolusi } = o
    this.gfx = scene.add.graphics().setDepth(kedalaman)
    const label = teks(scene, 0, 0, o.label, { ukuran: 46, warna: o.warnaLabel ?? 'kertas-terang' }, resolusi)
    const bagian: Phaser.GameObjects.GameObject[] = [label]
    if (o.ikon) {
      const ikon = scene.add.graphics()
      o.ikon(ikon)
      const total = 84 + 18 + label.width
      ikon.x = -total / 2 + 42
      label.x = total / 2 - label.width / 2
      bagian.push(ikon)
    }
    if (o.huruf) {
      const h = teks(scene, 0, 0, o.huruf, { ukuran: 26, judul: false, tebal: 800 }, resolusi)
      const bw = h.width + 20
      const hx = lebar / 2 - bw / 2 - 14
      const hy = -(tinggi - TEBAL) / 2 + 30
      h.setPosition(hx, hy)
      bagian.push(scene.add.rectangle(hx, hy, bw, 38, w('tinta-gelap'), 0.3), h)
    }
    this.isi = scene.add.container(x + lebar / 2, y + (tinggi - TEBAL) / 2, bagian).setDepth(kedalaman)
    this.zona = scene.add.zone(x, y, lebar, tinggi).setOrigin(0).setInteractive().setData('tombol', o.aksi).setDepth(kedalaman)
    this.gambar()
  }

  setTampil(v: boolean) {
    this.gfx.setVisible(v)
    this.isi.setVisible(v)
    this.zona.setVisible(v)
    if (v) this.zona.setInteractive()
    else {
      this.zona.disableInteractive()
      this.ditekan.clear()
      this.gambar()
    }
  }

  /** Redup = giliran komputer: tidak bisa ditekan. */
  setRedup(v: boolean) {
    if (v === this.redup) return
    this.redup = v
    if (v) this.zona.disableInteractive()
    else if (this.zona.visible) this.zona.setInteractive()
    this.isi.setAlpha(v ? 0.55 : 1)
    this.gambar()
  }

  tekan(id: number) {
    this.ditekan.add(id)
    this.gambar()
  }

  lepas(id: number) {
    if (this.ditekan.delete(id)) this.gambar()
  }

  lepasSemua() {
    this.ditekan.clear()
    this.gambar()
  }

  /** Kilatan singkat saat komputer "menekan" tombol ini. */
  kilat(scene: Phaser.Scene) {
    this.tekan(-99)
    scene.time.delayedCall(140, () => this.lepas(-99))
  }

  private gambar() {
    const { x, y, lebar, tinggi, warna, warnaGelap } = this.o
    const turun = this.ditekan.size > 0 ? TEBAL - 2 : 0
    const r = 24
    const a = this.redup ? 0.55 : 1
    const g = this.gfx.clear()
    g.fillStyle(w(warnaGelap), a).fillRoundedRect(x, y + TEBAL, lebar, tinggi - TEBAL, r)
    g.fillStyle(w(warna), a).fillRoundedRect(x, y + turun, lebar, tinggi - TEBAL, r)
    this.isi.y = y + (tinggi - TEBAL) / 2 + turun
  }
}

/** Telapak kaki (tampak bawah) berpusat di (x, y). */
export function gambarTelapak(g: Phaser.GameObjects.Graphics, x: number, y: number, warna: number, cermin = false) {
  const s = cermin ? -1 : 1
  g.fillStyle(warna)
  g.fillEllipse(x, y + 6, 26, 40)
  g.fillEllipse(x + s * 2, y - 14, 22, 18)
  const jari: [number, number, number][] = [
    [-9, -27, 5.5],
    [-2, -30, 4.5],
    [4, -29, 4],
    [9, -26, 3.6],
    [12, -21, 3.2],
  ]
  for (const [dx, dy, r] of jari) g.fillCircle(x + s * dx, y + dy, r)
}
