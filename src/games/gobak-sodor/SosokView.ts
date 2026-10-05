/**
 * Tampilan satu siswa di lapangan: alas berwarna tim di titik kaki (titik
 * logika), karakter kit berpose penyerang/penjaga, tanda pemain ("KAMU", "P1"),
 * dan tulisan singkat di atas kepala. Kedalaman mengikuti y supaya yang di
 * depan menutupi yang di belakang. Gerak hiasan (ayun langkah) dimatikan jika
 * pemain meminta gerak dikurangi.
 */
import * as Phaser from 'phaser'
import { WARNA, warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'
import { R_SENTUH } from './config'
import { ALAS } from './tekstur'
import { TINGGI_SOSOK } from './tata'

export interface TeksturSosok {
  serang: string
  jaga: string
  kaget: string
}

export type PeranSosok = 'serang' | 'jaga' | 'kaget'

export class SosokView {
  private scene: Phaser.Scene
  private tekstur: TeksturSosok
  private gerak: boolean
  private akar: Phaser.GameObjects.Container
  private alas: Phaser.GameObjects.Ellipse
  private cincin: Phaser.GameObjects.Ellipse
  private sosok: Phaser.GameObjects.Image
  private tanda: Phaser.GameObjects.Container
  private tandaTeks: Phaser.GameObjects.Text
  private popup: Phaser.GameObjects.Text
  private fase = Math.random() * 10
  private tween: Phaser.Tweens.Tween | null = null

  constructor(scene: Phaser.Scene, tekstur: TeksturSosok, warnaTim: number, o: { res: number; gerak: boolean }) {
    this.scene = scene
    this.tekstur = tekstur
    this.gerak = o.gerak
    this.akar = scene.add.container(0, 0)
    this.cincin = scene.add.ellipse(0, 0, R_SENTUH * 2, R_SENTUH * 0.9).setStrokeStyle(4, w('cahaya-kelir')).setVisible(false)
    this.alas = scene.add.ellipse(0, 0, 50, 20, warnaTim, 0.85).setStrokeStyle(3, w('kertas-terang'), 0.9)
    this.sosok = scene.add.image(0, 0, tekstur.serang).setOrigin(0.5, ALAS)
    this.sosok.setScale(TINGGI_SOSOK / this.sosok.height)
    // Tanda pemain: segitiga + label di atas kepala.
    this.tanda = scene.add.container(0, -TINGGI_SOSOK - 22).setVisible(false)
    this.tandaTeks = teks(scene, 0, -18, '', { ukuran: 30, warna: 'tinta-gelap' }, o.res)
    const latar = scene.add.rectangle(0, -18, 10, 38, w('cahaya-kelir')).setStrokeStyle(3, w('tinta-gelap'))
    const segitiga = scene.add.triangle(0, 4, -12, 0, 12, 0, 0, 14, w('cahaya-kelir')).setStrokeStyle(3, w('tinta-gelap'))
    this.tanda.add([segitiga, latar, this.tandaTeks])
    this.akar.add([this.cincin, this.alas, this.sosok, this.tanda])
    this.popup = teks(scene, 0, 0, '', { ukuran: 32, garis: 'tinta-gelap', tebalGaris: 7 }, o.res).setDepth(950).setAlpha(0)
  }

  get x() {
    return this.akar.x
  }

  get y() {
    return this.akar.y
  }

  setPos(x: number, y: number) {
    this.akar.setPosition(x, y)
    this.akar.setDepth(y)
  }

  setPeran(p: PeranSosok) {
    this.sosok.setTexture(this.tekstur[p])
    this.sosok.setScale(TINGGI_SOSOK / this.sosok.height)
  }

  /** Label tanda pemain ("KAMU", "P1", …) atau null untuk menyembunyikan. */
  setTanda(label: string | null) {
    this.tanda.setVisible(label !== null)
    this.cincin.setVisible(label !== null)
    if (label === null) return
    this.tandaTeks.setText(label)
    const latar = this.tanda.getAt(1) as Phaser.GameObjects.Rectangle
    latar.setSize(this.tandaTeks.width + 18, 38).setOrigin(0.5)
  }

  setTampil(v: boolean, alpha = 1) {
    this.akar.setVisible(v).setAlpha(alpha)
  }

  /** Ayun langkah saat bergerak (lajuPx = px/detik). */
  ayun(lajuPx: number, dtMs: number) {
    if (!this.gerak) return
    if (lajuPx > 20) {
      this.fase += (dtMs / 1000) * 14
      this.sosok.y = -Math.abs(Math.sin(this.fase)) * 5
      this.sosok.rotation = Math.sin(this.fase) * 0.05
    } else {
      this.sosok.y *= 0.7
      this.sosok.rotation *= 0.7
    }
    if (this.cincin.visible) this.cincin.setScale(1 + Math.sin(this.scene.time.now / 220) * 0.04)
  }

  /** Tulisan singkat di atas kepala. */
  sorak(isi: string, warna: NamaWarna) {
    const p = this.popup
    const tw = this.scene.tweens
    tw.killTweensOf(p)
    p.setText(isi).setColor(WARNA[warna]).setAlpha(1).setScale(1)
    p.setPosition(this.x, this.y - TINGGI_SOSOK - 30)
    if (this.gerak) {
      p.setScale(1.3)
      tw.add({ targets: p, scale: 1, y: p.y - 16, duration: 220, ease: 'Back.easeOut' })
    }
    tw.add({ targets: p, alpha: 0, delay: 900, duration: 300 })
  }

  /** Berjalan ke titik lain (pergantian penyerang). Tanpa animasi jika gerak dikurangi. */
  jalanKe(x: number, y: number, lama: number, selesai?: () => void) {
    this.tween?.stop()
    this.tween = null
    if (!this.gerak || lama <= 0) {
      this.setPos(x, y)
      selesai?.()
      return
    }
    const dari = { x: this.x, y: this.y }
    const posisi = { f: 0 }
    this.tween = this.scene.tweens.add({
      targets: posisi,
      f: 1,
      duration: lama,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.setPos(dari.x + (x - dari.x) * posisi.f, dari.y + (y - dari.y) * posisi.f)
        this.ayun(200, 16)
      },
      onComplete: () => {
        this.tween = null
        selesai?.()
      },
    })
  }

  /** Tersentuh: kaget, berkedip, lalu keluar lapangan. */
  gugur(lama: number) {
    this.setPeran('kaget')
    this.setTanda(null)
    this.sosok.setRotation(0).setY(0)
    if (!this.gerak) {
      this.scene.time.delayedCall(lama, () => this.setTampil(false))
      return
    }
    this.scene.tweens.add({ targets: this.sosok, x: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 4 })
    this.scene.tweens.add({ targets: this.akar, alpha: 0, delay: lama * 0.6, duration: lama * 0.4, onComplete: () => this.setTampil(false) })
  }

  /** Kembali normal di awal ronde. */
  pulihkan() {
    this.tween?.stop()
    this.tween = null
    this.scene.tweens.killTweensOf(this.akar)
    this.scene.tweens.killTweensOf(this.sosok)
    this.sosok.setPosition(0, 0).setRotation(0)
    this.setTampil(true)
  }
}
