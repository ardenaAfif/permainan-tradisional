/**
 * Tampilan pelari estafet di lintasan: karakter kit yang membawa balon
 * (dan teman pengapitnya), balon yang menggembung/memerah saat tekanan naik,
 * tanda pemain ("KAMU", "P1"), cipratan saat pecah, dan balon masuk keranjang.
 * Dipakai juga untuk bayangan pelari komputer (siluet tembus pandang).
 * Kedalaman mengikuti y supaya yang di depan menutupi yang di belakang.
 * Gerak hiasan dimatikan jika pemain meminta gerak dikurangi.
 */
import * as Phaser from 'phaser'
import { WARNA, warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { teks } from '../../shared/phaser/teks'
import type { IdCara } from './config'
import type { Titik } from './lintasan'
import { TINGGI_SOSOK } from './tata'
import { ORIGIN_BALON } from './tekstur'

export const KUNCI_BALON = 'ba-balon'
export const KUNCI_BALON_MERAH = 'ba-balon-merah'

export interface OpsiTampil {
  res: number
  gerak: boolean
  /** Pembesaran kamera yang melihat lintasan ini (ukuran teks dunia). */
  zoom: number
  /** Geser lintasan di dunia. */
  oy: number
}

/** Satu siswa di lapangan: bayangan kaki, alas warna tim, gambar karakter. */
export class Sosok {
  private gerak: boolean
  readonly akar: Phaser.GameObjects.Container
  private alas: Phaser.GameObjects.Ellipse | null
  readonly gambar: Phaser.GameObjects.Image
  private fase = Math.random() * 10
  private oy: number

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, kunci: string, asal: number, o: OpsiTampil & { warna: number | null }) {
    this.gerak = o.gerak
    this.oy = o.oy
    this.akar = scene.add.container(0, 0)
    const bayang = scene.add.ellipse(0, 2, 44, 14, w('tinta-gelap'), 0.22)
    this.alas = o.warna === null ? null : scene.add.ellipse(0, 0, 42, 16, o.warna, 0.85).setStrokeStyle(3, w('kertas-terang'), 0.9)
    this.gambar = scene.add.image(0, 0, kunci).setOrigin(0.5, asal)
    this.gambar.setScale(TINGGI_SOSOK / this.gambar.height)
    this.akar.add(this.alas ? [bayang, this.alas, this.gambar] : [bayang, this.gambar])
    layer.add(this.akar)
  }

  get x() {
    return this.akar.x
  }

  get tampil() {
    return this.akar.visible
  }

  /** y lintasan (tanpa geser dunia). */
  get y() {
    return this.akar.y - this.oy
  }

  setPos(x: number, y: number) {
    this.akar.setPosition(x, y + this.oy)
    this.akar.setDepth(y + this.oy)
  }

  setTekstur(kunci: string, asal: number) {
    this.gambar.setTexture(kunci).setOrigin(0.5, asal)
    this.gambar.setScale(TINGGI_SOSOK / this.gambar.height)
  }

  setTampil(v: boolean, alpha = 1) {
    this.akar.setVisible(v).setAlpha(alpha)
  }

  /** Ayun langkah saat bergerak (lajuPx = px/detik). */
  ayun(lajuPx: number, dtMs: number) {
    if (!this.gerak) return
    if (lajuPx > 20) {
      this.fase += (dtMs / 1000) * (6 + lajuPx / 25)
      this.gambar.y = -Math.abs(Math.sin(this.fase)) * 4
      this.gambar.rotation = Math.sin(this.fase) * 0.045
    } else {
      this.gambar.y *= 0.7
      this.gambar.rotation *= 0.7
    }
  }

  diam() {
    this.gambar.setPosition(0, 0).setRotation(0)
  }
}

export interface TeksturPelari {
  bawa: string
  asalBawa: number
  kaget: string
  senang: string
  /** Teman pengapit (cara diapit). */
  teman?: string
}

/** Titik tengah balon relatif ke titik kaki, menurut cara membawa. */
function letakBalon(cara: IdCara) {
  switch (cara) {
    case 'atas-kepala':
      return { dy: -TINGGI_SOSOK * 1.06, depan: false }
    case 'diapit':
      return { dy: -TINGGI_SOSOK * 0.5, depan: true }
    default:
      return { dy: -TINGGI_SOSOK * 0.38, depan: true }
  }
}

export class PelariView {
  private scene: Phaser.Scene
  private layer: Phaser.GameObjects.Layer
  private o: OpsiTampil
  private bayangan: boolean
  readonly pelari: Sosok
  readonly teman: Sosok
  private balon: Phaser.GameObjects.Container
  private balonBiru: Phaser.GameObjects.Image
  private balonMerah: Phaser.GameObjects.Image
  private tanda: Phaser.GameObjects.Container
  private tandaTeks: Phaser.GameObjects.Text
  private tandaLatar: Phaser.GameObjects.Rectangle
  private popup: Phaser.GameObjects.Text
  private tex: TeksturPelari | null = null
  private cara: IdCara = 'dua-tangan'
  private waktu = 0
  private skalaTeks: number

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, warna: number, o: OpsiTampil & { bayangan: boolean; kunciAwal: string }) {
    this.scene = scene
    this.layer = layer
    this.o = o
    this.bayangan = o.bayangan
    const warnaAlas = o.bayangan ? null : warna
    this.teman = new Sosok(scene, layer, o.kunciAwal, 0.98, { ...o, warna: warnaAlas })
    this.pelari = new Sosok(scene, layer, o.kunciAwal, 0.98, { ...o, warna: warnaAlas })
    this.teman.setTampil(false)
    this.balonBiru = scene.add.image(0, 0, KUNCI_BALON).setOrigin(ORIGIN_BALON.x, ORIGIN_BALON.y)
    this.balonMerah = scene.add.image(0, 0, KUNCI_BALON_MERAH).setOrigin(ORIGIN_BALON.x, ORIGIN_BALON.y).setAlpha(0)
    this.balon = scene.add.container(0, 0, [this.balonBiru, this.balonMerah])
    const skalaBalon = 1 / (o.res * o.zoom)
    this.balonBiru.setScale(skalaBalon)
    this.balonMerah.setScale(skalaBalon)
    layer.add(this.balon)

    // Teks dunia: ukuran dibagi zoom supaya ≥ 30 px panggung di semua mode.
    this.skalaTeks = 1 / o.zoom
    const rt = o.res * o.zoom
    this.tanda = scene.add.container(0, 0).setVisible(false)
    this.tandaTeks = teks(scene, 0, -18 * this.skalaTeks, '', { ukuran: 30 * this.skalaTeks, warna: 'tinta-gelap' }, rt)
    this.tandaLatar = scene.add.rectangle(0, -18 * this.skalaTeks, 10, 38 * this.skalaTeks, w('cahaya-kelir')).setStrokeStyle(3, w('tinta-gelap'))
    const s = this.skalaTeks
    const segitiga = scene.add.triangle(0, 4 * s, -12 * s, 0, 12 * s, 0, 0, 14 * s, w('cahaya-kelir')).setStrokeStyle(3, w('tinta-gelap'))
    this.tanda.add([segitiga, this.tandaLatar, this.tandaTeks])
    layer.add(this.tanda)
    this.popup = teks(scene, 0, 0, '', { ukuran: 34 * this.skalaTeks, garis: 'tinta-gelap', tebalGaris: 7 * this.skalaTeks }, rt)
      .setDepth(5000)
      .setAlpha(0)
    layer.add(this.popup)
    if (o.bayangan) {
      this.balon.setAlpha(0.42)
    }
  }

  /** Siapkan untuk putaran baru: tekstur dan cara membawa. */
  setPutaran(cara: IdCara, tex: TeksturPelari) {
    this.cara = cara
    this.tex = tex
    this.pelari.setTekstur(tex.bawa, tex.asalBawa)
    this.pelari.diam()
    if (tex.teman) this.teman.setTekstur(tex.teman, tex.asalBawa)
    const alpha = this.bayangan ? 0.42 : 1
    this.pelari.setTampil(true, alpha)
    this.teman.setTampil(!!tex.teman, alpha)
    this.balon.setVisible(true).setAlpha(alpha).setScale(1).setAngle(0)
    this.balonMerah.setAlpha(0)
    this.scene.tweens.killTweensOf(this.balon)
  }

  /** Label tanda pemain ("KAMU", "P1", …) atau null. */
  setTanda(label: string | null) {
    this.tanda.setVisible(label !== null)
    if (label === null) return
    this.tandaTeks.setText(label)
    this.tandaLatar.setSize(this.tandaTeks.width + 18 * this.skalaTeks, 38 * this.skalaTeks).setOrigin(0.5)
  }

  /** Perbarui posisi dan balon setiap frame. */
  perbarui(p: Titik, teman: Titik | null, d: { tekanan: number; goyang: number; laju: number; dt: number; bawa: boolean }) {
    this.waktu += d.dt
    this.pelari.setPos(p.x, p.y)
    this.pelari.ayun(d.laju, d.dt)
    if (teman) {
      this.teman.setPos(teman.x, teman.y)
      this.teman.ayun(d.laju, d.dt)
    }
    const oy = this.o.oy
    const atasKepala = this.cara === 'atas-kepala'
    this.tanda.setPosition(p.x, p.y + oy - TINGGI_SOSOK * (atasKepala ? 1.32 : 1.08) - 10)
    this.tanda.setDepth(4000 + oy)
    if (!d.bawa) return
    const l = letakBalon(this.cara)
    const bx = teman ? (p.x + teman.x) / 2 : p.x
    const by = (teman ? (p.y + teman.y) / 2 : p.y) + oy
    const depan = Math.max(p.y, teman?.y ?? p.y) + oy
    this.balon.setPosition(bx, by + l.dy + this.pelari.gambar.y)
    this.balon.setDepth(l.depan ? depan + 0.5 : depan - 0.5)
    // Menggembung saat tekanan naik, bergetar saat tertekan.
    const gembung = 1 + d.tekanan * 0.14
    let gx = gembung
    let gy = gembung
    if (this.o.gerak) {
      const getar = Math.sin(this.waktu / 26) * (0.03 + d.goyang * 0.1)
      gx += getar
      gy -= getar
      this.balon.setAngle(Math.sin(this.waktu / 90) * (2 + d.goyang * 8))
    }
    this.balon.setScale(gx, gy)
    this.balonMerah.setAlpha(Math.max(0, Math.min(1, (d.tekanan - 0.35) / 0.6)) * 0.9)
  }

  /** Tulisan singkat di atas kepala. */
  sorak(isi: string, warna: NamaWarna) {
    const pp = this.popup
    const tw = this.scene.tweens
    tw.killTweensOf(pp)
    pp.setText(isi).setColor(WARNA[warna]).setAlpha(1).setScale(1)
    pp.setPosition(this.pelari.x, this.pelari.y + this.o.oy - TINGGI_SOSOK * (this.cara === 'atas-kepala' ? 1.85 : 1.6))
    if (this.o.gerak) {
      pp.setScale(1.3)
      tw.add({ targets: pp, scale: 1, y: pp.y - 16 * this.skalaTeks, duration: 220, ease: 'Back.easeOut' })
    }
    tw.add({ targets: pp, alpha: 0, delay: 1000, duration: 300 })
  }

  /** Balon pecah di titik (x, y lintasan, tanah di bawah balon): cipratan, noda basah, pelari kaget. */
  pecah() {
    const tex = this.tex
    if (!tex) return
    const sc = this.scene
    const bx = this.balon.x
    const by = this.balon.y
    const tanahY = Math.max(this.pelari.y, this.teman.tampil ? this.teman.y : -Infinity) + this.o.oy
    this.balon.setVisible(false)
    if (!this.bayangan) {
      this.pelari.setTekstur(tex.kaget, 0.98)
      this.pelari.diam()
    }
    const alpha = this.bayangan ? 0.4 : 1
    // Noda basah di tanah.
    const noda = sc.add.ellipse(bx, tanahY + 4, 70, 26, w('air-gelap'), 0.45 * alpha).setDepth(this.o.oy + 1)
    this.layer.add(noda)
    sc.tweens.add({ targets: noda, alpha: 0, delay: 900, duration: 900, onComplete: () => noda.destroy() })
    if (!this.o.gerak) return
    // Butir air memercik ke segala arah lalu jatuh.
    const n = this.bayangan ? 7 : 14
    for (let i = 0; i < n; i++) {
      const sudut = (i / n) * Math.PI * 2 + Math.random() * 0.4
      const jauh = 30 + Math.random() * 40
      const tetes = sc.add.circle(bx, by, 3 + Math.random() * 3.5, w(i % 3 ? 'air' : 'air-muda'), alpha).setDepth(by + 600)
      this.layer.add(tetes)
      sc.tweens.add({
        targets: tetes,
        x: bx + Math.cos(sudut) * jauh,
        y: by + Math.sin(sudut) * jauh * 0.6 + 26,
        alpha: 0,
        scale: 0.5,
        duration: 480 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => tetes.destroy(),
      })
    }
    this.scene.tweens.add({ targets: this.pelari.gambar, x: { from: -4, to: 4 }, duration: 60, yoyo: true, repeat: 4 })
  }

  /** Balon baru di START. */
  baru() {
    const tex = this.tex
    if (!tex) return
    this.pelari.setTekstur(tex.bawa, tex.asalBawa)
    this.pelari.diam()
    this.balon.setVisible(true).setScale(1)
    this.balonMerah.setAlpha(0)
    if (this.o.gerak) {
      this.balon.setScale(0.2)
      this.scene.tweens.add({ targets: this.balon, scale: 1, duration: 260, ease: 'Back.easeOut' })
    }
  }

  /** Sampai: balon diletakkan ke keranjang, pelari bersorak. */
  sampai(keranjang: Titik, sorakan = true) {
    const tex = this.tex
    if (!tex) return
    if (!this.bayangan && sorakan) this.pelari.setTekstur(tex.senang, 0.98)
    this.pelari.diam()
    const tujuan = { x: keranjang.x, y: keranjang.y + this.o.oy - 34 }
    if (!this.o.gerak) {
      this.balon.setVisible(false)
      return
    }
    this.scene.tweens.add({
      targets: this.balon,
      x: tujuan.x,
      y: tujuan.y,
      scale: 0.6,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => this.balon.setVisible(false),
    })
  }

  setTampil(v: boolean) {
    const alpha = this.bayangan ? 0.42 : 1
    this.pelari.setTampil(v, alpha)
    this.teman.setTampil(v && !!this.tex?.teman, alpha)
    this.balon.setVisible(v)
    if (!v) this.tanda.setVisible(false)
  }
}
