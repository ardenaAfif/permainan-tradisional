/**
 * Adegan Phaser lomba Bakiak: panel siap (pilihan Tim Kompak di mode duel),
 * hitungan, aba-aba berirama, dua tim di lintasan, sampai finis.
 */
import * as Phaser from 'phaser'
import { jedakanAdegan, lanjutkanAdegan } from '../../shared/phaser/modul'
import { teks } from '../../shared/phaser/teks'
import { GELAP_PEMAIN, WARNA, type NamaWarna } from '../../app/tokens'
import { audio } from '../../shared/audio/AudioManager'
import type { GameResult, Kesulitan, Player } from '../../shared/types'
import { kakiKetukan, KelompokKompak, LogikaTim, OtakCpu, bpmKetukan, waktuKetukan, type Peristiwa } from './aturan'
import { bunyi } from './bunyi'
import { AKURASI_CPU, BANGKIT_CPU, BANGKIT_KETUK, JEDA_AWAL, JEDA_HASIL, KETUKAN_HITUNG } from './config'
import { JamLagu } from './JamLagu'
import { PanelKontrol } from './PanelKontrol'
import type { Anggota } from './tekstur'
import { gambarLintasan, KONTROL_Y, LAJUR, LEBAR, TINGGI, w } from './tata'
import { TimView, type TeksturSiswa } from './TimView'

export interface DataTim {
  pemain: Player
  /** Dari depan ke belakang. */
  anggota: Anggota[]
  manusia: boolean
}

export interface OpsiAdegan {
  mode: 'cpu' | 'split'
  tim: [DataTim, DataTim]
  kesulitan: Kesulitan
  /** Skala render (1–1,5): kanvas lebih tajam di PID/laptop. */
  resolusi: number
  gerak: boolean
  petunjukKeyboard: boolean
  kompakAwal: boolean
  simpanKompak(v: boolean): void
  /** Tekstur siap pakai: kunci → kanvas. */
  kanvas: Map<string, HTMLCanvasElement>
  onFinish(hasil: GameResult): void
}

export const kunciTekstur = (tim: number, siswa: number, raut: string) => `t${tim}-s${siswa}-${raut}`

const hex = (s: string) => parseInt(s.slice(1), 16)
const meter = (m: number) => m.toLocaleString('id-ID', { maximumFractionDigits: 1 })

interface Tim {
  data: DataTim
  logika: LogikaTim
  view: TimView
  panel?: PanelKontrol
  cpu?: OtakCpu
  kelompok?: KelompokKompak
}

type Fase = 'siap' | 'lomba' | 'selesai'

export class AdeganBakiak extends Phaser.Scene {
  private o: OpsiAdegan
  private fase: Fase = 'siap'
  private jam: JamLagu | null = null
  private tim: Tim[] = []
  /** Teks jarak di papan skor, per tim. */
  private skor: Phaser.GameObjects.Text[] = []
  private kompak = false
  private ketukBerikut = -KETUKAN_HITUNG
  private seruBerikut = -KETUKAN_HITUNG
  private seru!: Phaser.GameObjects.Text
  private tempo!: Phaser.GameObjects.Text
  private panelSiap: Phaser.GameObjects.Container | null = null
  private peta = new Map<string, [number, number]>()
  private dijeda = false

  constructor(o: OpsiAdegan) {
    super('bakiak')
    this.o = o
  }

  // ── Siklus hidup ──────────────────────────────────────────

  create() {
    const o = this.o
    for (const [kunci, kanvas] of o.kanvas) if (!this.textures.exists(kunci)) this.textures.addCanvas(kunci, kanvas)
    this.cameras.main.setZoom(o.resolusi).centerOn(LEBAR / 2, TINGGI / 2)
    // Minimal 6 sentuhan bersamaan (Tim Kompak di PID): 1 bawaan + 8 = 9 jari.
    this.input.addPointer(8)

    gambarLintasan(this, o.resolusi)
    this.tim = o.tim.map((d, i) => this.buatTim(d, i))
    this.buatPapanSkor()
    this.seru = teks(this, LEBAR / 2, 112, '', { ukuran: 68, garis: 'kertas-terang', tebalGaris: 10 }, o.resolusi).setAlpha(0)

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.tim.forEach((t) => t.panel?.lepasPointer(p.id)))
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.tim.forEach((t) => t.panel?.lepasPointer(p.id)))
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.tombolKeyboard(e, true))
    this.input.keyboard?.on('keyup', (e: KeyboardEvent) => this.tombolKeyboard(e, false))

    this.kompak = o.mode === 'split' && o.kompakAwal
    this.tampilPanelSiap()
    if (this.dijeda) this.jeda()
  }

  update(waktu: number, delta: number) {
    const dt = Math.min(delta, 100)
    if (this.fase === 'lomba' && this.jam) {
      const t = this.jam.sekarang()
      this.jadwalkanKetukan(t)
      while (this.fase === 'lomba' && waktuKetukan(this.seruBerikut) <= t) this.tampilSeru(this.seruBerikut++)
      this.tim.forEach((tim, i) => {
        if (this.fase !== 'lomba') return
        if (tim.cpu) {
          this.proses(i, tim.cpu.jalan(t))
        } else {
          for (const g of tim.kelompok?.periksa(t) ?? []) this.proses(i, tim.logika.tekan(g.t, g.hasil))
          this.proses(i, tim.logika.lewati(t))
        }
        if (tim.kelompok) tim.panel?.setMenunggu(tim.kelompok.sudahTekan)
        tim.panel?.update(t, tim.logika.ketukan, tim.logika.goyang, tim.logika.sisaBangkit(t))
      })
    }
    for (const tim of this.tim) tim.view.update(dt, tim.logika.goyang, waktu)
  }

  jeda() {
    this.dijeda = true
    this.jam?.jeda()
    // Sebelum create() adegan belum bisa dijeda; create() memanggil jeda() lagi.
    jedakanAdegan(this)
  }

  lanjut() {
    this.dijeda = false
    if (!this.sys.isPaused()) return
    lanjutkanAdegan(this)
    this.jam?.lanjut()
  }

  // ── Persiapan ─────────────────────────────────────────────

  private buatTim(data: DataTim, i: number): Tim {
    const tekstur: TeksturSiswa[] = data.anggota.map((_, j) => ({
      jalan: kunciTekstur(i, j, 'jalan'),
      kaget: kunciTekstur(i, j, 'kaget'),
      senang: kunciTekstur(i, j, 'senang'),
    }))
    const logika = new LogikaTim()
    const view = new TimView(this, LAJUR[i as 0 | 1], tekstur, hex(data.pemain.warna), this.o.gerak)
    const cpu = data.manusia ? undefined : new OtakCpu(logika, AKURASI_CPU[this.o.kesulitan], BANGKIT_CPU[this.o.kesulitan])
    return { data, logika, view, cpu }
  }

  private buatPapanSkor() {
    const r = this.o.resolusi
    this.tim.forEach((tim, i) => {
      const cx = i === 0 ? 340 : 940
      const g = this.add.graphics()
      g.fillStyle(w('tinta-gelap'), 0.72).fillRoundedRect(cx - 200, 10, 400, 52, 26)
      g.fillStyle(hex(tim.data.pemain.warna)).fillCircle(cx - 172, 36, 13)
      g.lineStyle(3, w('kertas-terang')).strokeCircle(cx - 172, 36, 13)
      const nama = teks(this, cx - 148, 36, `Tim ${tim.data.pemain.nama}`, { ukuran: 30 }, r).setOrigin(0, 0.5)
      this.skor[i] = teks(this, cx + 182, 36, '0 m', { ukuran: 30, warna: 'cahaya-kelir' }, r).setOrigin(1, 0.5)
      // Nama panjang dipotong supaya tidak menabrak jarak.
      const maks = 260
      if (nama.width > maks) nama.setScale(maks / nama.width, 1)
    })
    const g = this.add.graphics()
    g.fillStyle(w('tinta-gelap'), 0.72).fillRoundedRect(LEBAR / 2 - 88, 12, 176, 48, 24)
    this.tempo = teks(this, LEBAR / 2, 36, '', { ukuran: 30 }, this.o.resolusi)
    this.perbaruiTempo(0)
  }

  private perbaruiTempo(k: number) {
    this.tempo.setText(`Tempo ${bpmKetukan(Math.max(0, k))}`)
  }

  /** Kartu sebelum lomba: petunjuk, pilihan Tim Kompak (duel), tombol Mulai. */
  private tampilPanelSiap() {
    const r = this.o.resolusi
    const c = this.add.container(0, 0)
    this.panelSiap = c
    c.add(this.add.rectangle(0, 0, LEBAR, TINGGI, w('tinta-gelap'), 0.62).setOrigin(0).setInteractive())
    const kartu = this.add.graphics()
    const k = this.add.container(0, 0)
    c.add([kartu, k])
    const duel = this.o.mode === 'split'
    const tengah = LEBAR / 2
    // Isi disusun dari atas kartu; tinggi kartu mengikuti isinya.
    let y = 28
    const baris = (isi: string, ukuran: number, warna: NamaWarna, sela: number, tebal = 700) => {
      const t = teks(this, tengah, y, isi, { ukuran, warna, judul: false, tebal }, r).setOrigin(0.5, 0)
      t.setWordWrapWidth(800)
      k.add(t)
      y += t.height + sela
      return t
    }
    k.add(teks(this, tengah, y, 'Siap lomba bakiak?', { ukuran: 48, warna: 'biru-nila' }, r).setOrigin(0.5, 0))
    y += 70
    baris('Tekan tombol kaki tepat saat aba-aba.', 30, 'tinta', 6)
    baris('Salah irama bikin tim goyang. Kalau jatuh, ketuk cepat 6× untuk bangkit.', 30, 'tinta', 10, 600)
    if (this.o.petunjukKeyboard) baris(duel ? 'Keyboard: tim kiri A/S · tim kanan K/L' : 'Keyboard: A / ← kiri, S / → kanan', 26, 'kayu', 8)

    if (duel) {
      const atasPilihan = y + 8
      const pilihan: { kompak: boolean; judul: string; sub: string }[] = [
        { kompak: false, judul: 'Biasa', sub: '2 tombol per tim' },
        { kompak: true, judul: 'Tim Kompak', sub: '3 siswa per tim' },
      ]
      const gfx = this.add.graphics()
      k.add(gfx)
      const xPilihan = (i: number) => tengah - 400 + i * 410
      const judul = pilihan.map((p, i) => teks(this, xPilihan(i) + 195, atasPilihan + 34, p.judul, { ukuran: 36 }, r))
      const sub = pilihan.map((p, i) => teks(this, xPilihan(i) + 195, atasPilihan + 74, p.sub, { ukuran: 30, judul: false, tebal: 700 }, r))
      k.add([...judul, ...sub])
      y = atasPilihan + 124
      const catatan = baris('', 30, 'tinta', 0)
      y = catatan.y + 84
      const gambarPilihan = () => {
        gfx.clear()
        pilihan.forEach((p, i) => {
          const aktif = p.kompak === this.kompak
          gfx.fillStyle(w(aktif ? 'biru-nila-gelap' : 'garis-krem')).fillRoundedRect(xPilihan(i), atasPilihan + 6, 390, 104, 20)
          gfx.fillStyle(w(aktif ? 'biru-nila' : 'kertas-terang')).fillRoundedRect(xPilihan(i), atasPilihan, 390, 104, 20)
          judul[i]!.setColor(WARNA[aktif ? 'kertas-terang' : 'biru-nila'])
          sub[i]!.setColor(WARNA[aktif ? 'cahaya-kelir' : 'tinta'])
        })
        catatan.setText(
          this.kompak ? 'Tiap siswa pegang satu tombol. Maju hanya kalau ketiganya ditekan bersamaan.' : 'Tiap tim pegang tombol KIRI dan KANAN.',
        )
      }
      pilihan.forEach((p, i) => {
        const zona = this.add.zone(xPilihan(i), atasPilihan, 390, 110).setOrigin(0).setInteractive()
        zona.on('pointerdown', () => {
          this.kompak = p.kompak
          gambarPilihan()
        })
        k.add(zona)
      })
      gambarPilihan()
    }

    // Tombol Mulai.
    const by = y + 10
    const tombol = this.add.graphics()
    tombol.fillStyle(w('kunyit-gelap')).fillRoundedRect(tengah - 170, by + 6, 340, 84, 26)
    tombol.fillStyle(w('kunyit')).fillRoundedRect(tengah - 170, by, 340, 84, 26)
    k.add(tombol)
    k.add(teks(this, tengah, by + 42, 'Mulai!', { ukuran: 44, warna: 'kayu-gelap' }, r))
    const zona = this.add.zone(tengah - 170, by, 340, 90).setOrigin(0).setInteractive()
    zona.on('pointerup', () => this.mulai())
    k.add(zona)

    const tinggi = by + 90 + 28
    const atas = Math.max(8, (TINGGI - tinggi) / 2)
    k.y = atas
    kartu.fillStyle(w('kayu-gelap')).fillRoundedRect(tengah - 450, atas + 8, 900, tinggi, 28)
    kartu.fillStyle(w('kertas-krem')).fillRoundedRect(tengah - 450, atas, 900, tinggi, 28)
  }

  private mulai() {
    if (this.fase !== 'siap') return
    audio.buka()
    this.panelSiap?.destroy()
    this.panelSiap = null
    this.o.simpanKompak(this.kompak)
    this.buatPanelKontrol()
    this.fase = 'lomba'
    this.jam = new JamLagu(waktuKetukan(-KETUKAN_HITUNG) - JEDA_AWAL)
  }

  private buatPanelKontrol() {
    const duel = this.o.mode === 'split'
    const kb = this.o.petunjukKeyboard
    const huruf = duel ? (this.kompak ? [['A', 'S', 'D'], ['J', 'K', 'L']] : [['A', 'S'], ['K', 'L']]) : [['A', 'S']]
    huruf.forEach((baris, sisi) => baris.forEach((h, tombol) => this.peta.set(`Key${h}`, [sisi, tombol])))
    if (!duel) {
      this.peta.set('ArrowLeft', [0, 0])
      this.peta.set('ArrowRight', [0, 1])
    }
    this.tim.forEach((tim, i) => {
      if (!tim.data.manusia) return
      const warna = hex(tim.data.pemain.warna)
      tim.panel = new PanelKontrol(this, {
        x0: duel ? i * (LEBAR / 2) : 0,
        lebar: duel ? LEBAR / 2 : LEBAR,
        warnaTim: warna,
        warnaTimGelap: w(GELAP_PEMAIN[tim.data.pemain.warna] ?? 'kayu-gelap'),
        // Tombol kiri → kanan = siswa paling belakang → paling depan.
        kepala: this.kompak ? [2, 1, 0].map((j) => kunciTekstur(i, j, 'kepala')) : undefined,
        petunjuk: kb ? huruf[i] : undefined,
        resolusi: this.o.resolusi,
        gerak: this.o.gerak,
        onTekan: (tombol) => this.tekan(i, tombol),
      })
      if (this.kompak) tim.kelompok = new KelompokKompak(3)
    })
    if (duel) this.add.rectangle(LEBAR / 2, KONTROL_Y, 6, TINGGI - KONTROL_Y, w('kayu-gelap')).setOrigin(0.5, 0)
  }

  // ── Masukan ───────────────────────────────────────────────

  private tombolKeyboard(e: KeyboardEvent, turun: boolean) {
    if (this.fase === 'siap') {
      if (turun && (e.code === 'Enter' || e.code === 'Space')) this.mulai()
      return
    }
    const peta = this.peta.get(e.code)
    if (!peta) return
    const [sisi, tombol] = peta
    this.tim[sisi]?.panel?.tekanKeyboard(tombol, turun)
    if (turun && !e.repeat) this.tekan(sisi, tombol)
  }

  private tekan(sisi: number, tombol: number) {
    const tim = this.tim[sisi]
    if (!tim || this.fase !== 'lomba' || !this.jam) return
    const t = this.jam.sekarang()
    if (tim.kelompok && tim.logika.status === 'jalan') {
      tim.view.jejak(2 - tombol)
      for (const g of tim.kelompok.tekan(tombol, t)) this.proses(sisi, tim.logika.tekan(g.t, g.hasil))
    } else if (tim.kelompok) {
      this.proses(sisi, tim.logika.tekan(t, 'kompak'))
    } else {
      this.proses(sisi, tim.logika.tekan(t, tombol === 0 ? 'kiri' : 'kanan'))
    }
  }

  // ── Peristiwa ─────────────────────────────────────────────

  private proses(i: number, peristiwa: Peristiwa[]) {
    const tim = this.tim[i]!
    const { view, panel, logika } = tim
    const manusia = tim.data.manusia
    for (const e of peristiwa) {
      if (this.fase !== 'lomba') return
      switch (e.jenis) {
        case 'nilai': {
          view.setJarak(logika.jarak)
          const lama = waktuKetukan(e.ketukan + 1) - waktuKetukan(e.ketukan)
          if (e.maju > 0) view.langkah(kakiKetukan(e.ketukan), e.nilai === 'pas', lama)
          else view.terhuyung(e.nilai === 'salah')
          panel?.tampilNilai(e.nilai, e.alasan)
          if (manusia && e.nilai === 'salah') bunyi.salah()
          this.skor[i]?.setText(`${meter(logika.jarak)} m`)
          break
        }
        case 'ekstra':
          panel?.tampilNilai('ekstra')
          view.terhuyung(false)
          break
        case 'jatuh':
          view.jatuh()
          panel?.jatuh()
          tim.kelompok?.kosongkan()
          bunyi.jatuh()
          break
        case 'siap-bangkit':
          panel?.siapBangkit()
          break
        case 'ketuk-bangkit':
          view.ketukBangkit(e.ketuk, BANGKIT_KETUK)
          panel?.ketukBangkit(e.ketuk)
          if (manusia) bunyi.ketukBangkit(e.ketuk)
          break
        case 'bangkit-gagal':
          view.bangkitGagal()
          panel?.bangkitGagal()
          break
        case 'bangkit':
          view.bangkit()
          panel?.selesaiBangkit()
          if (manusia) bunyi.bangkit()
          break
        case 'finis':
          this.akhiri(i)
          break
      }
    }
  }

  private jadwalkanKetukan(t: number) {
    // Bunyi dijadwalkan sedikit lebih awal lewat Web Audio supaya tepat waktu.
    while (waktuKetukan(this.ketukBerikut) - t < 150) {
      const k = this.ketukBerikut++
      bunyi.ketukan(waktuKetukan(k) - t, k < 0 || kakiKetukan(k) === 'kiri')
    }
  }

  private tampilSeru(k: number) {
    const hitung = ['3', '2', '1', 'JALAN!']
    const isi = k < 0 ? hitung[k + KETUKAN_HITUNG] ?? '' : kakiKetukan(k) === 'kiri' ? 'KIRI!' : 'KANAN!'
    const warna: NamaWarna = k < 0 ? 'merah-bata' : kakiKetukan(k) === 'kiri' ? 'daun-pisang-gelap' : 'biru-nila'
    const s = this.seru
    this.tweens.killTweensOf(s)
    s.setText(isi).setColor(WARNA[warna]).setAlpha(1).setScale(1)
    const lama = waktuKetukan(k + 1) - waktuKetukan(k)
    if (this.o.gerak) {
      s.setScale(1.3)
      this.tweens.add({ targets: s, scale: 1, duration: 140, ease: 'Back.easeOut' })
    }
    this.tweens.add({ targets: s, alpha: 0.25, delay: lama * 0.45, duration: lama * 0.45 })
    if (k >= 0 && bpmKetukan(k) !== bpmKetukan(k - 1)) this.perbaruiTempo(k)
  }

  private akhiri(i: number) {
    if (this.fase !== 'lomba' || !this.jam) return
    this.fase = 'selesai'
    const t = this.jam.sekarang()
    const menang = this.tim[i]!
    bunyi.finis()
    menang.view.setJarak(menang.logika.jarak)
    this.skor[i]?.setText(`${meter(menang.logika.jarak)} m`)
    menang.view.menang()
    this.tim.forEach((tim) => tim.panel?.selesaiLomba())
    this.tweens.killTweensOf(this.seru)
    this.seru.setAlpha(0)

    const r = this.o.resolusi
    const c = this.add.container(LEBAR / 2, 250)
    const g = this.add.graphics()
    g.fillStyle(w('kayu-gelap')).fillRoundedRect(-330, -86, 660, 180, 28)
    g.fillStyle(w('kertas-krem')).fillRoundedRect(-330, -94, 660, 180, 28)
    c.add(g)
    c.add(teks(this, 0, -40, 'FINIS!', { ukuran: 64, warna: 'merah-bata' }, r))
    c.add(teks(this, 0, 32, `Tim ${menang.data.pemain.nama} menang!`, { ukuran: 40, warna: 'biru-nila' }, r))
    if (this.o.gerak) {
      c.setScale(0.6).setAlpha(0)
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' })
    }

    const hasil: GameResult = {
      pemenang: menang.data.pemain,
      skor: Object.fromEntries(this.tim.map((x) => [x.data.pemain.id, Math.round(x.logika.jarak * 10)])),
      keteranganSkor: Object.fromEntries(
        this.tim.map((x) => [x.data.pemain.id, `${meter(x.logika.jarak)} m · ${x.logika.statistik.pas} Pas · jatuh ${x.logika.statistik.jatuh}×`]),
      ),
      durasiDetik: Math.max(0, Math.round(t / 1000)),
    }
    this.time.delayedCall(JEDA_HASIL, () => this.o.onFinish(hasil))
  }
}
