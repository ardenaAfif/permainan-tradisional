/**
 * Panel kontrol satu pemain manusia: tombol KIRI, TAHAN, KANAN, meter
 * keseimbangan (jarum = miring badan), dan penunjuk irama (zona hijau = waktu
 * yang pas untuk langkah berikutnya). Satu pemain = lebar penuh; Duel Satu
 * Layar = satu kolom per pemain. Setiap sentuhan dihitung sendiri (multi-touch).
 */
import * as Phaser from 'phaser'
import { warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'
import type { Kaki, Status } from './aturan'
import { CEPAT, LAMBAT } from './config'
import { PANEL_Y, TINGGI } from './tata'

const TEBAL = 10
/** Panjang penunjuk irama (ms sejak langkah terakhir). */
const RITME_MAKS = LAMBAT + 300

export type Aksi = Kaki | 'tahan'

interface Kotak {
  x: number
  y: number
  lebar: number
  tinggi: number
  warna: NamaWarna
  warnaGelap: NamaWarna
}

class Tombol {
  private k: Kotak
  private gfx: Phaser.GameObjects.Graphics
  private isi: Phaser.GameObjects.Container
  private ditekan = new Set<number>()
  private menyala = false
  private redup = false
  private onTekan: () => void
  private onLepas: () => void

  constructor(scene: Phaser.Scene, k: Kotak, isi: Phaser.GameObjects.GameObject[], onTekan: () => void, onLepas: () => void) {
    this.k = k
    this.onTekan = onTekan
    this.onLepas = onLepas
    this.gfx = scene.add.graphics().setDepth(40)
    this.isi = scene.add.container(k.x + k.lebar / 2, 0, isi).setDepth(40)
    this.gambar()
    const zona = scene.add.zone(k.x, k.y, k.lebar, k.tinggi).setOrigin(0).setInteractive().setDepth(40)
    zona.on('pointerdown', (p: Phaser.Input.Pointer) => this.tekan(p.id))
    zona.on('pointerout', (p: Phaser.Input.Pointer) => this.lepas(p.id))
  }

  get aktif() {
    return this.ditekan.size > 0
  }

  tekan(id: number) {
    const baru = this.ditekan.size === 0
    this.ditekan.add(id)
    this.gambar()
    if (baru) this.onTekan()
  }

  lepas(id: number) {
    if (!this.ditekan.delete(id)) return
    this.gambar()
    if (this.ditekan.size === 0) this.onLepas()
  }

  lepasSemua() {
    if (this.ditekan.size === 0) return
    this.ditekan.clear()
    this.gambar()
    this.onLepas()
  }

  setMenyala(v: boolean) {
    if (v === this.menyala) return
    this.menyala = v
    this.gambar()
  }

  setRedup(v: boolean) {
    if (v === this.redup) return
    this.redup = v
    this.isi.setAlpha(v ? 0.5 : 1)
    this.gambar()
  }

  private gambar() {
    const { x, y, lebar, tinggi, warna, warnaGelap } = this.k
    const turun = this.ditekan.size > 0 ? TEBAL - 2 : 0
    const r = 22
    const a = this.redup ? 0.55 : 1
    const g = this.gfx.clear()
    g.fillStyle(w(warnaGelap), a).fillRoundedRect(x, y + TEBAL, lebar, tinggi - TEBAL, r)
    g.fillStyle(w(warna), a).fillRoundedRect(x, y + turun, lebar, tinggi - TEBAL, r)
    if (this.menyala) g.lineStyle(6, w('cahaya-kelir')).strokeRoundedRect(x + 3, y + turun + 3, lebar - 6, tinggi - TEBAL - 6, r - 3)
    this.isi.y = y + (tinggi - TEBAL) / 2 + turun
  }
}

export interface OpsiPanel {
  x0: number
  lebar: number
  /** Satu pemain di lebar penuh (tombol besar di kiri-kanan, meter di tengah). */
  tunggal: boolean
  warna: number
  /** Kunci tekstur kepala pemain (kolom Duel Satu Layar). */
  kepala?: string
  /** Huruf keyboard per tombol (hanya di perangkat bermouse/keyboard). */
  huruf?: Record<Aksi, string>
  res: number
  onLangkah(kaki: Kaki): void
  onTahan(v: boolean): void
}

const TAMPILAN: Record<Aksi, { label: string; warna: NamaWarna; gelap: NamaWarna; teks: NamaWarna }> = {
  kiri: { label: 'KIRI', warna: 'daun-pisang', gelap: 'daun-pisang-gelap', teks: 'kertas-terang' },
  tahan: { label: 'TAHAN', warna: 'kunyit', gelap: 'kunyit-gelap', teks: 'kayu-gelap' },
  kanan: { label: 'KANAN', warna: 'biru-nila', gelap: 'biru-nila-gelap', teks: 'kertas-terang' },
}

export class PanelKontrol {
  private scene: Phaser.Scene
  private tombol = new Map<Aksi, Tombol>()
  private jarum: Phaser.GameObjects.Rectangle
  private meterX: number
  private meterLebar: number
  private ritme: Phaser.GameObjects.Rectangle
  private ritmeX: number
  private ritmeLebar: number
  private tutup: Phaser.GameObjects.Container
  private tutupTeks: Phaser.GameObjects.Text
  private keadaan: Status = 'jalan'

  constructor(scene: Phaser.Scene, o: OpsiPanel) {
    this.scene = scene
    const { x0, lebar, res } = o
    const g = scene.add.graphics().setDepth(39)

    // Susunan: tunggal = [KIRI] [meter/irama + TAHAN] [KANAN]; kolom = kepala + meter, lalu tiga tombol.
    let kotak: Record<Aksi, { x: number; y: number; lebar: number; tinggi: number }>
    let meter: { x: number; y: number; lebar: number; tinggi: number }
    if (o.tunggal) {
      kotak = {
        kiri: { x: x0 + 16, y: 552, lebar: 330, tinggi: 160 },
        kanan: { x: x0 + lebar - 346, y: 552, lebar: 330, tinggi: 160 },
        tahan: { x: x0 + lebar / 2 - 170, y: 610, lebar: 340, tinggi: 102 },
      }
      meter = { x: x0 + lebar / 2 - 260, y: 556, lebar: 520, tinggi: 28 }
    } else {
      const dalam = lebar - 16
      const lebarTahan = Math.max(90, Math.round(dalam * 0.26))
      const sisi = (dalam - lebarTahan - 12) / 2
      const y = 598
      const t = TINGGI - 8 - y
      kotak = {
        kiri: { x: x0 + 8, y, lebar: sisi, tinggi: t },
        tahan: { x: x0 + 8 + sisi + 6, y, lebar: lebarTahan, tinggi: t },
        kanan: { x: x0 + 8 + sisi + 6 + lebarTahan + 6, y, lebar: sisi, tinggi: t },
      }
      const kiriMeter = o.kepala ? 58 : 12
      meter = { x: x0 + kiriMeter, y: 557, lebar: lebar - kiriMeter - 12, tinggi: 22 }
      // Pita warna pemain + kepala pemain sebagai penanda kolom.
      g.fillStyle(o.warna).fillRect(x0 + 4, PANEL_Y + 5, lebar - 8, 6)
      if (o.kepala) {
        g.fillStyle(o.warna).fillCircle(x0 + 30, 570, 22)
        g.lineStyle(3, w('kertas-terang')).strokeCircle(x0 + 30, 570, 22)
        const kepala = scene.add.image(x0 + 30, 572, o.kepala).setDepth(39)
        kepala.setScale(38 / kepala.height)
      }
      if (x0 > 0) g.fillStyle(w('kayu-gelap')).fillRect(x0 - 2, PANEL_Y, 4, TINGGI - PANEL_Y)
    }

    // Meter keseimbangan: hijau = tegak, kunyit = miring, merah = hampir jatuh.
    this.meterX = meter.x
    this.meterLebar = meter.lebar
    const tengah = meter.x + meter.lebar / 2
    const setengah = meter.lebar / 2
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(meter.x - 4, meter.y - 4, meter.lebar + 8, meter.tinggi + 8, 10)
    g.fillStyle(w('merah-bata')).fillRect(meter.x, meter.y, meter.lebar, meter.tinggi)
    g.fillStyle(w('kunyit')).fillRect(tengah - setengah * 0.7, meter.y, setengah * 1.4, meter.tinggi)
    g.fillStyle(w('daun-pisang')).fillRect(tengah - setengah * 0.4, meter.y, setengah * 0.8, meter.tinggi)
    g.fillStyle(w('kertas-terang'), 0.7).fillRect(tengah - 1.5, meter.y, 3, meter.tinggi)
    this.jarum = scene.add
      .rectangle(tengah, meter.y + meter.tinggi / 2, 9, meter.tinggi + 12, w('kertas-terang'))
      .setStrokeStyle(3, w('tinta-gelap'))
      .setDepth(41)

    // Penunjuk irama di bawah meter.
    this.ritmeX = meter.x
    this.ritmeLebar = meter.lebar
    const ry = meter.y + meter.tinggi + 8
    const rt = o.tunggal ? 10 : 7
    g.fillStyle(w('kayu-gelap')).fillRect(meter.x, ry, meter.lebar, rt)
    g.fillStyle(w('kunyit'), 0.45).fillRect(meter.x, ry, (meter.lebar * CEPAT) / RITME_MAKS, rt)
    g.fillStyle(w('daun-pisang')).fillRect(meter.x + (meter.lebar * CEPAT) / RITME_MAKS, ry, (meter.lebar * (LAMBAT - CEPAT)) / RITME_MAKS, rt)
    this.ritme = scene.add.rectangle(meter.x, ry + rt / 2, 6, rt + 8, w('kertas-terang')).setDepth(41).setVisible(false)

    // Penutup meter saat jatuh / kembali / finis.
    this.tutup = scene.add.container(0, 0).setDepth(42).setVisible(false)
    const tinggiTutup = ry + rt - meter.y + 8
    this.tutup.add(scene.add.rectangle(meter.x - 4, meter.y - 4, meter.lebar + 8, tinggiTutup, w('tinta-gelap'), 0.88).setOrigin(0))
    this.tutupTeks = teks(scene, tengah, meter.y - 4 + tinggiTutup / 2, '', { ukuran: 30, warna: 'cahaya-kelir' }, res)
    this.tutup.add(this.tutupTeks)

    for (const aksi of ['kiri', 'tahan', 'kanan'] as const) {
      const k = kotak[aksi]
      const tm = TAMPILAN[aksi]
      const isi = this.isiTombol(aksi, k.lebar, k.tinggi, o.huruf?.[aksi], res)
      const tombol = new Tombol(
        scene,
        { ...k, warna: tm.warna, warnaGelap: tm.gelap },
        isi,
        () => (aksi === 'tahan' ? o.onTahan(true) : o.onLangkah(aksi)),
        () => aksi === 'tahan' && o.onTahan(false),
      )
      this.tombol.set(aksi, tombol)
    }
  }

  /** Tombol keyboard ditekan/dilepas (id negatif supaya tidak bentrok dengan pointer). */
  tekanKeyboard(aksi: Aksi, turun: boolean, id: number) {
    const t = this.tombol.get(aksi)
    if (!t) return
    if (turun) t.tekan(id)
    else t.lepas(id)
  }

  lepasPointer(id: number) {
    for (const t of this.tombol.values()) t.lepas(id)
  }

  lepasSemua() {
    for (const t of this.tombol.values()) t.lepasSemua()
  }

  /** Penutup meter: JATUH!, balik ke start, atau FINIS. */
  setKeadaan(status: Status, label = '') {
    this.keadaan = status
    const tampil = status !== 'jalan'
    this.tutup.setVisible(tampil)
    this.tutupTeks.setText(label)
    const maks = this.meterLebar - 8
    this.tutupTeks.setScale(this.tutupTeks.width > maks ? maks / this.tutupTeks.width : 1)
    for (const t of this.tombol.values()) t.setRedup(tampil)
  }

  /** @param sejak ms sejak langkah terakhir, atau null jika irama belum dimulai. */
  update(miring: number, ditahan: boolean, sejak: number | null) {
    const m = Math.max(-1, Math.min(1, miring))
    this.jarum.x = this.meterX + this.meterLebar / 2 + (m * (this.meterLebar - 10)) / 2
    this.tombol.get('tahan')?.setMenyala(ditahan && this.keadaan === 'jalan')
    const tampil = sejak !== null && !ditahan && this.keadaan === 'jalan'
    this.ritme.setVisible(tampil)
    if (tampil) this.ritme.x = this.ritmeX + (this.ritmeLebar * Math.min(sejak, RITME_MAKS)) / RITME_MAKS
  }

  private isiTombol(aksi: Aksi, lebar: number, tinggi: number, huruf: string | undefined, res: number) {
    const s = this.scene
    const tm = TAMPILAN[aksi]
    const isi: Phaser.GameObjects.GameObject[] = []
    const ikon = s.add.graphics()
    const warnaIkon = w(tm.teks)
    if (aksi === 'tahan') {
      // Orang berdiri tegak.
      ikon.fillStyle(warnaIkon).fillCircle(0, -12, 7).fillRoundedRect(-4, -4, 8, 20, 3).fillRect(-12, 16, 24, 4)
    } else {
      const a = aksi === 'kiri' ? -1 : 1
      ikon.fillStyle(warnaIkon).fillTriangle(a * 16, 0, -a * 12, -15, -a * 12, 15)
    }
    ikon.y = -22
    const label = teks(s, 0, 18, tm.label, { ukuran: 30, warna: tm.teks }, res)
    if (label.width > lebar - 14) label.setScale((lebar - 14) / label.width)
    isi.push(ikon, label)
    if (huruf) {
      const h = teks(s, 0, 0, huruf, { ukuran: 24, judul: false, tebal: 800 }, res)
      const bw = Math.max(32, h.width + 14)
      const hx = lebar / 2 - bw / 2 - 8
      const hy = -(tinggi - TEBAL) / 2 + 22
      h.setPosition(hx, hy)
      isi.push(s.add.rectangle(hx, hy, bw, 32, w('tinta-gelap'), 0.3), h)
      // Tombol sempit (4 pemain): ikon bergeser supaya tidak tertutup huruf.
      if (lebar < 170) ikon.x = -bw / 2
    }
    return isi
  }
}
