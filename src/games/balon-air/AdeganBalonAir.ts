/**
 * Adegan Phaser Pecah Balon Air: estafet 4 putaran membawa balon air dari
 * START ke keranjang, tiap putaran dengan cara membawa yang berbeda. Lawan
 * Komputer: berlomba dengan bayangan pelari tim komputer di lintasan yang
 * sama. Duel Satu Layar: layar dibagi atas-bawah, satu lintasan per tim.
 * Simulasi ada di aturan.ts (langkah tetap 1/60 detik); adegan ini membaca
 * kendali (seret, joystick melayang, keyboard), menggerakkan kamera, dan
 * menggambar. Dunia dan papan UI dipisah dengan dua Layer + kamera sendiri.
 */
import * as Phaser from 'phaser'
import { WARNA, warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { audio } from '../../shared/audio/AudioManager'
import { jedakanAdegan, lanjutkanAdegan, type LingkunganPhaser } from '../../shared/phaser/modul'
import { teks } from '../../shared/phaser/teks'
import type { GameResult, Kesulitan, Player } from '../../shared/types'
import { acakBerbenih, formatWaktu, LogikaPelari, pemenang, posBayangan, rencanaBayangan, type Peristiwa, type RencanaBayangan } from './aturan'
import { bunyi } from './bunyi'
import { CPU, JEDA_HASIL, JEDA_PUTARAN, JUMLAH_PUTARAN, LAMA_HITUNG, URUTAN_CARA, type Cara, type IdCara } from './config'
import { KendaliSentuh } from './Kendali'
import { LINTASAN, PANJANG, type Titik } from './lintasan'
import { PapanBayangan, PapanInfo } from './PapanInfo'
import { KUNCI_BALON, PelariView, Sosok, type TeksturPelari } from './PelariView'
import { LEBAR, OFFSET_Y, pandangan, TINGGI, TINGGI_SOSOK, type Pandang } from './tata'
import { alas, BATU, JUMLAH_POTONGAN, KERANJANG, LEBAR_POTONGAN, R_GAMBAR_BATU, type Anggota, type Raut } from './tekstur'

export const KUNCI = {
  potongan: (i: number) => `ba-lap-${i}`,
  batu: (v: number) => `ba-batu-${v}`,
  keranjang: 'ba-keranjang',
  raut: (tim: number, a: number, r: Raut) => `ba-t${tim}-a${a}-${r}`,
}

export interface DataTim {
  pemain: Player
  anggota: Anggota[]
  manusia: boolean
  warna: number
}

export interface OpsiAdegan {
  mode: 'cpu' | 'split'
  tim: [DataTim, DataTim]
  kesulitan: Kesulitan
  env: LingkunganPhaser
  /** Piksel tekstur per px dunia (resolusi × pembesaran kamera). */
  skala: number
  kanvas: Map<string, HTMLCanvasElement>
  onFinish(hasil: GameResult): void
}

/** Raut pelari untuk cara membawa. */
export function rautBawa(cara: IdCara): Raut {
  return cara === 'atas-kepala' ? 'angkat' : cara === 'diapit' ? 'apit' : 'diam'
}

/** Raut siluet bayangan untuk cara membawa. */
export function rautBayangan(cara: IdCara): Raut {
  return cara === 'atas-kepala' ? 'bayang-angkat' : cara === 'diapit' ? 'bayang-apit' : 'bayang-diam'
}

type Fase = 'kartu' | 'hitung' | 'main' | 'antara' | 'akhir'

/** Kedalaman di Layer UI. */
const D = { papan: 100, kendali: 900, seru: 1500, kartu: 2000 }

/** Tombol keyboard per pemain. Mode komputer: keduanya untuk pemain. */
const KEY_P1 = { kiri: ['KeyA'], kanan: ['KeyD'], atas: ['KeyW'], bawah: ['KeyS'] }
const KEY_P2 = { kiri: ['ArrowLeft'], kanan: ['ArrowRight'], atas: ['ArrowUp'], bawah: ['ArrowDown'] }
const KEY_SEMUA = {
  kiri: [...KEY_P1.kiri, ...KEY_P2.kiri],
  kanan: [...KEY_P1.kanan, ...KEY_P2.kanan],
  atas: [...KEY_P1.atas, ...KEY_P2.atas],
  bawah: [...KEY_P1.bawah, ...KEY_P2.bawah],
}
const KEY_GERAK = new Set(Object.values(KEY_SEMUA).flat())

/** Seret: jari sejauh ini (px dunia) dari badan = kecepatan penuh. */
const R_SERET = 110
/** Sentuhan sedekat ini (px dunia) dari badan pelari = mode seret. */
const R_PEGANG = 80
/** Keyboard: arah mendekati tombol yang ditekan sekian satuan per detik (supaya tidak menyentak). */
const LAJU_KEYBOARD = 3

const NAMA_TIM = (p: Player) => `Tim ${p.nama}`

/** Tempat anggota tim menunggu di START dan beristirahat di dekat keranjang. */
const TEMPAT_TUNGGU: Titik[] = [
  { x: 52, y: 134 },
  { x: 52, y: 306 },
  { x: 30, y: 222 },
]
const TEMPAT_SELESAI: Titik[] = [
  { x: 2268, y: 140 },
  { x: 2268, y: 304 },
  { x: 2282, y: 222 },
]

interface StatusTim {
  logika: LogikaPelari
  /** Waktu putaran-putaran yang sudah selesai. */
  waktu: number[]
  /** Balon terpakai di putaran yang sudah selesai. */
  balon: number
  selesai: boolean
  kb: Titik
  jedaBahaya: number
}

export class AdeganBalonAir extends Phaser.Scene {
  private o: OpsiAdegan
  private res: number
  private fase: Fase = 'kartu'
  private dijeda = false
  private putaran = 0
  private dunia!: Phaser.GameObjects.Layer
  private ui!: Phaser.GameObjects.Layer
  private pandang: Pandang[] = []
  private kamera: Phaser.Cameras.Scene2D.Camera[] = []
  private kamX: number[] = []
  /** Tim yang berlari (Duel: 0 & 1; Lawan Komputer: 0 saja). */
  private regu: (0 | 1)[] = []
  private status: StatusTim[] = []
  private view: PelariView[] = []
  private tunggu: Sosok[][] = []
  private papan: PapanInfo[] = []
  private kendali: (KendaliSentuh | null)[] = []
  private seru: Phaser.GameObjects.Text[] = []
  private pesan: Phaser.GameObjects.Container[] = []
  private kartu: Phaser.GameObjects.Container | null = null
  private tombolMulai: { x: number; y: number; lebar: number; tinggi: number } | null = null
  private tombol = new Set<string>()
  private acak = acakBerbenih(Math.floor(Math.random() * 2 ** 31))
  private durasi = 0
  // Lawan Komputer: bayangan pelari.
  private bayangan: PelariView | null = null
  private papanBayangan: PapanBayangan | null = null
  private rencana: RencanaBayangan | null = null
  private waktuCpu: number[] = []
  private balonCpu = 0
  private tBayangan = 0
  private statusBayangan: 'jalan' | 'pecah' | 'sampai' = 'jalan'

  constructor(o: OpsiAdegan) {
    super('balon-air')
    this.o = o
    this.res = o.env.resolusi
  }

  private get split() {
    return this.o.mode === 'split'
  }

  private get cara(): Cara {
    return URUTAN_CARA[this.putaran]!
  }

  // ── Siklus hidup ──────────────────────────────────────────

  create() {
    const o = this.o
    for (const [kunci, kanvas] of o.kanvas) if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    // PID: dua pemain bersamaan, masing-masing satu jari, plus cadangan.
    this.input.addPointer(4)
    this.regu = this.split ? [0, 1] : [0]
    this.pandang = pandangan(this.split)
    this.dunia = this.add.layer()
    this.ui = this.add.layer()
    this.siapkanKamera()

    this.regu.forEach((_, i) => this.gambarLintasan(OFFSET_Y[i]!))
    this.buatTim()
    this.buatUi()

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.tekan(p))
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.lepas(p))
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.lepas(p))
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.tekanKeyboard(e))
    this.input.keyboard?.on('keyup', (e: KeyboardEvent) => this.tombol.delete(e.code))

    this.siapkanPutaran()
    this.tampilKartu()
    if (this.dijeda) this.jeda()
  }

  update(_waktu: number, delta: number) {
    const dt = Math.min(delta, 100)
    if (this.fase === 'main') {
      this.regu.forEach((_, i) => {
        const s = this.status[i]!
        if (s.selesai) return
        this.bacaKendali(i, dt)
        for (const e of s.logika.maju(dt)) this.proses(i, e)
      })
    }
    if (this.fase === 'main' || this.fase === 'antara') this.majuBayangan(dt)
    this.gambar(dt)
  }

  jeda() {
    this.dijeda = true
    // Jari/tombol yang ditahan bisa lepas tanpa terbaca selama jeda.
    this.tombol.clear()
    this.kendali.forEach((k) => k?.lepas())
    jedakanAdegan(this)
  }

  lanjut() {
    this.dijeda = false
    lanjutkanAdegan(this)
  }

  // ── Persiapan ─────────────────────────────────────────────

  /** Kamera dunia per pandangan (kamera utama = tim 0) + kamera UI di atas semuanya. */
  private siapkanKamera() {
    const r = this.res
    this.pandang.forEach((p, i) => {
      const kam = i === 0 ? this.cameras.main : this.cameras.add()
      kam.setViewport(p.x * r, p.y * r, p.lebar * r, p.tinggi * r).setZoom(p.zoom * r)
      kam.ignore(this.ui)
      this.kamera.push(kam)
      this.kamX.push(0)
      this.arahkanKamera(i, LINTASAN.start.x, true)
    })
    const kamUi = this.cameras.add(0, 0, LEBAR * r, TINGGI * r).setZoom(r).centerOn(LEBAR / 2, TINGGI / 2)
    kamUi.ignore(this.dunia)
  }

  /** Kamera tim ke-i mengikuti pelari (pelari sedikit di kiri tengah supaya jalan di depan terlihat). */
  private arahkanKamera(i: number, x: number, langsung: boolean, dt = 16) {
    const p = this.pandang[i]!
    const kam = this.kamera[i]!
    const lebar = p.lebar / p.zoom
    const tujuan = Phaser.Math.Clamp(x + lebar * 0.14, lebar / 2, PANJANG - lebar / 2)
    const lalu = this.kamX[i]!
    const sekarang = langsung ? tujuan : lalu + (tujuan - lalu) * Math.min(1, (dt / 1000) * 6)
    this.kamX[i] = sekarang
    kam.centerOn(sekarang, OFFSET_Y[i]! + (p.y0 + p.y1) / 2)
  }

  private keDunia<T extends Phaser.GameObjects.GameObject>(x: T) {
    this.dunia.add(x)
    return x
  }

  private keUi<T extends Phaser.GameObjects.GameObject>(x: T) {
    this.ui.add(x)
    return x
  }

  private gambarLintasan(oy: number) {
    const sk = this.o.skala
    for (let i = 0; i < JUMLAH_POTONGAN; i++) {
      this.keDunia(this.add.image(i * LEBAR_POTONGAN, oy, KUNCI.potongan(i)).setOrigin(0).setScale(1 / sk).setDepth(oy - 500))
    }
    LINTASAN.batu.forEach((b, i) => {
      const img = this.add.image(b.x, b.y + oy, KUNCI.batu(i % 2)).setOrigin(BATU.alasX / BATU.lebar, BATU.alasY / BATU.tinggi)
      img.setScale(b.r / R_GAMBAR_BATU / sk).setDepth(b.y + oy + b.r * 0.4)
      this.keDunia(img)
    })
    const k = LINTASAN.keranjang
    this.keDunia(
      this.add
        .image(k.x, k.y + oy + 6, KUNCI.keranjang)
        .setOrigin(0.5, KERANJANG.alasY / KERANJANG.tinggi)
        .setScale(1 / sk)
        .setDepth(k.y + oy + 6),
    )
    const zoom = this.pandang[0]!.zoom
    const label = (x: number, y: number, isi: string) =>
      this.keDunia(
        teks(this, x, y + oy, isi, { ukuran: 30 / zoom, warna: 'kertas-terang', garis: 'kayu', tebalGaris: 5 / zoom }, this.res * zoom)
          .setAlpha(0.9)
          .setDepth(oy - 400),
      )
    // Di semak sisi jauh, supaya tidak tertutup joystick atau pelari.
    label(LINTASAN.garisStart, 24, 'START')
    label(k.x, 24, 'KERANJANG')
  }

  /** Pelari, teman yang menunggu, dan (Lawan Komputer) bayangan pelari. */
  private buatTim() {
    const o = this.o
    const gerak = o.env.gerak
    this.regu.forEach((t, i) => {
      const p = this.pandang[i]!
      const opsi = { res: this.res, gerak, zoom: p.zoom, oy: OFFSET_Y[i]! }
      this.tunggu[i] = o.tim[t].anggota.map((_, a) => new Sosok(this, this.dunia, KUNCI.raut(t, a, 'diam'), alas('diam'), { ...opsi, warna: o.tim[t].warna }))
      this.view[i] = new PelariView(this, this.dunia, o.tim[t].warna, { ...opsi, bayangan: false, kunciAwal: KUNCI.raut(t, 0, 'diam') })
      this.status[i] = { logika: new LogikaPelari({ lintasan: LINTASAN, cara: this.cara }), waktu: [], balon: 0, selesai: false, kb: { x: 0, y: 0 }, jedaBahaya: 0 }
    })
    if (!this.split) {
      const p = this.pandang[0]!
      this.bayangan = new PelariView(this, this.dunia, o.tim[1].warna, {
        res: this.res,
        gerak,
        zoom: p.zoom,
        oy: OFFSET_Y[0],
        bayangan: true,
        kunciAwal: KUNCI.raut(1, 0, 'bayang-diam'),
      })
    }
  }

  private buatUi() {
    const o = this.o
    this.regu.forEach((t, i) => {
      const p = this.pandang[i]!
      this.papan[i] = new PapanInfo(this, this.ui, {
        split: this.split,
        indeks: i as 0 | 1,
        nama: NAMA_TIM(o.tim[t].pemain),
        warna: o.tim[t].warna,
        kunciKepala: KUNCI.raut(t, 0, 'kepala'),
        res: this.res,
        pandang: p,
      })
      const area = { x0: p.x, y0: p.y, lebar: p.lebar, tinggi: p.tinggi }
      this.kendali[i] = o.tim[t].manusia ? new KendaliSentuh(this, this.ui, area, o.tim[t].warna, this.res, this.split ? 64 : 84) : null
      this.seru[i] = this.keUi(
        teks(this, LEBAR / 2, p.y + p.tinggi / 2 - 10, '', { ukuran: this.split ? 84 : 110, warna: 'merah-bata', garis: 'kertas-terang', tebalGaris: 12 }, this.res)
          .setDepth(D.seru)
          .setAlpha(0),
      )
      const c = this.keUi(this.add.container(LEBAR / 2, p.y + p.tinggi / 2 - 30).setDepth(D.seru).setVisible(false))
      c.add([this.add.rectangle(0, 0, 10, 72, w('tinta-gelap'), 0.82), teks(this, 0, 0, '', { ukuran: 38, warna: 'kertas-terang' }, this.res)])
      this.pesan[i] = c
    })
    if (this.split) {
      // Garis pembagi layar.
      this.keUi(this.add.rectangle(LEBAR / 2, TINGGI / 2, LEBAR, 6, w('kayu-gelap')).setDepth(D.papan + 5))
    } else {
      this.papanBayangan = new PapanBayangan(this, this.ui, { nama: NAMA_TIM(o.tim[1].pemain), kunciKepala: KUNCI.raut(1, 0, 'kepala'), res: this.res })
    }
  }

  /** Tekstur pelari tim t di putaran ini (dan teman pengapit). */
  private teksturPutaran(t: 0 | 1, bayangan: boolean): TeksturPelari {
    const c = this.cara
    const a = this.putaran
    const raut = bayangan ? rautBayangan(c.id) : rautBawa(c.id)
    const tex: TeksturPelari = {
      bawa: KUNCI.raut(t, a, raut),
      asalBawa: alas(raut),
      kaget: KUNCI.raut(t, a, bayangan ? raut : 'kaget'),
      senang: KUNCI.raut(t, a, bayangan ? raut : 'senang'),
    }
    if (c.berpasangan) tex.teman = KUNCI.raut(t, (a + 1) % this.o.tim[t].anggota.length, raut)
    return tex
  }

  /** Susun logika, pelari, teman yang menunggu, bayangan, dan papan untuk putaran ini. */
  private siapkanPutaran() {
    const o = this.o
    const c = this.cara
    const n = this.putaran
    this.regu.forEach((t, i) => {
      const s = this.status[i]!
      s.logika = new LogikaPelari({ lintasan: LINTASAN, cara: c })
      s.selesai = false
      s.kb = { x: 0, y: 0 }
      const v = this.view[i]!
      v.setPutaran(c.id, this.teksturPutaran(t, false))
      v.setTanda(o.tim[t].manusia ? (this.split ? `P${i + 1}` : 'KAMU') : null)
      v.perbarui({ x: s.logika.x, y: s.logika.y }, s.logika.teman, { tekanan: 0, goyang: 0, laju: 0, dt: 0, bawa: true })
      // Anggota lain: yang belum berlari menunggu di START, yang sudah di dekat keranjang.
      const pasangan = c.berpasangan ? (n + 1) % o.tim[t].anggota.length : -1
      let kTunggu = 0
      let kSelesai = 0
      this.tunggu[i]!.forEach((sosok, a) => {
        if (a === n || a === pasangan) {
          sosok.setTampil(false)
          return
        }
        const tempat = a < n ? TEMPAT_SELESAI[kSelesai++ % 3]! : TEMPAT_TUNGGU[kTunggu++ % 3]!
        sosok.setTampil(true)
        sosok.setPos(tempat.x, tempat.y)
      })
      const papan = this.papan[i]!
      papan.setPutaran(this.split ? `Putaran ${n + 1}/${JUMLAH_PUTARAN}` : `Putaran ${n + 1}/${JUMLAH_PUTARAN} · ${c.judul}`)
      papan.setWaktu(this.totalTim(i))
      papan.setWaktuAktif(false)
      papan.setBalon(s.balon + 1)
      papan.setTekanan(0, 16)
      this.kendali[i]?.lepas()
      this.arahkanKamera(i, s.logika.x, true)
    })
    if (this.bayangan) {
      this.rencana = rencanaBayangan(LINTASAN, c, CPU[o.kesulitan], this.acak)
      this.tBayangan = 0
      this.statusBayangan = 'jalan'
      this.bayangan.setPutaran(c.id, this.teksturPutaran(1, true))
      this.majuBayangan(0)
      this.papanBayangan?.setWaktu(this.totalCpu())
      this.papanBayangan?.setBalon(this.balonCpu + 1)
    }
  }

  private totalTim(i: number) {
    const s = this.status[i]!
    return s.waktu.reduce((a, b) => a + b, 0) + (s.selesai ? 0 : s.logika.waktu)
  }

  private totalCpu() {
    const lalu = this.waktuCpu.reduce((a, b) => a + b, 0)
    return this.rencana && this.waktuCpu.length === this.putaran ? lalu + Math.min(this.tBayangan, this.rencana.waktu) : lalu
  }

  // ── Kartu putaran & hitungan ──────────────────────────────

  private tampilKartu() {
    this.fase = 'kartu'
    const r = this.res
    const o = this.o
    const c = this.cara
    const kb = o.env.keyboard
    const tengah = LEBAR / 2
    const lebarPanel = 1000
    const kiri = tengah - lebarPanel / 2
    const box = this.keUi(this.add.container(0, 0).setDepth(D.kartu))
    this.kartu = box
    box.add(this.add.rectangle(0, 0, LEBAR, TINGGI, w('tinta-gelap'), 0.6).setOrigin(0))
    const bg = this.add.graphics()
    const isi = this.add.container(0, 0)
    box.add([bg, isi])

    let y = 26
    const judul = this.putaran === 0 ? 'Estafet balon air!' : `Putaran ${this.putaran + 1} dari ${JUMLAH_PUTARAN}`
    isi.add(teks(this, tengah, y, judul, { ukuran: 46, warna: 'biru-nila' }, r).setOrigin(0.5, 0))
    y += 64
    const sub = this.putaran === 0 ? `Putaran 1 dari ${JUMLAH_PUTARAN}: ${c.judul}` : `Cara membawa: ${c.judul}`
    isi.add(teks(this, tengah, y, sub, { ukuran: 38, warna: 'merah-bata' }, r).setOrigin(0.5, 0))
    y += 58

    // Kiri: gambar cara membawa (pelari tim 0 + balon). Kanan: penjelasan.
    const kolomX = kiri + 250
    const lebarTeks = lebarPanel - 280
    const atasIsi = y
    let yt = y
    const baris = (t: string, warna: NamaWarna, tebal = 600, sela = 8) => {
      const x = teks(this, kolomX, yt, t, { ukuran: 30, warna, judul: false, tebal }, r).setOrigin(0, 0)
      x.setWordWrapWidth(lebarTeks, true)
      x.setAlign('left')
      isi.add(x)
      yt += x.height + sela
    }
    baris(c.keterangan, 'tinta', 700, 10)
    if (this.split) {
      baris('P1 di layar atas, P2 di layar bawah. Seret pelarimu, atau sentuh layarmu untuk joystick.', 'tinta')
      if (kb) baris('Keyboard: P1 W A S D · P2 tombol panah.', 'kayu')
    } else {
      baris('Seret pelarimu dengan jari, atau sentuh di mana saja untuk joystick.' + (kb ? ' Keyboard: panah / W A S D.' : ''), 'tinta')
      const lawan = NAMA_TIM(o.tim[1].pemain)
      baris(
        this.putaran === 0
          ? `Kalahkan waktu ${lawan} (komputer). Pelari mereka tampil sebagai bayangan.`
          : `Waktu timmu ${formatWaktu(this.totalTim(0))} · ${lawan} ${formatWaktu(this.totalCpu())}`,
        'kayu',
        700,
      )
    }
    if (this.putaran === 0) baris('Ingat pesan Bu Pavi: balon air dibawa, bukan dilempar ke wajah teman!', 'daun-pisang-gelap', 700)

    // Gambar cara membawa.
    const tex = this.teksturPutaran(0, false)
    const gx = kiri + 130
    const gTinggi = 190
    const kaki = Math.max(atasIsi + gTinggi + 10, yt - 4)
    const s = gTinggi / TINGGI_SOSOK
    const lingkar = this.add.circle(gx, kaki - gTinggi / 2 + 6, 112, w('kertas-krem-gelap'))
    isi.add(lingkar)
    const pelari = this.add.image(gx + (tex.teman ? 34 : 0), kaki, tex.bawa).setOrigin(0.5, tex.asalBawa)
    pelari.setScale(gTinggi / pelari.height)
    const gambar: Phaser.GameObjects.GameObject[] = []
    if (tex.teman) {
      const t2 = this.add.image(gx - 34, kaki, tex.teman).setOrigin(0.5, tex.asalBawa)
      t2.setScale(gTinggi / t2.height)
      gambar.push(t2)
    }
    gambar.push(pelari)
    const dy = c.id === 'atas-kepala' ? -1.06 : c.id === 'diapit' ? -0.5 : -0.38
    const balon = this.add.image(gx, kaki + dy * gTinggi, KUNCI_BALON).setScale((s / this.o.skala) * 1)
    gambar.push(balon)
    isi.add(gambar)

    const by = Math.max(yt, kaki) + 12
    const tombol = this.add.graphics()
    tombol.fillStyle(w('kunyit-gelap')).fillRoundedRect(tengah - 170, by + 6, 340, 84, 26)
    tombol.fillStyle(w('kunyit')).fillRoundedRect(tengah - 170, by, 340, 84, 26)
    isi.add(tombol)
    isi.add(teks(this, tengah, by + 42, 'Mulai!', { ukuran: 44, warna: 'kayu-gelap' }, r))

    const tinggi = by + 90 + 22
    const atas = Math.max(6, (TINGGI - tinggi) / 2)
    isi.y = atas
    this.tombolMulai = { x: tengah - 170, y: by + atas, lebar: 340, tinggi: 90 }
    bg.fillStyle(w('kayu-gelap')).fillRoundedRect(kiri, atas + 8, lebarPanel, tinggi, 28)
    bg.fillStyle(w('kertas-krem')).fillRoundedRect(kiri, atas, lebarPanel, tinggi, 28)
  }

  private mulaiHitung() {
    if (this.fase !== 'kartu') return
    audio.buka()
    this.kartu?.destroy()
    this.kartu = null
    this.tombolMulai = null
    this.fase = 'hitung'
    const angka = ['3', '2', '1']
    angka.forEach((a, i) =>
      this.time.delayedCall(200 + i * LAMA_HITUNG, () => {
        this.tampilSeru(a, 'merah-bata')
        bunyi.hitung()
      }),
    )
    this.time.delayedCall(200 + angka.length * LAMA_HITUNG, () => {
      this.tampilSeru('AYO!', 'daun-pisang-gelap')
      bunyi.mulai()
      this.fase = 'main'
      this.papan.forEach((p) => p.setWaktuAktif(true))
    })
  }

  private tampilSeru(isi: string, warna: NamaWarna) {
    for (const s of this.seru) {
      this.tweens.killTweensOf(s)
      s.setText(isi).setColor(WARNA[warna]).setAlpha(1).setScale(1)
      if (this.o.env.gerak) {
        s.setScale(1.35)
        this.tweens.add({ targets: s, scale: 1, duration: 160, ease: 'Back.easeOut' })
      }
      this.tweens.add({ targets: s, alpha: 0, delay: LAMA_HITUNG * 0.6, duration: LAMA_HITUNG * 0.35 })
    }
  }

  /** Pesan di tengah pandangan tim ke-i (lama = ms, 0 = tetap tampil). */
  private tampilPesan(i: number, isi: string, lama: number) {
    const c = this.pesan[i]!
    const tulisan = c.getAt(1) as Phaser.GameObjects.Text
    tulisan.setText(isi)
    ;(c.getAt(0) as Phaser.GameObjects.Rectangle).setSize(tulisan.width + 56, tulisan.height + 26).setOrigin(0.5)
    this.tweens.killTweensOf(c)
    c.setVisible(true).setAlpha(1)
    if (lama > 0) this.tweens.add({ targets: c, alpha: 0, delay: lama, duration: 300, onComplete: () => c.setVisible(false) })
  }

  private sembunyikanPesan() {
    for (const c of this.pesan) {
      this.tweens.killTweensOf(c)
      c.setVisible(false)
    }
  }

  // ── Kendali ───────────────────────────────────────────────

  private tekan(p: Phaser.Input.Pointer) {
    audio.buka()
    const t = { x: p.x / this.res, y: p.y / this.res }
    if (this.fase === 'kartu') return
    if (this.fase !== 'main' && this.fase !== 'hitung') return
    this.regu.forEach((_, i) => {
      const k = this.kendali[i]
      if (!k || k.aktif || !k.berisi(t)) return
      // Menyentuh pelari = seret; di tempat lain = joystick melayang.
      const l = this.status[i]!.logika
      const d = this.kamera[i]!.getWorldPoint(p.x, p.y)
      const dekat = Math.hypot(d.x - l.x, d.y - OFFSET_Y[i]! - (l.y - TINGGI_SOSOK * 0.45)) < R_PEGANG
      k.tekan(p, dekat ? 'seret' : 'joystick')
    })
  }

  private lepas(p: Phaser.Input.Pointer) {
    if (this.fase === 'kartu') {
      const b = this.tombolMulai
      const t = { x: p.x / this.res, y: p.y / this.res }
      if (b && t.x >= b.x && t.x <= b.x + b.lebar && t.y >= b.y && t.y <= b.y + b.tinggi) this.mulaiHitung()
      return
    }
    for (const k of this.kendali) if (k?.milik(p)) k.lepas()
  }

  /** Arah gerak dari tombol yang ditahan (panjang ≤ 1). */
  private arahKeyboard(peta: typeof KEY_P1): Titik {
    const ada = (kode: string[]) => kode.some((k) => this.tombol.has(k))
    const x = (ada(peta.kanan) ? 1 : 0) - (ada(peta.kiri) ? 1 : 0)
    const y = (ada(peta.bawah) ? 1 : 0) - (ada(peta.atas) ? 1 : 0)
    const p = Math.hypot(x, y)
    return p > 0 ? { x: x / p, y: y / p } : { x: 0, y: 0 }
  }

  private bacaKendali(i: number, dt: number) {
    const s = this.status[i]!
    const l = s.logika
    const k = this.kendali[i]
    if (!k) return
    // Keyboard dihaluskan (tombol hanya bisa penuh atau nol).
    const tujuan = this.arahKeyboard(this.split ? (i === 0 ? KEY_P1 : KEY_P2) : KEY_SEMUA)
    const langkah = (LAJU_KEYBOARD * dt) / 1000
    s.kb = { x: s.kb.x + Phaser.Math.Clamp(tujuan.x - s.kb.x, -langkah, langkah), y: s.kb.y + Phaser.Math.Clamp(tujuan.y - s.kb.y, -langkah, langkah) }
    if (k.mode === 'joystick') l.arah = k.vektor()
    else if (k.mode === 'seret' && k.pointerAktif) {
      // Seret: pelari berjalan ke arah jari; makin jauh jari, makin cepat.
      const p = k.pointerAktif
      const d = this.kamera[i]!.getWorldPoint(p.x, p.y)
      const dx = d.x - l.x
      const dy = d.y - OFFSET_Y[i]! - (l.y - TINGGI_SOSOK * 0.45)
      const jarak = Math.hypot(dx, dy)
      const f = jarak < 10 ? 0 : Math.min(1, (jarak - 10) / R_SERET) / jarak
      // Jalan mundur: logika membalik arah, jadi pelari didorong menjauhi jari.
      l.arah = { x: dx * f, y: dy * f }
    } else l.arah = s.kb
  }

  private tekanKeyboard(e: KeyboardEvent) {
    if (this.fase === 'kartu') {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        this.mulaiHitung()
      }
      return
    }
    if (KEY_GERAK.has(e.code)) {
      e.preventDefault()
      this.tombol.add(e.code)
    }
  }

  // ── Putaran ───────────────────────────────────────────────

  private proses(i: number, e: Peristiwa) {
    const v = this.view[i]!
    const s = this.status[i]!
    switch (e.jenis) {
      case 'bentur':
        bunyi.bentur(e.kuat)
        if (this.o.env.gerak) this.kamera[i]!.shake(140, 0.004 + e.kuat * 0.01)
        if (e.kuat > 0.2) v.sorak('Duk!', 'kertas-terang')
        break
      case 'genangan':
        bunyi.ciprat()
        break
      case 'pecah':
        bunyi.pecah()
        v.pecah()
        v.sorak('PECAH!', 'merah-bata')
        this.kendali[i]?.lepas()
        this.tampilPesan(i, 'Balon pecah! Ambil balon baru di START.', 1300)
        break
      case 'baru':
        bunyi.baru()
        v.baru()
        this.arahkanKamera(i, s.logika.x, true)
        this.papan[i]!.setBalon(s.balon + e.balon)
        break
      case 'sampai':
        this.sampai(i)
        break
    }
  }

  private sampai(i: number) {
    const s = this.status[i]!
    const v = this.view[i]!
    s.selesai = true
    s.waktu.push(s.logika.waktu)
    s.balon += s.logika.balon
    this.kendali[i]?.lepas()
    bunyi.sampai()
    v.sampai(LINTASAN.keranjang)
    v.sorak('SAMPAI!', 'cahaya-kelir')
    this.papan[i]!.setWaktu(this.totalTim(i))
    this.papan[i]!.setWaktuAktif(false)
    this.papan[i]!.setTekanan(0, 16)
    if (this.status.every((x) => x.selesai)) this.akhiriPutaran()
    else this.tampilPesan(i, `Sampai! Menunggu P${i === 0 ? 2 : 1}…`, 0)
  }

  /** Bayangan pelari maju bersama waktu putaran (juga sesudah pemain sampai, sampai bayangan tiba). */
  private majuBayangan(dt: number) {
    const v = this.bayangan
    const r = this.rencana
    if (!v || !r) return
    this.tBayangan += dt
    const pos = posBayangan(r, LINTASAN, this.cara.berpasangan, this.tBayangan)
    if (pos.status !== this.statusBayangan) {
      if (pos.status === 'pecah') v.pecah()
      else if (this.statusBayangan === 'pecah') v.baru()
      if (pos.status === 'sampai') v.sampai(LINTASAN.keranjang, false)
      this.statusBayangan = pos.status
    }
    const laju = pos.status === 'jalan' && this.tBayangan > 0 ? 160 : 0
    v.perbarui(pos.pelari, pos.teman, { tekanan: 0, goyang: 0, laju, dt, bawa: pos.status === 'jalan' })
    if (this.fase === 'main') this.papanBayangan?.setBalon(this.balonCpu + pos.balon)
  }

  private gambar(dt: number) {
    const main = this.fase === 'main'
    this.regu.forEach((_, i) => {
      const s = this.status[i]!
      const l = s.logika
      const v = this.view[i]!
      v.perbarui({ x: l.x, y: l.y }, l.teman, { tekanan: l.tekanan, goyang: l.goyang, laju: l.status === 'jalan' ? l.laju : 0, dt, bawa: l.status === 'jalan' })
      this.arahkanKamera(i, l.x, false, dt)
      const papan = this.papan[i]!
      if (main && !s.selesai) {
        papan.setWaktu(this.totalTim(i))
        papan.setTekanan(l.tekanan, dt, l.status === 'jalan')
        s.jedaBahaya -= dt
        if (l.tekanan >= 0.75 && l.status === 'jalan' && s.jedaBahaya <= 0) {
          bunyi.bahaya()
          s.jedaBahaya = 420
        }
      }
      const kemajuan = (x: number) => (x - LINTASAN.start.x) / (LINTASAN.keranjang.x - LINTASAN.start.x)
      if (this.split) {
        const lain = this.status[1 - i]!.logika
        papan.setPeta(kemajuan(l.x), kemajuan(lain.x), this.o.tim[(1 - i) as 0 | 1].warna, false)
      } else {
        const b = this.rencana ? posBayangan(this.rencana, LINTASAN, false, this.tBayangan).pelari.x : null
        papan.setPeta(kemajuan(l.x), b === null ? null : kemajuan(b), 0, true)
      }
      this.kendali[i]?.gambar()
    })
    if (main) this.papanBayangan?.setWaktu(this.totalCpu())
  }

  private akhiriPutaran() {
    if (this.fase !== 'main') return
    this.fase = 'antara'
    this.tombol.clear()
    this.durasi += Math.max(...this.status.map((s) => s.waktu.at(-1) ?? 0))
    const r = this.rencana
    if (r) {
      this.waktuCpu.push(r.waktu)
      this.balonCpu += r.balon
      this.papanBayangan?.setWaktu(this.totalCpu())
    }
    // Ringkasan putaran.
    this.regu.forEach((_, i) => {
      const w0 = this.status[i]!.waktu.at(-1) ?? 0
      let isi = `Putaran ${this.putaran + 1}: ${formatWaktu(w0)}`
      if (r) isi += ` · Bayangan ${formatWaktu(r.waktu)}`
      else isi = `P${i + 1} ${isi}`
      this.tampilPesan(i, isi, JEDA_PUTARAN - 300)
    })
    this.time.delayedCall(JEDA_PUTARAN, () => {
      this.sembunyikanPesan()
      if (this.putaran + 1 < JUMLAH_PUTARAN) {
        this.putaran++
        this.siapkanPutaran()
        this.tampilKartu()
      } else this.akhiriPertandingan()
    })
  }

  // ── Akhir ─────────────────────────────────────────────────

  private akhiriPertandingan() {
    this.fase = 'akhir'
    const o = this.o
    const total: [number, number] = this.split
      ? [this.totalTim(0), this.totalTim(1)]
      : [this.totalTim(0), this.waktuCpu.reduce((a, b) => a + b, 0)]
    const balon: [number, number] = this.split ? [this.status[0]!.balon, this.status[1]!.balon] : [this.status[0]!.balon, this.balonCpu]
    const m = pemenang(total)
    const hasil: GameResult = {
      pemenang: m === null ? null : o.tim[m].pemain,
      skor: Object.fromEntries(o.tim.map((t, i) => [t.pemain.id, m === null ? 1 : m === i ? 2 : 1])),
      keteranganSkor: Object.fromEntries(o.tim.map((t, i) => [t.pemain.id, `${formatWaktu(total[i]!)} · ${balon[i]} balon`])),
      durasiDetik: Math.round(this.durasi / 1000),
    }
    this.tampilHasil(m, total, balon)
    this.time.delayedCall(JEDA_HASIL, () => o.onFinish(hasil))
  }

  private tampilHasil(m: 0 | 1 | null, total: [number, number], balon: [number, number]) {
    const r = this.res
    const lebar = 820
    const tinggi = 340
    const atas = (TINGGI - tinggi) / 2
    const x0 = (LEBAR - lebar) / 2
    const c = this.keUi(this.add.container(0, 0).setDepth(D.kartu))
    c.add(this.add.rectangle(0, 0, LEBAR, TINGGI, w('tinta-gelap'), 0.5).setOrigin(0))
    const g = this.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(x0, atas + 8, lebar, tinggi, 28)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(x0, atas, lebar, tinggi, 28)
    c.add(g)
    c.add(teks(this, LEBAR / 2, atas + 50, m === null ? 'Seri!' : `${NAMA_TIM(this.o.tim[m].pemain)} tercepat!`, { ukuran: 48, warna: 'biru-nila' }, r))
    this.o.tim.forEach((t, i) => {
      const y = atas + 140 + i * 92
      if (m === i) g.fillStyle(w('cahaya-kelir-muda')).fillRoundedRect(x0 + 24, y - 40, lebar - 48, 80, 18)
      c.add(this.add.circle(x0 + 76, y, 30, t.warna).setStrokeStyle(4, w(m === i ? 'kunyit-gelap' : 'kertas-terang')))
      const k = this.add.image(x0 + 76, y + 2, KUNCI.raut(i, 0, 'kepala'))
      k.setScale(52 / k.height)
      c.add(k)
      const nama = teks(this, x0 + 124, y, NAMA_TIM(t.pemain) + (t.manusia ? '' : ' (komputer)'), { ukuran: 32, warna: 'tinta' }, r).setOrigin(0, 0.5)
      if (nama.width > 340) nama.setScale(340 / nama.width)
      c.add(nama)
      c.add(teks(this, x0 + lebar - 220, y, formatWaktu(total[i]!), { ukuran: 38, warna: 'merah-bata' }, r).setOrigin(1, 0.5))
      c.add(teks(this, x0 + lebar - 48, y, `${balon[i]} balon`, { ukuran: 30, warna: 'kayu', judul: false, tebal: 700 }, r).setOrigin(1, 0.5))
    })
    if (this.o.env.gerak) {
      c.setAlpha(0)
      this.tweens.add({ targets: c, alpha: 1, duration: 300 })
    }
  }
}
