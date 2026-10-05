/**
 * Adegan Phaser Gobak Sodor (lapangan tampak atas): kartu ronde, hitungan
 * 3-2-1 + peluit, ronde menyerang/menjaga bergantian, lalu papan hasil akhir.
 * Simulasi ada di aturan.ts (langkah tetap 1/60 detik); adegan ini membaca
 * kendali (joystick, slider sodor, keyboard, ketuk penjaga) dan menggambar.
 */
import * as Phaser from 'phaser'
import { WARNA, warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { audio } from '../../shared/audio/AudioManager'
import { jedakanAdegan, lanjutkanAdegan, type LingkunganPhaser } from '../../shared/phaser/modul'
import { teks } from '../../shared/phaser/teks'
import type { GameResult, Kesulitan, Player } from '../../shared/types'
import { acakBerbenih, LogikaRonde, pemenang, posStart, timPenyerang, type DataPenjaga, type Lapangan, type Peristiwa, type Titik } from './aturan'
import { bunyi } from './bunyi'
import {
  JAGA_CPU,
  JAGA_MANUSIA,
  JAGA_TEMAN,
  JEDA_GUGUR,
  JEDA_HASIL,
  JEDA_POIN,
  LAMA_HITUNG,
  LAMA_RONDE,
  RONDE_PER_TIM,
  SERANG_CPU,
} from './config'
import { Joystick, SliderSodor, type Kotak } from './Kendali'
import { PanelTim } from './PanelTim'
import { SosokView } from './SosokView'
import type { Anggota, Raut } from './tekstur'
import { KENDALI_ATAS, LEBAR, PANEL_LEBAR, TEPI_ATAS, TEPI_BAWAH, TINGGI, panelX } from './tata'

export const KUNCI = {
  latar: 'gs-latar',
  raut: (tim: number, i: number, r: Raut) => `gs-t${tim}-a${i}-${r}`,
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
  lap: Lapangan
  env: LingkunganPhaser
  kanvas: Map<string, HTMLCanvasElement>
  onFinish(hasil: GameResult): void
}

type Fase = 'kartu' | 'hitung' | 'main' | 'antara' | 'akhir'

/** Kedalaman: lapangan < tulisan zona < siswa (= y) < UI. */
const D = { latar: 0, zona: 1, ui: 1000, seru: 1500, kartu: 2000 }

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

const NAMA_TIM = (p: Player) => `Tim ${p.nama}`

export class AdeganGobakSodor extends Phaser.Scene {
  private o: OpsiAdegan
  private res: number
  private fase: Fase = 'kartu'
  private dijeda = false
  private ronde = 0
  private readonly jumlahRonde = RONDE_PER_TIM * 2
  private poin: [number, number] = [0, 0]
  private logika: LogikaRonde | null = null
  /** Anggota tim penjaga untuk penjaga logika ke-k (garis 0…n−1, lalu sodor). */
  private anggotaJaga: number[] = []
  private sosok: [SosokView[], SosokView[]] = [[], []]
  private panel!: [PanelTim, PanelTim]
  private joystick!: [Joystick, Joystick]
  private slider: [SliderSodor | null, SliderSodor | null] = [null, null]
  private petunjuk!: Phaser.GameObjects.Text
  private info!: Phaser.GameObjects.Text
  private infoLatar!: Phaser.GameObjects.Rectangle
  private seru!: Phaser.GameObjects.Text
  private pesan!: Phaser.GameObjects.Container
  private pesanTeks!: Phaser.GameObjects.Text
  private kartu: Phaser.GameObjects.Container | null = null
  private tombol = new Set<string>()
  private detikTampil = -1
  private durasi = 0
  private acak = acakBerbenih(Math.floor(Math.random() * 2 ** 31))

  constructor(o: OpsiAdegan) {
    super('gobak-sodor')
    this.o = o
    this.res = o.env.resolusi
  }

  private get lap() {
    return this.o.lap
  }

  private get split() {
    return this.o.mode === 'split'
  }

  /** Tim yang menyerang / menjaga di ronde ini. */
  private get serang(): 0 | 1 {
    return timPenyerang(this.ronde)
  }

  private get jaga(): 0 | 1 {
    return this.serang === 0 ? 1 : 0
  }

  /** Mode komputer: pemain sedang menjaga (mengendalikan satu penjaga). */
  private get pemainMenjaga() {
    return !this.split && this.jaga === 0
  }

  // ── Siklus hidup ──────────────────────────────────────────

  create() {
    const o = this.o
    for (const [kunci, kanvas] of o.kanvas) if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    this.cameras.main.setZoom(this.res).centerOn(LEBAR / 2, TINGGI / 2)
    // PID: dua pemain bersamaan (joystick + slider), masing-masing satu jari, plus cadangan.
    this.input.addPointer(4)

    this.add.image(0, 0, KUNCI.latar).setOrigin(0).setScale(1 / this.res).setDepth(D.latar)
    const zona = (y: number, isi: string) =>
      teks(this, this.lap.tengahX, y, isi, { ukuran: 36, warna: 'kayu', tebal: 800 }, this.res).setAlpha(0.5).setDepth(D.zona)
    zona((TEPI_ATAS + this.lap.garisY[this.lap.garisY.length - 1]!) / 2, 'UJUNG')
    zona(TEPI_BAWAH - 22, 'START')

    this.buatSosok()
    this.panel = [0, 1].map(
      (i) =>
        new PanelTim(
          this,
          i as 0 | 1,
          NAMA_TIM(o.tim[i]!.pemain),
          o.tim[i]!.warna,
          o.tim[i]!.anggota.map((_, a) => KUNCI.raut(i, a, 'kepala')),
          this.res,
        ),
    ) as [PanelTim, PanelTim]
    const kotak = (sisi: 0 | 1): Kotak => ({ x0: panelX(sisi), y0: KENDALI_ATAS, lebar: PANEL_LEBAR, tinggi: TINGGI - KENDALI_ATAS })
    this.joystick = [0, 1].map((i) => new Joystick(this, kotak(i as 0 | 1), o.tim[i]!.warna, this.res)) as [Joystick, Joystick]
    if (this.split) {
      this.slider = [0, 1].map(
        (i) => new SliderSodor(this, kotak(i as 0 | 1), o.tim[i]!.warna, this.res, [this.lap.garisY.at(-1)!, this.lap.garisY[0]!], this.lap.garisY),
      ) as [SliderSodor, SliderSodor]
    }
    this.petunjuk = teks(this, panelX(1) + PANEL_LEBAR / 2, KENDALI_ATAS + 16, '', { ukuran: 30, warna: 'kertas-terang', garis: 'tinta-gelap', tebalGaris: 6 }, this.res)
      .setOrigin(0.5, 0)
      .setDepth(D.ui)
      .setLineSpacing(2)

    this.infoLatar = this.add.rectangle(LEBAR / 2, 30, 300, 48, w('tinta-gelap'), 0.78).setDepth(D.ui)
    this.info = teks(this, LEBAR / 2, 31, '', { ukuran: 30 }, this.res).setDepth(D.ui)
    this.seru = teks(this, LEBAR / 2, TINGGI / 2 - 20, '', { ukuran: 110, warna: 'merah-bata', garis: 'kertas-terang', tebalGaris: 12 }, this.res)
      .setDepth(D.seru)
      .setAlpha(0)
    this.pesan = this.add.container(LEBAR / 2, TINGGI / 2 - 40).setDepth(D.seru).setVisible(false)
    this.pesanTeks = teks(this, 0, 0, '', { ukuran: 44, warna: 'kertas-terang' }, this.res)
    this.pesan.add([this.add.rectangle(0, 0, 10, 80, w('tinta-gelap'), 0.82), this.pesanTeks])

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      audio.buka()
      this.ketukLapangan(p)
    })
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.tekanKeyboard(e))
    this.input.keyboard?.on('keyup', (e: KeyboardEvent) => this.tombol.delete(e.code))

    this.siapkanRonde()
    this.tampilKartu()
    if (this.dijeda) this.jeda()
  }

  update(_waktu: number, delta: number) {
    const dt = Math.min(delta, 100)
    const l = this.logika
    if (!l) return
    if (this.fase === 'main') {
      this.bacaKendali(l)
      const ev = l.maju(dt)
      for (const e of ev) this.proses(e)
    }
    this.gambarRonde(l, dt)
  }

  jeda() {
    this.dijeda = true
    // Jari/tombol yang ditahan bisa lepas tanpa terbaca selama jeda.
    this.tombol.clear()
    this.joystick?.forEach((j) => j.lepas())
    this.slider.forEach((s) => s?.lepas())
    jedakanAdegan(this)
  }

  lanjut() {
    this.dijeda = false
    lanjutkanAdegan(this)
  }

  // ── Persiapan ─────────────────────────────────────────────

  private buatSosok() {
    const o = this.o
    o.tim.forEach((t, i) => {
      this.sosok[i] = t.anggota.map(
        (_, a) =>
          new SosokView(
            this,
            { serang: KUNCI.raut(i, a, 'serang'), jaga: KUNCI.raut(i, a, 'jaga'), kaget: KUNCI.raut(i, a, 'kaget') },
            t.warna,
            { res: this.res, gerak: o.env.gerak },
          ),
      )
    })
  }

  /** Tempat menunggu penyerang ke-a di zona START (pojok kiri & kanan). */
  private tempatTunggu(a: number): Titik {
    const { x0, x1 } = this.lap
    const y = TEPI_BAWAH - 14
    const posisi = [x0 + 34, x1 - 34, x0 + 84, x1 - 84, x0 + 134, x1 - 134]
    return { x: posisi[a % posisi.length]!, y }
  }

  /** Susun logika, siswa, dan kendali untuk ronde ini. */
  private siapkanRonde() {
    const o = this.o
    const lap = this.lap
    const s = this.serang
    const j = this.jaga
    const n = lap.garisY.length
    // Ketua tim (anggota 0) menjadi sodor; anggota lain menjaga garis 0…n−1.
    this.anggotaJaga = lap.sodor ? [...Array.from({ length: n }, (_, g) => g + 1), 0] : Array.from({ length: n }, (_, g) => g)
    const indeksSodor = lap.sodor ? n : -1
    const pilihanAwal = lap.sodor ? indeksSodor : 0
    const penjaga: DataPenjaga[] = this.anggotaJaga.map((_, k) => {
      const jenis = k === indeksSodor ? 'sodor' : 'garis'
      const garis = jenis === 'sodor' ? -1 : k
      let manusia = false
      if (this.split) manusia = k === pilihanAwal
      else if (j === 0) manusia = k === pilihanAwal
      const profil = manusia ? JAGA_MANUSIA : j === 0 ? JAGA_TEMAN[o.kesulitan] : JAGA_CPU[o.kesulitan]
      return { jenis, garis, profil, manusia }
    })
    this.logika = new LogikaRonde({
      lap,
      nPenyerang: o.tim[s].anggota.length,
      penjaga,
      otak: !this.split && s === 1 ? SERANG_CPU[o.kesulitan] : null,
      lamaRonde: LAMA_RONDE,
      jedaGugur: JEDA_GUGUR,
      jedaPoin: JEDA_POIN,
      acak: this.acak,
    })

    // Siswa: tim penyerang di START, tim penjaga di garisnya.
    const l = this.logika
    this.sosok[s].forEach((v, a) => {
      v.pulihkan()
      v.setPeran('serang')
      v.setTanda(null)
      const p = a === 0 ? posStart(lap) : this.tempatTunggu(a)
      v.setPos(p.x, p.y)
    })
    this.sosok[j].forEach((v) => {
      v.pulihkan()
      v.setPeran('jaga')
      v.setTanda(null)
      v.setTampil(false)
    })
    l.penjaga.forEach((p, k) => {
      const v = this.sosok[j][this.anggotaJaga[k]!]!
      v.setTampil(true)
      v.setPos(p.x, p.y)
    })
    this.perbaruiTanda()

    this.panel[s].setPeran('MENYERANG')
    this.panel[s].setWarnaPeran(WARNA['merah-bata'])
    this.panel[j].setPeran('MENJAGA')
    this.panel[j].setWarnaPeran(WARNA['biru-nila'])
    this.panel.forEach((pn, i) => {
      pn.setPoin(this.poin[i]!)
      o.tim[i]!.anggota.forEach((_, a) => pn.setAnggota(a, i === s ? (a === 0 ? 'main' : 'tunggu') : 'biasa'))
    })

    // Kendali: joystick di sisi tim yang dikendalikan pemain; Duel: slider sodor di sisi penjaga.
    const kb = o.env.keyboard
    if (this.split) {
      this.joystick[s].setTampil(true)
      this.joystick[s].setSumbu('xy')
      this.joystick[s].setLabel(`P${s + 1} · Penyerang`)
      this.joystick[j].setTampil(false)
      this.slider[s]?.setTampil(false)
      this.slider[j]?.setTampil(true)
      this.slider[j]?.setLabel(`P${j + 1} · Sodor`)
      this.slider[j]?.batal()
      this.petunjuk.setVisible(false)
    } else {
      this.joystick[0].setTampil(true)
      this.joystick[1].setTampil(false)
      this.joystick[0].setLabel(s === 0 ? 'Gerak' : 'Gerak penjaga')
      this.joystick[0].setSumbu(s === 0 ? 'xy' : this.sumbuPilihan())
      this.petunjuk.setVisible(true)
      this.petunjuk.setText(
        s === 0
          ? 'Lewati semua\ngaris sampai\nUJUNG, lalu\npulang ke START.' + (kb ? '\n\nPanah / WASD' : '')
          : 'Kejar penyerang\ndi garismu.\nKetuk penjaga\nlain untuk pindah.' + (kb ? '\n\nSpasi: pindah' : ''),
      )
    }
    this.detikTampil = -1
    this.tulisInfo(l)
  }

  private sumbuPilihan() {
    const p = this.logika?.penjaga.find((x) => x.manusia)
    return p?.jenis === 'sodor' ? 'y' : 'x'
  }

  /** Tanda "KAMU"/"P1"/"P2" di atas siswa yang dikendalikan pemain. */
  private perbaruiTanda() {
    const l = this.logika
    if (!l) return
    const s = this.serang
    const j = this.jaga
    const label = (tim: number) => (this.split ? `P${tim + 1}` : 'KAMU')
    const penyerangManusia = this.split || s === 0
    this.sosok[s].forEach((v, a) => v.setTanda(penyerangManusia && a === l.aktif ? label(s) : null))
    l.penjaga.forEach((p, k) => this.sosok[j][this.anggotaJaga[k]!]!.setTanda(p.manusia ? label(j) : null))
  }

  // ── Kartu ronde & hitungan ────────────────────────────────

  private tampilKartu() {
    this.fase = 'kartu'
    const r = this.res
    const o = this.o
    const s = this.serang
    const j = this.jaga
    const c = this.add.container(0, 0).setDepth(D.kartu)
    this.kartu = c
    c.add(this.add.rectangle(0, 0, LEBAR, TINGGI, w('tinta-gelap'), 0.6).setOrigin(0).setInteractive())
    const bg = this.add.graphics()
    const isi = this.add.container(0, 0)
    c.add([bg, isi])
    const tengah = LEBAR / 2
    let y = 28
    const baris = (t: string, ukuran: number, warna: NamaWarna, sela: number, tebal = 700) => {
      const x = teks(this, tengah, y, t, { ukuran, warna, judul: false, tebal }, r).setOrigin(0.5, 0)
      x.setWordWrapWidth(820)
      isi.add(x)
      y += x.height + sela
    }
    const judul = this.ronde === 0 ? 'Siap main gobak sodor?' : `Ronde ${this.ronde + 1} dari ${this.jumlahRonde}`
    isi.add(teks(this, tengah, y, judul, { ukuran: 48, warna: 'biru-nila' }, r).setOrigin(0.5, 0))
    y += 70
    if (this.ronde > 0) baris('Peran bertukar!', 34, 'merah-bata', 6, 800)
    baris(`${NAMA_TIM(o.tim[s].pemain)} menyerang · ${NAMA_TIM(o.tim[j].pemain)} menjaga`, 30, 'tinta', 10, 800)
    if (this.split) {
      baris(`P${s + 1}: joystick di sisimu menggerakkan penyerang. Lewati semua garis sampai UJUNG, lalu pulang ke START = 1 poin.`, 30, 'tinta', 6, 600)
      baris(`P${j + 1}: geser slider di sisimu untuk menggerakkan sodor di garis tengah. Sentuh penyerangnya!`, 30, 'tinta', 8, 600)
    } else if (s === 0) {
      baris('Gerakkan penyerangmu melewati semua garis sampai UJUNG, lalu pulang ke START = 1 poin.', 30, 'tinta', 6, 600)
      baris('Tersentuh penjaga = gugur, penyerang berikutnya masuk.', 30, 'merah-bata', 8, 700)
    } else {
      baris('Kamu mengendalikan penjaga bertanda KAMU. Penjaga hanya bisa bergerak di garisnya.', 30, 'tinta', 6, 600)
      baris('Ketuk penjaga lain untuk pindah. Sentuh penyerang sebelum mereka pulang!', 30, 'tinta', 8, 600)
    }
    if (o.env.keyboard) {
      const kb = this.split
        ? `Keyboard: P1 W A S D · P2 tombol panah`
        : s === 0
          ? 'Keyboard: panah / W A S D'
          : 'Keyboard: panah / W A S D · Spasi pindah penjaga'
      baris(kb, 30, 'kayu', 6)
    }
    baris(`${o.tim[s].anggota.length} penyerang · ${LAMA_RONDE / 1000} detik`, 30, 'kayu', 8)

    const by = y + 6
    const tombol = this.add.graphics()
    tombol.fillStyle(w('kunyit-gelap')).fillRoundedRect(tengah - 170, by + 6, 340, 84, 26)
    tombol.fillStyle(w('kunyit')).fillRoundedRect(tengah - 170, by, 340, 84, 26)
    isi.add(tombol)
    isi.add(teks(this, tengah, by + 42, 'Mulai!', { ukuran: 44, warna: 'kayu-gelap' }, r))
    const zona = this.add.zone(tengah - 170, by, 340, 90).setOrigin(0).setInteractive()
    zona.on('pointerup', () => this.mulaiHitung())
    isi.add(zona)

    const tinggi = by + 90 + 24
    const atas = Math.max(8, (TINGGI - tinggi) / 2)
    isi.y = atas
    bg.fillStyle(w('kayu-gelap')).fillRoundedRect(tengah - 460, atas + 8, 920, tinggi, 28)
    bg.fillStyle(w('kertas-krem')).fillRoundedRect(tengah - 460, atas, 920, tinggi, 28)
  }

  private mulaiHitung() {
    if (this.fase !== 'kartu') return
    audio.buka()
    this.kartu?.destroy()
    this.kartu = null
    this.fase = 'hitung'
    const angka = ['3', '2', '1']
    angka.forEach((a, i) =>
      this.time.delayedCall(200 + i * LAMA_HITUNG, () => {
        this.tampilSeru(a, 'merah-bata')
        bunyi.hitung()
      }),
    )
    this.time.delayedCall(200 + angka.length * LAMA_HITUNG, () => {
      this.tampilSeru('PRIIT!', 'daun-pisang-gelap')
      bunyi.mulai()
      this.fase = 'main'
    })
  }

  private tampilSeru(isi: string, warna: NamaWarna) {
    const s = this.seru
    this.tweens.killTweensOf(s)
    s.setText(isi).setColor(WARNA[warna]).setAlpha(1).setScale(1)
    if (this.o.env.gerak) {
      s.setScale(1.35)
      this.tweens.add({ targets: s, scale: 1, duration: 160, ease: 'Back.easeOut' })
    }
    this.tweens.add({ targets: s, alpha: 0, delay: LAMA_HITUNG * 0.6, duration: LAMA_HITUNG * 0.35 })
  }

  private tampilPesan(isi: string, lama: number) {
    this.pesanTeks.setText(isi)
    const latar = this.pesan.getAt(0) as Phaser.GameObjects.Rectangle
    latar.setSize(this.pesanTeks.width + 56, 80).setOrigin(0.5)
    this.pesan.setVisible(true).setAlpha(1)
    this.tweens.killTweensOf(this.pesan)
    this.tweens.add({ targets: this.pesan, alpha: 0, delay: lama, duration: 300, onComplete: () => this.pesan.setVisible(false) })
  }

  // ── Kendali ───────────────────────────────────────────────

  /** Arah gerak dari tombol yang ditahan (panjang ≤ 1). */
  private arahKeyboard(peta: typeof KEY_P1): Titik {
    const ada = (kode: string[]) => kode.some((k) => this.tombol.has(k))
    const x = (ada(peta.kanan) ? 1 : 0) - (ada(peta.kiri) ? 1 : 0)
    const y = (ada(peta.bawah) ? 1 : 0) - (ada(peta.atas) ? 1 : 0)
    const p = Math.hypot(x, y)
    return p > 0 ? { x: x / p, y: y / p } : { x: 0, y: 0 }
  }

  /** Kendali pemain di sisi `tim`: joystick jika disentuh, selain itu keyboard. */
  private arahPemain(tim: 0 | 1): Titik {
    const j = this.joystick[tim]
    if (j.aktif) return j.vektor
    return this.arahKeyboard(this.split ? (tim === 0 ? KEY_P1 : KEY_P2) : KEY_SEMUA)
  }

  private bacaKendali(l: LogikaRonde) {
    const s = this.serang
    const j = this.jaga
    if (this.split || s === 0) l.joystick = this.arahPemain(s)
    for (const p of l.penjaga) {
      if (!p.manusia) continue
      if (this.split) {
        const slider = this.slider[j]
        const kb = this.arahKeyboard(j === 0 ? KEY_P1 : KEY_P2)
        if (kb.y !== 0) {
          slider?.batal()
          p.tujuan = null
          p.arah = kb.y
        } else {
          p.tujuan = slider?.tujuan ?? null
          p.arah = 0
        }
      } else {
        const v = this.arahPemain(0)
        p.arah = p.jenis === 'sodor' ? v.y : v.x
        p.tujuan = null
      }
    }
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
      return
    }
    if (!this.pemainMenjaga || (this.fase !== 'main' && this.fase !== 'hitung')) return
    const l = this.logika
    if (!l) return
    if (e.code === 'Space' || e.code === 'Tab') {
      e.preventDefault()
      if (e.repeat) return
      const k = l.penjaga.findIndex((p) => p.manusia)
      this.pilihJaga((k + 1) % l.penjaga.length)
    } else if (/^Digit[1-9]$/.test(e.code)) {
      // 1…n = garis dari START ke UJUNG, angka berikutnya = sodor.
      const k = Number(e.code.slice(5)) - 1
      if (k < l.penjaga.length) this.pilihJaga(k)
    }
  }

  /** Mode komputer, ronde menjaga: ketuk penjaga di lapangan untuk mengendalikannya. */
  private ketukLapangan(p: Phaser.Input.Pointer) {
    if (!this.pemainMenjaga || (this.fase !== 'main' && this.fase !== 'hitung')) return
    const l = this.logika
    if (!l) return
    const t = this.cameras.main.getWorldPoint(p.x, p.y)
    if (t.x < this.lap.x0 - 50 || t.x > this.lap.x1 + 50) return
    // Titik tengah badan (± 40 px di atas kaki) paling dekat dengan ketukan.
    let terbaik = -1
    let jarak = 110
    l.penjaga.forEach((g, k) => {
      const d = Math.hypot(t.x - g.x, t.y - (g.y - 40))
      if (d < jarak) {
        jarak = d
        terbaik = k
      }
    })
    if (terbaik >= 0) this.pilihJaga(terbaik)
  }

  private pilihJaga(k: number) {
    const l = this.logika
    if (!l) return
    const baru = l.penjaga[k]
    if (!baru || baru.manusia) return
    for (const p of l.penjaga) {
      if (!p.manusia) continue
      p.manusia = false
      p.profil = JAGA_TEMAN[this.o.kesulitan]
      p.arah = 0
      p.tujuan = null
    }
    baru.manusia = true
    baru.profil = JAGA_MANUSIA
    this.joystick[0].setSumbu(baru.jenis === 'sodor' ? 'y' : 'x')
    this.perbaruiTanda()
    bunyi.pilih()
  }

  // ── Ronde ─────────────────────────────────────────────────

  private proses(e: Peristiwa) {
    const s = this.serang
    const j = this.jaga
    const tim = this.sosok[s]
    switch (e.jenis) {
      case 'lewat':
        bunyi.lewat()
        break
      case 'ujung':
        tim[e.penyerang]!.sorak('PULANG!', 'cahaya-kelir')
        bunyi.ujung()
        break
      case 'poin': {
        this.poin[s]++
        this.panel[s].setPoin(this.poin[s])
        this.panel[s].setAnggota(e.penyerang, 'tunggu')
        const v = tim[e.penyerang]!
        v.sorak('+1 POIN!', 'cahaya-kelir')
        v.setTanda(null)
        const t = this.tempatTunggu(e.penyerang)
        v.jalanKe(t.x, t.y, JEDA_POIN * 0.8)
        bunyi.poin()
        this.majukanBerikut(e.berikut, JEDA_POIN)
        break
      }
      case 'kena': {
        tim[e.penyerang]!.gugur(JEDA_GUGUR * 0.8)
        this.panel[s].setAnggota(e.penyerang, 'gugur')
        this.sosok[j][this.anggotaJaga[e.penjaga]!]!.sorak('KENA!', 'merah-bata')
        bunyi.kena()
        this.majukanBerikut(e.berikut, JEDA_GUGUR)
        break
      }
      case 'masuk':
        this.panel[s].setAnggota(e.penyerang, 'main')
        this.perbaruiTanda()
        break
      case 'selesai':
        this.akhiriRonde(e.sebab)
        break
    }
  }

  /** Penyerang berikutnya berjalan dari tempat tunggu ke START selama pergantian. */
  private majukanBerikut(berikut: number | null, jeda: number) {
    if (berikut === null) return
    const v = this.sosok[this.serang][berikut]!
    const p = posStart(this.lap)
    // Yang baru dapat poin dan langsung masuk lagi: tunggu sampai ia tiba di tempat tunggunya.
    this.time.delayedCall(jeda * 0.15, () => v.jalanKe(p.x, p.y, jeda * 0.75))
  }

  private gambarRonde(l: LogikaRonde, dt: number) {
    const s = this.serang
    const j = this.jaga
    const a = l.penyerangAktif
    if (a && l.aktif !== null) {
      const v = this.sosok[s][l.aktif]!
      v.setPos(a.x, a.y)
      v.ayun(a.laju, dt)
    }
    l.penjaga.forEach((p, k) => {
      const v = this.sosok[j][this.anggotaJaga[k]!]!
      v.setPos(p.x, p.y)
      v.ayun(Math.abs(p.laju), dt)
      if (p.jenis === 'sodor') this.slider[j]?.setPosisi(p.y)
    })
    this.tulisInfo(l)
  }

  private tulisInfo(l: LogikaRonde) {
    const detik = Math.ceil(l.sisaWaktu / 1000)
    if (detik === this.detikTampil) return
    this.detikTampil = detik
    const mm = Math.floor(detik / 60)
    const ss = String(detik % 60).padStart(2, '0')
    this.info.setText(`Ronde ${this.ronde + 1}/${this.jumlahRonde} · ${mm}:${ss}`)
    this.info.setColor(WARNA[detik <= 10 && this.fase === 'main' ? 'cahaya-kelir' : 'kertas-terang'])
    this.infoLatar.setSize(this.info.width + 36, 48).setOrigin(0.5)
  }

  private akhiriRonde(sebab: 'gugur' | 'waktu') {
    if (this.fase !== 'main') return
    this.fase = 'antara'
    const l = this.logika!
    this.durasi += l.waktu
    this.joystick.forEach((j) => j.lepas())
    this.slider.forEach((x) => x?.lepas())
    this.tombol.clear()
    bunyi.akhir()
    const s = this.serang
    const dapat = l.poin
    const judul = sebab === 'waktu' ? 'Waktu habis!' : 'Semua penyerang tersentuh!'
    this.tampilPesan(`${judul}  ${NAMA_TIM(this.o.tim[s].pemain)} +${dapat} poin`, 1900)
    this.time.delayedCall(2400, () => {
      if (this.ronde + 1 < this.jumlahRonde) {
        this.ronde++
        this.siapkanRonde()
        this.tampilKartu()
      } else this.akhiriPertandingan()
    })
  }

  // ── Akhir ─────────────────────────────────────────────────

  private akhiriPertandingan() {
    this.fase = 'akhir'
    const o = this.o
    const m = pemenang(this.poin)
    const hasil: GameResult = {
      pemenang: m === null ? null : o.tim[m].pemain,
      skor: Object.fromEntries(o.tim.map((t, i) => [t.pemain.id, this.poin[i]!])),
      keteranganSkor: Object.fromEntries(o.tim.map((t, i) => [t.pemain.id, `${this.poin[i]} poin`])),
      durasiDetik: Math.round(this.durasi / 1000),
    }
    this.tampilHasil(m)
    this.time.delayedCall(JEDA_HASIL, () => o.onFinish(hasil))
  }

  private tampilHasil(m: 0 | 1 | null) {
    const r = this.res
    const lebar = 760
    const tinggi = 330
    const atas = (TINGGI - tinggi) / 2
    const x0 = (LEBAR - lebar) / 2
    const c = this.add.container(0, 0).setDepth(D.kartu)
    c.add(this.add.rectangle(0, 0, LEBAR, TINGGI, w('tinta-gelap'), 0.5).setOrigin(0).setInteractive())
    const g = this.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(x0, atas + 8, lebar, tinggi, 28)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(x0, atas, lebar, tinggi, 28)
    c.add(g)
    c.add(teks(this, LEBAR / 2, atas + 50, m === null ? 'Seri!' : `${NAMA_TIM(this.o.tim[m].pemain)} menang!`, { ukuran: 48, warna: 'biru-nila' }, r))
    this.o.tim.forEach((t, i) => {
      const y = atas + 140 + i * 88
      if (m === i) g.fillStyle(w('cahaya-kelir-muda')).fillRoundedRect(x0 + 24, y - 38, lebar - 48, 76, 18)
      c.add(this.add.circle(x0 + 76, y, 30, t.warna).setStrokeStyle(4, w(m === i ? 'kunyit-gelap' : 'kertas-terang')))
      const k = this.add.image(x0 + 76, y + 2, KUNCI.raut(i, 0, 'kepala'))
      k.setScale(52 / k.height)
      c.add(k)
      const nama = teks(this, x0 + 124, y, NAMA_TIM(t.pemain) + (t.manusia ? '' : ' (komputer)'), { ukuran: 32, warna: 'tinta' }, r).setOrigin(0, 0.5)
      if (nama.width > 420) nama.setScale(420 / nama.width)
      c.add(nama)
      c.add(teks(this, x0 + lebar - 48, y, `${this.poin[i]} poin`, { ukuran: 36, warna: 'merah-bata' }, r).setOrigin(1, 0.5))
    })
    if (this.o.env.gerak) {
      c.setAlpha(0)
      this.tweens.add({ targets: c, alpha: 1, duration: 300 })
    }
  }
}
