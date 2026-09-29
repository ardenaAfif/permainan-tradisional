/**
 * Adegan Phaser Bola Bekel (tampak atas). Satu lemparan: swipe ke atas (atau
 * tahan lalu lepas Spasi), selama bola di udara sentuh biji sesuai tahap,
 * lalu tangkap bola saat lingkaran waktu masuk cincin hijau. Berhasil = lempar
 * lagi (tahap tuntas = naik tahap); gagal = giliran pindah dan tahap diulang
 * pada giliran berikutnya. Semua penilaian waktu memakai jam performance.now()
 * yang bisa dijeda, bukan hitungan frame, supaya adil di HP 30 fps maupun
 * laptop 60 fps. Tata letak mengikuti ukuran panggung (mendatar atau tegak).
 */
import * as Phaser from 'phaser'
import { warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { audio } from '../../shared/audio/AudioManager'
import { jedakanAdegan, lanjutkanAdegan, type LingkunganPhaser } from '../../shared/phaser/modul'
import { teks } from '../../shared/phaser/teks'
import type { GameResult, Kesulitan, Player } from '../../shared/types'
import {
  cincinTangkap,
  jariWaktu,
  kebutuhan,
  kekuatanSwipe,
  kekuatanTahan,
  lamaUdara,
  nilaiTangkap,
  perintahTahap,
  rencanaCpu,
  sebarBiji,
  sentuhBiji,
  tahapSelesai,
  tahapTuntas,
  tangkap,
  tinggiBola,
  type Biji,
  type RencanaCpu,
} from './aturan'
import { bunyi } from './bunyi'
import {
  JARAK_BIJI,
  JEDA_CPU,
  JEDA_GAGAL,
  JEDA_HASIL,
  JEDA_TAHAP,
  JEDA_TANGKAP,
  JUMLAH_BIJI,
  PELUANG_CPU,
  R_BOLA,
  R_SENTUH_BIJI,
  R_WAKTU_AWAL,
  SISI,
  SWIPE_MIN,
  TAHAP,
  type Tahap,
} from './config'
import { ANGKAT_BOLA, aturanSebar, buatTata, TINGGI_PAPAN, titikBiji, type Tata, type Titik } from './tata'
import { R_TEKSTUR_BOLA, RAPAT_BIJI, UKURAN_BIJI, type Raut } from './tekstur'

export interface OpsiAdeganBekel {
  pemain: Player[]
  kesulitan: Kesulitan
  env: LingkunganPhaser
  /** Tekstur siap pakai (lihat KUNCI): kunci → kanvas beresolusi env.resolusi. */
  kanvas: Map<string, HTMLCanvasElement>
  onFinish(hasil: GameResult): void
}

export const KUNCI = {
  latar: (tegak: boolean) => (tegak ? 'latar-tegak' : 'latar-datar'),
  bola: 'bola',
  bayang: 'bayang',
  biji: (sisi: number) => `biji-${sisi}`,
  kepala: (i: number, r: Raut) => `p${i}-${r}`,
}

/** Kedalaman gambar. */
const D = { biji: 2, label: 2.5, bayang: 3, cincin: 4, bola: 6, jejak: 7, ui: 10, sorak: 12 }

type Fase = 'antara' | 'siap' | 'udara' | 'selesai'

interface Papan {
  bagian: Phaser.GameObjects.GameObject[]
  badge: Phaser.GameObjects.Text
  bg: Phaser.GameObjects.Graphics
  pip: Phaser.GameObjects.Graphics
  x: number
  y: number
  lebar: number
}

interface Sampel {
  x: number
  y: number
  t: number
}

export class AdeganBolaBekel extends Phaser.Scene {
  private o: OpsiAdeganBekel
  private res = 1
  private tata: Tata = buatTata(false, 1)
  private fase: Fase = 'antara'
  private dijeda = false

  // Jam permainan (ms), berhenti saat dijeda.
  private jamAsal = performance.now()
  private jedaSejak: number | null = null

  private aktif = 0
  /** Indeks tahap tiap pemain (TAHAP.length = tamat). */
  private tahap: number[] = []
  private biji: Biji[] = []
  private pemainTerakhir = -1

  // Lemparan yang sedang berjalan.
  private lama = 1
  private mulaiLempar = 0
  private sudah = 0
  private perlu = 0
  private dibalik = new Set<number>()
  private masukCincin = false
  /** Ketinggian bola yang sedang tampil (0..1). */
  private hBola = 0
  private swipe: { id: number; jejak: Sampel[] } | null = null
  private tahanSejak: number | null = null

  // Komputer.
  private rencana: RencanaCpu | null = null
  private iKetuk = 0
  private cpuLemparPada = 0

  // Gambar.
  private latar!: Phaser.GameObjects.Image
  private gambarBiji: Phaser.GameObjects.Image[] = []
  private labelBiji: Phaser.GameObjects.Text[] = []
  private bola!: Phaser.GameObjects.Image
  private bayang!: Phaser.GameObjects.Image
  private gWaktu!: Phaser.GameObjects.Graphics
  private gJejak!: Phaser.GameObjects.Graphics
  private gPanah!: Phaser.GameObjects.Graphics
  private papan: Papan[] = []
  private tahapBg!: Phaser.GameObjects.Graphics
  private tahapKepala!: Phaser.GameObjects.Image
  private tahapJudul!: Phaser.GameObjects.Text
  private tahapSub!: Phaser.GameObjects.Text
  private tahapIkon!: Phaser.GameObjects.Image
  private hitungBg!: Phaser.GameObjects.Graphics
  private hitungIkon!: Phaser.GameObjects.Image
  private hitungTeks!: Phaser.GameObjects.Text
  private pesan!: Phaser.GameObjects.Text
  private pesanBg!: Phaser.GameObjects.Graphics
  private raut: Raut = 'biasa'

  constructor(o: OpsiAdeganBekel) {
    super('bola-bekel')
    this.o = o
  }

  private get n() {
    return this.o.pemain.length
  }

  private cpu(i = this.aktif) {
    return this.o.pemain[i]?.avatar === 'cpu'
  }

  /** Skala gambar biji supaya tampil UKURAN_BIJI px panggung. */
  private get skalaBiji() {
    return 1 / (this.res * RAPAT_BIJI)
  }

  private sekarang() {
    return (this.jedaSejak ?? performance.now()) - this.jamAsal
  }

  private get tahapAktif(): Tahap {
    return TAHAP[Math.min(this.tahap[this.aktif] ?? 0, TAHAP.length - 1)]!
  }

  /** Letak biji di orientasi sekarang. */
  private posBiji(i: number): Titik {
    const b = this.biji[i]!
    const l = b.letak[this.tata.tegak ? 1 : 0] ?? b.letak[0]!
    return titikBiji(this.tata, l.u, l.v)
  }

  // ── Siklus hidup ──────────────────────────────────────────

  create() {
    const o = this.o
    this.res = o.env.resolusi
    for (const [kunci, kanvas] of o.kanvas) if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    // Beberapa jari: di PID teman bisa ikut menunjuk, dan tap biji bisa cepat beruntun.
    this.input.addPointer(3)
    this.tahap = o.pemain.map(() => 0)

    const r = 1 / this.res
    this.latar = this.add.image(0, 0, KUNCI.latar(false)).setOrigin(0).setScale(r)
    for (let i = 0; i < JUMLAH_BIJI; i++) {
      this.gambarBiji.push(this.add.image(0, 0, KUNCI.biji(0)).setScale(this.skalaBiji).setDepth(D.biji).setVisible(false))
      this.labelBiji.push(
        teks(this, 0, 0, String(i + 1), { ukuran: 30, warna: 'kertas-terang', garis: 'biru-nila', tebalGaris: 7 }, this.res)
          .setDepth(D.label)
          .setVisible(false),
      )
    }
    this.gWaktu = this.add.graphics().setDepth(D.cincin)
    this.bayang = this.add.image(0, 0, KUNCI.bayang).setDepth(D.bayang)
    this.bola = this.add.image(0, 0, KUNCI.bola).setDepth(D.bola)
    this.gJejak = this.add.graphics().setDepth(D.jejak)
    this.gPanah = this.add.graphics().setDepth(D.jejak)

    this.tahapBg = this.add.graphics().setDepth(D.ui)
    this.tahapKepala = this.add.image(0, 0, KUNCI.kepala(0, 'biasa')).setDepth(D.ui)
    this.tahapJudul = teks(this, 0, 0, '', { ukuran: 32, warna: 'cahaya-kelir' }, this.res).setOrigin(0, 0.5).setDepth(D.ui)
    this.tahapSub = teks(this, 0, 0, '', { ukuran: 30, judul: false, tebal: 700 }, this.res).setOrigin(0, 0.5).setDepth(D.ui)
    this.tahapIkon = this.add.image(0, 0, KUNCI.biji(0)).setDepth(D.ui).setVisible(false)

    this.hitungBg = this.add.graphics().setDepth(D.ui)
    this.hitungIkon = this.add.image(0, 0, KUNCI.biji(3)).setDepth(D.ui)
    this.hitungTeks = teks(this, 0, 0, '', { ukuran: 36 }, this.res).setOrigin(0, 0.5).setDepth(D.ui)
    this.tampilHitung(false)

    this.pesanBg = this.add.graphics().setDepth(D.ui)
    this.pesan = teks(this, 0, 0, '', { ukuran: 30 }, this.res).setDepth(D.ui)

    this.aturTata()
    // HP diputar (game orientasi 'any'): ukuran panggung berubah, susun ulang.
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.aturTata())

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      audio.buka()
      this.tekan(p.id, p.worldX, p.worldY)
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.geser(p.id, p.worldX, p.worldY))
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.lepas(p.id, p.worldX, p.worldY))
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.lepas(p.id, p.worldX, p.worldY))
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.tombolKeyboard(e, true))
    this.input.keyboard?.on('keyup', (e: KeyboardEvent) => this.tombolKeyboard(e, false))

    this.time.delayedCall(400, () => this.mulaiGiliran())
    if (this.dijeda) this.jeda()
  }

  update() {
    const t = this.sekarang()
    if (this.fase === 'siap') this.updateSiap(t)
    else if (this.fase === 'udara') this.updateUdara(t)
  }

  jeda() {
    this.dijeda = true
    this.jedaSejak ??= performance.now()
    // Jari/tombol yang sedang ditahan bisa lepas tanpa terbaca selama jeda.
    this.swipe = null
    this.tahanSejak = null
    this.gJejak?.clear()
    jedakanAdegan(this)
  }

  lanjut() {
    this.dijeda = false
    if (this.jedaSejak !== null) {
      this.jamAsal += performance.now() - this.jedaSejak
      this.jedaSejak = null
    }
    lanjutkanAdegan(this)
  }

  // ── Tata letak ────────────────────────────────────────────

  /** Susun semua gambar untuk ukuran panggung sekarang (mendatar/tegak). */
  private aturTata() {
    const lebar = this.scale.width / this.res
    const tinggi = this.scale.height / this.res
    const tata = buatTata(tinggi > lebar, this.n)
    this.tata = tata
    this.cameras.main.setSize(this.scale.width, this.scale.height).setZoom(this.res).centerOn(tata.lebar / 2, tata.tinggi / 2)
    this.latar.setTexture(KUNCI.latar(tata.tegak))

    this.buatPapan()
    this.perbaruiPapan(this.pemainTerakhir < 0 ? -1 : this.aktif)
    this.susunTahap()
    this.letakkanBiji()
    if (this.fase !== 'udara') this.letakkanBola(0)
    this.susunHitung()
    this.setPesan(this.pesan.text)
    this.gJejak.clear()
    if (this.fase === 'siap' && !this.cpu()) this.tampilPanah(true)
  }

  private buatPapan() {
    for (const p of this.papan) {
      p.bagian.forEach((b) => b.destroy())
    }
    this.papan = []
    this.o.pemain.forEach((pemain, i) => {
      const { x, y, lebar } = this.tata.papan[i]!
      const cy = y + TINGGI_PAPAN / 2
      const bg = this.add.graphics().setDepth(D.ui)
      const kepala = this.add.image(x + 30, cy, KUNCI.kepala(i, 'biasa')).setDepth(D.ui)
      kepala.setScale(44 / kepala.height)
      const nama = teks(this, x + 58, cy, pemain.nama, { ukuran: 30 }, this.res).setOrigin(0, 0.5).setDepth(D.ui)
      const maks = lebar - 58 - 56
      if (nama.width > maks) nama.setScale(maks / nama.width, 1)
      const badge = teks(this, x + lebar - 30, cy, '1', { ukuran: 30, warna: 'kayu-gelap' }, this.res).setDepth(D.ui)
      const pip = this.add.graphics().setDepth(D.ui)
      this.papan.push({ bagian: [bg, kepala, nama, badge, pip], bg, badge, pip, x, y, lebar })
    })
  }

  /** Papan pemain: badge = tahap sekarang, titik = tahap yang sudah tuntas. */
  private perbaruiPapan(sorot = -1) {
    const jumlah = TAHAP.length
    this.papan.forEach((p, i) => {
      const aktif = i === sorot
      const g = p.bg.clear()
      g.fillStyle(w(aktif ? 'biru-nila' : 'tinta-gelap'), aktif ? 0.95 : 0.72).fillRoundedRect(p.x, p.y, p.lebar, TINGGI_PAPAN, 26)
      if (aktif) g.lineStyle(4, w('cahaya-kelir')).strokeRoundedRect(p.x, p.y, p.lebar, TINGGI_PAPAN, 26)
      g.fillStyle(w('kunyit')).fillCircle(p.x + p.lebar - 30, p.y + TINGGI_PAPAN / 2, 20)
      const tahap = this.tahap[i] ?? 0
      const tuntas = tahapSelesai(tahap, jumlah)
      p.badge.setText(String(Math.min(tahap + 1, jumlah)))
      const pg = p.pip.clear()
      const jarak = Math.min(18, (p.lebar - 40) / jumlah)
      const px = p.x + p.lebar / 2 - (jarak * (jumlah - 1)) / 2
      for (let k = 0; k < jumlah; k++) {
        pg.fillStyle(w(k < tuntas ? 'cahaya-kelir' : 'tinta-gelap'), k < tuntas ? 1 : 0.45).fillCircle(px + k * jarak, p.y + TINGGI_PAPAN + 11, 5.5)
      }
    })
  }

  /** Papan tahap: kepala pemain aktif, "Tahap k/n · nama", perintah, dan ikon sisi untuk tahap balik. */
  private susunTahap() {
    const { x, y, w: lebar, h } = this.tata.tahap
    const tahap = this.tahapAktif
    const k = Math.min((this.tahap[this.aktif] ?? 0) + 1, TAHAP.length)
    this.tahapBg.clear().fillStyle(w('tinta-gelap'), 0.8).fillRoundedRect(x, y, lebar, h, 24)
    this.tahapKepala.setTexture(KUNCI.kepala(this.aktif, this.raut)).setPosition(x + 52, y + h / 2)
    this.tahapKepala.setScale((h - 14) / this.tahapKepala.height)
    const balik = tahap.jenis === 'balik'
    this.tahapIkon.setVisible(balik)
    if (balik) {
      this.tahapIkon.setTexture(KUNCI.biji(tahap.sisi ?? 0)).setPosition(x + lebar - h / 2 - 6, y + h / 2)
      this.tahapIkon.setScale(((h - 12) / UKURAN_BIJI) * this.skalaBiji)
    }
    const kiri = x + 104
    const maks = lebar - 104 - (balik ? h + 4 : 24)
    this.tahapJudul.setText(`Tahap ${k}/${TAHAP.length} · ${tahap.nama}`).setPosition(kiri, y + h * 0.31)
    this.tahapSub.setText(perintahTahap(tahap)).setPosition(kiri, y + h * 0.7)
    for (const t of [this.tahapJudul, this.tahapSub]) t.setScale(t.width > maks ? maks / t.width : 1, 1)
  }

  private setRaut(raut: Raut) {
    this.raut = raut
    this.tahapKepala.setTexture(KUNCI.kepala(this.aktif, raut))
  }

  /** Penghitung biji lemparan ini, di samping tempat bola. */
  private susunHitung() {
    const { x, y } = this.tata.hitung
    const selesai = this.perlu > 0 && this.sudah >= this.perlu
    this.hitungBg
      .clear()
      .fillStyle(w(selesai ? 'daun-pisang-tua' : 'tinta-gelap'), 0.85)
      .fillRoundedRect(x - 78, y - 34, 156, 68, 34)
    const tahap = this.tahapAktif
    this.hitungIkon
      .setTexture(KUNCI.biji(tahap.jenis === 'balik' ? (tahap.sisi ?? 0) : 3))
      .setPosition(x - 44, y)
      .setScale((52 / UKURAN_BIJI) * this.skalaBiji)
    this.hitungTeks.setText(`${this.sudah}/${this.perlu}`).setPosition(x - 10, y)
  }

  private tampilHitung(v: boolean) {
    this.hitungBg.setVisible(v)
    this.hitungIkon.setVisible(v)
    this.hitungTeks.setVisible(v)
  }

  private letakkanBiji() {
    const label = this.o.env.keyboard && (this.fase === 'siap' || this.fase === 'udara') && !this.cpu()
    this.gambarBiji.forEach((img, i) => {
      const b = this.biji[i]
      this.tweens.killTweensOf(img)
      if (!b) {
        img.setVisible(false)
        this.labelBiji[i]!.setVisible(false)
        return
      }
      const p = this.posBiji(i)
      img
        .setTexture(KUNCI.biji(b.sisi))
        .setPosition(p.x, p.y)
        .setRotation(b.sudut)
        .setScale(this.skalaBiji)
        .setAlpha(1)
        .setVisible(!b.diambil)
      this.labelBiji[i]!.setPosition(p.x + 34, p.y - 34).setVisible(label && !b.diambil)
    })
  }

  /**
   * Bola di atas tempat tangan (geser dx); h = ketinggian 0..1. Bola membesar
   * saat tinggi (makin dekat ke mata), bayangan mengecil dan memudar.
   */
  private letakkanBola(h: number, dx = 0) {
    this.hBola = h
    const x = this.tata.tangan.x + dx
    const { y } = this.tata.tangan
    const s = 1 + 1.15 * h
    this.bola.setPosition(x, y - ANGKAT_BOLA * h).setScale((R_BOLA * s) / R_TEKSTUR_BOLA / this.res)
    this.bayang
      .setPosition(x + 14 * h, y + 12)
      .setScale(((1 - 0.5 * h) * R_BOLA * 1.15) / R_TEKSTUR_BOLA / this.res)
      .setAlpha(0.32 * (1 - 0.55 * h))
  }

  // ── Pesan & sorak ─────────────────────────────────────────

  private setPesan(isi: string) {
    const lebarPanggung = this.tata.lebar
    this.pesan.setText(isi).setPosition(lebarPanggung / 2, this.tata.pesanY)
    const maks = lebarPanggung - 40
    this.pesan.setScale(this.pesan.width > maks - 48 ? (maks - 48) / this.pesan.width : 1, 1)
    const lebar = this.pesan.displayWidth + 48
    this.pesanBg.clear().fillStyle(w('tinta-gelap'), 0.8).fillRoundedRect(lebarPanggung / 2 - lebar / 2, this.tata.pesanY - 27, lebar, 54, 27)
    this.pesanBg.setVisible(!!isi)
  }

  /** Tulisan besar di tengah tikar; garis terang supaya terbaca di atas anyaman. */
  private sorak(isi: string, warna: NamaWarna = 'biru-nila', lama = 900) {
    const t = teks(this, this.tata.lebar / 2, this.tata.sorakY, isi, { ukuran: 60, warna, garis: 'kertas-terang', tebalGaris: 12 }, this.res).setDepth(D.sorak)
    const maks = this.tata.lebar - 60
    if (t.width > maks) t.setScale(maks / t.width)
    if (this.o.env.gerak) {
      const s = t.scale
      t.setScale(s * 0.6)
      this.tweens.add({ targets: t, scale: s, duration: 220, ease: 'Back.easeOut' })
    }
    this.tweens.add({ targets: t, alpha: 0, delay: lama, duration: 300, onComplete: () => t.destroy() })
  }

  /** Lingkaran kecil yang mengembang di titik yang disentuh (komputer juga, supaya terlihat). */
  private kilat(p: Titik, warna: NamaWarna = 'kertas-terang') {
    const c = this.add.circle(p.x, p.y, 30).setStrokeStyle(6, w(warna)).setDepth(D.jejak)
    this.tweens.add({
      targets: c,
      ...(this.o.env.gerak && { scale: 1.8 }),
      alpha: 0,
      duration: 320,
      onComplete: () => c.destroy(),
    })
  }

  /** Tanda silang merah di biji yang salah disentuh. */
  private tandaSalah(p: Titik) {
    const g = this.add.graphics().setDepth(D.sorak)
    g.lineStyle(10, w('merah-bata'))
    g.lineBetween(p.x - 26, p.y - 26, p.x + 26, p.y + 26).lineBetween(p.x - 26, p.y + 26, p.x + 26, p.y - 26)
    this.tweens.add({ targets: g, alpha: 0, delay: JEDA_GAGAL - 300, duration: 300, onComplete: () => g.destroy() })
  }

  /** Panah ke atas di atas bola: ajakan swipe. */
  private tampilPanah(v: boolean) {
    const g = this.gPanah.clear()
    this.tweens.killTweensOf(g)
    g.setAlpha(1)
    if (!v) return
    const { x, y } = this.tata.tangan
    g.lineStyle(10, w('biru-nila'), 0.85)
    for (const dy of [70, 118, 166]) {
      g.beginPath()
      g.moveTo(x - 30, y - dy + 22)
      g.lineTo(x, y - dy)
      g.lineTo(x + 30, y - dy + 22)
      g.strokePath()
    }
    if (this.o.env.gerak) this.tweens.add({ targets: g, alpha: 0.35, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }

  // ── Alur ──────────────────────────────────────────────────

  /** Awal giliran (atau awal tahap baru): biji disebar ulang. */
  private mulaiGiliran() {
    if (this.fase === 'selesai') return
    const i = this.aktif
    const p = this.o.pemain[i]!
    const tahap = this.tahapAktif
    this.biji = sebarBiji(tahap, [aturanSebar(buatTata(false, this.n), JARAK_BIJI), aturanSebar(buatTata(true, this.n), JARAK_BIJI)])
    this.raut = 'biasa'
    this.perlu = 0
    this.sudah = 0
    this.tampilHitung(false)
    this.perbaruiPapan(i)
    this.susunTahap()
    this.letakkanBola(0)

    // Main bergantian: tanda jelas saat perangkat harus berpindah tangan.
    if (this.pemainTerakhir !== i) {
      if (this.n > 1) this.sorak(`Giliran ${p.nama}!`)
      this.pemainTerakhir = i
    } else {
      this.sorak(`Tahap ${(this.tahap[i] ?? 0) + 1}: ${tahap.nama}`)
    }

    this.fase = 'antara'
    this.letakkanBiji()
    bunyi.sebar()
    if (this.o.env.gerak) {
      const { x, y } = this.tata.tangan
      this.gambarBiji.forEach((img, k) => {
        const tujuan = { x: img.x, y: img.y, rotation: img.rotation }
        img.setPosition(x, y - 40).setRotation(tujuan.rotation - 3)
        this.tweens.add({ targets: img, ...tujuan, delay: k * 40, duration: 380, ease: 'Cubic.easeOut' })
      })
    }
    this.time.delayedCall(this.o.env.gerak ? 650 : 200, () => this.siapLempar())
  }

  private siapLempar() {
    if (this.fase === 'selesai') return
    const p = this.o.pemain[this.aktif]!
    this.fase = 'siap'
    this.perlu = kebutuhan(this.tahapAktif, this.biji)
    this.sudah = 0
    this.dibalik.clear()
    this.rencana = null
    this.swipe = null
    this.tahanSejak = null
    this.gWaktu.clear()
    this.letakkanBola(0)
    this.letakkanBiji()
    this.susunHitung()
    this.tampilHitung(true)
    this.setRaut('biasa')
    if (this.cpu()) {
      this.setPesan(`${p.nama} bersiap melempar…`)
      this.cpuLemparPada = this.sekarang() + JEDA_CPU + Math.random() * 300
      this.tampilPanah(false)
    } else {
      this.setPesan(this.o.env.keyboard ? 'Swipe ke atas, atau tahan lalu lepas Spasi, untuk melempar' : 'Swipe ke atas untuk melempar bola')
      this.tampilPanah(true)
    }
  }

  private updateSiap(t: number) {
    if (this.cpu()) {
      if (t >= this.cpuLemparPada) {
        this.rencana = rencanaCpu(this.tahapAktif, this.biji, PELUANG_CPU[this.o.kesulitan])
        this.jejakCpu()
        this.lempar(this.rencana.kekuatan)
      }
      return
    }
    if (this.tahanSejak !== null) this.gambarIsi(kekuatanTahan(t - this.tahanSejak))
  }

  /** Meteran kekuatan saat Spasi ditahan, di samping bola. */
  private gambarIsi(k: number) {
    const { x, y } = this.tata.tangan
    const bx = x - 120
    const tinggi = 150
    const g = this.gJejak.clear()
    g.fillStyle(w('tinta-gelap'), 0.8).fillRoundedRect(bx - 16, y - tinggi, 32, tinggi, 14)
    g.fillStyle(w(k >= 1 ? 'cahaya-kelir' : 'kunyit')).fillRoundedRect(bx - 10, y - 6 - (tinggi - 12) * k, 20, Math.max(8, (tinggi - 12) * k), 8)
  }

  /** Jejak swipe komputer supaya pemain lain melihat lemparannya. */
  private jejakCpu() {
    const { x, y } = this.tata.tangan
    const g = this.gJejak.clear().setAlpha(1)
    g.lineStyle(12, w('biru-nila'), 0.5).lineBetween(x + 20, y + 40, x, y - 150)
    this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.clear().setAlpha(1) })
  }

  private lempar(kekuatan: number) {
    if (this.fase !== 'siap') return
    this.tampilPanah(false)
    this.swipe = null
    this.tahanSejak = null
    if (!this.cpu()) this.gJejak.clear()
    this.lama = lamaUdara(kekuatan)
    this.mulaiLempar = this.sekarang()
    this.masukCincin = false
    this.iKetuk = 0
    this.fase = 'udara'
    bunyi.lempar()
    const tahap = this.tahapAktif
    const nama = this.o.pemain[this.aktif]!.nama
    if (this.cpu()) this.setPesan(`${nama} melempar bola…`)
    else if (tahap.jenis === 'balik') this.setPesan(`Balik ${this.perlu} biji ke sisi ${SISI[tahap.sisi ?? 0]}, lalu tangkap bola!`)
    else this.setPesan(`Ambil ${this.perlu} biji, lalu tangkap bola!`)
  }

  private updateUdara(t: number) {
    const dt = t - this.mulaiLempar
    this.letakkanBola(tinggiBola(dt, this.lama))
    this.gambarWaktu(dt)
    if (!this.masukCincin && nilaiTangkap(dt, this.lama) === 'pas') {
      this.masukCincin = true
      bunyi.cincin()
    }
    const r = this.rencana
    if (this.cpu() && r) {
      while (this.iKetuk < r.ketuk.length && r.ketuk[this.iKetuk]!.t <= dt) {
        const k = r.ketuk[this.iKetuk++]!
        this.kilat(this.posBiji(k.biji))
        this.sentuh(k.biji)
        if (this.fase !== 'udara') return
      }
      if (r.tangkap !== null && dt >= r.tangkap) {
        this.kilat(this.tata.tangan)
        this.cobaTangkap(r.tangkap)
        return
      }
    }
    if (dt >= this.lama) this.bolaJatuh()
  }

  /** Lingkaran waktu yang menyusut, dan cincin tangkap hijau di tempat bola. */
  private gambarWaktu(dt: number) {
    const { x, y } = this.tata.tangan
    const c = cincinTangkap(this.lama)
    const pas = nilaiTangkap(dt, this.lama) === 'pas'
    const g = this.gWaktu.clear()
    g.lineStyle(c.luar - c.dalam, w('daun-pisang'), pas ? 0.75 : 0.5).strokeCircle(x, y, (c.luar + c.dalam) / 2)
    g.lineStyle(3, w('daun-pisang-tua'), 0.9).strokeCircle(x, y, c.luar).strokeCircle(x, y, c.dalam)
    g.lineStyle(pas ? 9 : 7, w(pas ? 'cahaya-kelir' : 'biru-nila')).strokeCircle(x, y, jariWaktu(dt, this.lama))
  }

  /** Biji ke-i disentuh selama bola di udara. */
  private sentuh(i: number) {
    if (this.fase !== 'udara') return
    const tahap = this.tahapAktif
    const hasil = sentuhBiji(tahap, this.biji, i, this.sudah, this.perlu, this.dibalik)
    const img = this.gambarBiji[i]!
    const p = this.posBiji(i)
    switch (hasil) {
      case 'abaikan':
        return
      case 'lebih':
        this.tandaSalah(p)
        this.gagal(
          'Kebanyakan!',
          tahap.jenis === 'balik' ? `Lemparan ini cukup membalik ${this.perlu} biji.` : `Lemparan ini cukup ${this.perlu} biji.`,
        )
        return
      case 'salah':
        this.tandaSalah(p)
        this.gagal('Salah biji!', `Biji itu sudah menghadap sisi ${SISI[tahap.sisi ?? 0]}.`)
        return
      case 'ambil': {
        this.biji[i]!.diambil = true
        this.labelBiji[i]!.setVisible(false)
        bunyi.ambil()
        if (this.o.env.gerak) {
          const { x, y } = this.tata.hitung
          this.tweens.add({
            targets: img,
            x: x - 44,
            y,
            scale: 0.5 * this.skalaBiji,
            alpha: 0.2,
            duration: 240,
            ease: 'Sine.easeIn',
            onComplete: () => img.setVisible(false),
          })
        } else img.setVisible(false)
        break
      }
      case 'balik': {
        const b = this.biji[i]!
        b.sisi = tahap.sisi ?? 0
        this.dibalik.add(i)
        bunyi.balik()
        if (this.o.env.gerak) {
          const s = this.skalaBiji
          this.tweens.add({
            targets: img,
            scaleX: 0,
            duration: 90,
            onComplete: () => {
              img.setTexture(KUNCI.biji(b.sisi))
              this.tweens.add({ targets: img, scaleX: s, duration: 90 })
            },
          })
        } else img.setTexture(KUNCI.biji(b.sisi))
        break
      }
    }
    this.sudah++
    this.susunHitung()
    if (this.sudah >= this.perlu && !this.cpu()) this.setPesan('Sekarang tangkap bolanya!')
  }

  /** Bola disentuh pada waktu dt sejak dilempar. */
  private cobaTangkap(dt: number) {
    if (this.fase !== 'udara') return
    const hasil = tangkap(dt, this.lama, this.sudah, this.perlu)
    if (hasil === 'jatuh') {
      this.bolaJatuh()
      return
    }
    if (hasil === 'tangkap') {
      this.berhasilTangkap()
      return
    }
    // Bola tertangkap, tetapi tangkapannya tidak sah.
    this.fase = 'antara'
    this.gWaktu.clear()
    this.letakkanBola(0)
    bunyi.tangkap()
    if (hasil === 'kurang') {
      const kerja = this.tahapAktif.jenis === 'balik' ? 'dibalik' : 'diambil'
      this.gagal('Belum lengkap!', `Baru ${this.sudah} dari ${this.perlu} biji ${kerja}. Selesaikan dulu, baru tangkap.`)
    } else {
      this.gagal('Terlalu cepat!', 'Tangkap saat lingkaran masuk cincin hijau.')
    }
  }

  private berhasilTangkap() {
    this.fase = 'antara'
    this.gWaktu.clear()
    this.letakkanBola(0)
    bunyi.tangkap()
    this.kilat(this.tata.tangan, 'daun-pisang')
    this.setRaut('senang')
    const i = this.aktif
    const p = this.o.pemain[i]!
    if (!tahapTuntas(this.tahapAktif, this.biji)) {
      this.setPesan(this.cpu() ? `${p.nama} menangkap bola.` : 'Tertangkap! Lempar lagi.')
      this.time.delayedCall(JEDA_TANGKAP, () => this.siapLempar())
      return
    }
    this.tahap[i] = (this.tahap[i] ?? 0) + 1
    this.perbaruiPapan(i)
    if (this.tahap[i]! >= TAHAP.length) {
      this.akhiri(i)
      return
    }
    bunyi.naikTahap()
    this.tampilHitung(false)
    this.sorak('Tahap tuntas!', 'daun-pisang-tua')
    const berikut = TAHAP[this.tahap[i]!]!
    this.setPesan(`${p.nama} lanjut ke tahap ${this.tahap[i]! + 1}: ${berikut.nama}`)
    this.time.delayedCall(JEDA_TAHAP, () => this.mulaiGiliran())
  }

  private bolaJatuh() {
    if (this.fase !== 'udara') return
    this.gagal('Bola jatuh!', 'Tangkap sebelum bola menyentuh lantai.')
  }

  /** Bola yang tidak tertangkap jatuh dari ketinggiannya lalu memantul menjauh. */
  private pantulkanBola() {
    const h0 = this.hBola
    if (!this.o.env.gerak) {
      this.letakkanBola(0)
      bunyi.pantul()
      return
    }
    const arah = Math.random() < 0.5 ? -1 : 1
    // Bagian awal tween untuk jatuh (jika bola masih tinggi), sisanya tiga pantulan.
    const jatuh = h0 > 0.02 ? 0.25 : 0
    const proksi = { t: 0 }
    let pantul = jatuh ? -1 : 0
    if (!jatuh) bunyi.pantul()
    this.tweens.add({
      targets: proksi,
      t: 1,
      duration: jatuh ? 1150 : 900,
      onUpdate: () => {
        const t = proksi.t
        if (t < jatuh) {
          const f = t / jatuh
          this.letakkanBola(h0 * (1 - f * f))
          return
        }
        const u = (t - jatuh) / (1 - jatuh)
        this.letakkanBola(Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u) * 0.3, arah * 150 * Math.sin((u * Math.PI) / 2))
        const ke = Math.floor(u * 3)
        if (ke > pantul && ke < 3) {
          pantul = ke
          bunyi.pantul(1 - u)
        }
      },
    })
  }

  /** Kesalahan: tampilkan alasannya, lalu giliran pindah. Tahap tetap, diulang dari awal nanti. */
  private gagal(judul: string, alasan: string) {
    // Bola yang masih di udara jatuh ke lantai.
    if (this.fase === 'udara') this.pantulkanBola()
    this.fase = 'antara'
    this.swipe = null
    this.tahanSejak = null
    this.rencana = null
    this.gWaktu.clear()
    this.tampilPanah(false)
    this.gJejak.clear()
    bunyi.salah()
    this.setRaut('kaget')
    this.sorak(judul, 'merah-bata', JEDA_GAGAL - 500)
    const berikut = this.o.pemain[(this.aktif + 1) % this.n]!
    this.setPesan(this.n > 1 ? `${alasan} Giliran ${berikut.nama}.` : `${alasan} Coba lagi.`)
    this.time.delayedCall(JEDA_GAGAL, () => {
      if (this.fase === 'selesai') return
      this.aktif = (this.aktif + 1) % this.n
      this.mulaiGiliran()
    })
  }

  private akhiri(pemenang: number) {
    this.fase = 'selesai'
    this.tampilPanah(false)
    this.tampilHitung(false)
    this.gWaktu.clear()
    this.letakkanBiji()
    this.setPesan('')
    bunyi.selesai()
    const menang = this.o.pemain[pemenang]!
    const { lebar, tinggi } = this.tata
    const c = this.add.container(lebar / 2, tinggi * 0.42).setDepth(D.sorak)
    const lebarKartu = Math.min(680, lebar - 40)
    const g = this.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(-lebarKartu / 2, -86, lebarKartu, 180, 28)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(-lebarKartu / 2, -94, lebarKartu, 180, 28)
    c.add(g)
    const judul = teks(this, 0, -40, 'Semua tahap tuntas!', { ukuran: 52, warna: 'merah-bata' }, this.res)
    const nama = teks(this, 0, 32, `${menang.nama} menang!`, { ukuran: 42, warna: 'biru-nila' }, this.res)
    for (const t of [judul, nama]) if (t.width > lebarKartu - 40) t.setScale((lebarKartu - 40) / t.width)
    c.add([judul, nama])
    if (this.o.env.gerak) {
      c.setScale(0.6).setAlpha(0)
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' })
    }

    const jumlah = TAHAP.length
    const tuntas = this.o.pemain.map((_, i) => tahapSelesai(this.tahap[i] ?? 0, jumlah))
    const hasil: GameResult = {
      pemenang: menang,
      skor: Object.fromEntries(this.o.pemain.map((p, i) => [p.id, tuntas[i]!])),
      keteranganSkor: Object.fromEntries(this.o.pemain.map((p, i) => [p.id, `Tuntas ${tuntas[i]} tahap`])),
      durasiDetik: Math.round(this.sekarang() / 1000),
    }
    this.time.delayedCall(JEDA_HASIL, () => this.o.onFinish(hasil))
  }

  // ── Masukan ───────────────────────────────────────────────

  private tekan(id: number, x: number, y: number) {
    if (this.cpu() || this.dijeda) return
    if (this.fase === 'siap') {
      if (!this.swipe && this.tahanSejak === null) this.swipe = { id, jejak: [{ x, y, t: performance.now() }] }
    } else if (this.fase === 'udara') {
      this.ketuk(x, y)
    }
  }

  private geser(id: number, x: number, y: number) {
    const s = this.swipe
    if (!s || s.id !== id || this.fase !== 'siap') return
    s.jejak.push({ x, y, t: performance.now() })
    if (s.jejak.length > 40) s.jejak.splice(1, s.jejak.length - 40)
    const awal = s.jejak[0]!
    this.gJejak.clear().lineStyle(12, w('biru-nila'), 0.45).lineBetween(awal.x, awal.y, x, y)
  }

  private lepas(id: number, x: number, y: number) {
    const s = this.swipe
    if (!s || s.id !== id) return
    this.swipe = null
    this.gJejak.clear()
    if (this.fase !== 'siap') return
    const akhir = { x, y, t: performance.now() }
    const awal = s.jejak[0]!
    // Layar px per px panggung: kekuatan swipe dinilai dalam jarak di layar.
    const skala = this.game.canvas.getBoundingClientRect().width / this.tata.lebar || 1
    // Kecepatan dari ±100 ms terakhir: yang dihitung sentakan di akhir swipe.
    let dari = awal
    for (let k = s.jejak.length - 1; k >= 0; k--) {
      dari = s.jejak[k]!
      if (akhir.t - dari.t >= 100) break
    }
    const kecepatan = ((dari.y - akhir.y) * skala) / Math.max(16, akhir.t - dari.t)
    const atas = (awal.y - akhir.y) * skala
    const k = kekuatanSwipe(atas, (akhir.x - awal.x) * skala, kecepatan)
    if (k !== null) {
      this.lempar(k)
      return
    }
    if (atas < SWIPE_MIN) this.setPesan('Swipe ke ATAS untuk melempar bola')
  }

  /** Tap selama bola di udara: biji terdekat, atau bola/cincin untuk menangkap. */
  private ketuk(x: number, y: number) {
    let pilih = -1
    let terdekat = R_SENTUH_BIJI
    this.biji.forEach((b, i) => {
      if (b.diambil) return
      const p = this.posBiji(i)
      const d = Math.hypot(p.x - x, p.y - y)
      if (d < terdekat) {
        terdekat = d
        pilih = i
      }
    })
    if (pilih >= 0) {
      this.kilat(this.posBiji(pilih))
      this.sentuh(pilih)
      return
    }
    const { tangan } = this.tata
    const kenaBola = Math.hypot(this.bola.x - x, this.bola.y - y) <= this.bola.displayWidth / 2 + 30
    if (kenaBola || Math.hypot(tangan.x - x, tangan.y - y) <= R_WAKTU_AWAL + 24) this.cobaTangkap(this.sekarang() - this.mulaiLempar)
  }

  private tombolKeyboard(e: KeyboardEvent, turun: boolean) {
    const lempar = e.code === 'Space' || e.code === 'ArrowUp'
    const angka = /^(Digit|Numpad)([1-9])$/.exec(e.code)
    if (!lempar && !angka && e.code !== 'Enter' && e.code !== 'NumpadEnter') return
    e.preventDefault()
    if (this.cpu() || this.dijeda) return
    if (!turun) {
      if (lempar && this.tahanSejak !== null && this.fase === 'siap') {
        const k = kekuatanTahan(this.sekarang() - this.tahanSejak)
        this.tahanSejak = null
        this.lempar(k)
      }
      return
    }
    if (e.repeat) return
    if (this.fase === 'siap' && lempar && !this.swipe) {
      this.tahanSejak = this.sekarang()
      this.tampilPanah(false)
    } else if (this.fase === 'udara') {
      if (angka) {
        const i = Number(angka[2]) - 1
        if (this.biji[i] && !this.biji[i].diambil) {
          this.kilat(this.posBiji(i))
          this.sentuh(i)
        }
      } else if (e.code !== 'ArrowUp') {
        this.cobaTangkap(this.sekarang() - this.mulaiLempar)
      }
    }
  }
}
