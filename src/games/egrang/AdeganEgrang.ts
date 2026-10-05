/**
 * Adegan Phaser lomba Egrang (tampak samping): kartu siap, hitungan 3-2-1,
 * empat pelari di lintasan berpagar sampai finis, lalu papan urutan finis.
 * Waktu lomba memakai jam performance.now() yang bisa dijeda (bukan hitungan
 * frame), supaya irama langkah dinilai sama di HP 30 fps maupun laptop 60 fps.
 */
import * as Phaser from 'phaser'
import { hexKeAngka, WARNA, warnaAngka as w, type NamaWarna } from '../../app/tokens'
import { audio } from '../../shared/audio/AudioManager'
import { jedakanAdegan, lanjutkanAdegan, type LingkunganPhaser } from '../../shared/phaser/modul'
import { teks } from '../../shared/phaser/teks'
import type { GameResult, Kesulitan, Player } from '../../shared/types'
import { acakBerbenih, LogikaPelari, OtakCpu, urutkan, type Kaki, type Peristiwa } from './aturan'
import { bunyi } from './bunyi'
import { BATAS_SUSUL, CPU, JEDA_HASIL, LAMA_HITUNG, POS_MUDAH, type Rintangan } from './config'
import { SensorMiring } from './miring'
import { PanelKontrol, type Aksi } from './PanelKontrol'
import { PelariView } from './PelariView'
import { SPANDUK_ATAS, type Raut } from './tekstur'
import { FINIS_X, LEBAR, START_X, TANDA_X, TINGGI, kolom, lajur, xMeter } from './tata'

export const KUNCI = {
  latar: 'egrang-latar',
  raut: (i: number, r: Raut) => `egrang-p${i}-${r}`,
}

export interface OpsiAdegan {
  mode: 'cpu' | 'split'
  pemain: Player[]
  kesulitan: Kesulitan
  rintangan: readonly Rintangan[]
  env: LingkunganPhaser
  kanvas: Map<string, HTMLCanvasElement>
  /** Pilihan kendali miring HP terakhir (diingat saat "Ulang dari awal"). */
  miringAwal: boolean
  simpanMiring(v: boolean): void
  onFinish(hasil: GameResult): void
}

interface Pelari {
  pemain: Player
  manusia: boolean
  warna: number
  logika: LogikaPelari
  view: PelariView
  otak?: OtakCpu
  panel?: PanelKontrol
  urutan: number | null
}

type Fase = 'siap' | 'hitung' | 'lomba' | 'akhir'

/** Tombol keyboard per kolom pemain (Duel Satu Layar). Satu pemain: A/←, S/→, W/↑/Spasi. */
const KEYBOARD_KOLOM: [string[], string[], string[]][] = [
  [['KeyA'], ['KeyS'], ['KeyW']],
  [['KeyK'], ['KeyL'], ['KeyO']],
  [['ArrowLeft'], ['ArrowRight'], ['ArrowUp']],
  [['Numpad4'], ['Numpad6'], ['Numpad8']],
]
const HURUF_KOLOM: Record<Aksi, string>[] = [
  { kiri: 'A', kanan: 'S', tahan: 'W' },
  { kiri: 'K', kanan: 'L', tahan: 'O' },
  { kiri: '←', kanan: '→', tahan: '↑' },
  { kiri: '4', kanan: '6', tahan: '8' },
]

const angka = (n: number, digit = 1) => n.toLocaleString('id-ID', { maximumFractionDigits: digit })

export class AdeganEgrang extends Phaser.Scene {
  private o: OpsiAdegan
  private res: number
  private fase: Fase = 'siap'
  private pelari: Pelari[] = []
  /** Pelari manusia menurut kolom kontrol (kiri → kanan). */
  private manusia: Pelari[] = []
  private peta = new Map<string, [number, Aksi]>()
  private jamAsal = 0
  private jedaSejak: number | null = null
  private dijeda = false
  private hitungTampil = 99
  private jumlahFinis = 0
  private tSusul: number | null = null
  private seru!: Phaser.GameObjects.Text
  private pesan!: Phaser.GameObjects.Container
  private pesanTeks!: Phaser.GameObjects.Text
  private panelSiap: Phaser.GameObjects.Container | null = null
  private pakaiMiring = false
  private sensor: SensorMiring | null = null

  constructor(o: OpsiAdegan) {
    super('egrang')
    this.o = o
    this.res = o.env.resolusi
  }

  private sekarang() {
    return (this.jedaSejak ?? performance.now()) - this.jamAsal
  }

  // ── Siklus hidup ──────────────────────────────────────────

  create() {
    const o = this.o
    for (const [kunci, kanvas] of o.kanvas) if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    this.cameras.main.setZoom(this.res).centerOn(LEBAR / 2, TINGGI / 2)
    // PID: sampai 4 pemain, masing-masing bisa memakai dua jari.
    this.input.addPointer(9)

    this.add.image(0, 0, KUNCI.latar).setOrigin(0).setScale(1 / this.res)
    this.buatPapanLintasan()
    this.buatPelari()
    this.buatPanel()

    this.seru = teks(this, LEBAR / 2, 132, '', { ukuran: 96, warna: 'merah-bata', garis: 'kertas-terang', tebalGaris: 12 }, this.res)
      .setDepth(65)
      .setAlpha(0)
    this.pesan = this.add.container(LEBAR / 2, 38).setDepth(65).setVisible(false)
    this.pesanTeks = teks(this, 0, 0, '', { ukuran: 30 }, this.res)
    this.pesan.add([this.add.rectangle(0, 0, 10, 50, w('tinta-gelap'), 0.78), this.pesanTeks])

    this.input.on('pointerdown', () => audio.buka())
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.manusia.forEach((m) => m.panel?.lepasPointer(p.id)))
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.manusia.forEach((m) => m.panel?.lepasPointer(p.id)))
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.tombolKeyboard(e, true))
    this.input.keyboard?.on('keyup', (e: KeyboardEvent) => this.tombolKeyboard(e, false))
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sensor?.berhenti())
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.sensor?.berhenti())

    this.pakaiMiring = o.miringAwal && this.bolehMiring()
    this.tampilPanelSiap()
    if (this.dijeda) this.jeda()
  }

  update(waktu: number, delta: number) {
    const dt = Math.min(delta, 100)
    const t = this.sekarang()
    if (this.fase === 'hitung') this.updateHitung(t)
    if (this.fase === 'lomba') {
      this.pelari.forEach((p, i) => {
        if (this.fase !== 'lomba') return
        if (p.otak) this.proses(i, p.otak.jalan(t), t)
        else {
          if (this.sensor && p === this.manusia[0]) p.logika.kemudi = this.sensor.nilai()
          this.proses(i, p.logika.lanjut(t), t)
        }
        const l = p.logika
        p.panel?.update(l.miring, l.ditahan, l.langkahTerakhir === null ? null : t - l.langkahTerakhir)
      })
      const semuaFinis = this.pelari.every((p) => p.urutan !== null)
      if (this.fase === 'lomba' && (semuaFinis || (this.tSusul !== null && t >= this.tSusul))) this.akhiri(t)
    }
    for (const p of this.pelari) p.view.update(dt, p.logika.status === 'jalan' ? p.logika.miring : 0, waktu)
  }

  jeda() {
    this.dijeda = true
    this.jedaSejak ??= performance.now()
    // Jari/tombol yang ditahan bisa lepas tanpa terbaca selama jeda.
    for (const m of this.manusia) m.panel?.lepasSemua()
    jedakanAdegan(this)
  }

  lanjut() {
    this.dijeda = false
    if (this.jedaSejak !== null) {
      this.jamAsal += performance.now() - this.jedaSejak
      this.jedaSejak = null
    }
    lanjutkanAdegan(this)
    // Cara memegang HP bisa berubah selama jeda.
    this.sensor?.kalibrasi()
  }

  // ── Persiapan ─────────────────────────────────────────────

  private bolehMiring() {
    return this.o.mode === 'cpu' && SensorMiring.tersedia()
  }

  /** Tanda pemain di kiri lintasan, papan meter, dan tulisan FINIS. */
  private buatPapanLintasan() {
    const n = this.o.pemain.length
    const atasJauh = lajur(n - 1).pita[0]
    const yPapan = atasJauh - 58
    const mudah = this.o.kesulitan === 'mudah'
    teks(this, START_X, yPapan, 'START', { ukuran: 30, garis: 'kayu-gelap', tebalGaris: 6 }, this.res).setDepth(5)
    for (const m of [10, 20]) {
      const label = mudah && POS_MUDAH.includes(m) ? `POS ${m} m` : `${m} m`
      teks(this, xMeter(m), yPapan, label, { ukuran: 30, garis: mudah ? 'daun-pisang-tua' : 'kayu-gelap', tebalGaris: 6 }, this.res).setDepth(5)
    }
    teks(this, FINIS_X, atasJauh - SPANDUK_ATAS + 19, 'FINIS', { ukuran: 30 }, this.res).setDepth(5)
  }

  private buatPelari() {
    const o = this.o
    const acak = acakBerbenih(Math.floor(Math.random() * 2 ** 31))
    const pos = o.kesulitan === 'mudah' ? POS_MUDAH : []
    o.pemain.forEach((pemain, i) => {
      const l = lajur(i)
      const manusia = pemain.avatar !== 'cpu'
      const warna = hexKeAngka(pemain.warna)
      const logika = new LogikaPelari({ rintangan: o.rintangan, pos, acak })
      const view = new PelariView(
        this,
        l,
        { jalan: KUNCI.raut(i, 'jalan'), kaget: KUNCI.raut(i, 'kaget'), senang: KUNCI.raut(i, 'senang') },
        { res: this.res, gerak: o.env.gerak, kedalaman: 20 - i * 2 },
      )
      const otak = manusia ? undefined : new OtakCpu(logika, CPU[o.kesulitan], acak)
      const p: Pelari = { pemain, manusia, warna, logika, view, otak, urutan: null }
      this.pelari.push(p)
      if (manusia) this.manusia.push(p)

      // Tanda pemain: kepala dalam lingkaran warna pemain (cincin cahaya = pemain manusia).
      const y = l.tanah - 34 * l.skala
      const r = 30 * l.skala
      this.add.circle(TANDA_X, y, r, warna).setStrokeStyle(manusia ? 6 : 4, w(manusia ? 'cahaya-kelir' : 'kertas-terang')).setDepth(6)
      const kepala = this.add.image(TANDA_X, y + 2, KUNCI.raut(i, 'kepala')).setDepth(6)
      kepala.setScale((r * 1.7) / kepala.height)
    })
  }

  private buatPanel() {
    const n = this.manusia.length
    const kb = this.o.env.keyboard
    const tunggal = n === 1
    this.manusia.forEach((p, k) => {
      const indeks = this.pelari.indexOf(p)
      const { x0, lebar } = tunggal ? { x0: 0, lebar: LEBAR } : kolom(k, n)
      p.panel = new PanelKontrol(this, {
        x0,
        lebar,
        tunggal,
        warna: p.warna,
        kepala: tunggal ? undefined : KUNCI.raut(indeks, 'kepala'),
        huruf: kb ? HURUF_KOLOM[k] : undefined,
        res: this.res,
        onLangkah: (kaki) => this.langkah(k, kaki),
        onTahan: (v) => this.tahan(k, v),
      })
      const tombol = KEYBOARD_KOLOM[k]
      if (!tombol) return
      ;(['kiri', 'kanan', 'tahan'] as const).forEach((aksi, j) => tombol[j]!.forEach((kode) => this.peta.set(kode, [k, aksi])))
    })
    if (tunggal) {
      this.peta.set('ArrowLeft', [0, 'kiri'])
      this.peta.set('ArrowRight', [0, 'kanan'])
      this.peta.set('ArrowUp', [0, 'tahan'])
      this.peta.set('Space', [0, 'tahan'])
    }
  }

  /** Kartu sebelum lomba: petunjuk, pilihan kendali miring (HP/tablet), tombol Mulai. */
  private tampilPanelSiap() {
    const r = this.res
    const c = this.add.container(0, 0).setDepth(80)
    this.panelSiap = c
    c.add(this.add.rectangle(0, 0, LEBAR, TINGGI, w('tinta-gelap'), 0.62).setOrigin(0).setInteractive())
    const kartu = this.add.graphics()
    const k = this.add.container(0, 0)
    c.add([kartu, k])
    const tengah = LEBAR / 2
    let y = 26
    const baris = (isi: string, ukuran: number, warna: NamaWarna, sela: number, tebal = 700) => {
      const t = teks(this, tengah, y, isi, { ukuran, warna, judul: false, tebal }, r).setOrigin(0.5, 0)
      t.setWordWrapWidth(840)
      k.add(t)
      y += t.height + sela
      return t
    }
    k.add(teks(this, tengah, y, 'Siap lomba egrang?', { ukuran: 48, warna: 'biru-nila' }, r).setOrigin(0.5, 0))
    y += 68
    baris('Tekan KIRI dan KANAN bergantian dengan irama tenang.', 30, 'tinta', 6)
    baris('Jaga jarum keseimbangan di hijau. Kalau badan miring, tahan tombol TAHAN.', 30, 'tinta', 6, 600)
    baris(this.o.kesulitan === 'mudah' ? 'Jatuh = balik ke pos terakhir.' : 'Jatuh = balik ke garis start.', 30, 'merah-bata', 8)
    if (this.o.env.keyboard) {
      const n = this.manusia.length
      const isi =
        n === 1
          ? 'A / ← kiri · S / → kanan · W / ↑ / Spasi tahan'
          : HURUF_KOLOM.slice(0, n)
              .map((h, i) => `P${i + 1} ${h.kiri}/${h.kanan} (tahan ${h.tahan})`)
              .join(' · ') + (n === 4 ? ' · P4 pakai numpad' : '')
      baris(`Keyboard: ${isi}`, 26, 'kayu', 8)
    }

    if (this.bolehMiring()) {
      const atas = y + 6
      const pilihan = [
        { miring: false, judul: 'Tombol saja', sub: 'KIRI · TAHAN · KANAN' },
        { miring: true, judul: '+ Miring HP', sub: 'Lawan arah miring badan' },
      ]
      const gfx = this.add.graphics()
      k.add(gfx)
      const xPilihan = (i: number) => tengah - 410 + i * 420
      const judul = pilihan.map((p, i) => teks(this, xPilihan(i) + 200, atas + 32, p.judul, { ukuran: 34 }, r))
      const sub = pilihan.map((p, i) => teks(this, xPilihan(i) + 200, atas + 72, p.sub, { ukuran: 30, judul: false, tebal: 700 }, r))
      k.add([...judul, ...sub])
      const catatan = teks(this, tengah, atas + 124, '', { ukuran: 30, warna: 'merah-bata', judul: false, tebal: 700 }, r).setOrigin(0.5, 0)
      k.add(catatan)
      y = atas + 124
      const gambar = () => {
        gfx.clear()
        pilihan.forEach((p, i) => {
          const aktif = p.miring === this.pakaiMiring
          gfx.fillStyle(w(aktif ? 'biru-nila-gelap' : 'garis-krem')).fillRoundedRect(xPilihan(i), atas + 6, 400, 100, 20)
          gfx.fillStyle(w(aktif ? 'biru-nila' : 'kertas-terang')).fillRoundedRect(xPilihan(i), atas, 400, 100, 20)
          judul[i]!.setColor(WARNA[aktif ? 'kertas-terang' : 'biru-nila'])
          sub[i]!.setColor(WARNA[aktif ? 'cahaya-kelir' : 'tinta'])
        })
      }
      pilihan.forEach((p, i) => {
        const zona = this.add.zone(xPilihan(i), atas, 400, 106).setOrigin(0).setInteractive()
        // pointerup: iOS hanya memberi izin sensor dari sentuhan yang selesai.
        zona.on('pointerup', () => {
          if (!p.miring) {
            this.pakaiMiring = false
            catatan.setText('')
            gambar()
            return
          }
          void SensorMiring.izinkan().then((boleh) => {
            this.pakaiMiring = boleh
            catatan.setText(boleh ? '' : 'Izin sensor miring ditolak. Pakai tombol saja.')
            gambar()
          })
        })
        k.add(zona)
      })
      gambar()
      y += 36
    }

    const by = y + 10
    const tombol = this.add.graphics()
    tombol.fillStyle(w('kunyit-gelap')).fillRoundedRect(tengah - 170, by + 6, 340, 84, 26)
    tombol.fillStyle(w('kunyit')).fillRoundedRect(tengah - 170, by, 340, 84, 26)
    k.add(tombol)
    k.add(teks(this, tengah, by + 42, 'Mulai!', { ukuran: 44, warna: 'kayu-gelap' }, r))
    const zona = this.add.zone(tengah - 170, by, 340, 90).setOrigin(0).setInteractive()
    zona.on('pointerup', () => this.mulai())
    k.add(zona)

    const tinggi = by + 90 + 26
    const atasKartu = Math.max(8, (TINGGI - tinggi) / 2)
    k.y = atasKartu
    kartu.fillStyle(w('kayu-gelap')).fillRoundedRect(tengah - 470, atasKartu + 8, 940, tinggi, 28)
    kartu.fillStyle(w('kertas-krem')).fillRoundedRect(tengah - 470, atasKartu, 940, tinggi, 28)
  }

  private mulai() {
    if (this.fase !== 'siap') return
    audio.buka()
    this.panelSiap?.destroy()
    this.panelSiap = null
    this.o.simpanMiring(this.pakaiMiring)
    if (this.pakaiMiring) {
      const sensor = new SensorMiring()
      sensor.mulai()
      this.sensor = sensor
      this.time.delayedCall(1500, () => {
        if (sensor.adaData || this.sensor !== sensor) return
        sensor.berhenti()
        this.sensor = null
        this.tampilPesan('Sensor miring tidak terbaca. Pakai tombol saja.', 3500)
      })
    }
    this.fase = 'hitung'
    this.jamAsal = performance.now() + 3 * LAMA_HITUNG + 250
  }

  // ── Lomba ─────────────────────────────────────────────────

  private updateHitung(t: number) {
    const sisa = Math.ceil(-t / LAMA_HITUNG)
    if (t >= 0) {
      this.fase = 'lomba'
      this.tampilSeru('JALAN!', 'daun-pisang-gelap')
      bunyi.hitung(true)
      this.sensor?.kalibrasi()
      return
    }
    if (sisa <= 3 && sisa !== this.hitungTampil) {
      this.hitungTampil = sisa
      this.tampilSeru(String(sisa), 'merah-bata')
      bunyi.hitung(false)
    }
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
    latar.setSize(this.pesanTeks.width + 40, 50).setOrigin(0.5)
    this.pesan.setVisible(true).setAlpha(1)
    this.tweens.killTweensOf(this.pesan)
    this.tweens.add({ targets: this.pesan, alpha: 0, delay: lama, duration: 300, onComplete: () => this.pesan.setVisible(false) })
  }

  private langkah(k: number, kaki: Kaki) {
    const p = this.manusia[k]
    if (!p || this.fase !== 'lomba') return
    const t = this.sekarang()
    this.proses(this.pelari.indexOf(p), p.logika.langkah(kaki, t), t)
  }

  private tahan(k: number, v: boolean) {
    const p = this.manusia[k]
    if (!p || this.fase !== 'lomba') return
    const t = this.sekarang()
    this.proses(this.pelari.indexOf(p), p.logika.setTahan(v, t), t)
  }

  private tombolKeyboard(e: KeyboardEvent, turun: boolean) {
    if (this.fase === 'siap') {
      if (turun && (e.code === 'Enter' || e.code === 'Space')) this.mulai()
      return
    }
    const peta = this.peta.get(e.code)
    if (!peta || (turun && e.repeat)) return
    e.preventDefault()
    const [k, aksi] = peta
    // Id negatif per tombol keyboard supaya tidak bentrok dengan id pointer.
    const id = -1 - [...this.peta.keys()].indexOf(e.code)
    this.manusia[k]?.panel?.tekanKeyboard(aksi, turun, id)
  }

  private proses(i: number, peristiwa: Peristiwa[], t: number) {
    const p = this.pelari[i]!
    const { view, panel, logika, manusia } = p
    for (const e of peristiwa) {
      switch (e.jenis) {
        case 'langkah':
          view.setJarak(logika.jarak)
          view.langkah(e.kaki, e.medan)
          if (!manusia) break
          bunyi.langkah(e.kaki)
          if (e.medan === 'genangan') bunyi.ciprat()
          if (e.nilai === 'buru') view.sorak('TERBURU-BURU!', 'kunyit')
          else if (e.nilai === 'sama') view.sorak('KAKI SAMA!', 'merah-bata')
          if (e.nilai === 'buru' || e.nilai === 'sama') bunyi.oleng()
          break
        case 'jatuh':
          view.jatuh(e.arah)
          view.sorak('GUBRAK!', 'cahaya-kelir')
          bunyi.jatuh(manusia)
          panel?.setKeadaan('jatuh', 'JATUH!')
          break
        case 'kembali': {
          const label = e.ke > 0 ? `Ke pos ${e.ke} m` : 'Balik ke start'
          view.kembali(e.ke, label)
          panel?.setKeadaan('kembali', label)
          break
        }
        case 'siap':
          view.siap()
          panel?.setKeadaan('jalan')
          if (manusia) bunyi.bangkit()
          break
        case 'finis': {
          const urutan = ++this.jumlahFinis
          p.urutan = urutan
          view.setJarak(logika.jarak)
          view.finis(urutan, p.warna)
          panel?.setKeadaan('finis', `FINIS! Ke-${urutan}`)
          if (manusia || urutan === 1) bunyi.finis(urutan === 1)
          if (urutan === 1) {
            this.tSusul = t + BATAS_SUSUL
            this.tampilPesan(`${p.pemain.nama} finis pertama!`, 2600)
          }
          break
        }
      }
    }
  }

  // ── Akhir ─────────────────────────────────────────────────

  private akhiri(t: number) {
    if (this.fase !== 'lomba') return
    this.fase = 'akhir'
    for (const m of this.manusia) m.panel?.lepasSemua()
    this.sensor?.berhenti()
    this.sensor = null

    const urut = urutkan(this.pelari.map((p) => ({ id: p.pemain.id, jarak: p.logika.jarak, waktuFinis: p.logika.waktuFinis, p })))
    const keterangan = (x: (typeof urut)[number], ke: number) => {
      const l = x.p.logika
      const dasar = l.waktuFinis !== null ? `Finis ke-${ke} · ${angka(l.waktuFinis / 1000)} dtk` : `${angka(l.jarak)} m`
      return l.statistik.jatuh ? `${dasar} · jatuh ${l.statistik.jatuh}×` : dasar
    }
    const hasil: GameResult = {
      pemenang: urut[0]!.p.pemain,
      // Yang finis di atas (1000 − urutan), sisanya menurut jarak (dm).
      skor: Object.fromEntries(urut.map((x, i) => [x.id, x.waktuFinis !== null ? 1000 - i : Math.round(x.jarak * 10)])),
      keteranganSkor: Object.fromEntries(urut.map((x, i) => [x.id, keterangan(x, i + 1)])),
      durasiDetik: Math.max(0, Math.round(t / 1000)),
    }
    this.tampilUrutan(urut.map((x, i) => ({ p: x.p, info: keterangan(x, i + 1) })))
    this.time.delayedCall(JEDA_HASIL, () => this.o.onFinish(hasil))
  }

  private tampilUrutan(daftar: { p: Pelari; info: string }[]) {
    const r = this.res
    const lebar = 760
    const barisT = 70
    const tinggi = 92 + daftar.length * barisT + 18
    const atas = Math.max(16, (TINGGI - tinggi) / 2)
    const x0 = (LEBAR - lebar) / 2
    const c = this.add.container(0, 0).setDepth(90)
    c.add(this.add.rectangle(0, 0, LEBAR, TINGGI, w('tinta-gelap'), 0.45).setOrigin(0).setInteractive())
    const g = this.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(x0, atas + 8, lebar, tinggi, 28)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(x0, atas, lebar, tinggi, 28)
    c.add(g)
    c.add(teks(this, LEBAR / 2, atas + 46, 'Urutan finis', { ukuran: 44, warna: 'biru-nila' }, r))
    daftar.forEach(({ p, info }, i) => {
      const y = atas + 92 + i * barisT + barisT / 2
      const indeks = this.pelari.indexOf(p)
      if (i % 2 === 0) g.fillStyle(w('kertas-krem-gelap')).fillRoundedRect(x0 + 20, y - barisT / 2 + 4, lebar - 40, barisT - 8, 14)
      c.add(this.add.circle(x0 + 60, y, 24, w(p.urutan === 1 ? 'cahaya-kelir' : 'kertas-terang')).setStrokeStyle(4, p.warna))
      c.add(teks(this, x0 + 60, y + 1, String(i + 1), { ukuran: 30, warna: 'tinta' }, r))
      c.add(this.add.circle(x0 + 122, y, 26, p.warna))
      const kepala = this.add.image(x0 + 122, y + 2, KUNCI.raut(indeks, 'kepala'))
      kepala.setScale(46 / kepala.height)
      c.add(kepala)
      const nama = teks(this, x0 + 164, y, p.pemain.nama + (p.manusia ? '' : ' (komputer)'), { ukuran: 30, warna: 'tinta' }, r).setOrigin(0, 0.5)
      if (nama.width > 300) nama.setScale(300 / nama.width)
      c.add(nama)
      const ket = teks(this, x0 + lebar - 36, y, info, { ukuran: 26, warna: 'kayu', judul: false, tebal: 700 }, r).setOrigin(1, 0.5)
      if (ket.width > 260) ket.setScale(260 / ket.width)
      c.add(ket)
    })
    if (this.o.env.gerak) {
      c.setAlpha(0)
      this.tweens.add({ targets: c, alpha: 1, duration: 300 })
    }
  }
}
