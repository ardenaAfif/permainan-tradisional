/**
 * Adegan Phaser Kelereng (tampak atas, fisika Matter tanpa gravitasi).
 * Fisika dijalankan manual dengan langkah tetap 1/60 detik supaya sentilan
 * yang sama menempuh jarak yang sama di HP 30 fps maupun laptop 60 fps.
 */
import * as Phaser from 'phaser'
import { warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { STAGE_H, STAGE_W } from '../../app/stage/stageCoords'
import { audio } from '../../shared/audio/AudioManager'
import { jedakanAdegan, lanjutkanAdegan, type LingkunganPhaser } from '../../shared/phaser/modul'
import { teks } from '../../shared/phaser/teks'
import type { GameResult, Kesulitan, Player } from '../../shared/types'
import {
  acakLubang,
  bidikCpu,
  diLuarBatas,
  diLuarLingkaran,
  giliranKe,
  indeksPemenang,
  jarak,
  jumlahLubang,
  kecepatanDariKekuatan,
  lubangSah,
  penaruhLubang,
  perlambat,
  susunTaruhan,
  tempatDiGaris,
  terdekat,
  type Titik,
} from './aturan'
import { bunyi } from './bunyi'
import { FRAME_GULIR } from './tekstur'
import {
  AWAL_Y,
  BATAS,
  BATAS_WAKTU_LUNCUR,
  GALAT_CPU,
  GALAT_KEKUATAN_CPU,
  GARIS_X,
  JEDA_ANTARGILIRAN,
  JEDA_CPU,
  JEDA_HASIL,
  KEKUATAN_MIN,
  LAMA_BIDIK_CPU,
  LANGKAH_MS,
  LEBAR_ZONA_GARIS,
  LEBIH_TEMBAK,
  LUBANG_TANGKAP,
  PUSAT_LINGKARAN,
  R_GACOAN,
  R_LINGKARAN,
  R_LUBANG,
  R_TARUHAN,
  REDAM_BIBIR,
  TARIK_MAKS,
  V_MASUK,
} from './config'

export type JenisKelereng = 'lubang' | 'tembak'

export interface OpsiAdeganKelereng {
  jenis: JenisKelereng
  jumlahGiliran: number
  pemain: Player[]
  kesulitan: Kesulitan
  env: LingkunganPhaser
  /** Tekstur siap pakai (lihat KUNCI): kunci → kanvas beresolusi env.resolusi. */
  kanvas: Map<string, HTMLCanvasElement>
  onFinish(hasil: GameResult): void
}

export const KUNCI = {
  latar: 'latar',
  lubang: 'lubang',
  bayangGacoan: 'bayang-gacoan',
  bayangTaruhan: 'bayang-taruhan',
  /** Gacoan utuh (ikon papan skor). */
  gacoan: (i: number) => `gacoan-${i}`,
  /** Lapisan kelereng per nama ('g0' = gacoan pemain 0, 't3' = taruhan ke-3). */
  badan: (nama: string) => `badan-${nama}`,
  urat: (nama: string) => `urat-${nama}`,
  kilauGacoan: 'kilau-gacoan',
  kilauTaruhan: 'kilau-taruhan',
}

/** Kedalaman gambar. */
const D = { lubang: 1, bayang: 2, kelereng: 3, bidik: 4, ui: 10 }

const OPSI_BODY = { restitution: 0.9, friction: 0, frictionStatic: 0, frictionAir: 0, inertia: Infinity, slop: 0.02 }

interface Kelereng {
  jenis: 'gacoan' | 'taruhan'
  /** Indeks pemain untuk gacoan; -1 untuk taruhan. */
  pemilik: number
  r: number
  body: MatterJS.BodyType | null
  /** Badan kaca + urat + kilau; posisinya mengikuti body. */
  tampil: Phaser.GameObjects.Container
  /** Lapisan urat: diputar searah laju, frame maju sesuai jarak gelinding. */
  urat: Phaser.GameObjects.Image
  /** Sudut gelinding (radian) = jarak tempuh / jari-jari. */
  putaran: number
  bayang: Phaser.GameObjects.Image
  /** Melewati garis batas pada sentilan ini. */
  keluar: boolean
  /** Diam di garis sentil (boleh digeser sebelum disentil). */
  diGaris: boolean
}

type Fase = 'lubang' | 'bidik' | 'cpu' | 'meluncur' | 'antara' | 'selesai'

interface Papan {
  bg: Phaser.GameObjects.Graphics
  skor: Phaser.GameObjects.Text
  x: number
  lebar: number
}

export class AdeganKelereng extends Phaser.Scene {
  private o: OpsiAdeganKelereng
  private fase: Fase = 'lubang'
  private dijeda = false
  private res = 1
  private kelereng: Kelereng[] = []
  private gacoan: (Kelereng | null)[] = []
  private lubang: Titik[] = []
  private skor: number[] = []
  private giliran = 0
  private hangus = false
  private akumulasi = 0
  private waktuLuncur = 0
  private waktuMain = 0
  private pemainTerakhir = -1

  private papan: Papan[] = []
  private pesan!: Phaser.GameObjects.Text
  private pesanBg!: Phaser.GameObjects.Graphics
  private bidik!: Phaser.GameObjects.Graphics
  private tombolAcak: Phaser.GameObjects.Container | null = null

  // Bidikan pemain.
  private idTarik: number | null = null
  private awalTarik: Titik = { x: 0, y: 0 }
  private geserMaks = 0
  private sudut = 0
  private kekuatan = 0
  private sedangBidik = false

  constructor(o: OpsiAdeganKelereng) {
    super('kelereng')
    this.o = o
  }

  private get n() {
    return this.o.pemain.length
  }

  private get pemainAktif() {
    return giliranKe(this.giliran, this.n).pemain
  }

  private get gacoanAktif() {
    return this.gacoan[this.pemainAktif] ?? null
  }

  private cpu(i: number) {
    return this.o.pemain[i]?.avatar === 'cpu'
  }

  // ── Siklus hidup ──────────────────────────────────────────

  create() {
    const o = this.o
    this.res = o.env.resolusi
    for (const [kunci, kanvas] of o.kanvas) {
      if (this.textures.exists(kunci)) continue
      const t = this.textures.addCanvas(kunci, kanvas)
      // Lembar urat: FRAME_GULIR frame berjajar ke kanan.
      if (t && kunci.startsWith('urat-')) {
        const lebar = kanvas.width / FRAME_GULIR
        for (let f = 0; f < FRAME_GULIR; f++) t.add(f, 0, f * lebar, 0, lebar, kanvas.height)
      }
    }
    this.cameras.main.setZoom(this.res).centerOn(STAGE_W / 2, STAGE_H / 2)
    this.skor = o.pemain.map(() => 0)
    this.gacoan = o.pemain.map(() => null)

    this.gambar(0, 0, KUNCI.latar).setOrigin(0)
    this.bidik = this.add.graphics().setDepth(D.bidik)
    this.buatPapan()
    this.pesanBg = this.add.graphics().setDepth(D.ui)
    this.pesan = teks(this, STAGE_W / 2, 668, '', { ukuran: 30 }, this.res).setDepth(D.ui)

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, di: Phaser.GameObjects.GameObject[]) => this.tekan(p, di))
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.geser(p))
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.lepas(p))
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.lepas(p))
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.tombolKeyboard(e))
    this.matter.world.on('collisionstart', (ev: { pairs: { bodyA: MatterJS.BodyType; bodyB: MatterJS.BodyType }[] }) => {
      let kuat = 0
      for (const { bodyA: a, bodyB: b } of ev.pairs) kuat = Math.max(kuat, Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y))
      if (kuat > 0.6) bunyi.klikKaca(kuat / 14)
    })

    if (o.jenis === 'lubang') this.mulaiLubang()
    else {
      susunTaruhan(PUSAT_LINGKARAN).forEach((p, i) => this.buatKelereng('taruhan', -1, p, `t${i}`))
      this.mulaiGiliran()
    }
    if (this.dijeda) this.jeda()
  }

  update(_waktu: number, delta: number) {
    const dt = Math.min(delta, 100)
    if (this.fase !== 'selesai') this.waktuMain += dt
    if (this.fase === 'meluncur') {
      this.akumulasi += dt
      for (let i = 0; this.akumulasi >= LANGKAH_MS && i < 6; i++) {
        this.langkahFisika()
        this.akumulasi -= LANGKAH_MS
      }
      this.waktuLuncur += dt
      if (this.fase === 'meluncur' && (this.semuaDiam() || this.waktuLuncur > BATAS_WAKTU_LUNCUR)) this.selesaiGiliran()
    }
    for (const k of this.kelereng) {
      if (!k.body) continue
      const { x, y } = k.body.position
      this.gelindingkan(k, x - k.tampil.x, y - k.tampil.y)
      k.tampil.setPosition(x, y)
      k.bayang.setPosition(x + 3, y + 4)
    }
  }

  jeda() {
    this.dijeda = true
    jedakanAdegan(this)
  }

  lanjut() {
    this.dijeda = false
    lanjutkanAdegan(this)
  }

  // ── Gambar & kelereng ─────────────────────────────────────

  /** Gambar dari tekstur beresolusi tinggi, diskalakan ke ukuran panggung. */
  private gambar(x: number, y: number, kunci: string) {
    return this.add.image(x, y, kunci).setScale(1 / this.res)
  }

  private buatKelereng(jenis: Kelereng['jenis'], pemilik: number, p: Titik, nama: string): Kelereng {
    const r = jenis === 'gacoan' ? R_GACOAN : R_TARUHAN
    const bayang = this.gambar(p.x + 3, p.y + 4, jenis === 'gacoan' ? KUNCI.bayangGacoan : KUNCI.bayangTaruhan).setDepth(D.bayang)
    const urat = this.gambar(0, 0, KUNCI.urat(nama)).setFrame(0)
    const kilau = this.gambar(0, 0, jenis === 'gacoan' ? KUNCI.kilauGacoan : KUNCI.kilauTaruhan)
    const tampil = this.add.container(p.x, p.y, [this.gambar(0, 0, KUNCI.badan(nama)), urat, kilau]).setDepth(D.kelereng)
    const k: Kelereng = {
      jenis,
      pemilik,
      r,
      body: this.matter.add.circle(p.x, p.y, r, OPSI_BODY),
      tampil,
      urat,
      putaran: Math.random() * Math.PI * 2,
      bayang,
      keluar: false,
      diGaris: false,
    }
    urat.setRotation(Math.random() * Math.PI * 2)
    this.gelindingkan(k, 0, 0)
    this.kelereng.push(k)
    return k
  }

  /**
   * Kelereng menggelinding sejauh (dx, dy): urat diputar ke arah laju dan
   * bergeser di permukaan bola sebanyak jarak / jari-jari. Kilau tetap diam.
   */
  private gelindingkan(k: Kelereng, dx: number, dy: number) {
    const d = Math.hypot(dx, dy)
    if (d > 0.01 && this.o.env.gerak) {
      k.putaran += d / k.r
      k.urat.setRotation(Math.atan2(dy, dx))
    }
    const putaran = ((k.putaran % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    k.urat.setFrame(Math.floor((putaran / (Math.PI * 2)) * FRAME_GULIR) % FRAME_GULIR)
  }

  private posisi(k: Kelereng): Titik {
    return k.body ? { x: k.body.position.x, y: k.body.position.y } : { x: k.tampil.x, y: k.tampil.y }
  }

  private lepasBody(k: Kelereng) {
    if (k.body) this.matter.world.remove(k.body)
    k.body = null
  }

  private hapus(k: Kelereng, pudar = true) {
    this.lepasBody(k)
    this.kelereng = this.kelereng.filter((x) => x !== k)
    this.gacoan = this.gacoan.map((g) => (g === k ? null : g))
    if (pudar && this.o.env.gerak) {
      this.tweens.add({ targets: [k.tampil, k.bayang], alpha: 0, duration: 250, onComplete: () => (k.tampil.destroy(), k.bayang.destroy()) })
    } else {
      k.tampil.destroy()
      k.bayang.destroy()
    }
  }

  /** Taruh gacoan di garis sentil (dekat y), atau pindahkan yang sudah ada. */
  private taruhDiGaris(k: Kelereng | null, pemain: number, y: number): Kelereng {
    const lain = this.kelereng.filter((x) => x !== k).map((x) => this.posisi(x))
    const p = tempatDiGaris(y, lain, R_GACOAN * 2 + 6)
    if (!k) {
      k = this.buatKelereng('gacoan', pemain, p, `g${pemain}`)
      this.gacoan[pemain] = k
    } else if (k.body) {
      this.matter.body.setPosition(k.body, p, false)
      this.matter.body.setVelocity(k.body, { x: 0, y: 0 })
    }
    k.diGaris = true
    return k
  }

  // ── Papan skor & pesan ────────────────────────────────────

  private buatPapan() {
    const jeda = 12
    const lebar = Math.min(320, (1020 - jeda * (this.n - 1)) / this.n)
    const x0 = STAGE_W / 2 - (this.n * lebar + (this.n - 1) * jeda) / 2
    this.o.pemain.forEach((p, i) => {
      const x = x0 + i * (lebar + jeda)
      const bg = this.add.graphics().setDepth(D.ui)
      this.gambar(x + 30, 36, KUNCI.gacoan(i)).setDepth(D.ui)
      const nama = teks(this, x + 54, 36, p.nama, { ukuran: 30 }, this.res).setOrigin(0, 0.5).setDepth(D.ui)
      const skor = teks(this, x + lebar - 18, 36, '0', { ukuran: 30, warna: 'cahaya-kelir' }, this.res).setOrigin(1, 0.5).setDepth(D.ui)
      const maks = lebar - 54 - 56
      if (nama.width > maks) nama.setScale(maks / nama.width, 1)
      this.papan.push({ bg, skor, x, lebar })
    })
    this.sorotPapan(-1)
  }

  private sorotPapan(aktif: number) {
    this.papan.forEach((p, i) => {
      p.bg.clear()
      p.bg.fillStyle(w(i === aktif ? 'biru-nila' : 'tinta-gelap'), i === aktif ? 0.95 : 0.72).fillRoundedRect(p.x, 10, p.lebar, 52, 26)
      if (i === aktif) p.bg.lineStyle(4, w('cahaya-kelir')).strokeRoundedRect(p.x, 10, p.lebar, 52, 26)
    })
  }

  private perbaruiSkor() {
    this.papan.forEach((p, i) => p.skor.setText(String(this.skor[i])))
  }

  private setPesan(isi: string) {
    this.pesan.setText(isi)
    const lebar = this.pesan.width + 48
    this.pesanBg.clear().fillStyle(w('tinta-gelap'), 0.72).fillRoundedRect(STAGE_W / 2 - lebar / 2, 668 - 27, lebar, 54, 27)
    this.pesanBg.setVisible(!!isi)
  }

  /** Tulisan singkat di tengah panggung (mis. "Giliran Dimas!"). */
  private tampilSorak(isi: string, warna: NamaWarna = 'kertas-terang') {
    const t = teks(this, STAGE_W / 2, 250, isi, { ukuran: 56, warna, garis: 'kayu-gelap', tebalGaris: 10 }, this.res).setDepth(D.ui)
    if (this.o.env.gerak) {
      t.setScale(0.6)
      this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' })
    }
    this.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 300, onComplete: () => t.destroy() })
  }

  private tampilPlus(p: Titik, isi: string) {
    const t = teks(this, p.x, p.y - 24, isi, { ukuran: 40, warna: 'cahaya-kelir', garis: 'kayu-gelap', tebalGaris: 8 }, this.res).setDepth(D.ui)
    this.tweens.add({ targets: t, y: p.y - (this.o.env.gerak ? 70 : 24), alpha: 0, delay: 350, duration: 650, onComplete: () => t.destroy() })
  }

  // ── Mode Lubang: menaruh lubang ───────────────────────────

  private mulaiLubang() {
    this.fase = 'lubang'
    const c = this.add.container(1030, 610).setDepth(D.ui)
    const g = this.add.graphics()
    g.fillStyle(w('kunyit-gelap')).fillRoundedRect(0, 6, 190, 76, 24)
    g.fillStyle(w('kunyit')).fillRoundedRect(0, 0, 190, 76, 24)
    const zona = this.add.zone(0, 0, 190, 82).setOrigin(0).setInteractive()
    zona.on('pointerup', () => this.acakSemuaLubang())
    c.add([g, teks(this, 95, 38, 'Acak', { ukuran: 36, warna: 'kayu-gelap' }, this.res), zona])
    this.tombolAcak = c
    this.langkahLubang()
  }

  private langkahLubang() {
    const total = jumlahLubang(this.n)
    if (this.lubang.length >= total) {
      this.tombolAcak?.destroy()
      this.tombolAcak = null
      this.time.delayedCall(500, () => this.mulaiGiliran())
      this.fase = 'antara'
      return
    }
    const penaruh = penaruhLubang(this.lubang.length, this.n)
    const nama = this.o.pemain[penaruh]!.nama
    this.sorotPapan(penaruh)
    const ke = `${this.lubang.length + 1} dari ${total}`
    if (this.cpu(penaruh)) {
      this.setPesan(`${nama} menaruh lubang ${ke}…`)
      this.time.delayedCall(800, () => {
        if (this.fase === 'lubang' && this.lubang.length < total) this.taruhLubang(acakLubang(this.lubang))
      })
    } else {
      this.setPesan(`${nama}: tap tanah untuk menaruh lubang ${ke}`)
    }
  }

  private taruhLubang(p: Titik) {
    const img = this.gambar(p.x, p.y, KUNCI.lubang).setDepth(D.lubang)
    if (this.o.env.gerak) {
      img.setScale(0)
      this.tweens.add({ targets: img, scale: 1 / this.res, duration: 220, ease: 'Back.easeOut' })
    }
    bunyi.lubang()
    this.lubang.push(p)
    this.langkahLubang()
  }

  private acakSemuaLubang() {
    if (this.fase !== 'lubang') return
    audio.buka()
    while (this.fase === 'lubang' && this.lubang.length < jumlahLubang(this.n)) this.taruhLubang(acakLubang(this.lubang))
  }

  private tapLubang(p: Titik) {
    const penaruh = penaruhLubang(this.lubang.length, this.n)
    if (this.cpu(penaruh)) return
    if (lubangSah(p, this.lubang)) {
      this.taruhLubang(p)
      return
    }
    // Tempat tidak sah: lingkaran merah sebentar.
    const g = this.add.graphics().setDepth(D.bidik)
    g.lineStyle(5, w('merah-bata')).strokeCircle(p.x, p.y, R_LUBANG)
    this.tweens.add({ targets: g, alpha: 0, delay: 250, duration: 300, onComplete: () => g.destroy() })
    this.setPesan('Terlalu dekat garis atau lubang lain. Coba tempat lain.')
  }

  // ── Giliran ───────────────────────────────────────────────

  private mulaiGiliran() {
    const { pemain, ke } = giliranKe(this.giliran, this.n)
    const p = this.o.pemain[pemain]!
    this.hangus = false
    const g = this.gacoan[pemain] ?? this.taruhDiGaris(null, pemain, AWAL_Y)
    this.sorotPapan(pemain)
    const urutan = `giliran ${ke} dari ${this.o.jumlahGiliran}`
    // Main bergantian: beri tanda jelas saat perangkat harus berpindah tangan.
    if (!this.cpu(pemain) && this.pemainTerakhir !== pemain && this.o.pemain.filter((_, i) => !this.cpu(i)).length > 1) {
      this.tampilSorak(`Giliran ${p.nama}!`)
    }
    this.pemainTerakhir = pemain
    if (this.cpu(pemain)) {
      this.fase = 'cpu'
      this.setPesan(`${p.nama} membidik… (${urutan})`)
      this.time.delayedCall(JEDA_CPU, () => this.giliranCpu())
      return
    }
    this.fase = 'bidik'
    // Arah awal untuk keyboard: ke target terdekat.
    const target = this.targetTerdekat(this.posisi(g))
    this.sudut = target ? Math.atan2(target.y - this.posisi(g).y, target.x - this.posisi(g).x) : 0
    this.kekuatan = 0.5
    this.sedangBidik = false
    const cara = this.o.env.keyboard ? 'tarik lalu lepas, atau ← → ↑ ↓ lalu Spasi' : 'tarik ke belakang lalu lepas'
    this.setPesan(`${p.nama}, ${urutan}: ${cara}`)
  }

  private targetTerdekat(dari: Titik): Titik | null {
    if (this.o.jenis === 'lubang') return terdekat(dari, this.lubang)
    return terdekat(
      dari,
      this.kelereng.filter((k) => k.jenis === 'taruhan' && k.body).map((k) => this.posisi(k)),
    )
  }

  private sentil(sudut: number, kekuatan: number) {
    const g = this.gacoanAktif
    if (!g?.body || (this.fase !== 'bidik' && this.fase !== 'cpu')) return
    audio.buka()
    const v = kecepatanDariKekuatan(kekuatan)
    this.matter.body.setVelocity(g.body, { x: Math.cos(sudut) * v, y: Math.sin(sudut) * v })
    g.diGaris = false
    this.bidik.clear()
    this.sedangBidik = false
    this.fase = 'meluncur'
    this.waktuLuncur = 0
    this.akumulasi = 0
    bunyi.sentil(kekuatan)
  }

  private langkahFisika() {
    this.matter.world.step(LANGKAH_MS)
    const penembak = this.gacoanAktif
    for (const k of [...this.kelereng]) {
      const b = k.body
      if (!b) continue
      const v = b.velocity
      const s = Math.hypot(v.x, v.y)
      let baru = perlambat(s)
      if (this.o.jenis === 'lubang' && k === penembak) {
        const l = this.lubang.find((h) => jarak(h, b.position) < R_LUBANG)
        if (l) {
          if (jarak(l, b.position) < LUBANG_TANGKAP && baru < V_MASUK) {
            this.masukLubang(k, l)
            continue
          }
          baru *= REDAM_BIBIR
        }
      }
      this.matter.body.setVelocity(b, s > 0 ? { x: (v.x / s) * baru, y: (v.y / s) * baru } : { x: 0, y: 0 })
      if (diLuarBatas(b.position)) this.keluarGaris(k)
    }
  }

  private masukLubang(k: Kelereng, l: Titik) {
    // Langsung keluar dari permainan; gambarnya menyusul menghilang ke lubang.
    this.lepasBody(k)
    this.kelereng = this.kelereng.filter((x) => x !== k)
    this.gacoan = this.gacoan.map((g) => (g === k ? null : g))
    this.skor[k.pemilik]!++
    this.perbaruiSkor()
    bunyi.masukLubang()
    this.tampilPlus(l, '+1')
    this.tweens.add({
      targets: k.tampil,
      x: l.x,
      y: l.y,
      scale: 0.55,
      alpha: 0.2,
      duration: 260,
      onComplete: () => k.tampil.destroy(),
    })
    k.bayang.destroy()
  }

  private keluarGaris(k: Kelereng) {
    this.lepasBody(k)
    k.keluar = true
    k.bayang.setVisible(false)
    k.tampil.setAlpha(0.45)
    if (k === this.gacoanAktif) {
      this.hangus = true
      bunyi.keluar()
      this.setPesan('Keluar garis! Giliran hangus.')
    }
  }

  private semuaDiam() {
    return this.kelereng.every((k) => !k.body || (k.body.velocity.x === 0 && k.body.velocity.y === 0))
  }

  private selesaiGiliran() {
    this.fase = 'antara'
    const pemain = this.pemainAktif
    const penembak = this.gacoanAktif
    for (const k of this.kelereng) if (k.body) this.matter.body.setVelocity(k.body, { x: 0, y: 0 })

    if (this.o.jenis === 'tembak') {
      const kena = this.kelereng.filter((k) => k.jenis === 'taruhan' && (k.keluar || diLuarLingkaran(this.posisi(k), PUSAT_LINGKARAN, R_LINGKARAN)))
      if (this.hangus) {
        if (kena.length) this.setPesan('Keluar garis! Kelereng yang kena dikembalikan ke lingkaran.')
        for (const k of kena) this.kembalikanKeLingkaran(k)
      } else if (kena.length) {
        this.skor[pemain]! += kena.length
        this.tampilPlus(this.posisi(kena[0]!), `+${kena.length}`)
        bunyi.poin()
        const papan = this.papan[pemain]!
        for (const k of kena) {
          this.lepasBody(k)
          this.kelereng = this.kelereng.filter((x) => x !== k)
          k.bayang.destroy()
          this.tweens.add({
            targets: k.tampil,
            x: papan.x + 30,
            y: 36,
            alpha: this.o.env.gerak ? 1 : 0,
            duration: this.o.env.gerak ? 450 : 150,
            ease: 'Sine.easeIn',
            onComplete: () => k.tampil.destroy(),
          })
        }
      }
      if (penembak) this.hapus(penembak)
    } else {
      // Gacoan yang keluar garis mulai lagi dari garis sentil pada gilirannya.
      for (const k of this.kelereng.filter((x) => x.keluar)) this.hapus(k)
    }
    this.perbaruiSkor()

    this.giliran++
    const habis = this.o.jenis === 'tembak' && !this.kelereng.some((k) => k.jenis === 'taruhan')
    if (this.giliran >= this.n * this.o.jumlahGiliran || habis) this.time.delayedCall(900, () => this.akhiri())
    else this.time.delayedCall(JEDA_ANTARGILIRAN + (this.hangus ? 500 : 0), () => this.mulaiGiliran())
  }

  /** Mode Tembak, giliran hangus: kelereng yang terkena kembali ke dalam lingkaran. */
  private kembalikanKeLingkaran(k: Kelereng) {
    this.lepasBody(k)
    const lain = this.kelereng.filter((x) => x !== k && x.body).map((x) => this.posisi(x))
    let p: Titik = PUSAT_LINGKARAN
    for (let i = 0; i < 200; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * R_LINGKARAN * 0.6
      const c = { x: PUSAT_LINGKARAN.x + Math.cos(a) * r, y: PUSAT_LINGKARAN.y + Math.sin(a) * r }
      if (lain.every((q) => jarak(q, c) > R_TARUHAN + R_GACOAN + 4)) {
        p = c
        break
      }
    }
    k.keluar = false
    k.tampil.setAlpha(1).setPosition(p.x, p.y)
    k.bayang.setVisible(true).setPosition(p.x + 3, p.y + 4)
    k.body = this.matter.add.circle(p.x, p.y, k.r, OPSI_BODY)
  }

  private giliranCpu() {
    if (this.fase !== 'cpu') return
    const g = this.gacoanAktif
    if (!g?.body) return
    const target = this.targetTerdekat(this.posisi(g))
    if (!target) {
      this.selesaiGiliran()
      return
    }
    const bidikDari = () => {
      const lebih = this.o.jenis === 'tembak' ? LEBIH_TEMBAK : 0
      const b = bidikCpu(this.posisi(g), target, GALAT_CPU[this.o.kesulitan], lebih, GALAT_KEKUATAN_CPU)
      const proksi = { p: 0 }
      this.tweens.add({
        targets: proksi,
        p: b.kekuatan,
        duration: LAMA_BIDIK_CPU,
        ease: 'Sine.easeOut',
        onUpdate: () => this.gambarBidik(b.sudut, proksi.p),
        onComplete: () => this.time.delayedCall(150, () => this.sentil(b.sudut, b.kekuatan)),
      })
    }
    // Dari garis sentil, komputer menggeser gacoan sejajar target dulu.
    if (g.diGaris) {
      const tujuan = tempatDiGaris(
        target.y,
        this.kelereng.filter((x) => x !== g).map((x) => this.posisi(x)),
        R_GACOAN * 2 + 6,
      )
      const proksi = { y: this.posisi(g).y }
      this.tweens.add({
        targets: proksi,
        y: tujuan.y,
        duration: 350,
        onUpdate: () => g.body && this.matter.body.setPosition(g.body, { x: GARIS_X, y: proksi.y }, false),
        onComplete: bidikDari,
      })
    } else bidikDari()
  }

  private akhiri() {
    if (this.fase === 'selesai') return
    this.fase = 'selesai'
    this.bidik.clear()
    this.setPesan('')
    this.sorotPapan(-1)
    const menang = indeksPemenang(this.skor)
    bunyi.selesai()

    const c = this.add.container(STAGE_W / 2, 330).setDepth(D.ui)
    const g = this.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(-330, -86, 660, 180, 28)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(-330, -94, 660, 180, 28)
    c.add(g)
    c.add(teks(this, 0, -40, 'Selesai!', { ukuran: 60, warna: 'merah-bata' }, this.res))
    const judul = menang === null ? 'Seri!' : `${this.o.pemain[menang]!.nama} menang!`
    c.add(teks(this, 0, 32, judul, { ukuran: 40, warna: 'biru-nila' }, this.res))
    if (this.o.env.gerak) {
      c.setScale(0.6).setAlpha(0)
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' })
    }

    const hasil: GameResult = {
      pemenang: menang === null ? null : this.o.pemain[menang]!,
      skor: Object.fromEntries(this.o.pemain.map((p, i) => [p.id, this.skor[i]!])),
      keteranganSkor: Object.fromEntries(this.o.pemain.map((p, i) => [p.id, `${this.skor[i]} poin`])),
      durasiDetik: Math.round(this.waktuMain / 1000),
    }
    this.time.delayedCall(JEDA_HASIL, () => this.o.onFinish(hasil))
  }

  // ── Bidikan ───────────────────────────────────────────────

  /** Garis bidik putus-putus, tali tarikan, dan meter kekuatan di dekat gacoan. */
  private gambarBidik(sudut: number, p: number) {
    const g = this.bidik.clear()
    const k = this.gacoanAktif
    if (!k || p <= 0) return
    const { x, y } = this.posisi(k)
    const dx = Math.cos(sudut)
    const dy = Math.sin(sudut)
    const tarik = 18 + p * 70
    g.lineStyle(4, w('kayu-gelap'), 0.8).lineBetween(x, y, x - dx * tarik, y - dy * tarik)
    g.fillStyle(w('kayu-gelap'), 0.9).fillCircle(x - dx * tarik, y - dy * tarik, 8)
    const L = 40 + p * 300
    g.lineStyle(5, w('kertas-terang'), 0.95)
    for (let s = k.r + 6; s < L; s += 24) {
      const e = Math.min(L, s + 14)
      g.lineBetween(x + dx * s, y + dy * s, x + dx * e, y + dy * e)
    }
    const ux = x + dx * (L + 4)
    const uy = y + dy * (L + 4)
    g.fillStyle(w('kertas-terang')).fillTriangle(ux + dx * 16, uy + dy * 16, ux - dy * 11, uy + dx * 11, ux + dy * 11, uy - dx * 11)
    // Meter kekuatan di bawah gacoan (di atasnya jika dekat tepi bawah).
    const my = y + (y > BATAS.bawah - 80 ? -44 : 44)
    g.fillStyle(w('tinta-gelap'), 0.65).fillRoundedRect(x - 64, my - 11, 128, 22, 11)
    const warna: NamaWarna = p < 0.5 ? 'daun-pisang' : p < 0.8 ? 'kunyit' : 'merah-bata'
    g.fillStyle(w(warna)).fillRoundedRect(x - 60, my - 7, Math.max(14, 120 * p), 14, 7)
  }

  // ── Masukan ───────────────────────────────────────────────

  private tekan(p: Phaser.Input.Pointer, di: Phaser.GameObjects.GameObject[]) {
    audio.buka()
    if (di.length || this.idTarik !== null) return
    if (this.fase !== 'lubang' && this.fase !== 'bidik') return
    this.idTarik = p.id
    this.awalTarik = { x: p.worldX, y: p.worldY }
    this.geserMaks = 0
  }

  private geser(p: Phaser.Input.Pointer) {
    if (p.id !== this.idTarik) return
    const tx = p.worldX - this.awalTarik.x
    const ty = p.worldY - this.awalTarik.y
    const panjang = Math.hypot(tx, ty)
    this.geserMaks = Math.max(this.geserMaks, panjang)
    if (this.fase !== 'bidik' || panjang < 14) return
    // Tarik ke belakang: arah sentil berlawanan dengan arah tarikan.
    this.sudut = Math.atan2(-ty, -tx)
    this.kekuatan = Math.min(1, panjang / TARIK_MAKS)
    this.sedangBidik = true
    this.gambarBidik(this.sudut, this.kekuatan)
  }

  private lepas(p: Phaser.Input.Pointer) {
    if (p.id !== this.idTarik) return
    this.idTarik = null
    const tap = this.geserMaks < 14
    const titik = { x: p.worldX, y: p.worldY }
    if (this.fase === 'lubang') {
      if (tap) this.tapLubang(titik)
      return
    }
    if (this.fase !== 'bidik') return
    if (this.sedangBidik && this.kekuatan >= KEKUATAN_MIN) {
      this.sentil(this.sudut, this.kekuatan)
      return
    }
    this.sedangBidik = false
    this.bidik.clear()
    // Tap di dekat garis sentil: geser gacoan ke situ sebelum menyentil.
    const g = this.gacoanAktif
    if (tap && g?.diGaris && Math.abs(titik.x - GARIS_X) < LEBAR_ZONA_GARIS) this.taruhDiGaris(g, this.pemainAktif, titik.y)
  }

  private tombolKeyboard(e: KeyboardEvent) {
    if (this.fase === 'lubang') {
      if (e.code === 'Enter' || e.code === 'Space') this.acakSemuaLubang()
      return
    }
    if (this.fase !== 'bidik' || this.idTarik !== null) return
    const g = this.gacoanAktif
    if (!g) return
    const langkahSudut = ((e.shiftKey ? 0.5 : 2) * Math.PI) / 180
    switch (e.code) {
      case 'ArrowLeft':
        this.sudut -= langkahSudut
        break
      case 'ArrowRight':
        this.sudut += langkahSudut
        break
      case 'ArrowUp':
        this.kekuatan = Math.min(1, this.kekuatan + 0.04)
        break
      case 'ArrowDown':
        this.kekuatan = Math.max(KEKUATAN_MIN, this.kekuatan - 0.04)
        break
      case 'KeyW':
      case 'KeyS':
        if (!g.diGaris) return
        this.taruhDiGaris(g, this.pemainAktif, this.posisi(g).y + (e.code === 'KeyW' ? -20 : 20))
        break
      case 'Space':
      case 'Enter':
        e.preventDefault()
        this.sentil(this.sudut, this.kekuatan)
        return
      default:
        return
    }
    e.preventDefault()
    this.sedangBidik = false
    this.gambarBidik(this.sudut, this.kekuatan)
  }
}
