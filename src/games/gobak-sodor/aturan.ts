/**
 * Logika satu ronde Gobak Sodor tanpa Phaser (diuji di aturan.test.ts):
 * penyerang aktif, penjaga di garisnya, sentuhan, poin, dan otak komputer.
 * Adegan memanggil maju(deltaMs); simulasi berjalan dengan langkah tetap
 * 1/60 detik supaya hasilnya sama di HP 30 fps maupun laptop 60 fps.
 */
import { LEWAT, R_SENTUH, V_PENYERANG, type ProfilJaga, type ProfilSerang } from './config'

export interface Titik {
  x: number
  y: number
}

export interface Lapangan {
  x0: number
  x1: number
  tengahX: number
  /** Garis jaga mendatar; indeks 0 = garis masuk (paling dekat START, y terbesar). */
  garisY: readonly number[]
  /** Batas gerak penyerang: tepi zona UJUNG (atas) dan zona START (bawah). */
  atas: number
  bawah: number
  sodor: boolean
}

export const LANGKAH_MS = 1000 / 60
/** Penyerang tidak boleh keluar dari sisi lapangan (px dari garis tepi). */
const TEPI_SISI = 14

export type JenisJaga = 'garis' | 'sodor'

export interface Penjaga {
  jenis: JenisJaga
  /** Indeks garis (penjaga garis); −1 untuk sodor. */
  garis: number
  x: number
  y: number
  profil: ProfilJaga
  manusia: boolean
  /** Kendali manusia: arah −1..1 sepanjang garisnya … */
  arah: number
  /** … atau posisi tujuan di garisnya (slider sodor). Diutamakan jika tidak null. */
  tujuan: number | null
  /** Kecepatan saat ini sepanjang garisnya (px/detik, bertanda: + ke kanan/bawah). */
  laju: number
}

export type StatusSerang = 'tunggu' | 'main' | 'gugur'

export interface Penyerang {
  status: StatusSerang
  x: number
  y: number
  /** Sudah sampai UJUNG, sekarang kembali ke START. */
  pulang: boolean
  poin: number
  laju: number
}

export type Peristiwa =
  | { jenis: 'masuk'; penyerang: number }
  | { jenis: 'lewat'; penyerang: number; garis: number }
  | { jenis: 'ujung'; penyerang: number }
  | { jenis: 'poin'; penyerang: number; berikut: number | null }
  | { jenis: 'kena'; penyerang: number; penjaga: number; berikut: number | null }
  | { jenis: 'selesai'; sebab: 'gugur' | 'waktu' }

export interface DataPenjaga {
  jenis: JenisJaga
  garis: number
  profil: ProfilJaga
  manusia: boolean
}

export interface OpsiRonde {
  lap: Lapangan
  nPenyerang: number
  penjaga: DataPenjaga[]
  /** Profil komputer untuk penyerang; null = penyerang dikendalikan pemain. */
  otak: ProfilSerang | null
  lamaRonde: number
  jedaGugur: number
  jedaPoin: number
  acak: () => number
}

// ── Geometri ──────────────────────────────────────────────

/** Banyaknya garis jaga yang sudah ada di bawah titik y (0 = zona START, n = zona UJUNG). */
export function zona(lap: Lapangan, y: number) {
  return lap.garisY.reduce((n, gy) => (y < gy ? n + 1 : n), 0)
}

export function posStart(lap: Lapangan): Titik {
  return { x: lap.tengahX, y: (lap.garisY[0]! + lap.bawah) / 2 + 6 }
}

/** Posisi awal penjaga: penjaga garis berselang-seling kiri-kanan, sodor di tengah. */
export function posAwalPenjaga(lap: Lapangan, d: Pick<DataPenjaga, 'jenis' | 'garis'>): Titik {
  const g = lap.garisY
  if (d.jenis === 'sodor') return { x: lap.tengahX, y: (g[0]! + g[g.length - 1]!) / 2 }
  return { x: lap.tengahX + (d.garis % 2 ? 1 : -1) * 110, y: g[d.garis]! }
}

export function batasSodor(lap: Lapangan): [number, number] {
  return [lap.garisY[lap.garisY.length - 1]!, lap.garisY[0]!]
}

const jarak = (a: Titik, b: Titik) => Math.hypot(a.x - b.x, a.y - b.y)
const batas = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Gerakkan nilai menuju tujuan paling jauh `maks`. */
function menuju(dari: number, ke: number, maks: number) {
  return Math.abs(ke - dari) <= maks ? ke : dari + Math.sign(ke - dari) * maks
}

// ── Ronde ─────────────────────────────────────────────────

interface Sampel {
  t: number
  x: number
  y: number
  vx: number
  vy: number
}

export class LogikaRonde {
  readonly lap: Lapangan
  readonly penyerang: Penyerang[]
  readonly penjaga: Penjaga[]
  /** Waktu main (ms) sejak peluit. */
  waktu = 0
  fase: 'main' | 'ganti' | 'selesai' = 'main'
  /** Indeks penyerang yang sedang di lapangan (null saat pergantian). */
  aktif: number | null = 0
  poin = 0
  /** Kendali pemain untuk penyerang: vektor joystick (panjang ≤ 1). */
  joystick: Titik = { x: 0, y: 0 }
  private o: OpsiRonde
  private otak: OtakPenyerang | null
  private berikut: number | null = null
  private gantiSampai = 0
  private sisa = 0
  private riwayat: Sampel[] = []

  constructor(o: OpsiRonde) {
    this.o = o
    this.lap = o.lap
    const s = posStart(o.lap)
    this.penyerang = Array.from({ length: o.nPenyerang }, (_, i) => ({
      status: i === 0 ? 'main' : 'tunggu',
      x: s.x,
      y: s.y,
      pulang: false,
      poin: 0,
      laju: 0,
    }))
    this.penjaga = o.penjaga.map((d) => ({ ...d, ...posAwalPenjaga(o.lap, d), arah: 0, tujuan: null, laju: 0 }))
    this.otak = o.otak ? new OtakPenyerang(o.otak, o.acak) : null
  }

  get sisaWaktu() {
    return Math.max(0, this.o.lamaRonde - this.waktu)
  }

  get penyerangAktif() {
    return this.aktif === null ? null : this.penyerang[this.aktif]!
  }

  /** Jalankan simulasi sejauh `ms` (langkah tetap). */
  maju(ms: number): Peristiwa[] {
    const ev: Peristiwa[] = []
    this.sisa += Math.min(ms, 250)
    while (this.sisa >= LANGKAH_MS && this.fase !== 'selesai') {
      this.sisa -= LANGKAH_MS
      this.langkah(LANGKAH_MS, ev)
    }
    return ev
  }

  private langkah(dt: number, ev: Peristiwa[]) {
    this.waktu += dt
    const det = dt / 1000
    const a = this.penyerangAktif
    if (a && this.fase === 'main') this.gerakPenyerang(a, det, ev)
    this.catat(a, det)
    for (const p of this.penjaga) this.gerakPenjaga(p, det)
    if (a && this.fase === 'main') {
      const kena = this.penjaga.findIndex((p) => jarak(p, a) < R_SENTUH)
      if (kena >= 0) {
        a.status = 'gugur'
        a.laju = 0
        this.gantiPenyerang(this.o.jedaGugur)
        ev.push({ jenis: 'kena', penyerang: this.indeks(a), penjaga: kena, berikut: this.berikut })
      }
    }
    if (this.fase === 'ganti' && this.waktu >= this.gantiSampai) {
      if (this.berikut === null) {
        this.fase = 'selesai'
        ev.push({ jenis: 'selesai', sebab: 'gugur' })
        return
      }
      const b = this.penyerang[this.berikut]!
      Object.assign(b, posStart(this.lap), { status: 'main', pulang: false, laju: 0 })
      this.aktif = this.berikut
      this.berikut = null
      this.fase = 'main'
      this.riwayat = []
      this.otak?.reset()
      ev.push({ jenis: 'masuk', penyerang: this.aktif })
    }
    if (this.waktu >= this.o.lamaRonde && this.fase !== 'selesai') {
      this.fase = 'selesai'
      ev.push({ jenis: 'selesai', sebab: 'waktu' })
    }
  }

  private indeks(a: Penyerang) {
    return this.penyerang.indexOf(a)
  }

  private gerakPenyerang(a: Penyerang, det: number, ev: Peristiwa[]) {
    const lap = this.lap
    let v: Titik
    let cepat: number
    if (this.otak) {
      v = this.otak.kemudi(this.waktu, a, this.penjaga, lap)
      cepat = this.o.otak!.kecepatan
    } else {
      const j = this.joystick
      const p = Math.hypot(j.x, j.y)
      v = p > 1 ? { x: j.x / p, y: j.y / p } : j
      cepat = V_PENYERANG
    }
    const zAwal = zona(lap, a.y)
    const x0 = a.x
    const y0 = a.y
    a.x = batas(a.x + v.x * cepat * det, lap.x0 + TEPI_SISI, lap.x1 - TEPI_SISI)
    a.y = batas(a.y + v.y * cepat * det, lap.atas, lap.bawah)
    a.laju = Math.hypot(a.x - x0, a.y - y0) / det
    const z = zona(lap, a.y)
    const i = this.indeks(a)
    if (z > zAwal && !a.pulang) ev.push({ jenis: 'lewat', penyerang: i, garis: z - 1 })
    if (z < zAwal && a.pulang) ev.push({ jenis: 'lewat', penyerang: i, garis: z })
    const n = lap.garisY.length
    if (!a.pulang && a.y < lap.garisY[n - 1]! - LEWAT) {
      a.pulang = true
      ev.push({ jenis: 'ujung', penyerang: i })
    } else if (a.pulang && a.y > lap.garisY[0]! + LEWAT) {
      a.poin++
      this.poin++
      a.status = 'tunggu'
      a.pulang = false
      a.laju = 0
      this.gantiPenyerang(this.o.jedaPoin)
      ev.push({ jenis: 'poin', penyerang: i, berikut: this.berikut })
    }
  }

  /** Penyerang berikutnya: urutan antrean setelah yang aktif (yang baru dapat poin ikut antre di belakang). */
  private gantiPenyerang(jeda: number) {
    const n = this.penyerang.length
    const dari = this.aktif ?? 0
    this.berikut = null
    for (let k = 1; k <= n; k++) {
      const j = (dari + k) % n
      if (this.penyerang[j]!.status === 'tunggu') {
        this.berikut = j
        break
      }
    }
    this.aktif = null
    this.riwayat = []
    this.fase = 'ganti'
    this.gantiSampai = this.waktu + jeda
  }

  private catat(a: Penyerang | null, det: number) {
    if (!a || this.fase !== 'main') return
    const akhir = this.riwayat[this.riwayat.length - 1]
    const vx = akhir ? (a.x - akhir.x) / det : 0
    const vy = akhir ? (a.y - akhir.y) / det : 0
    this.riwayat.push({ t: this.waktu, x: a.x, y: a.y, vx, vy })
    // Cukup untuk reaksi paling lambat (±1 detik).
    if (this.riwayat.length > 70) this.riwayat.shift()
  }

  /** Posisi penyerang aktif seperti terlihat `reaksi` ms yang lalu. */
  private terlihat(reaksi: number): Sampel | null {
    const t = this.waktu - reaksi
    for (let i = this.riwayat.length - 1; i >= 0; i--) if (this.riwayat[i]!.t <= t) return this.riwayat[i]!
    return null
  }

  private gerakPenjaga(p: Penjaga, det: number) {
    const lap = this.lap
    const maks = p.profil.kecepatan * det
    const sodor = p.jenis === 'sodor'
    const [yMin, yMax] = batasSodor(lap)
    const awal = sodor ? p.y : p.x
    let tujuan: number
    if (p.manusia) {
      tujuan = p.tujuan ?? awal + batas(p.arah, -1, 1) * maks
    } else {
      const s = this.terlihat(p.profil.reaksi)
      if (s) tujuan = sodor ? s.y + s.vy * p.profil.antisipasi : s.x + s.vx * p.profil.antisipasi
      else if (this.fase === 'ganti') {
        // Pergantian penyerang: kembali pelan ke posisi awal.
        const asal = posAwalPenjaga(lap, p)
        tujuan = sodor ? asal.y : asal.x
      } else tujuan = awal
    }
    const baru = menuju(awal, tujuan, this.fase === 'ganti' && !p.manusia ? maks * 0.5 : maks)
    if (sodor) p.y = batas(baru, yMin, yMax)
    else p.x = batas(baru, lap.x0, lap.x1)
    p.laju = ((sodor ? p.y : p.x) - awal) / det
  }
}

// ── Otak penyerang komputer ───────────────────────────────

/** Arah lari menyeberang yang dicoba: lurus, serong, atau serong tajam (x per 1 satuan y). */
const SERONG = [0, -0.6, 0.6, -1.1, 1.1]

/**
 * Penyerang komputer: menunggu di depan garis berikutnya sambil bergeser ke
 * kiri-kanan (sesekali berbalik untuk memancing), lalu lari menyeberang saat
 * celahnya cukup. Celah dinilai dengan membayangkan beberapa arah lari dan
 * gerak para penjaga sesaat ke depan. Menjauhi sodor dan penjaga lain.
 */
export class OtakPenyerang {
  private p: ProfilSerang
  private acak: () => number
  private tKeputusan = -Infinity
  private mode: 'tunggu' | 'lari' = 'tunggu'
  /** Garis yang sedang diterobos, beserta arahnya (pergi/pulang). */
  private garisLari = -1
  private lariPulang = false
  private serong = 0
  private geser: -1 | 1 = 1
  private target: Titik = { x: 0, y: 0 }
  private garisTunggu = -1
  private mulaiTunggu = 0

  constructor(p: ProfilSerang, acak: () => number) {
    this.p = p
    this.acak = acak
    this.reset()
  }

  reset() {
    this.mode = 'tunggu'
    this.garisLari = -1
    this.garisTunggu = -1
    this.tKeputusan = -Infinity
    this.geser = this.acak() < 0.5 ? -1 : 1
  }

  /** Arah gerak (panjang ≤ 1). */
  kemudi(t: number, a: Penyerang, penjaga: Penjaga[], lap: Lapangan): Titik {
    if (t - this.tKeputusan >= this.p.reaksi) {
      this.tKeputusan = t
      this.putuskan(t, a, penjaga, lap)
    }
    const dx = this.target.x - a.x
    const dy = this.target.y - a.y
    const d = Math.hypot(dx, dy)
    const pelan = Math.min(1, d / 18)
    let vx = d > 1 ? (dx / d) * pelan : 0
    let vy = d > 1 ? (dy / d) * pelan : 0
    // Menjauh dari penjaga yang terlalu dekat (kecuali garis yang sedang diterobos).
    for (const g of penjaga) {
      if (this.mode === 'lari' && g.jenis === 'garis' && g.garis === this.garisLari) continue
      const ex = a.x - g.x
      const ey = a.y - g.y
      const dd = Math.hypot(ex, ey) || 1
      const zonaHindar = R_SENTUH + 22
      if (dd >= zonaHindar) continue
      const dorong = ((zonaHindar - dd) / zonaHindar) * 2
      // Penjaga garis hanya bergerak mendatar: menjauh tegak lurus garisnya.
      if (g.jenis === 'garis') vy += Math.sign(ey || 1) * dorong
      else vx += Math.sign(ex || (a.x < lap.tengahX ? -1 : 1)) * dorong
    }
    const p = Math.hypot(vx, vy)
    return p > 1 ? { x: vx / p, y: vy / p } : { x: vx, y: vy }
  }

  private putuskan(t: number, a: Penyerang, penjaga: Penjaga[], lap: Lapangan) {
    const g = lap.garisY
    const n = g.length
    const z = zona(lap, a.y)
    const k = a.pulang ? z - 1 : z
    if (k < 0 || k >= n) {
      // Di UJUNG sebelum berbalik / di START setelah pulang: logika ronde yang mengurus.
      this.target = { x: a.x, y: a.pulang ? lap.bawah : lap.atas }
      return
    }
    const gy = g[k]!
    // Tempat menunggu di sisi garis sebelum menyeberang; sisi = +1 jika di bawah garis.
    const sisi = a.pulang ? -1 : 1
    const jarakTunggu = R_SENTUH + 14
    const wy = gy + sisi * jarakTunggu
    // Tujuan setelah menyeberang: tempat menunggu garis berikutnya, UJUNG, atau START.
    const k2 = a.pulang ? k - 1 : k + 1
    const by = k2 >= 0 && k2 < n ? g[k2]! + sisi * jarakTunggu : a.pulang ? posStart(lap).y : gy - (R_SENTUH + 18)

    if (this.garisTunggu !== k) {
      this.garisTunggu = k
      this.mulaiTunggu = t
    }
    // Makin lama menunggu makin nekat, sampai batas tertentu.
    const cermat = this.p.cermat - Math.min(40, (this.p.nekat * (t - this.mulaiTunggu)) / 1000)

    // Baru saja menyeberang: terus lari sampai lepas dari jangkauan penjaga garis itu.
    if (this.mode === 'lari' && this.garisLari !== k && this.garisLari >= 0 && Math.abs(a.y - g[this.garisLari]!) < R_SENTUH + 16) return
    if (this.mode === 'lari' && this.garisLari === k && this.lariPulang === a.pulang) {
      const sudahDekat = Math.abs(a.y - gy) <= R_SENTUH + 4
      if (sudahDekat || !this.p.batal || this.celah(a, this.serong, by, penjaga, lap) > cermat) {
        this.target = this.ujungLari(a, this.serong, by, lap)
        return
      }
      this.mode = 'tunggu'
    }
    // Cari arah lari dengan celah terlebar.
    let terbaik = -Infinity
    let arah = 0
    for (const s of SERONG) {
      const c = this.celah(a, s, by, penjaga, lap)
      if (c > terbaik) {
        terbaik = c
        arah = s
      }
    }
    if (terbaik > cermat) {
      this.mode = 'lari'
      this.garisLari = k
      this.lariPulang = a.pulang
      this.serong = arah
      this.target = this.ujungLari(a, arah, by, lap)
      return
    }

    // Menunggu: bergeser ke kiri-kanan di depan garis, berbalik di tepi atau untuk memancing.
    this.mode = 'tunggu'
    const tepi = 32
    let kiri = lap.x0 + tepi
    let kanan = lap.x1 - tepi
    // Sodor bisa menjangkau tempat menunggu: garis tengah dianggap tembok.
    const sodor = penjaga.find((p) => p.jenis === 'sodor')
    const [yMin, yMax] = batasSodor(lap)
    const terjangkau = wy > yMin - R_SENTUH - 8 && wy < yMax + R_SENTUH + 8
    if (sodor && terjangkau && Math.abs(sodor.y - wy) < R_SENTUH + 70) {
      const pinggir = R_SENTUH + 16
      if (a.x < lap.tengahX) kanan = lap.tengahX - pinggir
      else kiri = lap.tengahX + pinggir
    }
    const jaga = penjaga.find((p) => p.jenis === 'garis' && p.garis === k)
    if (a.x <= kiri + 8) this.geser = 1
    else if (a.x >= kanan - 8) this.geser = -1
    else if (jaga && Math.abs(jaga.x - a.x) < 100 && Math.sign(jaga.laju) === this.geser && this.acak() < this.p.pancing) {
      // Memancing: penjaga ikut berlari searah, lalu berbalik tiba-tiba.
      this.geser = this.geser === 1 ? -1 : 1
    }
    // Masih jauh dari tempat menunggu: datangi dulu (jangan berlari menyusuri garis yang baru dilewati).
    this.target = Math.abs(a.y - wy) > 24 ? { x: batas(a.x, kiri, kanan), y: wy } : { x: this.geser > 0 ? kanan : kiri, y: wy }
  }

  /** Titik tujuan lari serong `s` (x per 1 satuan y) sampai baris y = by. */
  private ujungLari(a: Penyerang, s: number, by: number, lap: Lapangan): Titik {
    return { x: batas(a.x + s * Math.abs(by - a.y), lap.x0 + 30, lap.x1 - 30), y: by }
  }

  /**
   * Jarak terdekat (dikurangi jangkauan sentuh) antara penyerang dan penjaga
   * mana pun selama lari serong `s` sampai by, dengan membayangkan penjaga
   * mengejar setelah jeda reaksi yang ditebak. Makin besar makin aman.
   */
  private celah(a: Penyerang, s: number, by: number, penjaga: Penjaga[], lap: Lapangan) {
    const v = this.p.kecepatan
    const tujuan = this.ujungLari(a, s, by, lap)
    const panjang = Math.hypot(tujuan.x - a.x, tujuan.y - a.y)
    if (panjang < 1) return -Infinity
    const ux = (tujuan.x - a.x) / panjang
    const uy = (tujuan.y - a.y) / panjang
    const lama = panjang / v
    const dt = 1 / 30
    const reaksi = this.p.tebakReaksi
    const pos = (t: number) => {
      const d = Math.min(lama, Math.max(0, t)) * v
      return { x: a.x + ux * d, y: a.y + uy * d }
    }
    const [yMin, yMax] = batasSodor(lap)
    let min = Infinity
    for (const g of penjaga) {
      const sodor = g.jenis === 'sodor'
      let gp = sodor ? g.y : g.x
      const cepat = g.profil.kecepatan
      for (let t = 0; t <= lama + dt; t += dt) {
        // Penjaga mengejar posisi penyerang `reaksi` detik sebelumnya (sebelum lari = posisi sekarang).
        const lihat = pos(t - reaksi)
        gp = menuju(gp, sodor ? lihat.y : lihat.x, cepat * dt)
        gp = sodor ? batas(gp, yMin, yMax) : batas(gp, lap.x0, lap.x1)
        const p = pos(t)
        const d = sodor ? Math.hypot(p.x - g.x, p.y - gp) : Math.hypot(p.x - gp, p.y - g.y)
        if (d < min) min = d
      }
    }
    return min - R_SENTUH
  }
}

// ── Pertandingan ──────────────────────────────────────────

/** Tim yang menyerang di ronde ke-r (mulai 0): tim pemain utama (0) lebih dulu, lalu bergantian. */
export const timPenyerang = (r: number): 0 | 1 => (r % 2 === 0 ? 0 : 1)

/** Pemenang dari poin dua tim: 0, 1, atau null jika seri. */
export function pemenang(poin: readonly [number, number]): 0 | 1 | null {
  if (poin[0] === poin[1]) return null
  return poin[0] > poin[1] ? 0 : 1
}

export function acakBerbenih(benih: number) {
  let s = benih >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
