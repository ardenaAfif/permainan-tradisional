/**
 * Logika Pecah Balon Air tanpa Phaser (diuji di aturan.test.ts): gerak pelari,
 * tabrakan dengan rintangan, meter tekanan balon, teman pengapit, dan rencana
 * bayangan pelari tim komputer. Adegan memanggil maju(deltaMs); simulasi
 * berjalan dengan langkah tetap 1/60 detik supaya hasilnya sama di HP 30 fps
 * maupun laptop 60 fps.
 */
import {
  A_AMAN,
  A_CPU,
  GENANGAN_LAJU,
  GENANGAN_RESPON,
  JARAK_APIT,
  JEDA_PECAH,
  K_AKSEL,
  K_APIT,
  K_BENTUR,
  K_GENANGAN,
  K_TITIAN,
  OMEGA_TEMAN,
  PENGALI_TEPI,
  R_BADAN,
  R_SAMPAI,
  RESPON,
  SELISIH_SERI,
  TOLERANSI_APIT,
  TURUN_DIAM,
  TURUN_JALAN,
  V_BENTUR_MIN,
  V_JALAN,
  V_MAKS,
  V_TITIAN,
  type Cara,
  type ProfilCpu,
} from './config'
import { buatJalur, diGenangan, diTitian, dindingParit, titikDi, type Jalur, type Kotak, type Lintasan, type Titik } from './lintasan'

export const LANGKAH_MS = 1000 / 60
const DT = LANGKAH_MS / 1000

export type StatusPelari = 'jalan' | 'pecah' | 'sampai'

export type Peristiwa =
  | { jenis: 'bentur'; kuat: number }
  | { jenis: 'genangan' }
  | { jenis: 'pecah'; x: number; y: number }
  | { jenis: 'baru'; balon: number }
  | { jenis: 'sampai' }

const batas = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Gerakkan nilai menuju tujuan paling jauh `maks`. */
export function menuju(dari: number, ke: number, maks: number) {
  return Math.abs(ke - dari) <= maks ? ke : dari + Math.sign(ke - dari) * maks
}

/** Jejak langkah pelari (untuk teman pengapit yang menyusul di belakangnya). */
class Jejak implements Jalur {
  titik: Titik[] = []
  s: number[] = []
  panjang = 0

  mulai(dari: Titik, ke: Titik) {
    this.titik = [{ ...dari }, { ...ke }]
    this.panjang = Math.hypot(ke.x - dari.x, ke.y - dari.y)
    this.s = [0, this.panjang]
  }

  /** Jarak kumulatif sampai titik p (tanpa mencatatnya jika belum cukup jauh). */
  catat(p: Titik): number {
    const akhir = this.titik[this.titik.length - 1]!
    const d = Math.hypot(p.x - akhir.x, p.y - akhir.y)
    if (d < 2) return this.panjang + d
    this.titik.push({ ...p })
    this.panjang += d
    this.s.push(this.panjang)
    return this.panjang
  }
}

export interface OpsiPelari {
  lintasan: Lintasan
  cara: Cara
}

/** Satu pelari estafet (dan teman pengapitnya) di satu putaran. */
export class LogikaPelari {
  readonly l: Lintasan
  readonly cara: Cara
  x: number
  y: number
  vx = 0
  vy = 0
  /** 0..1; penuh = balon pecah. */
  tekanan = 0
  /** Seberapa keras balon sedang tertekan (0..1, dihaluskan), untuk tampilan. */
  goyang = 0
  status: StatusPelari = 'jalan'
  /** Balon yang sudah dipakai di putaran ini (termasuk yang sedang dibawa). */
  balon = 1
  /** Waktu putaran (ms) sejak peluit sampai tiba di keranjang. */
  waktu = 0
  /** Kendali: arah gerak yang diminta pemain (panjang ≤ 1), sebelum dibalik. */
  arah: Titik = { x: 0, y: 0 }
  /** Posisi teman pengapit (cara diapit), selain itu null. */
  teman: Titik | null = null
  diGenangan = false
  diTitian = false
  private sisa = 0
  private sisaPecah = 0
  private jedaBentur = 0
  private dinding: Kotak[]
  private jejak = new Jejak()
  private sPelari = 0
  private sTeman = 0
  private vTeman = 0

  constructor(o: OpsiPelari) {
    this.l = o.lintasan
    this.cara = o.cara
    this.x = o.lintasan.start.x
    this.y = o.lintasan.start.y
    this.dinding = dindingParit(o.lintasan)
    this.mulaiLagi()
  }

  get laju() {
    return Math.hypot(this.vx, this.vy)
  }

  /** Jalankan simulasi selama `dtMs`; kembalikan peristiwa yang terjadi. */
  maju(dtMs: number): Peristiwa[] {
    const ev: Peristiwa[] = []
    this.sisa += dtMs
    while (this.sisa >= LANGKAH_MS) {
      this.sisa -= LANGKAH_MS
      this.langkah(ev)
    }
    return ev
  }

  /** Kembali ke START dengan balon utuh (awal putaran / setelah pecah). */
  private mulaiLagi() {
    const s = this.l.start
    this.x = s.x
    this.y = s.y
    this.vx = 0
    this.vy = 0
    this.tekanan = 0
    this.goyang = 0
    this.status = 'jalan'
    if (this.cara.berpasangan) {
      // Teman berdiri sejarak JARAK_APIT di belakang (kiri) pelari.
      this.jejak.mulai({ x: s.x - JARAK_APIT, y: s.y }, s)
      this.sPelari = this.jejak.panjang
      this.sTeman = 0
      this.vTeman = 0
      this.teman = { x: s.x - JARAK_APIT, y: s.y }
    }
  }

  private langkah(ev: Peristiwa[]) {
    if (this.status === 'sampai') return
    this.waktu += LANGKAH_MS
    if (this.status === 'pecah') {
      this.sisaPecah -= LANGKAH_MS
      if (this.sisaPecah <= 0) {
        this.balon++
        this.mulaiLagi()
        ev.push({ jenis: 'baru', balon: this.balon })
      }
      return
    }
    const c = this.cara
    const pos = { x: this.x, y: this.y }
    const genang = diGenangan(this.l, pos)
    if (genang && !this.diGenangan) ev.push({ jenis: 'genangan' })
    this.diGenangan = genang
    this.diTitian = diTitian(this.l, pos)

    // Kecepatan mendekati arah kendali dengan halus.
    const vmaks = V_MAKS * c.laju * (genang ? GENANGAN_LAJU : 1)
    const k = RESPON * (genang ? GENANGAN_RESPON : 1)
    let ax = this.arah.x
    let ay = this.arah.y
    const p = Math.hypot(ax, ay)
    if (p > 1) {
      ax /= p
      ay /= p
    }
    if (c.terbalik) {
      ax = -ax
      ay = -ay
    }
    const f = 1 - Math.exp(-k * DT)
    const nvx = this.vx + (ax * vmaks - this.vx) * f
    const nvy = this.vy + (ay * vmaks - this.vy) * f
    const aksel = Math.hypot(nvx - this.vx, nvy - this.vy) / DT
    let naik = Math.max(0, aksel - A_AMAN) * K_AKSEL * DT
    this.vx = nvx
    this.vy = nvy
    this.x += this.vx * DT
    this.y += this.vy * DT

    // Benturan: batu dan parit keras, pagar tepi lebih empuk.
    const bentur = this.tabrakan()
    this.jedaBentur -= LANGKAH_MS
    if (bentur.laju > V_BENTUR_MIN) {
      const kuat = K_BENTUR * bentur.pengali * Math.min(1.4, bentur.laju / V_MAKS)
      naik += kuat
      if (this.jedaBentur <= 0) ev.push({ jenis: 'bentur', kuat })
      this.jedaBentur = 250
    }

    const laju = this.laju
    if (genang) naik += (Math.max(0, laju - 40) / V_MAKS) * K_GENANGAN * DT
    if (this.diTitian) naik += (Math.max(0, laju - V_TITIAN) / V_MAKS) * K_TITIAN * DT
    if (c.berpasangan) naik += this.majuTeman()
    naik *= c.peka

    if (naik > 1e-5) this.tekanan += naik
    else this.tekanan -= (laju > V_JALAN ? TURUN_JALAN : TURUN_DIAM) * DT
    this.tekanan = batas(this.tekanan, 0, 1)
    // Goyang = laju kenaikan tekanan (per detik), dihaluskan.
    this.goyang += (Math.min(1, naik / DT / 0.8) - this.goyang) * Math.min(1, DT * 8)

    if (this.tekanan >= 1) {
      this.status = 'pecah'
      this.sisaPecah = JEDA_PECAH
      this.vx = 0
      this.vy = 0
      this.goyang = 0
      const b = this.posBalon()
      ev.push({ jenis: 'pecah', x: b.x, y: b.y })
      return
    }
    const kr = this.l.keranjang
    if (Math.hypot(this.x - kr.x, this.y - kr.y) < R_SAMPAI) {
      this.status = 'sampai'
      this.vx = 0
      this.vy = 0
      this.goyang = 0
      ev.push({ jenis: 'sampai' })
    }
  }

  /** Titik tengah balon di tanah (antara dua pengapit, atau di kaki pelari). */
  posBalon(): Titik {
    if (this.teman) return { x: (this.x + this.teman.x) / 2, y: (this.y + this.teman.y) / 2 }
    return { x: this.x, y: this.y }
  }

  /** Dorong pelari keluar dari rintangan; kembalikan laju benturan terbesar (tegak lurus). */
  private tabrakan(): { laju: number; pengali: number } {
    let laju = 0
    let pengali = 1
    const tumbuk = (nx: number, ny: number, mult: number) => {
      const vn = this.vx * nx + this.vy * ny
      if (vn >= 0) return
      this.vx -= vn * nx
      this.vy -= vn * ny
      if (-vn > laju) {
        laju = -vn
        pengali = mult
      }
    }
    const l = this.l
    for (const b of l.batu) {
      const dx = this.x - b.x
      const dy = this.y - b.y
      const d = Math.hypot(dx, dy)
      const min = b.r + R_BADAN
      if (d >= min) continue
      const nx = d > 0 ? dx / d : -1
      const ny = d > 0 ? dy / d : 0
      this.x = b.x + nx * min
      this.y = b.y + ny * min
      tumbuk(nx, ny, 1)
    }
    for (const k of this.dinding) {
      const cx = batas(this.x, k.x0, k.x1)
      const cy = batas(this.y, k.y0, k.y1)
      const dx = this.x - cx
      const dy = this.y - cy
      const d = Math.hypot(dx, dy)
      if (d >= R_BADAN) continue
      let nx: number
      let ny: number
      if (d > 0) {
        nx = dx / d
        ny = dy / d
        this.x = cx + nx * R_BADAN
        this.y = cy + ny * R_BADAN
      } else {
        // Titik kaki di dalam parit: keluar lewat sisi terdekat.
        const sisi = [this.x - k.x0, k.x1 - this.x, this.y - k.y0, k.y1 - this.y]
        const i = sisi.indexOf(Math.min(...sisi))
        nx = i === 0 ? -1 : i === 1 ? 1 : 0
        ny = i === 2 ? -1 : i === 3 ? 1 : 0
        if (i === 0) this.x = k.x0 - R_BADAN
        if (i === 1) this.x = k.x1 + R_BADAN
        if (i === 2) this.y = k.y0 - R_BADAN
        if (i === 3) this.y = k.y1 + R_BADAN
      }
      tumbuk(nx, ny, 1)
    }
    if (this.y < l.yAtas) {
      this.y = l.yAtas
      tumbuk(0, 1, PENGALI_TEPI)
    } else if (this.y > l.yBawah) {
      this.y = l.yBawah
      tumbuk(0, -1, PENGALI_TEPI)
    }
    if (this.x < l.xMin) {
      this.x = l.xMin
      tumbuk(1, 0, PENGALI_TEPI)
    } else if (this.x > l.xMaks) {
      this.x = l.xMaks
      tumbuk(-1, 0, PENGALI_TEPI)
    }
    return { laju, pengali }
  }

  /**
   * Teman pengapit menyusuri jejak pelari sejarak JARAK_APIT di belakangnya
   * (pegas teredam kritis, jadi menyusul sedikit terlambat). Kembalikan
   * kenaikan tekanan jika jarak keduanya terlalu jauh atau terlalu dekat.
   */
  private majuTeman(): number {
    const sBaru = this.jejak.catat({ x: this.x, y: this.y })
    const vPelari = (sBaru - this.sPelari) / DT
    this.sPelari = sBaru
    const tujuan = Math.max(0, sBaru - JARAK_APIT)
    const a = OMEGA_TEMAN * OMEGA_TEMAN * (tujuan - this.sTeman) + 2 * OMEGA_TEMAN * (vPelari - this.vTeman)
    this.vTeman += a * DT
    this.sTeman = batas(this.sTeman + this.vTeman * DT, 0, sBaru)
    this.teman = titikDi(this.jejak, this.sTeman)
    const d = Math.hypot(this.x - this.teman.x, this.y - this.teman.y)
    const lebih = Math.abs(d - JARAK_APIT) - TOLERANSI_APIT
    return Math.max(0, lebih) * K_APIT * DT
  }
}

// ── Bayangan pelari (tim komputer) ────────────────────────

export interface RencanaBayangan {
  jalur: Jalur
  /** Jarak tempuh di jalur pada setiap langkah 1/60 detik. */
  s: number[]
  /** Rentang langkah saat balon bayangan pecah (diam di tempat), atau null. */
  pecah: [number, number] | null
  /** Balon yang dipakai. */
  balon: number
  /** Waktu putaran (ms). */
  waktu: number
}

/**
 * Rencana lari komputer di satu putaran: menyusuri jalur bebas rintangan
 * dengan percepatan halus, melambat di genangan dan papan titian, dan
 * kadang balonnya pecah sekali lalu mengulang dari START.
 */
export function rencanaBayangan(l: Lintasan, cara: Cara, profil: ProfilCpu, acak: () => number): RencanaBayangan {
  const j = buatJalur(l.jalur)
  const vmaks = V_MAKS * cara.laju
  const batasLaju = (s: number) => {
    const p = titikDi(j, s)
    let v = vmaks * profil.tempo
    if (diGenangan(l, p)) v = Math.min(v, vmaks * GENANGAN_LAJU * 0.9)
    if (diTitian(l, p)) v = Math.min(v, V_TITIAN * 0.95)
    return v
  }
  const titikPecah = acak() < Math.min(0.9, profil.pecah * cara.peka) ? (0.3 + acak() * 0.5) * j.panjang : null
  const kr = l.keranjang
  const s: number[] = []
  let jarak = 0
  let v = 0
  let pecah: [number, number] | null = null
  let balon = 1
  const BATAS_LANGKAH = 60 * 600
  while (s.length < BATAS_LANGKAH) {
    s.push(jarak)
    const p = titikDi(j, jarak)
    if (Math.hypot(p.x - kr.x, p.y - kr.y) < R_SAMPAI) break
    if (titikPecah !== null && !pecah && jarak >= titikPecah) {
      const mulai = s.length
      const lama = Math.round(JEDA_PECAH / LANGKAH_MS)
      for (let i = 0; i < lama; i++) s.push(jarak)
      pecah = [mulai, s.length]
      balon++
      jarak = 0
      v = 0
      continue
    }
    // Melambat lebih dulu sebelum genangan / papan titian di depan.
    let tujuan = batasLaju(jarak)
    for (let d = 12; d < 170; d += 12) tujuan = Math.min(tujuan, Math.sqrt(batasLaju(jarak + d) ** 2 + 2 * A_CPU * d))
    v = menuju(v, tujuan, A_CPU * DT)
    jarak += v * DT
  }
  return { jalur: j, s, pecah, balon, waktu: s.length * LANGKAH_MS }
}

export interface PosBayangan {
  pelari: Titik
  /** Teman pengapit (cara diapit). */
  teman: Titik | null
  status: StatusPelari
  balon: number
}

/** Posisi bayangan pada waktu putaran `t` (ms). */
export function posBayangan(r: RencanaBayangan, l: Lintasan, berpasangan: boolean, t: number): PosBayangan {
  const i = Math.min(r.s.length - 1, Math.max(0, Math.floor(t / LANGKAH_MS)))
  const jarak = r.s[i]!
  const pelari = titikDi(r.jalur, jarak)
  let teman: Titik | null = null
  if (berpasangan) {
    teman = jarak >= JARAK_APIT ? titikDi(r.jalur, jarak - JARAK_APIT) : { x: l.start.x - (JARAK_APIT - jarak), y: l.start.y }
  }
  const sudahPecah = !!r.pecah && i >= r.pecah[1]
  const status: StatusPelari = t >= r.waktu - LANGKAH_MS ? 'sampai' : r.pecah && i >= r.pecah[0] && i < r.pecah[1] ? 'pecah' : 'jalan'
  return { pelari, teman, status, balon: sudahPecah ? r.balon : 1 }
}

// ── Hasil ─────────────────────────────────────────────────

/** Tim tercepat (waktu total terkecil), atau null jika selisihnya di bawah SELISIH_SERI. */
export function pemenang(waktu: readonly [number, number]): 0 | 1 | null {
  if (Math.abs(waktu[0] - waktu[1]) < SELISIH_SERI) return null
  return waktu[0] < waktu[1] ? 0 : 1
}

/** "1:05,3" — menit:detik,persepuluh (ms dibulatkan ke bawah). */
export function formatWaktu(ms: number): string {
  const ds = Math.floor(Math.max(0, ms) / 100)
  const m = Math.floor(ds / 600)
  const d = Math.floor((ds % 600) / 10)
  return `${m}:${String(d).padStart(2, '0')},${ds % 10}`
}

export function acakBerbenih(benih: number) {
  let s = benih >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
