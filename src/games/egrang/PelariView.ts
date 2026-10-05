/**
 * Tampilan satu pelari (tampak samping lintasan): siswa berpose egrang dari
 * character kit. Badan berputar di ujung bambu mengikuti miring; langkah
 * mengangkat satu bambu (badan berporos di bambu lainnya). Gerak hiasan
 * dimatikan jika pemain meminta gerak dikurangi; miring tetap terlihat karena
 * itu keadaan permainan.
 */
import * as Phaser from 'phaser'
import { WARNA, warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'
import { arahKaki, type Kaki, type Medan } from './aturan'
import { ALAS_EGRANG, BAMBU_DX, MEDALI_X, TINGGI_KARAKTER, xMeter, type Lajur } from './tata'

export interface TeksturPelari {
  jalan: string
  kaget: string
  senang: string
}

/** Sudut badan (rad) saat |miring| = 1, tepat sebelum jatuh. */
const MIRING_MAKS = 0.42
/** Sudut tergeletak setelah jatuh. */
const ROBOH = 1.42
/** Sudut ayunan langkah (rad). */
const AYUN_LANGKAH = 0.07

export class PelariView {
  private scene: Phaser.Scene
  private lajur: Lajur
  private tekstur: TeksturPelari
  private gerak: boolean
  private res: number
  private kedalaman: number
  private akar: Phaser.GameObjects.Container
  private sosok: Phaser.GameObjects.Image
  private bintang: Phaser.GameObjects.Container
  private popup: Phaser.GameObjects.Text
  private x: number
  private targetX: number
  private mode: 'jalan' | 'jatuh' | 'finis' = 'jalan'
  /** Ayunan langkah: f naik-turun 0→1→0, arah = +1 (egrang kiri terangkat) / −1. */
  private ayun = { f: 0, arah: 0 }
  private dx: number
  private tinggi: number

  constructor(scene: Phaser.Scene, lajur: Lajur, tekstur: TeksturPelari, o: { res: number; gerak: boolean; kedalaman: number }) {
    this.scene = scene
    this.lajur = lajur
    this.tekstur = tekstur
    this.gerak = o.gerak
    this.res = o.res
    this.kedalaman = o.kedalaman
    const s = lajur.skala
    this.tinggi = TINGGI_KARAKTER * s
    this.dx = BAMBU_DX * this.tinggi
    this.x = this.targetX = xMeter(0)

    this.akar = scene.add.container(this.x, lajur.tanah).setDepth(o.kedalaman)
    this.sosok = scene.add.image(0, 0, tekstur.jalan).setOrigin(0.5, ALAS_EGRANG)
    this.sosok.setScale(this.tinggi / this.sosok.height)
    this.akar.add(this.sosok)

    // Bintang pusing di dekat kepala setelah jatuh.
    this.bintang = scene.add.container(0, -14 * s).setVisible(false)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      this.bintang.add(scene.add.star(Math.cos(a) * 30 * s, Math.sin(a) * 10 * s, 5, 5 * s, 12 * s, w('cahaya-kelir')).setStrokeStyle(2, w('kunyit-gelap')))
    }
    this.akar.add(this.bintang)

    this.popup = teks(scene, this.x, 0, '', { ukuran: 30, garis: 'tinta-gelap', tebalGaris: 7 }, o.res).setDepth(60).setAlpha(0)
  }

  get posisiX() {
    return this.x
  }

  setJarak(m: number) {
    this.targetX = xMeter(m)
  }

  /** Satu langkah: bambu sisi `kaki` terangkat. Genangan memercik, gelombang berdebu. */
  langkah(kaki: Kaki, medan: Medan) {
    if (this.mode !== 'jalan' || !this.gerak) return
    const tw = this.scene.tweens
    tw.killTweensOf(this.ayun)
    this.ayun.arah = arahKaki(kaki)
    this.ayun.f = 0
    tw.add({ targets: this.ayun, f: 1, duration: 110, yoyo: true, ease: 'Sine.easeOut' })
    if (medan === 'genangan') this.percik(kaki, 'langit-jendela', 4)
    else if (medan === 'gelombang') this.percik(kaki, 'lantai', 2)
  }

  /** Tulisan singkat di atas kepala. */
  sorak(isi: string, warna: NamaWarna) {
    const p = this.popup
    const tw = this.scene.tweens
    tw.killTweensOf(p)
    p.setText(isi).setColor(WARNA[warna]).setAlpha(1).setScale(1)
    p.setPosition(this.x, this.lajur.tanah - this.tinggi * 0.95)
    if (this.gerak) {
      p.setScale(1.25)
      tw.add({ targets: p, scale: 1, duration: 140, ease: 'Back.easeOut' })
    }
    tw.add({ targets: p, alpha: 0, delay: 650, duration: 250 })
  }

  jatuh(arah: -1 | 1) {
    this.mode = 'jatuh'
    const tw = this.scene.tweens
    tw.killTweensOf(this.ayun)
    tw.killTweensOf(this.sosok)
    this.ayun.f = 0
    this.sosok.setTexture(this.tekstur.kaget)
    const s = this.lajur.skala
    // Kepala mendarat sejauh ±tinggi badan di sisi jatuhnya.
    this.bintang.setPosition(arah * this.tinggi * 0.72, -16 * s)
    const akhir = () => {
      this.sosok.setRotation(arah * ROBOH).setY(0)
      this.bintang.setVisible(true)
      if (this.gerak) tw.add({ targets: this.bintang, angle: 360, duration: 1000, repeat: -1 })
    }
    if (!this.gerak) {
      akhir()
      return
    }
    // Sempat menahan sebentar ke arah sebaliknya, lalu roboh memantul.
    tw.chain({
      targets: this.sosok,
      tweens: [
        { rotation: this.sosok.rotation - arah * 0.12, duration: 120, ease: 'Sine.easeOut' },
        { rotation: arah * ROBOH, y: 0, duration: 520, ease: 'Bounce.easeOut', onComplete: () => this.debu(arah) },
      ],
      onComplete: akhir,
    })
  }

  /** Pindah ke start/pos setelah jatuh (layar memudar singkat). */
  kembali(ke: number, label: string) {
    const tw = this.scene.tweens
    const pindah = () => {
      tw.killTweensOf(this.bintang)
      this.bintang.setVisible(false).setAngle(0)
      this.x = this.targetX = xMeter(ke)
      this.akar.x = this.x
      this.sosok.setTexture(this.tekstur.jalan).setRotation(0).setY(0)
      this.sorak(label, 'kertas-terang')
    }
    if (!this.gerak) {
      pindah()
      return
    }
    tw.add({
      targets: this.akar,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        pindah()
        tw.add({ targets: this.akar, alpha: 1, duration: 260 })
      },
    })
  }

  siap() {
    this.mode = 'jalan'
    this.akar.setAlpha(1)
    this.sosok.setTexture(this.tekstur.jalan)
  }

  finis(urutan: number, warna: number) {
    this.mode = 'finis'
    this.scene.tweens.killTweensOf(this.ayun)
    this.ayun.f = 0
    this.sosok.setTexture(this.tekstur.senang).setRotation(0).setY(0)
    const s = this.lajur.skala
    const y = this.lajur.tanah - 20 * s
    const medali = this.scene.add.container(MEDALI_X, y).setDepth(this.kedalaman + 0.5)
    medali.add(this.scene.add.circle(0, 0, 25, w(urutan === 1 ? 'cahaya-kelir' : 'kertas-terang')).setStrokeStyle(5, warna))
    medali.add(teks(this.scene, 0, 1, String(urutan), { ukuran: 32, warna: 'tinta' }, this.res))
    if (this.gerak) {
      medali.setScale(0.3)
      this.scene.tweens.add({ targets: medali, scale: 1, duration: 320, ease: 'Back.easeOut' })
      this.scene.tweens.add({ targets: this.sosok, y: -14 * s, duration: 240, yoyo: true, repeat: 3, ease: 'Sine.easeOut' })
    }
  }

  update(dtMs: number, miring: number, waktu: number) {
    const f = Math.min(1, dtMs / 90)
    this.x += (this.targetX - this.x) * f
    this.akar.x = this.x
    if (this.popup.alpha > 0) this.popup.x = this.x
    if (this.mode !== 'jalan') return
    let rot = miring * MIRING_MAKS
    if (this.gerak) rot += this.ayun.arah * this.ayun.f * AYUN_LANGKAH + Math.sin(waktu / 130) * 0.012 * Math.abs(miring)
    // Berporos di ujung bambu yang lebih rendah: bambu itu tetap menapak tanah.
    this.sosok.rotation = rot
    this.sosok.y = -this.dx * Math.abs(Math.sin(rot))
  }

  private percik(kaki: Kaki, warna: NamaWarna, n: number) {
    const s = this.lajur.skala
    // Percikan di bambu yang menumpu (sisi yang tidak terangkat).
    const x0 = this.x + arahKaki(kaki) * this.dx
    for (let i = 0; i < n; i++) {
      const titik = this.scene.add.circle(x0, this.lajur.tanah - 2, (3 + Math.random() * 3) * s, w(warna)).setDepth(this.kedalaman + 0.2)
      this.scene.tweens.add({
        targets: titik,
        x: x0 + (Math.random() * 2 - 1) * 26 * s,
        y: this.lajur.tanah - (12 + Math.random() * 20) * s,
        alpha: 0,
        duration: 320 + Math.random() * 120,
        ease: 'Quad.easeOut',
        onComplete: () => titik.destroy(),
      })
    }
  }

  private debu(arah: -1 | 1) {
    const s = this.lajur.skala
    for (let i = 0; i < 5; i++) {
      const x = this.x + arah * (20 + i * 22) * s
      const kepul = this.scene.add.circle(x, this.lajur.tanah - 4, 8 * s, w('kertas-krem'), 0.9).setDepth(this.kedalaman + 0.2)
      this.scene.tweens.add({
        targets: kepul,
        scale: 2.2,
        y: kepul.y - 14 * s,
        alpha: 0,
        duration: 480,
        delay: i * 30,
        onComplete: () => kepul.destroy(),
      })
    }
  }
}
