/**
 * Panel kontrol satu tim di bagian bawah: jalur aba-aba (catatan KIRI/KANAN
 * berjalan ke lingkaran), meter goyang, tantangan bangkit, dan tombol kaki.
 * Tombol memakai input Phaser; setiap sentuhan (pointer) dihitung sendiri,
 * jadi beberapa tombol bisa ditekan bersamaan (multi-touch).
 */
import * as Phaser from 'phaser'
import { WARNA, type NamaWarna } from '../../app/tokens'
import { BANGKIT_KETUK, BANGKIT_WAKTU, GOYANG_MAKS } from './config'
import { kakiKetukan, waktuKetukan, type Nilai } from './aturan'
import {
  GOYANG_T,
  GOYANG_Y,
  JALUR_T,
  JALUR_Y,
  KONTROL_Y,
  LAJU_CATATAN,
  TOMBOL_T,
  TOMBOL_Y,
  teks,
  w,
} from './tata'

const TEBAL = 10
const WARNA_KAKI = { kiri: ['daun-pisang', 'daun-pisang-gelap'], kanan: ['biru-nila', 'biru-nila-gelap'] } as const

export interface OpsiPanel {
  x0: number
  lebar: number
  warnaTim: number
  warnaTimGelap: number
  /** Tim Kompak: tiga tombol kaki bergambar kepala siswa (kiri → kanan). */
  kepala?: string[]
  /** Huruf keyboard per tombol (hanya ditampilkan di perangkat bermouse). */
  petunjuk?: string[]
  resolusi: number
  gerak: boolean
  onTekan(tombol: number): void
}

interface KotakTombol {
  x: number
  y: number
  lebar: number
  tinggi: number
  warna: number
  warnaGelap: number
}

class Tombol {
  private k: KotakTombol
  private gfx: Phaser.GameObjects.Graphics
  private isi: Phaser.GameObjects.Container
  private ditekan = new Set<number>()
  private menyala = false

  constructor(scene: Phaser.Scene, k: KotakTombol, isi: Phaser.GameObjects.GameObject[], onTekan: () => void) {
    this.k = k
    const { x, y, lebar, tinggi } = k
    this.gfx = scene.add.graphics()
    this.isi = scene.add.container(x + lebar / 2, y + (tinggi - TEBAL) / 2, isi)
    this.gambar()
    const zona = scene.add.zone(x, y, lebar, tinggi).setOrigin(0).setInteractive()
    zona.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.tekan(p.id)
      onTekan()
    })
    zona.on('pointerout', (p: Phaser.Input.Pointer) => this.lepas(p.id))
  }

  tekan(id: number) {
    this.ditekan.add(id)
    this.gambar()
  }

  lepas(id: number) {
    if (this.ditekan.delete(id)) this.gambar()
  }

  setMenyala(v: boolean) {
    if (v === this.menyala) return
    this.menyala = v
    this.gambar()
  }

  private gambar() {
    const { x, y, lebar, tinggi, warna, warnaGelap } = this.k
    const turun = this.ditekan.size > 0 ? TEBAL - 2 : 0
    const r = 22
    const g = this.gfx.clear()
    g.fillStyle(warnaGelap).fillRoundedRect(x, y + TEBAL, lebar, tinggi - TEBAL, r)
    g.fillStyle(warna).fillRoundedRect(x, y + turun, lebar, tinggi - TEBAL, r)
    if (this.menyala) g.lineStyle(6, w('cahaya-kelir')).strokeRoundedRect(x + 3, y + turun + 3, lebar - 6, tinggi - TEBAL - 6, r - 3)
    this.isi.y = y + (tinggi - TEBAL) / 2 + turun
  }
}

export class PanelKontrol {
  private scene: Phaser.Scene
  private o: OpsiPanel
  private tombol: Tombol[] = []
  private catatan: Phaser.GameObjects.Container[] = []
  private ringX: number
  private jalurKiri: number
  private jalurKanan: number
  private cy = JALUR_Y + JALUR_T / 2
  private popup: Phaser.GameObjects.Text
  private goyangIsi: Phaser.GameObjects.Rectangle
  private goyangLebar: number
  private bangkit: Phaser.GameObjects.Container
  private bangkitTeks: Phaser.GameObjects.Text
  private pip: Phaser.GameObjects.Arc[] = []
  private statusBangkit: 'tidak' | 'jatuh' | 'ketuk' = 'tidak'

  constructor(scene: Phaser.Scene, o: OpsiPanel) {
    this.scene = scene
    this.o = o
    const { x0, lebar, resolusi } = o
    const kiri = x0 + 16
    const kanan = x0 + lebar - 16
    this.jalurKiri = kiri
    this.jalurKanan = kanan
    this.ringX = kiri + 62

    // Pita warna tim di tepi atas panel.
    scene.add.rectangle(x0 + 6, KONTROL_Y + 4, lebar - 12, 6, o.warnaTim).setOrigin(0, 0)

    // Jalur aba-aba.
    const g = scene.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(kiri, JALUR_Y, kanan - kiri, JALUR_T, 18)
    g.lineStyle(5, w('kertas-terang')).strokeCircle(this.ringX, this.cy, 29)
    g.fillStyle(w('kertas-terang'), 0.18).fillCircle(this.ringX, this.cy, 29)
    for (let i = 0; i < 14; i++) this.catatan.push(this.buatCatatan())
    this.popup = teks(scene, this.ringX + 150, this.cy, '', { ukuran: 36, garis: 'kayu-gelap', tebalGaris: 8 }, resolusi).setAlpha(0)

    // Meter goyang.
    this.goyangLebar = kanan - kiri
    scene.add.rectangle(kiri, GOYANG_Y, this.goyangLebar, GOYANG_T, w('kayu-gelap')).setOrigin(0, 0)
    this.goyangIsi = scene.add.rectangle(kiri, GOYANG_Y, 0, GOYANG_T, w('daun-pisang')).setOrigin(0, 0)

    // Tombol.
    const n = o.kepala ? o.kepala.length : 2
    const sela = n === 2 ? 28 : 12
    const lebarTombol = (kanan - kiri - sela * (n - 1)) / n
    for (let i = 0; i < n; i++) {
      const x = kiri + i * (lebarTombol + sela)
      const isi: Phaser.GameObjects.GameObject[] = []
      let warna = o.warnaTim
      let gelap = o.warnaTimGelap
      if (o.kepala) {
        const kepala = scene.add.image(0, 0, o.kepala[i]!)
        kepala.setScale(104 / kepala.height)
        isi.push(kepala)
      } else {
        const kaki = i === 0 ? 'kiri' : 'kanan'
        warna = w(WARNA_KAKI[kaki][0])
        gelap = w(WARNA_KAKI[kaki][1])
        // [◀ KIRI] dan [KANAN ▶], dipusatkan bersama.
        const label = teks(scene, 0, 0, kaki === 'kiri' ? 'KIRI' : 'KANAN', { ukuran: 46 }, resolusi)
        const total = label.width + 14 + 26
        // Titik Triangle Phaser diukur dari pojok kiri-atas bentuknya (origin 0,5 = tengah).
        const titik: [number, number, number, number, number, number] = kaki === 'kiri' ? [26, 0, 26, 36, 0, 18] : [0, 0, 0, 36, 26, 18]
        const panah = scene.add.triangle(0, 0, ...titik, w('kertas-terang'))
        if (kaki === 'kiri') {
          panah.x = -total / 2 + 13
          label.x = total / 2 - label.width / 2
        } else {
          label.x = -total / 2 + label.width / 2
          panah.x = total / 2 - 13
        }
        isi.push(panah, label)
      }
      const huruf = o.petunjuk?.[i]
      if (huruf) {
        const kotak = scene.add.rectangle(lebarTombol / 2 - 34, (TOMBOL_T - TEBAL) / 2 - 30, 40, 40, w('tinta-gelap'), 0.35)
        isi.push(kotak, teks(scene, kotak.x, kotak.y, huruf, { ukuran: 26 }, resolusi))
      }
      const kotak = { x, y: TOMBOL_Y, lebar: lebarTombol, tinggi: TOMBOL_T, warna, warnaGelap: gelap }
      this.tombol.push(new Tombol(scene, kotak, isi, () => o.onTekan(i)))
    }

    // Tantangan bangkit menutupi jalur aba-aba.
    this.bangkit = scene.add.container(0, 0).setVisible(false)
    this.bangkit.add(scene.add.rectangle(kiri, JALUR_Y, kanan - kiri, JALUR_T, w('merah-bata-gelap'), 0.96).setOrigin(0, 0))
    const lebarJalur = kanan - kiri
    const pipMulai = kiri + lebarJalur * 0.62
    const jarakPip = Math.min(40, (kanan - 30 - pipMulai) / (BANGKIT_KETUK - 1))
    this.bangkitTeks = teks(scene, kiri + lebarJalur * 0.31, this.cy, '', { ukuran: 32 }, resolusi)
    this.bangkit.add(this.bangkitTeks)
    for (let i = 0; i < BANGKIT_KETUK; i++) {
      const pip = scene.add.circle(pipMulai + i * jarakPip, this.cy, 13, w('kayu-gelap')).setStrokeStyle(4, w('kertas-terang'))
      this.pip.push(pip)
      this.bangkit.add(pip)
    }
  }

  /** Huruf keyboard ditekan: tampilkan tombolnya turun. */
  tekanKeyboard(i: number, turun: boolean) {
    const t = this.tombol[i]
    if (!t) return
    if (turun) t.tekan(-1 - i)
    else t.lepas(-1 - i)
  }

  lepasPointer(id: number) {
    this.tombol.forEach((t) => t.lepas(id))
  }

  /** Tim Kompak: tombol yang sudah ditekan dalam kelompok berjalan menyala. */
  setMenunggu(ditekan: ReadonlySet<number>) {
    if (this.statusBangkit === 'ketuk') return
    this.tombol.forEach((t, i) => t.setMenyala(ditekan.has(i)))
  }

  tampilNilai(nilai: Nilai | 'ekstra', alasan?: 'kaki' | 'kompak') {
    const isi: Record<Nilai | 'ekstra', [string, NamaWarna]> = {
      pas: ['PAS!', 'cahaya-kelir'],
      oke: ['OKE', 'kertas-terang'],
      meleset: ['MELESET', 'abu-kartu'],
      salah: [alasan === 'kompak' ? 'BELUM KOMPAK!' : 'SALAH KAKI!', 'merah-bata'],
      ekstra: ['TERBURU-BURU', 'kunyit'],
    }
    const [label, warna] = isi[nilai]
    const p = this.popup
    this.scene.tweens.killTweensOf(p)
    p.setText(label).setColor(WARNA[warna]).setAlpha(1).setScale(1)
    p.x = Math.min(this.ringX + 60 + p.width / 2, this.jalurKanan - p.width / 2 - 8)
    p.y = this.cy
    if (this.o.gerak) {
      p.setScale(1.25)
      this.scene.tweens.add({ targets: p, scale: 1, duration: 120, ease: 'Back.easeOut' })
    }
    this.scene.tweens.add({ targets: p, alpha: 0, delay: 380, duration: 220 })
  }

  jatuh() {
    this.statusBangkit = 'jatuh'
    this.bangkit.setVisible(true)
    this.bangkitTeks.setText('JATUH!')
    this.pip.forEach((p) => p.setFillStyle(w('kayu-gelap')))
  }

  siapBangkit() {
    this.statusBangkit = 'ketuk'
    this.bangkitTeks.setText(`Ketuk cepat ${BANGKIT_KETUK}×!`)
    this.tombol.forEach((t) => t.setMenyala(true))
  }

  ketukBangkit(ke: number) {
    this.pip.forEach((p, i) => p.setFillStyle(w(i < ke ? 'cahaya-kelir' : 'kayu-gelap')))
  }

  bangkitGagal() {
    this.bangkitTeks.setText('Kurang cepat! Lagi!')
    this.ketukBangkit(0)
  }

  selesaiBangkit() {
    this.statusBangkit = 'tidak'
    this.bangkit.setVisible(false)
    this.tombol.forEach((t) => t.setMenyala(false))
  }

  selesaiLomba() {
    this.catatan.forEach((c) => c.setVisible(false))
    this.selesaiBangkit()
  }

  /**
   * @param t waktu lagu sekarang
   * @param ketukanAwal ketukan pertama yang belum dinilai tim
   * @param sisaBangkit sisa waktu bangkit (ms) atau null
   */
  update(t: number, ketukanAwal: number, goyang: number, sisaBangkit: number | null) {
    const redup = this.statusBangkit !== 'tidak'
    let n = 0
    for (let k = Math.max(0, ketukanAwal); n < this.catatan.length; k++) {
      const x = this.ringX + (waktuKetukan(k) - t) * LAJU_CATATAN
      if (x > this.jalurKanan - 30) break
      if (x < this.jalurKiri + 28) continue
      const c = this.catatan[n++]!
      const kaki = kakiKetukan(k)
      if (c.getData('kaki') !== kaki) this.warnaiCatatan(c, kaki)
      c.setPosition(x, this.cy).setVisible(true)
      // Memudar di dekat ujung kanan supaya catatan tidak muncul tiba-tiba.
      c.setAlpha((redup ? 0.3 : 1) * Math.min(1, (this.jalurKanan - 30 - x) / 60))
    }
    for (; n < this.catatan.length; n++) this.catatan[n]!.setVisible(false)

    if (this.statusBangkit === 'ketuk') {
      const sisa = sisaBangkit ?? BANGKIT_WAKTU
      this.goyangIsi.width = this.goyangLebar * (sisa / BANGKIT_WAKTU)
      this.goyangIsi.fillColor = w('cahaya-kelir')
    } else {
      const p = goyang / GOYANG_MAKS
      this.goyangIsi.width = this.goyangLebar * p
      this.goyangIsi.fillColor = w(p < 0.5 ? 'daun-pisang' : p < 0.8 ? 'kunyit' : 'merah-bata')
    }
  }

  private buatCatatan() {
    const c = this.scene.add.container(0, 0).setVisible(false)
    c.add(this.scene.add.graphics())
    c.add(this.scene.add.triangle(0, 0, 0, 0, 0, 26, 18, 13, w('kertas-terang')))
    return c
  }

  private warnaiCatatan(c: Phaser.GameObjects.Container, kaki: 'kiri' | 'kanan') {
    c.setData('kaki', kaki)
    const g = c.getAt(0) as Phaser.GameObjects.Graphics
    const panah = c.getAt(1) as Phaser.GameObjects.Triangle
    g.clear()
    g.fillStyle(w(WARNA_KAKI[kaki][1])).fillRoundedRect(-30, -21, 60, 46, 14)
    g.fillStyle(w(WARNA_KAKI[kaki][0])).fillRoundedRect(-30, -24, 60, 44, 14)
    g.lineStyle(3, w('kertas-terang')).strokeRoundedRect(-30, -24, 60, 44, 14)
    panah.setScale(kaki === 'kiri' ? -1 : 1, 1).setPosition(kaki === 'kiri' ? -2 : 2, -2)
  }
}
