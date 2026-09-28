/**
 * Adegan Phaser Sunda Manda / Engklek (tampak atas-miring). Satu percobaan =
 * satu level: lempar gacuk ke kotak bernomor level, lompat maju-balik tanpa
 * menginjak kotak bergacuk maupun garis, ambil gacuk, lalu keluar. Berhasil =
 * naik level dan main lagi; salah = giliran pindah. Semua penilaian waktu
 * memakai jam performance.now() (bisa dijeda), bukan hitungan frame, supaya
 * adil di HP 30 fps maupun laptop 60 fps.
 */
import * as Phaser from 'phaser'
import { WARNA, warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { audio } from '../../shared/audio/AudioManager'
import { jedakanAdegan, lanjutkanAdegan, type LingkunganPhaser } from '../../shared/phaser/modul'
import { teks } from '../../shared/phaser/teks'
import type { GameResult, Kesulitan, Player } from '../../shared/types'
import {
  cincinLevel,
  hasilLempar,
  jariCincin,
  jarumDiTengah,
  jumlahKotak,
  levelTuntas,
  nilaiTekan,
  posisiMeter,
  rencanaCpu,
  sapuanLevel,
  sudutJarum,
  susunLangkah,
  tengahRuas,
  type Cincin,
  type HasilLempar,
  type Kaki,
  type Langkah,
} from './aturan'
import { bunyi } from './bunyi'
import {
  BATAS_TAHAN,
  GARIS_METER,
  JEDA_BERHASIL,
  JEDA_CPU,
  JEDA_GAGAL,
  JEDA_HASIL,
  JEDA_LOMPAT,
  JENDELA_DUA_JARI,
  JENDELA_PAS,
  LAMA_LEMPAR,
  LAMA_LOMPAT,
  PELUANG_CPU,
  PERIODE_JARUM,
  POLA,
  SUDUT_MAKS,
  TINGGI_KARAKTER,
  ZONA_TENGAH,
} from './config'
import { ALAS, ALAS_SATU, type Raut } from './tekstur'
import { gambarTelapak, Tombol } from './Tombol'
import {
  LEBAR,
  METER,
  PANEL_Y,
  PESAN_Y,
  TataPola,
  TEMPAT_KELUAR,
  TEMPAT_LEMPAR,
  TINGGI,
  TOMBOL_T,
  TOMBOL_Y,
  type Tanah,
  type Titik,
} from './tata'

export interface OpsiAdeganEngklek {
  pemain: Player[]
  kesulitan: Kesulitan
  env: LingkunganPhaser
  /** Tekstur siap pakai (lihat KUNCI): kunci → kanvas beresolusi env.resolusi. */
  kanvas: Map<string, HTMLCanvasElement>
  onFinish(hasil: GameResult): void
}

export const KUNCI = {
  latar: 'latar',
  gacuk: (i: number) => `gacuk-${i}`,
  raut: (i: number, r: Raut) => `p${i}-${r}`,
}

/** Kedalaman gambar. Karakter: D.karakter + y/1000 supaya yang di depan menutupi yang di belakang. */
const D = { sorot: 1, nomor: 1.5, tapak: 2, gacuk: 3, karakter: 5, terbang: 8, cincin: 9, ui: 10, panel: 11, sorak: 12 }

type Fase = 'antara' | 'lempar' | 'lompat' | 'ambil' | 'selesai'
type Aksi = 'lempar' | 'satu' | 'dua' | 'ambil' | 'lapangan'

/** Tinggi lompatan (px) dan lengkung lemparan gacuk. */
const TINGGI_LOMPAT = 55
const TINGGI_LEMPAR = 150
/** Dial keseimbangan di panel kanan. */
const DIAL = { x: 952, y: 700, r: 158 }

interface Papan {
  bg: Phaser.GameObjects.Graphics
  badge: Phaser.GameObjects.Text
  pip: Phaser.GameObjects.Graphics
  x: number
  lebar: number
}

interface TekanTertunda {
  t: number
  id: number
  kaki: Kaki
  batas: number
}

export class AdeganEngklek extends Phaser.Scene {
  private o: OpsiAdeganEngklek
  private res = 1
  private tata = new TataPola(POLA)
  private jumlahLevel = jumlahKotak(POLA)
  private fase: Fase = 'antara'
  private dijeda = false

  // Jam permainan (ms), berhenti saat dijeda.
  private jamAsal = performance.now()
  private jedaSejak: number | null = null

  private aktif = 0
  private level: number[] = []
  private langkah: Langkah[] = []
  private iLangkah = 0
  /** Posisi pemain aktif di tanah. */
  private posisi: Tanah = TEMPAT_LEMPAR
  private mulaiFase = 0
  private cincin: Cincin = { lama: 1, tepat: 1 }
  private tertunda: TekanTertunda | null = null
  private tahan: { id: number; mulai: number } | null = null
  private sisiJarumLalu = 0
  private pemainTerakhir = -1

  // Komputer.
  private rencana: number | null = null
  private cpuBerhentiDi = 0
  private cpuMulai = 0
  private meterLalu = 0
  private cpuTekan: { t: number; kaki: Kaki } | null = null
  private cpuTahanPada = 0
  private cpuLepasSetelah = 0

  // Gambar.
  private karakter: Phaser.GameObjects.Image[] = []
  private gacuk!: Phaser.GameObjects.Image
  private bayangGacuk!: Phaser.GameObjects.Ellipse
  private sorot!: Phaser.GameObjects.Graphics
  private gCincin!: Phaser.GameObjects.Graphics
  private meterStatis!: Phaser.GameObjects.Graphics
  private meterJarum!: Phaser.GameObjects.Graphics
  private meterLabel: Phaser.GameObjects.Text[] = []
  private dial!: Phaser.GameObjects.Graphics
  private papan: Papan[] = []
  private pesan!: Phaser.GameObjects.Text
  private pesanBg!: Phaser.GameObjects.Graphics
  private tombol = new Map<Exclude<Aksi, 'lapangan'>, Tombol>()

  constructor(o: OpsiAdeganEngklek) {
    super('engklek')
    this.o = o
  }

  private get n() {
    return this.o.pemain.length
  }

  private cpu(i = this.aktif) {
    return this.o.pemain[i]?.avatar === 'cpu'
  }

  private sekarang() {
    return (this.jedaSejak ?? performance.now()) - this.jamAsal
  }

  // ── Siklus hidup ──────────────────────────────────────────

  create() {
    const o = this.o
    this.res = o.env.resolusi
    for (const [kunci, kanvas] of o.kanvas) if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    this.cameras.main.setZoom(this.res).centerOn(LEBAR / 2, TINGGI / 2)
    // Dua jari bersamaan = dua kaki; di PID beberapa siswa bisa menyentuh sekaligus.
    this.input.addPointer(4)
    this.level = o.pemain.map(() => 1)

    this.add.image(0, 0, KUNCI.latar).setOrigin(0).setScale(1 / this.res)
    this.buatNomorKotak()
    this.sorot = this.add.graphics().setDepth(D.sorot)
    this.gCincin = this.add.graphics().setDepth(D.cincin)
    this.bayangGacuk = this.add.ellipse(0, 0, 40, 12, w('kayu-gelap'), 0.3).setDepth(D.tapak).setVisible(false)
    this.gacuk = this.add.image(0, 0, KUNCI.gacuk(0)).setScale(1 / this.res).setDepth(D.gacuk).setVisible(false)
    this.buatMeter()
    this.dial = this.add.graphics().setDepth(D.panel)
    this.buatTombol()
    this.buatPapan()
    this.pesanBg = this.add.graphics().setDepth(D.ui)
    this.pesan = teks(this, LEBAR / 2, PESAN_Y, '', { ukuran: 30 }, this.res).setDepth(D.ui)

    o.pemain.forEach((_, i) => {
      const img = this.add.image(0, 0, KUNCI.raut(i, 'dua')).setOrigin(0.5, ALAS)
      img.setScale(TINGGI_KARAKTER / img.height)
      this.karakter.push(img)
    })
    this.jalanKe(this.aktif, TEMPAT_LEMPAR, false)
    this.aturTempatTunggu(false)

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, di: Phaser.GameObjects.GameObject[]) => {
      audio.buka()
      const aksi = di.map((d) => d.getData('tombol') as Aksi | undefined).find(Boolean)
      if (aksi) this.masukan(aksi, p.id)
      else if (p.worldY < PANEL_Y) this.masukan('lapangan', p.id)
    })
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.lepas(p.id))
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.lepas(p.id))
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.tombolKeyboard(e, true))
    this.input.keyboard?.on('keyup', (e: KeyboardEvent) => this.tombolKeyboard(e, false))

    this.time.delayedCall(400, () => this.mulaiPercobaan())
    if (this.dijeda) this.jeda()
  }

  update() {
    const t = this.sekarang()
    if (this.fase === 'lempar') this.updateLempar(t)
    else if (this.fase === 'lompat') this.updateLompat(t)
    else if (this.fase === 'ambil') this.updateAmbil(t)
    this.karakter.forEach((k) => k.setDepth(D.karakter + k.y / 1000))
  }

  jeda() {
    this.dijeda = true
    this.jedaSejak ??= performance.now()
    // Jari/tombol yang sedang ditahan bisa lepas tanpa terbaca selama jeda.
    this.tertunda = null
    if (this.tahan && !this.cpu()) {
      this.tahan = null
      this.gambarDial(null)
      this.condongkan(false)
    }
    for (const t of this.tombol.values()) t.lepasSemua()
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

  // ── Pembuatan ─────────────────────────────────────────────

  private buatNomorKotak() {
    for (const k of this.tata.semuaKotak) {
      const p = this.tata.layar(this.tata.pusatKotak(k.kotak))
      // Angka kapur ikut miring rebah di tanah.
      teks(this, p.x, p.y, String(k.kotak), { ukuran: 36, warna: 'kertas-terang' }, this.res)
        .setAlpha(0.85)
        .setScale(1, 0.8)
        .setDepth(D.nomor)
    }
  }

  private buatMeter() {
    const { x, y, lebar, tinggi } = METER
    this.meterStatis = this.add.graphics().setDepth(D.ui)
    this.meterJarum = this.add.graphics().setDepth(D.ui)
    const ruas = lebar / this.jumlahLevel
    for (let k = 1; k <= this.jumlahLevel; k++) {
      this.meterLabel.push(teks(this, x + ruas * (k - 0.5), y + tinggi / 2, String(k), { ukuran: 30, warna: 'kayu-gelap' }, this.res).setDepth(D.ui))
    }
    this.tampilMeter(false)
  }

  private buatTombol() {
    const r = this.res
    const kb = this.o.env.keyboard
    const kiri = { x: 24, lebar: 604 }
    const kanan = { x: 652, lebar: 604 }
    const tengah = { x: 340, lebar: 600 }
    const dasar = { y: TOMBOL_Y, tinggi: TOMBOL_T, resolusi: r }
    const tambah = (aksi: Exclude<Aksi, 'lapangan'>, t: Tombol) => {
      this.tombol.set(aksi, t)
      t.setTampil(false)
    }
    tambah(
      'lempar',
      new Tombol(
        this,
        {
          ...dasar,
          ...tengah,
          aksi: 'lempar',
          warna: 'kunyit',
          warnaGelap: 'kunyit-gelap',
          label: 'LEMPAR!',
          warnaLabel: 'kayu-gelap',
          ikon: (g) => {
            g.fillStyle(w('kayu-gelap')).fillEllipse(0, 6, 60, 36)
            g.fillStyle(w('daun-pisang')).fillEllipse(0, 0, 60, 34)
            g.fillStyle(w('kertas-terang'), 0.5).fillEllipse(-12, -6, 16, 8)
          },
          huruf: kb ? 'Spasi' : undefined,
        },
        D.panel,
      ),
    )
    tambah(
      'satu',
      new Tombol(
        this,
        {
          ...dasar,
          ...kiri,
          aksi: 'satu',
          warna: 'daun-pisang',
          warnaGelap: 'daun-pisang-tua',
          label: 'SATU KAKI',
          ikon: (g) => gambarTelapak(g, 0, 2, w('kertas-terang')),
          huruf: kb ? 'Spasi' : undefined,
        },
        D.panel,
      ),
    )
    tambah(
      'dua',
      new Tombol(
        this,
        {
          ...dasar,
          ...kanan,
          aksi: 'dua',
          warna: 'biru-nila',
          warnaGelap: 'biru-nila-gelap',
          label: 'DUA KAKI',
          ikon: (g) => {
            gambarTelapak(g, -18, 2, w('kertas-terang'), true)
            gambarTelapak(g, 18, 2, w('kertas-terang'))
          },
          huruf: kb ? 'D / Shift' : undefined,
        },
        D.panel,
      ),
    )
    tambah(
      'ambil',
      new Tombol(
        this,
        {
          ...dasar,
          ...kiri,
          aksi: 'ambil',
          warna: 'merah-bata',
          warnaGelap: 'merah-bata-gelap',
          label: 'TAHAN: AMBIL',
          huruf: kb ? 'tahan E' : undefined,
        },
        D.panel,
      ),
    )
  }

  private tampilTombol(...aksi: Exclude<Aksi, 'lapangan'>[]) {
    const redup = this.cpu()
    for (const [a, t] of this.tombol) {
      t.setTampil(aksi.includes(a))
      t.setRedup(redup)
    }
    if (!aksi.includes('ambil')) this.dial.clear()
  }

  private buatPapan() {
    const jeda = 12
    const lebar = Math.min(300, (1020 - jeda * (this.n - 1)) / this.n)
    const x0 = LEBAR / 2 - (this.n * lebar + (this.n - 1) * jeda) / 2
    this.o.pemain.forEach((p, i) => {
      const x = x0 + i * (lebar + jeda)
      const bg = this.add.graphics().setDepth(D.ui)
      const kepala = this.add.image(x + 30, 34, KUNCI.raut(i, 'kepala')).setDepth(D.ui)
      kepala.setScale(44 / kepala.height)
      const nama = teks(this, x + 58, 34, p.nama, { ukuran: 30 }, this.res).setOrigin(0, 0.5).setDepth(D.ui)
      const maks = lebar - 58 - 56
      if (nama.width > maks) nama.setScale(maks / nama.width, 1)
      const badge = teks(this, x + lebar - 30, 34, '1', { ukuran: 30, warna: 'kayu-gelap' }, this.res).setDepth(D.ui)
      const pip = this.add.graphics().setDepth(D.ui)
      this.papan.push({ bg, badge, pip, x, lebar })
    })
    this.perbaruiPapan()
  }

  /** Papan pemain: badge = kotak target (level) sekarang, titik = level yang sudah tuntas. */
  private perbaruiPapan(sorot = -1) {
    this.papan.forEach((p, i) => {
      const aktif = i === sorot
      const g = p.bg.clear()
      g.fillStyle(w(aktif ? 'biru-nila' : 'tinta-gelap'), aktif ? 0.95 : 0.72).fillRoundedRect(p.x, 8, p.lebar, 52, 26)
      if (aktif) g.lineStyle(4, w('cahaya-kelir')).strokeRoundedRect(p.x, 8, p.lebar, 52, 26)
      g.fillStyle(w('kunyit')).fillCircle(p.x + p.lebar - 30, 34, 20)
      const tuntas = levelTuntas(this.level[i]!, this.jumlahLevel)
      p.badge.setText(String(Math.min(this.level[i]!, this.jumlahLevel)))
      const pg = p.pip.clear()
      const jarak = Math.min(16, (p.lebar - 40) / this.jumlahLevel)
      const px = p.x + p.lebar / 2 - (jarak * (this.jumlahLevel - 1)) / 2
      for (let k = 0; k < this.jumlahLevel; k++) {
        pg.fillStyle(w(k < tuntas ? 'cahaya-kelir' : 'tinta-gelap'), k < tuntas ? 1 : 0.45).fillCircle(px + k * jarak, 70, 5)
      }
    })
  }

  // ── Pesan & sorak ─────────────────────────────────────────

  private setPesan(isi: string) {
    this.pesan.setText(isi)
    const maks = 1000
    this.pesan.setScale(this.pesan.width > maks - 48 ? (maks - 48) / this.pesan.width : 1, 1)
    const lebar = this.pesan.displayWidth + 48
    this.pesanBg.clear().fillStyle(w('tinta-gelap'), 0.72).fillRoundedRect(LEBAR / 2 - lebar / 2, PESAN_Y - 27, lebar, 54, 27)
    this.pesanBg.setVisible(!!isi)
  }

  /** Tulisan besar di tengah panggung; garis terang supaya terbaca di atas tanah. */
  private sorak(isi: string, warna: NamaWarna = 'biru-nila', lama = 900) {
    const t = teks(this, LEBAR / 2, 220, isi, { ukuran: 60, warna, garis: 'kertas-terang', tebalGaris: 12 }, this.res).setDepth(D.sorak)
    if (this.o.env.gerak) {
      t.setScale(0.6)
      this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' })
    }
    this.tweens.add({ targets: t, alpha: 0, delay: lama, duration: 300, onComplete: () => t.destroy() })
  }

  // ── Karakter ──────────────────────────────────────────────

  private setRaut(i: number, raut: Raut) {
    const k = this.karakter[i]!
    k.setTexture(KUNCI.raut(i, raut))
    k.setOrigin(0.5, raut === 'satu' ? ALAS_SATU : ALAS)
    k.setScale(TINGGI_KARAKTER / k.height)
  }

  /** Pemain yang tidak giliran berdiri di tepi kiri, urut sesudah pemain aktif. */
  private aturTempatTunggu(gerak = this.o.env.gerak) {
    for (let j = 1; j < this.n; j++) {
      const i = (this.aktif + j) % this.n
      this.jalanKe(i, this.tata.tempatTunggu(j - 1), gerak)
      this.setRaut(i, 'dua')
    }
  }

  private jalanKe(i: number, tujuan: Tanah, gerak = this.o.env.gerak, selesai?: () => void) {
    const k = this.karakter[i]!
    const p = this.tata.layar(tujuan)
    this.tweens.killTweensOf(k)
    k.setRotation(0)
    if (!gerak || (Math.abs(k.x - p.x) < 1 && Math.abs(k.y - p.y) < 1)) {
      k.setPosition(p.x, p.y)
      selesai?.()
      return
    }
    this.tweens.add({ targets: k, x: p.x, y: p.y, duration: 420, ease: 'Sine.easeInOut', onComplete: () => selesai?.() })
  }

  /** Lompatan melengkung dari posisi sekarang ke `tujuan`; `raut` dipakai saat mendarat. */
  private lompatKe(tujuan: Tanah, raut: Raut, selesai: () => void) {
    const k = this.karakter[this.aktif]!
    const dari = { x: k.x, y: k.y }
    const ke = this.tata.layar(tujuan)
    this.tweens.killTweensOf(k)
    k.setRotation(0)
    if (!this.o.env.gerak) {
      k.setPosition(ke.x, ke.y)
      this.setRaut(this.aktif, raut)
      selesai()
      return
    }
    this.setRaut(this.aktif, 'satu')
    k.setOrigin(0.5, ALAS)
    const proksi = { t: 0 }
    this.tweens.add({
      targets: proksi,
      t: 1,
      duration: LAMA_LOMPAT,
      onUpdate: () => {
        k.x = dari.x + (ke.x - dari.x) * proksi.t
        k.y = dari.y + (ke.y - dari.y) * proksi.t - Math.sin(Math.PI * proksi.t) * TINGGI_LOMPAT
      },
      onComplete: () => {
        k.setPosition(ke.x, ke.y)
        this.setRaut(this.aktif, raut)
        selesai()
      },
    })
  }

  /** Condong meraih gacuk (ke arah garis mulai = kiri). */
  private condongkan(v: boolean) {
    const k = this.karakter[this.aktif]!
    this.tweens.killTweensOf(k)
    const sudut = v ? -0.32 : 0
    if (this.o.env.gerak) this.tweens.add({ targets: k, rotation: sudut, duration: 200, ease: 'Sine.easeOut' })
    else k.setRotation(sudut)
  }

  private tapak(titik: Tanah[], salah = false) {
    for (const t of titik) {
      const p = this.tata.layar(t)
      const e = this.add.ellipse(p.x, p.y + 2, 26, 11, w(salah ? 'merah-bata' : 'kayu-gelap'), salah ? 0.7 : 0.32).setDepth(D.tapak)
      this.tweens.add({ targets: e, alpha: 0, delay: 1800, duration: 600, onComplete: () => e.destroy() })
    }
  }

  /** Tanda silang merah di garis yang terinjak. */
  private tandaSalah(t: Tanah) {
    const p = this.tata.layar(t)
    const g = this.add.graphics().setDepth(D.cincin)
    g.lineStyle(9, w('merah-bata'))
    g.lineBetween(p.x - 22, p.y - 14, p.x + 22, p.y + 14).lineBetween(p.x - 22, p.y + 14, p.x + 22, p.y - 14)
    this.tweens.add({ targets: g, alpha: 0, delay: JEDA_GAGAL - 300, duration: 300, onComplete: () => g.destroy() })
  }

  // ── Alur percobaan ────────────────────────────────────────

  private mulaiPercobaan() {
    if (this.fase === 'selesai') return
    const i = this.aktif
    const p = this.o.pemain[i]!
    const level = this.level[i]!
    this.langkah = susunLangkah(POLA, level)
    this.iLangkah = 0
    this.posisi = TEMPAT_LEMPAR
    this.tertunda = null
    this.tahan = null
    this.cpuTekan = null
    this.rencana = this.cpu() ? rencanaCpu(this.langkah.length + 2, PELUANG_CPU[this.o.kesulitan]) : null
    this.perbaruiPapan(i)

    // Main bergantian: tanda jelas saat perangkat harus berpindah tangan.
    if (this.pemainTerakhir !== i) {
      if (this.n > 1) this.sorak(`Giliran ${p.nama}!`)
      this.pemainTerakhir = i
    } else this.sorak(`Level ${level}`)

    this.gacuk.setTexture(KUNCI.gacuk(i)).setVisible(false)
    this.bayangGacuk.setVisible(false)
    this.setRaut(i, 'dua')
    this.jalanKe(i, TEMPAT_LEMPAR)
    this.aturTempatTunggu()

    this.fase = 'lempar'
    this.mulaiFase = this.sekarang()
    this.meterLalu = 0
    this.tampilMeter(true, level)
    this.tampilTombol('lempar')
    this.sorotKotak([level])
    if (this.cpu()) {
      this.setPesan(`${p.nama} membidik kotak ${level}…`)
      this.cpuMulai = this.mulaiFase + JEDA_CPU + Math.random() * 700
      this.cpuBerhentiDi = this.rencana === 0 ? this.lemparMeleset(level) : tengahRuas(level, this.jumlahLevel) + (Math.random() - 0.5) * 0.4 / this.jumlahLevel
    } else {
      this.setPesan(`${p.nama}, level ${level}: tap LEMPAR saat jarum di kotak ${level}`)
    }
  }

  /** Titik berhenti meter yang meleset untuk komputer: garis di sekitar target atau kotak tetangga. */
  private lemparMeleset(level: number) {
    const n = this.jumlahLevel
    const pilihan: number[] = []
    if (level > 1) pilihan.push((level - 1) / n, tengahRuas(level - 1, n))
    if (level < n) pilihan.push(level / n, tengahRuas(level + 1, n))
    return pilihan[Math.floor(Math.random() * pilihan.length)]!
  }

  private updateLempar(t: number) {
    const p = posisiMeter(t - this.mulaiFase, sapuanLevel(this.level[this.aktif]!, this.jumlahLevel))
    this.gambarJarumMeter(p)
    if (this.cpu() && t >= this.cpuMulai) {
      const s = this.cpuBerhentiDi
      if ((this.meterLalu - s) * (p - s) <= 0 && this.meterLalu !== p) {
        this.tombol.get('lempar')?.kilat(this)
        this.lempar(s)
      }
    }
    this.meterLalu = p
  }

  private lempar(pMeter?: number) {
    if (this.fase !== 'lempar') return
    const level = this.level[this.aktif]!
    const p = pMeter ?? posisiMeter(this.sekarang() - this.mulaiFase, sapuanLevel(level, this.jumlahLevel))
    this.gambarJarumMeter(p)
    this.fase = 'antara'
    const hasil = hasilLempar(p, this.jumlahLevel, GARIS_METER)
    const tujuan = hasil.jenis === 'kotak' ? this.tata.pusatKotak(hasil.kotak) : this.tata.titikGaris(...hasil.antara)
    const k = this.karakter[this.aktif]!
    this.setRaut(this.aktif, 'lempar')
    bunyi.lempar()
    this.terbangkanGacuk({ x: k.x + 26, y: k.y - TINGGI_KARAKTER * 0.62 }, tujuan, () => {
      bunyi.gacukJatuh()
      this.setRaut(this.aktif, 'dua')
      this.sesudahLempar(hasil, level)
    })
  }

  private terbangkanGacuk(dari: Titik, tujuan: Tanah, selesai: () => void) {
    const ke = this.tata.layar(tujuan)
    const g = this.gacuk.setVisible(true).setDepth(D.terbang)
    const bayang = this.bayangGacuk.setVisible(true)
    const tanahDari = this.tata.layar(this.posisi)
    const akhir = () => {
      g.setPosition(ke.x, ke.y).setDepth(D.gacuk).setAngle(0)
      bayang.setPosition(ke.x, ke.y + 6)
      selesai()
    }
    if (!this.o.env.gerak) {
      akhir()
      return
    }
    const proksi = { t: 0 }
    this.tweens.add({
      targets: proksi,
      t: 1,
      duration: LAMA_LEMPAR,
      onUpdate: () => {
        const t = proksi.t
        g.x = dari.x + (ke.x - dari.x) * t
        g.y = dari.y + (ke.y - dari.y) * t - Math.sin(Math.PI * t) * TINGGI_LEMPAR
        g.angle = t * 540
        bayang.x = tanahDari.x + (ke.x - tanahDari.x) * t
        bayang.y = tanahDari.y + (ke.y - tanahDari.y) * t + 6
      },
      onComplete: akhir,
    })
  }

  private sesudahLempar(hasil: HasilLempar, level: number) {
    if (hasil.jenis === 'kotak' && hasil.kotak === level) {
      bunyi.pas()
      this.setPesan(`Masuk kotak ${level}! Bersiap melompat…`)
      this.time.delayedCall(650, () => {
        this.tampilMeter(false)
        this.mulaiLompat()
      })
      return
    }
    if (hasil.jenis === 'garis') {
      const [a, b] = hasil.antara
      const letak = a === 0 ? 'di garis mulai' : b > this.jumlahLevel ? 'di garis ujung' : `di garis kotak ${a} dan ${b}`
      this.gagal('Kena garis!', `Gacuk jatuh ${letak}.`)
    } else {
      this.gagal('Meleset!', `Gacuk masuk kotak ${hasil.kotak}, bukan kotak ${level}.`)
    }
  }

  // ── Fase 2: melompat ──────────────────────────────────────

  private mulaiLompat() {
    if (this.fase === 'selesai') return
    const l = this.langkah[this.iLangkah]
    if (!l) {
      this.keluar()
      return
    }
    const level = this.level[this.aktif]!
    this.fase = 'lompat'
    this.mulaiFase = this.sekarang()
    this.cincin = cincinLevel(level, this.jumlahLevel)
    this.tertunda = null
    this.tampilTombol('satu', 'dua')
    this.sorotKotak(l.kotak, l.baris >= this.tata.n)
    const putar = l.baris >= this.tata.n
    const nama = this.o.pemain[this.aktif]!.nama
    if (this.cpu()) {
      this.setPesan(`${nama} melompat…`)
      this.rencanakanTekanCpu(l)
    } else if (putar) {
      this.setPesan('Setengah lingkaran: berbalik dengan DUA KAKI')
    } else if (level <= 2) {
      const petunjuk = l.kaki === 'satu' ? '1 kotak menyala → SATU KAKI' : '2 kotak menyala → DUA KAKI'
      this.setPesan(`Tap saat lingkaran di zona hijau: ${petunjuk}`)
    } else {
      this.setPesan(l.arah === 'maju' ? 'Lompat! Lewati kotak bergacuk.' : 'Kembali ke garis mulai!')
    }
  }

  private rencanakanTekanCpu(l: Langkah) {
    const aksi = 1 + this.iLangkah
    const tepat = this.cincin.tepat
    if (this.rencana === aksi) {
      // Gagal: salah kaki, atau terlalu cepat.
      if (Math.random() < 0.5) this.cpuTekan = { t: this.mulaiFase + tepat, kaki: l.kaki === 'satu' ? 'dua' : 'satu' }
      else this.cpuTekan = { t: this.mulaiFase + tepat - JENDELA_PAS - 150, kaki: l.kaki }
    } else {
      this.cpuTekan = { t: this.mulaiFase + tepat + (Math.random() - 0.5) * JENDELA_PAS, kaki: l.kaki }
    }
  }

  private updateLompat(t: number) {
    this.gambarCincin(t - this.mulaiFase)
    if (this.cpu()) {
      if (this.cpuTekan && t >= this.cpuTekan.t) {
        const { t: tt, kaki } = this.cpuTekan
        this.cpuTekan = null
        this.tombol.get(kaki)?.kilat(this)
        this.nilaiLompatan(tt, kaki)
      }
      return
    }
    if (this.tertunda && t >= this.tertunda.batas) {
      const { t: tt, kaki } = this.tertunda
      this.tertunda = null
      this.nilaiLompatan(tt, kaki)
      return
    }
    if (!this.tertunda && nilaiTekan(t - this.mulaiFase, this.cincin) === 'lambat') this.nilaiLompatan(t, null)
  }

  /**
   * Tekanan pemain saat melompat. SATU KAKI (atau satu jari di lapangan) ditunggu
   * sebentar: jari/tombol kedua dalam JENDELA_DUA_JARI berarti dua kaki. Waktu
   * yang dinilai tetap waktu tekanan pertama.
   */
  private tekanLompat(kaki: Kaki, id: number) {
    const t = this.sekarang()
    const tunda = this.tertunda
    if (tunda) {
      if (tunda.id === id) return
      this.tertunda = null
      this.nilaiLompatan(tunda.t, 'dua')
      return
    }
    if (kaki === 'dua') this.nilaiLompatan(t, 'dua')
    else this.tertunda = { t, id, kaki, batas: t + JENDELA_DUA_JARI }
  }

  /** kaki = null: tidak menekan sampai lingkaran lewat zona hijau. */
  private nilaiLompatan(t: number, kaki: Kaki | null) {
    if (this.fase !== 'lompat') return
    const l = this.langkah[this.iLangkah]!
    this.fase = 'antara'
    this.gCincin.clear()
    const nilai = kaki ? nilaiTekan(t - this.mulaiFase, this.cincin) : 'lambat'
    const tujuan = this.tata.posisiLangkah(l)
    if (nilai === 'pas' && kaki === l.kaki) {
      bunyi.lompat()
      this.lompatKe(tujuan, l.kaki === 'satu' ? 'satu' : 'dua', () => {
        bunyi.mendarat(l.kaki === 'dua')
        this.tapak(this.tata.tapakLangkah(l))
        this.posisi = tujuan
        this.iLangkah++
        this.sorot.clear()
        if (l.ambil) this.time.delayedCall(JEDA_LOMPAT, () => this.mulaiAmbil())
        else this.time.delayedCall(JEDA_LOMPAT, () => this.mulaiLompat())
      })
      return
    }
    const garis = this.tata.garisDepan(tujuan, l.arah)
    const alasan =
      nilai === 'cepat'
        ? 'Terlalu cepat! Tap saat lingkaran di zona hijau.'
        : nilai === 'lambat'
          ? 'Terlambat! Tap saat lingkaran di zona hijau.'
          : l.kaki === 'satu'
            ? 'Satu kotak = SATU KAKI.'
            : l.baris >= this.tata.n
              ? 'Setengah lingkaran = DUA KAKI.'
              : 'Kotak berpasangan = DUA KAKI.'
    bunyi.lompat()
    this.lompatKe(garis, 'kaget', () => {
      this.tapak([garis], true)
      this.tandaSalah(garis)
      this.gagal('Injak garis!', alasan, true)
    })
  }

  // ── Fase 3: mengambil gacuk ───────────────────────────────

  private mulaiAmbil() {
    if (this.fase === 'selesai') return
    this.fase = 'ambil'
    this.tahan = null
    this.tampilTombol('ambil')
    this.gambarDial(null)
    const level = this.level[this.aktif]!
    this.sorotKotak([level])
    if (this.cpu()) {
      this.setPesan(`${this.o.pemain[this.aktif]!.nama} mengambil gacuk…`)
      this.cpuTahanPada = this.sekarang() + JEDA_CPU
      const gagal = this.rencana === this.langkah.length + 1
      // Berhasil: lepas saat jarum pertama kali lewat tengah; gagal: di ujung ayunan.
      this.cpuLepasSetelah = gagal ? PERIODE_JARUM / 2 : PERIODE_JARUM / 4 + (Math.random() - 0.5) * 40
      if (!gagal && Math.random() < 0.4) this.cpuLepasSetelah += PERIODE_JARUM / 2
    } else {
      this.setPesan(`Tahan AMBIL untuk meraih gacuk, lepas saat jarum di tengah`)
    }
  }

  private mulaiTahan(id: number) {
    if (this.fase !== 'ambil' || this.tahan) return
    this.tahan = { id, mulai: this.sekarang() }
    this.sisiJarumLalu = Math.sign(sudutJarum(0))
    this.condongkan(true)
    this.tombol.get('ambil')?.tekan(id)
  }

  private lepasTahan(id: number) {
    const tahan = this.tahan
    if (this.fase !== 'ambil' || !tahan || tahan.id !== id) return
    this.tahan = null
    this.tombol.get('ambil')?.lepas(id)
    const sudut = sudutJarum(this.sekarang() - tahan.mulai)
    this.gambarDial(sudut)
    this.fase = 'antara'
    if (jarumDiTengah(sudut)) this.ambilBerhasil()
    else this.gagalAmbil()
  }

  private updateAmbil(t: number) {
    if (this.cpu()) {
      if (!this.tahan && t >= this.cpuTahanPada) this.mulaiTahan(-50)
      else if (this.tahan && t - this.tahan.mulai >= this.cpuLepasSetelah) {
        this.lepasTahan(-50)
        return
      }
    }
    if (!this.tahan) return
    const lama = t - this.tahan.mulai
    const sudut = sudutJarum(lama)
    this.gambarDial(sudut)
    const sisi = Math.sign(sudut)
    if (sisi !== this.sisiJarumLalu && sisi !== 0) {
      bunyi.detak()
      this.sisiJarumLalu = sisi
    }
    if (lama > BATAS_TAHAN) {
      this.tahan = null
      this.tombol.get('ambil')?.lepasSemua()
      this.fase = 'antara'
      this.gagalAmbil()
    }
  }

  private ambilBerhasil() {
    bunyi.ambil()
    this.sorot.clear()
    this.setPesan('Gacuk terambil! Lanjut kembali.')
    const k = this.karakter[this.aktif]!
    const ke = { x: k.x - 10, y: k.y - TINGGI_KARAKTER * 0.45 }
    const selesai = () => {
      this.gacuk.setVisible(false)
      this.bayangGacuk.setVisible(false)
      this.condongkan(false)
      this.dial.clear()
      this.time.delayedCall(250, () => this.mulaiLompat())
    }
    if (!this.o.env.gerak) {
      selesai()
      return
    }
    this.gacuk.setDepth(D.terbang)
    this.bayangGacuk.setVisible(false)
    this.tweens.add({
      targets: this.gacuk,
      x: ke.x,
      y: ke.y,
      scale: 0.6 / this.res,
      duration: 280,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.gacuk.setScale(1 / this.res)
        selesai()
      },
    })
  }

  private gagalAmbil() {
    const k = this.karakter[this.aktif]!
    this.setRaut(this.aktif, 'kaget')
    this.tweens.killTweensOf(k)
    if (this.o.env.gerak) this.tweens.add({ targets: k, rotation: -0.5, duration: 160, yoyo: true, repeat: 1 })
    else k.setRotation(0)
    this.gagal('Oleng!', 'Gacuk gagal diambil. Lepas saat jarum di zona hijau.')
  }

  // ── Selesai satu percobaan ────────────────────────────────

  private keluar() {
    this.fase = 'antara'
    this.sorot.clear()
    this.tampilTombol()
    bunyi.lompat()
    this.lompatKe(TEMPAT_KELUAR, 'senang', () => {
      bunyi.mendarat(true)
      this.posisi = TEMPAT_KELUAR
      const i = this.aktif
      const p = this.o.pemain[i]!
      this.level[i]!++
      this.perbaruiPapan(i)
      if (this.level[i]! > this.jumlahLevel) {
        this.akhiri(i)
        return
      }
      bunyi.naikLevel()
      this.sorak('Berhasil!', 'daun-pisang-tua')
      this.setPesan(`${p.nama} naik ke level ${this.level[i]} dan main lagi!`)
      this.time.delayedCall(JEDA_BERHASIL, () => this.mulaiPercobaan())
    })
  }

  /** Kesalahan: tampilkan alasannya, lalu giliran pindah. */
  private gagal(judul: string, alasan: string, sudahDiGambar = false) {
    this.fase = 'antara'
    this.tertunda = null
    this.tahan = null
    this.gCincin.clear()
    this.sorot.clear()
    bunyi.salah()
    if (!sudahDiGambar) this.setRaut(this.aktif, 'kaget')
    this.sorak(judul, 'merah-bata', JEDA_GAGAL - 500)
    const berikut = this.o.pemain[(this.aktif + 1) % this.n]!
    this.setPesan(this.n > 1 ? `${alasan} Giliran ${berikut.nama}.` : `${alasan} Coba lagi.`)
    for (const t of this.tombol.values()) t.setRedup(true)
    this.time.delayedCall(JEDA_GAGAL, () => {
      if (this.fase === 'selesai') return
      this.gacuk.setVisible(false)
      this.bayangGacuk.setVisible(false)
      this.dial.clear()
      this.tampilMeter(false)
      const lama = this.aktif
      this.aktif = (this.aktif + 1) % this.n
      if (this.n > 1) this.setRaut(lama, 'dua')
      this.mulaiPercobaan()
    })
  }

  private akhiri(pemenang: number) {
    this.fase = 'selesai'
    this.tampilTombol()
    this.tampilMeter(false)
    this.gCincin.clear()
    this.sorot.clear()
    this.setPesan('')
    bunyi.selesai()
    const menang = this.o.pemain[pemenang]!
    this.karakter.forEach((_, i) => this.setRaut(i, i === pemenang ? 'senang' : 'dua'))
    const k = this.karakter[pemenang]!
    if (this.o.env.gerak) this.tweens.add({ targets: k, y: k.y - 26, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeOut' })

    const c = this.add.container(LEBAR / 2, 250).setDepth(D.sorak)
    const g = this.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(-340, -86, 680, 180, 28)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(-340, -94, 680, 180, 28)
    c.add(g)
    c.add(teks(this, 0, -40, `Tuntas ${this.jumlahLevel} kotak!`, { ukuran: 56, warna: 'merah-bata' }, this.res))
    c.add(teks(this, 0, 32, `${menang.nama} menang!`, { ukuran: 42, warna: 'biru-nila' }, this.res))
    if (this.o.env.gerak) {
      c.setScale(0.6).setAlpha(0)
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' })
    }

    const tuntas = this.o.pemain.map((_, i) => levelTuntas(this.level[i]!, this.jumlahLevel))
    const hasil: GameResult = {
      pemenang: menang,
      skor: Object.fromEntries(this.o.pemain.map((p, i) => [p.id, tuntas[i]!])),
      keteranganSkor: Object.fromEntries(this.o.pemain.map((p, i) => [p.id, `Tuntas ${tuntas[i]} kotak`])),
      durasiDetik: Math.round(this.sekarang() / 1000),
    }
    this.time.delayedCall(JEDA_HASIL, () => this.o.onFinish(hasil))
  }

  // ── Gambar dinamis ────────────────────────────────────────

  /** Kotak tujuan/target menyala. */
  private sorotKotak(kotak: number[], putar = false) {
    const g = this.sorot.clear()
    const bentuk: Titik[][] = kotak.flatMap((k) => {
      const b = this.tata.kotak(k)
      return b ? [this.tata.sudutKotak(b)] : []
    })
    if (putar) bentuk.push(this.tata.busurPutar())
    for (const titik of bentuk) {
      g.fillStyle(w('cahaya-kelir'), 0.45).fillPoints(titik, true)
      g.lineStyle(5, w('cahaya-kelir')).strokePoints(titik, true)
    }
  }

  private tampilMeter(v: boolean, target = 0) {
    this.meterStatis.setVisible(v)
    this.meterJarum.setVisible(v)
    this.meterLabel.forEach((t, i) => t.setVisible(v).setColor(WARNA[i + 1 === target ? 'kertas-terang' : 'kayu-gelap']))
    if (!v) return
    const { x, y, lebar, tinggi } = METER
    const ruas = lebar / this.jumlahLevel
    const g = this.meterStatis.clear()
    g.fillStyle(w('kayu-gelap'), 0.9).fillRoundedRect(x - 10, y - 8, lebar + 20, tinggi + 16, 16)
    for (let k = 1; k <= this.jumlahLevel; k++) {
      const x0 = x + ruas * (k - 1)
      const garis = (ruas * GARIS_METER) / 2
      g.fillStyle(w(k === target ? 'daun-pisang' : 'kertas-krem'), 1).fillRect(x0 + garis, y, ruas - garis * 2, tinggi)
      // Garis kapur di tepi ruas.
      g.fillStyle(w('kertas-terang'), 0.35).fillRect(x0, y, garis, tinggi).fillRect(x0 + ruas - garis, y, garis, tinggi)
    }
  }

  private gambarJarumMeter(p: number) {
    const { x, y, lebar, tinggi } = METER
    const px = x + p * lebar
    const g = this.meterJarum.clear()
    g.fillStyle(w('merah-bata')).fillRect(px - 3, y - 12, 6, tinggi + 24)
    g.fillStyle(w('merah-bata')).fillTriangle(px - 14, y - 26, px + 14, y - 26, px, y - 8)
    g.lineStyle(3, w('kertas-terang')).strokeTriangle(px - 14, y - 26, px + 14, y - 26, px, y - 8)
  }

  /** Lingkaran timing di tempat mendarat berikutnya. */
  private gambarCincin(t: number) {
    const l = this.langkah[this.iLangkah]
    if (!l) return
    const p = this.tata.layar(this.tata.posisiLangkah(l))
    const cy = p.y - 6
    const c = this.cincin
    const rLuar = jariCincin(c.tepat - JENDELA_PAS, c)
    const rDalam = jariCincin(c.tepat + JENDELA_PAS, c)
    const r = jariCincin(t, c)
    const pas = nilaiTekan(t, c) === 'pas'
    const g = this.gCincin.clear()
    g.lineStyle(rLuar - rDalam, w('daun-pisang'), 0.6).strokeCircle(p.x, cy, (rLuar + rDalam) / 2)
    g.lineStyle(3, w('daun-pisang-tua'), 0.9).strokeCircle(p.x, cy, rLuar).strokeCircle(p.x, cy, rDalam)
    if (r > 0) g.lineStyle(7, w(pas ? 'cahaya-kelir' : 'kertas-terang')).strokeCircle(p.x, cy, r)
  }

  /** Dial keseimbangan: setengah lingkaran, zona hijau di tengah, jarum = sudut (null = diam miring). */
  private gambarDial(sudut: number | null) {
    const g = this.dial.clear()
    const { x, y, r } = DIAL
    const rad = (d: number) => ((d - 90) * Math.PI) / 180
    g.fillStyle(w('kayu-gelap'), 0.9).slice(x, y, r + 12, rad(-90), rad(90), false).fillPath()
    g.fillStyle(w('merah-bata'), 0.85).slice(x, y, r, rad(-SUDUT_MAKS - 8), rad(SUDUT_MAKS + 8), false).fillPath()
    g.fillStyle(w('kunyit'), 0.95).slice(x, y, r, rad(-ZONA_TENGAH * 2.6), rad(ZONA_TENGAH * 2.6), false).fillPath()
    g.fillStyle(w('daun-pisang'), 1).slice(x, y, r, rad(-ZONA_TENGAH), rad(ZONA_TENGAH), false).fillPath()
    g.fillStyle(w('kayu-gelap')).fillCircle(x, y, 26)
    const s = sudut ?? sudutJarum(0)
    const aktif = sudut !== null
    const a = rad(s)
    g.lineStyle(9, w(aktif ? 'kertas-terang' : 'abu-kartu')).lineBetween(x, y, x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6))
    g.fillStyle(w(aktif && jarumDiTengah(s) ? 'cahaya-kelir' : 'kertas-terang')).fillCircle(x, y, 14)
  }

  // ── Masukan ───────────────────────────────────────────────

  private masukan(aksi: Aksi, id: number) {
    if (this.cpu() || this.fase === 'selesai' || this.fase === 'antara') return
    if (aksi !== 'lapangan') this.tombol.get(aksi)?.tekan(id)
    switch (this.fase) {
      case 'lempar':
        if (aksi === 'lempar' || aksi === 'lapangan' || aksi === 'satu') this.lempar()
        break
      case 'lompat':
        if (aksi === 'dua') this.tekanLompat('dua', id)
        else if (aksi === 'satu' || aksi === 'lapangan') this.tekanLompat('satu', id)
        break
      case 'ambil':
        if (aksi === 'ambil' || aksi === 'lapangan') this.mulaiTahan(id)
        break
    }
  }

  private lepas(id: number) {
    for (const t of this.tombol.values()) t.lepas(id)
    if (!this.cpu()) this.lepasTahan(id)
  }

  private tombolKeyboard(e: KeyboardEvent, turun: boolean) {
    const peta: Record<string, [Exclude<Aksi, 'lapangan'>, number]> = {
      Space: [this.fase === 'lempar' ? 'lempar' : this.fase === 'ambil' ? 'ambil' : 'satu', -2],
      Enter: [this.fase === 'lempar' ? 'lempar' : 'satu', -3],
      KeyD: ['dua', -4],
      ShiftLeft: ['dua', -5],
      ShiftRight: ['dua', -6],
      KeyE: ['ambil', -7],
    }
    const k = peta[e.code]
    if (!k) return
    e.preventDefault()
    if (e.repeat) return
    if (turun) this.masukan(k[0], k[1])
    else this.lepas(k[1])
  }
}
