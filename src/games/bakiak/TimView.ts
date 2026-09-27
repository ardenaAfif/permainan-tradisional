/**
 * Tampilan satu tim di lintasan (tampak samping): sepasang papan bakiak, tiga
 * siswa, dan meter goyang kecil di depan tim. Posisi mengejar jarak logika
 * dengan halus; gerak hiasan dimatikan jika pemain meminta gerak dikurangi.
 */
import * as Phaser from 'phaser'
import { GOYANG_MAKS } from './config'
import type { Kaki } from './aturan'
import { ALAS_KARAKTER } from './tekstur'
import { PX_PER_M, START_X, w, type Lajur } from './tata'

/** Kunci tekstur per siswa (indeks 0 = paling depan). */
export interface TeksturSiswa {
  jalan: string
  kaget: string
  senang: string
}

const MIRING_JATUH = 1.35
const TINGGI_METER = 70

export class TimView {
  private scene: Phaser.Scene
  private tekstur: TeksturSiswa[]
  private gerak: boolean
  private akar: Phaser.GameObjects.Container
  private badan: Phaser.GameObjects.Container
  private siswa: Phaser.GameObjects.Image[] = []
  private papanKiri: Phaser.GameObjects.Rectangle
  private papanKanan: Phaser.GameObjects.Container
  private meterIsi: Phaser.GameObjects.Rectangle
  private bintang: Phaser.GameObjects.Container
  private x: number
  private targetX: number
  private panjang: number
  private tumbang = false
  private menangAnim = false
  private goyah = 0

  constructor(scene: Phaser.Scene, lajur: Lajur, tekstur: TeksturSiswa[], warnaTim: number, gerak: boolean) {
    this.scene = scene
    this.tekstur = tekstur
    this.gerak = gerak
    const sp = lajur.jarakSiswa
    const skala = lajur.tinggiKarakter / (scene.textures.get(tekstur[0]!.jalan).getSourceImage().height || 1)
    this.panjang = sp * 2 + 80
    const L = this.panjang
    this.x = this.targetX = START_X
    this.akar = scene.add.container(this.x, lajur.tanah)
    // Badan berputar di tengah bakiak (untuk goyangan).
    this.badan = scene.add.container(-L / 2, 0)
    this.akar.add(this.badan)
    const kx = (dx: number) => dx + L / 2

    this.papanKiri = scene.add.rectangle(kx(-L), -18, L, 9, w('kayu')).setOrigin(0, 0)
    this.badan.add(this.papanKiri)
    // Dari belakang ke depan supaya siswa depan tergambar paling atas.
    const posisi = [-34, -34 - sp, -34 - sp * 2]
    for (let i = 2; i >= 0; i--) {
      const img = scene.add.image(kx(posisi[i]!), -12, tekstur[i]!.jalan).setOrigin(0.5, ALAS_KARAKTER).setScale(skala)
      this.siswa[i] = img
      this.badan.add(img)
    }
    const kanan = scene.add.container(kx(-L), -11)
    kanan.add(scene.add.rectangle(0, 0, L, 12, w('kayu-muda')).setOrigin(0, 0))
    kanan.add(scene.add.rectangle(0, 9, L, 3, w('kayu-gelap')).setOrigin(0, 0))
    // Tali pengikat kaki (merah bata) di tiap siswa.
    for (const px of posisi) kanan.add(scene.add.rectangle(px + L - 7, -4, 26, 8, w('merah-bata')).setOrigin(0, 0))
    this.papanKanan = kanan
    this.badan.add(kanan)

    // Meter goyang mini di depan tim: bingkai warna tim, isi naik dari bawah.
    const mx = 16
    const my = -lajur.tinggiKarakter + 10
    this.akar.add(scene.add.rectangle(mx, my, 18, TINGGI_METER + 6, warnaTim).setOrigin(0.5, 0).setStrokeStyle(3, w('kertas-terang')))
    this.akar.add(scene.add.rectangle(mx, my + 3, 12, TINGGI_METER, w('tinta-gelap'), 0.6).setOrigin(0.5, 0))
    this.meterIsi = scene.add.rectangle(mx, my + 3 + TINGGI_METER, 12, TINGGI_METER, w('daun-pisang')).setOrigin(0.5, 1).setScale(1, 0)
    this.akar.add(this.meterIsi)

    // Bintang pusing saat jatuh.
    this.bintang = scene.add.container(-10, -50).setVisible(false)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      this.bintang.add(scene.add.star(Math.cos(a) * 34, Math.sin(a) * 12, 5, 6, 13, w('cahaya-kelir')).setStrokeStyle(2, w('kunyit-gelap')))
    }
    this.akar.add(this.bintang)
  }

  /** Jarak logika (meter) → posisi tujuan. */
  setJarak(m: number) {
    this.targetX = START_X + m * PX_PER_M
  }

  /** Satu langkah: papan kaki yang sesuai terangkat, siswa terayun. */
  langkah(kaki: Kaki, penuh: boolean, lamaKetukan: number) {
    if (this.tumbang) return
    const papan = kaki === 'kiri' ? this.papanKiri : this.papanKanan
    const dy = penuh ? 12 : 6
    const lama = Math.min(170, lamaKetukan / 3)
    if (!this.gerak) return
    this.scene.tweens.add({ targets: papan, y: papan.y - dy, duration: lama, yoyo: true, ease: 'Sine.easeOut' })
    this.siswa.forEach((s, i) =>
      this.scene.tweens.add({
        targets: s,
        y: -12 - dy * 0.7,
        angle: kaki === 'kiri' ? -4 : 4,
        duration: lama,
        delay: i * 25,
        yoyo: true,
        ease: 'Sine.easeOut',
      }),
    )
  }

  /** Meleset / salah kaki: tim terhuyung. */
  terhuyung(kuat: boolean) {
    if (this.tumbang) return
    this.goyah = kuat ? 1 : 0.5
  }

  jatuh() {
    this.tumbang = true
    this.siswa.forEach((s, i) => {
      s.setTexture(this.tekstur[i]!.kaget)
      this.scene.tweens.killTweensOf(s)
      s.y = -12
      if (this.gerak) {
        this.scene.tweens.add({ targets: s, rotation: MIRING_JATUH, duration: 420, delay: (2 - i) * 90, ease: 'Bounce.easeOut' })
      } else s.rotation = MIRING_JATUH
    })
    this.bintang.setVisible(true)
    if (this.gerak) {
      this.scene.tweens.add({ targets: this.bintang, angle: 360, duration: 1100, repeat: -1 })
    }
  }

  /** Setiap ketukan bangkit mengangkat tim sedikit. */
  ketukBangkit(ke: number, dari: number) {
    const r = MIRING_JATUH * (1 - (ke / dari) * 0.6)
    this.siswa.forEach((s) => {
      this.scene.tweens.killTweensOf(s)
      if (this.gerak) this.scene.tweens.add({ targets: s, rotation: r, duration: 90, ease: 'Back.easeOut' })
      else s.rotation = r
    })
  }

  bangkitGagal() {
    this.siswa.forEach((s) => {
      this.scene.tweens.killTweensOf(s)
      s.rotation = MIRING_JATUH
    })
  }

  bangkit() {
    this.tumbang = false
    this.bintang.setVisible(false)
    this.scene.tweens.killTweensOf(this.bintang)
    this.siswa.forEach((s, i) => {
      s.setTexture(this.tekstur[i]!.jalan)
      this.scene.tweens.killTweensOf(s)
      if (this.gerak) this.scene.tweens.add({ targets: s, rotation: 0, duration: 260, delay: i * 40, ease: 'Back.easeOut' })
      else s.rotation = 0
    })
  }

  /** Tim Kompak: siswa ke-i (0 = depan) menjejak sendiri. */
  jejak(i: number) {
    const s = this.siswa[i]
    if (!s || this.tumbang || !this.gerak) return
    this.scene.tweens.add({ targets: s, y: -18, duration: 60, yoyo: true })
  }

  menang() {
    this.menangAnim = true
    this.tumbang = false
    this.bintang.setVisible(false)
    this.siswa.forEach((s, i) => {
      this.scene.tweens.killTweensOf(s)
      s.setTexture(this.tekstur[i]!.senang).setRotation(0).setY(-12)
      if (this.gerak) this.scene.tweens.add({ targets: s, y: -34, duration: 260, delay: i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeOut' })
    })
  }

  update(dtMs: number, goyang: number, waktu: number) {
    // Kejar posisi tujuan dengan halus (langkah terlihat bergeser, bukan melompat).
    const f = Math.min(1, dtMs / 90)
    this.x += (this.targetX - this.x) * f
    this.akar.x = this.x

    const p = goyang / GOYANG_MAKS
    this.meterIsi.scaleY = p
    this.meterIsi.fillColor = w(p < 0.5 ? 'daun-pisang' : p < 0.8 ? 'kunyit' : 'merah-bata')

    if (!this.gerak || this.tumbang || this.menangAnim) {
      this.badan.rotation = 0
      return
    }
    this.goyah = Math.max(0, this.goyah - dtMs / 500)
    const amp = 0.012 + p * 0.07 + this.goyah * 0.06
    this.badan.rotation = Math.sin(waktu / (110 - p * 40)) * amp
  }
}
