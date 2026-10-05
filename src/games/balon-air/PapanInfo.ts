/**
 * Papan info di atas lintasan: nama tim, waktu tim, balon terpakai, meter
 * tekanan, dan peta mini posisi pelari (dengan lawan / bayangan). Lawan
 * Komputer: papan tinggi dua baris + papan bayangan di kanan. Duel: satu baris
 * di atas setiap separuh layar. Pojok kiri & kanan atas dikosongkan untuk
 * tombol GameShell.
 */
import * as Phaser from 'phaser'
import { WARNA, warnaAngka as w } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'
import { formatWaktu } from './aturan'
import { SISI_TOMBOL, LEBAR, type Pandang } from './tata'

export interface OpsiPapan {
  split: boolean
  indeks: 0 | 1
  nama: string
  warna: number
  kunciKepala: string
  res: number
  pandang: Pandang
}

/** Ikon balon kecil (lingkaran biru + simpul). */
function ikonBalon(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
  g.fillStyle(w('air-gelap')).fillTriangle(x - 4, y + r + 5, x + 4, y + r + 5, x, y + r - 2)
  g.fillStyle(w('air')).fillEllipse(x, y, r * 2 - 1, r * 2)
  g.fillStyle(w('kertas-terang'), 0.6).fillEllipse(x - r * 0.38, y - r * 0.4, r * 0.45, r * 0.6)
}

export class PapanInfo {
  private o: OpsiPapan
  private waktu: Phaser.GameObjects.Text
  private balon: Phaser.GameObjects.Text
  private putaran: Phaser.GameObjects.Text | null
  private meter: Phaser.GameObjects.Graphics
  private meterKotak: { x: number; y: number; lebar: number; tinggi: number }
  private peta: Phaser.GameObjects.Graphics
  private petaGaris: { x0: number; x1: number; y: number }
  private tekananLalu = -1
  private kedip = 0
  private hatiHati: Phaser.GameObjects.Text
  private pita: Phaser.GameObjects.Rectangle | null = null

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, o: OpsiPapan) {
    this.o = o
    const r = o.res
    const p = o.pandang
    const y0 = p.papanY
    const tinggi = p.papanTinggi
    const tambah = <T extends Phaser.GameObjects.GameObject>(x: T) => {
      layer.add(x)
      return x
    }
    const g = tambah(scene.add.graphics().setDepth(100))
    g.fillStyle(w('kayu-gelap'), 0.94).fillRect(0, y0, LEBAR, tinggi)
    g.fillStyle(w('kunyit')).fillRect(0, y0 + tinggi - 4, LEBAR, 4)
    const kepala = (x: number, y: number, rad: number) => {
      tambah(scene.add.circle(x, y, rad, o.warna).setStrokeStyle(4, w('kertas-terang')).setDepth(101))
      const k = tambah(scene.add.image(x, y + 2, o.kunciKepala).setDepth(102))
      k.setScale((rad * 1.75) / k.height)
    }
    const ikon = tambah(scene.add.graphics().setDepth(101))

    if (!o.split) {
      // Kiri: tim, waktu, balon. Tengah: meter tekanan. Putaran: pita di atas lintasan.
      const xk = SISI_TOMBOL + 12
      kepala(xk + 30, y0 + 48, 30)
      const nama = tambah(teks(scene, xk + 72, y0 + 28, o.nama, { ukuran: 30, garis: 'tinta-gelap', tebalGaris: 5 }, r).setOrigin(0, 0.5).setDepth(101))
      if (nama.width > 240) nama.setScale(240 / nama.width)
      this.waktu = tambah(teks(scene, xk + 72, y0 + 68, '0:00,0', { ukuran: 32, warna: 'cahaya-kelir' }, r).setOrigin(0, 0.5).setDepth(101))
      ikonBalon(ikon, xk + 212, y0 + 66, 12)
      this.balon = tambah(teks(scene, xk + 230, y0 + 68, '×1', { ukuran: 30 }, r).setOrigin(0, 0.5).setDepth(101))
      tambah(teks(scene, 640, y0 + 28, 'Tekanan balon', { ukuran: 30, warna: 'kertas-krem' }, r).setDepth(101))
      this.meterKotak = { x: 480, y: y0 + 56, lebar: 320, tinggi: 26 }
      this.petaGaris = { x0: 390, x1: 890, y: 698 }
      this.pita = tambah(scene.add.rectangle(640, p.y + 28, 10, 44, w('tinta-gelap'), 0.72).setDepth(840))
      this.putaran = tambah(teks(scene, 640, p.y + 29, '', { ukuran: 30 }, r).setDepth(841))
    } else {
      // Satu baris, kolom yang sama di kedua separuh layar.
      const yc = y0 + tinggi / 2 - 1
      const xk = SISI_TOMBOL
      kepala(xk + 20, yc, 20)
      const label = `P${o.indeks + 1} · ${o.nama}`
      const nama = tambah(teks(scene, xk + 48, yc, label, { ukuran: 30, garis: 'tinta-gelap', tebalGaris: 5 }, r).setOrigin(0, 0.5).setDepth(101))
      const muat = 360 - (xk + 48)
      if (nama.width > muat) nama.setScale(muat / nama.width)
      this.waktu = tambah(teks(scene, 372, yc, '0:00,0', { ukuran: 30, warna: 'cahaya-kelir' }, r).setOrigin(0, 0.5).setDepth(101))
      ikonBalon(ikon, 496, yc - 2, 11)
      this.balon = tambah(teks(scene, 512, yc, '×1', { ukuran: 30 }, r).setOrigin(0, 0.5).setDepth(101))
      this.meterKotak = { x: 572, y: yc - 12, lebar: 160, tinggi: 24 }
      this.petaGaris = { x0: 768, x1: 940, y: yc }
      this.putaran = tambah(teks(scene, LEBAR - SISI_TOMBOL, yc, '', { ukuran: 30 }, r).setOrigin(1, 0.5).setDepth(101))
    }
    this.meter = tambah(scene.add.graphics().setDepth(101))
    this.peta = tambah(scene.add.graphics().setDepth(o.split ? 101 : 850))
    this.hatiHati = tambah(
      teks(scene, LEBAR / 2, p.y + (o.split ? 34 : 82), 'Pelan-pelan!', { ukuran: 32, warna: 'cahaya-kelir', garis: 'tinta-gelap', tebalGaris: 6 }, r)
        .setDepth(860)
        .setVisible(false),
    )
    this.setTekanan(0, 16)
  }

  setPutaran(isi: string) {
    this.putaran?.setText(isi)
    if (this.putaran) this.pita?.setSize(this.putaran.width + 40, 44).setOrigin(0.5)
  }

  setWaktu(ms: number) {
    this.waktu.setText(formatWaktu(ms))
  }

  setBalon(n: number) {
    this.balon.setText(`×${n}`)
  }

  /** Meter tekanan 0..1: hijau → kunyit → merah; berkedip saat hampir pecah. */
  setTekanan(v: number, dtMs: number, peringatan = true) {
    const bahaya = v >= 0.75 && peringatan
    this.kedip = bahaya ? this.kedip + dtMs : 0
    const nyala = !bahaya || Math.floor(this.kedip / 160) % 2 === 0
    this.hatiHati.setVisible(bahaya)
    const kunci = Math.round(v * 200) + (nyala ? 0 : 1000)
    if (kunci === this.tekananLalu) return
    this.tekananLalu = kunci
    const m = this.meterKotak
    const g = this.meter.clear()
    g.fillStyle(w('tinta-gelap'), 0.6).fillRoundedRect(m.x - 3, m.y - 3, m.lebar + 6, m.tinggi + 6, (m.tinggi + 6) / 2)
    g.fillStyle(w('kertas-krem'), 0.25).fillRoundedRect(m.x, m.y, m.lebar, m.tinggi, m.tinggi / 2)
    const isi = Math.max(0, Math.min(1, v)) * m.lebar
    const warna = v < 0.5 ? 'daun-pisang' : v < 0.75 ? 'kunyit' : 'merah-bata'
    if (isi > 2) g.fillStyle(w(nyala ? warna : 'cahaya-kelir')).fillRoundedRect(m.x, m.y, Math.max(m.tinggi, isi), m.tinggi, m.tinggi / 2)
    // Garis bahaya di 75%.
    g.fillStyle(w('kertas-terang'), 0.7).fillRect(m.x + m.lebar * 0.75 - 1.5, m.y + 2, 3, m.tinggi - 4)
  }

  /** Peta mini: posisi 0..1 (START → keranjang) pelari sendiri dan lawan/bayangan. */
  setPeta(diri: number, lawan: number | null, warnaLawan: number, lawanBayangan: boolean) {
    const { x0, x1, y } = this.petaGaris
    const g = this.peta.clear()
    const titik = (f: number) => x0 + Math.max(0, Math.min(1, f)) * (x1 - x0)
    g.fillStyle(w('tinta-gelap'), 0.55).fillRoundedRect(x0 - 14, y - 12, x1 - x0 + 28, 24, 12)
    g.lineStyle(4, w('kertas-krem'), 0.8).lineBetween(x0, y, x1, y)
    g.fillStyle(w('kertas-terang')).fillRect(x0 - 2, y - 9, 4, 18)
    ikonBalon(g, x1, y - 1, 7)
    if (lawan !== null) {
      if (lawanBayangan) g.fillStyle(w('tinta-gelap'), 0.75).fillCircle(titik(lawan), y, 8)
      else g.fillStyle(warnaLawan).fillCircle(titik(lawan), y, 8)
      g.lineStyle(2, w('kertas-terang'), lawanBayangan ? 0.6 : 1).strokeCircle(titik(lawan), y, 8)
    }
    g.fillStyle(this.o.warna).fillCircle(titik(diri), y, 10)
    g.lineStyle(3, w('kertas-terang')).strokeCircle(titik(diri), y, 10)
  }

  /** Warna teks waktu: kunyit muda saat main, putih saat menunggu/selesai. */
  setWaktuAktif(aktif: boolean) {
    this.waktu.setColor(WARNA[aktif ? 'cahaya-kelir' : 'kertas-terang'])
  }
}

/** Lawan Komputer: waktu tim komputer (bayangan pelari) di kanan papan atas. */
export class PapanBayangan {
  private waktu: Phaser.GameObjects.Text
  private balon: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, o: { nama: string; kunciKepala: string; res: number }) {
    const r = o.res
    const kanan = LEBAR - SISI_TOMBOL - 12
    const tambah = <T extends Phaser.GameObjects.GameObject>(x: T) => {
      layer.add(x)
      return x
    }
    tambah(scene.add.circle(kanan - 30, 48, 30, w('tinta-gelap'), 0.6).setStrokeStyle(4, w('kertas-terang'), 0.6).setDepth(101))
    const k = tambah(scene.add.image(kanan - 30, 50, o.kunciKepala).setDepth(102).setAlpha(0.55))
    k.setScale(52 / k.height)
    const nama = tambah(teks(scene, kanan - 72, 28, `Bayangan ${o.nama}`, { ukuran: 30, warna: 'kertas-krem' }, r).setOrigin(1, 0.5).setDepth(101))
    if (nama.width > 300) nama.setScale(300 / nama.width)
    this.balon = tambah(teks(scene, kanan - 72, 68, '×1', { ukuran: 30, warna: 'kertas-krem' }, r).setOrigin(1, 0.5).setDepth(101))
    const ikon = tambah(scene.add.graphics().setDepth(101))
    ikonBalon(ikon, kanan - 72 - 56, 66, 12)
    this.waktu = tambah(teks(scene, kanan - 72 - 78, 68, '0:00,0', { ukuran: 32, warna: 'kertas-krem' }, r).setOrigin(1, 0.5).setDepth(101))
  }

  setWaktu(ms: number) {
    this.waktu.setText(formatWaktu(ms))
  }

  setBalon(n: number) {
    this.balon.setText(`×${n}`)
  }
}
