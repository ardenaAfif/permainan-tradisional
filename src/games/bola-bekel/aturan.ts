/**
 * Aturan Bola Bekel tanpa Phaser: kebutuhan biji per lemparan, penilaian
 * sentuhan dan tangkapan, lintasan bola, kekuatan lemparan, penyebaran biji,
 * dan rencana komputer.
 */
import {
  JENDELA_TANGKAP,
  JUMLAH_BIJI,
  LAMA_ISI,
  LAMA_MAKS,
  LAMA_MIN,
  R_WAKTU_AKHIR,
  R_WAKTU_AWAL,
  SISI,
  SWIPE_MIN,
  SWIPE_V_MAKS,
  SWIPE_V_MIN,
  type Tahap,
} from './config'

export interface Letak {
  u: number
  v: number
}

export interface Biji {
  /**
   * Posisi ternormalisasi di tikar (0..1), satu per tata letak (0 = mendatar,
   * 1 = tegak), supaya biji tetap tersebar rapi saat HP diputar.
   */
  letak: Letak[]
  /** Sisi yang menghadap ke atas (indeks SISI). */
  sisi: number
  diambil: boolean
  /** Putaran gambar (radian), hanya hiasan. */
  sudut: number
}

const batas = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))

// ── Tahap ─────────────────────────────────────────────────

/** Biji yang masih harus dikerjakan di tahap ini (belum diambil / belum menghadap sisi tujuan). */
export function sisaBiji(tahap: Tahap, biji: Biji[]): number {
  if (tahap.jenis === 'ambil') return biji.filter((b) => !b.diambil).length
  return biji.filter((b) => b.sisi !== tahap.sisi).length
}

/** Jumlah biji yang harus diambil/dibalik pada lemparan ini (lemparan terakhir cukup sisanya). */
export function kebutuhan(tahap: Tahap, biji: Biji[]): number {
  const sisa = sisaBiji(tahap, biji)
  return tahap.jumlah === 'semua' ? sisa : Math.min(tahap.jumlah, sisa)
}

export const tahapTuntas = (tahap: Tahap, biji: Biji[]) => sisaBiji(tahap, biji) === 0

/** Kalimat perintah tahap, mis. "Ambil 2 biji tiap lemparan". */
export function perintahTahap(tahap: Tahap): string {
  const sisi = SISI[tahap.sisi ?? 0] ?? ''
  if (tahap.jenis === 'balik') {
    return tahap.jumlah === 'semua'
      ? `Balik semua biji ke sisi ${sisi} sekali lempar`
      : `Balik ${tahap.jumlah} biji ke sisi ${sisi} tiap lemparan`
  }
  return tahap.jumlah === 'semua' ? 'Ambil semua biji sekali lempar' : `Ambil ${tahap.jumlah} biji tiap lemparan`
}

export type HasilSentuh = 'ambil' | 'balik' | 'lebih' | 'salah' | 'abaikan'

/**
 * Menyentuh biji ke-i selama bola di udara. `sudah` = biji yang sudah
 * dikerjakan di lemparan ini, `dibalik` = biji yang dibalik di lemparan ini
 * (disentuh lagi = diabaikan, bukan salah).
 */
export function sentuhBiji(tahap: Tahap, biji: Biji[], i: number, sudah: number, perlu: number, dibalik: ReadonlySet<number>): HasilSentuh {
  const b = biji[i]
  if (!b || b.diambil) return 'abaikan'
  if (tahap.jenis === 'balik') {
    if (dibalik.has(i)) return 'abaikan'
    if (b.sisi === tahap.sisi) return 'salah'
    return sudah >= perlu ? 'lebih' : 'balik'
  }
  return sudah >= perlu ? 'lebih' : 'ambil'
}

// ── Bola ──────────────────────────────────────────────────

/** Lama bola di udara untuk kekuatan 0..1. */
export const lamaUdara = (kekuatan: number) => LAMA_MIN + (LAMA_MAKS - LAMA_MIN) * batas(kekuatan)

/** Lama jendela tangkap (bola di dalam cincin) di akhir lemparan; menyempit untuk lemparan tinggi. */
export const jendelaTangkap = (lama: number) => (JENDELA_TANGKAP * LAMA_MIN) / lama

export type NilaiTangkap = 'cepat' | 'pas' | 'jatuh'

export function nilaiTangkap(t: number, lama: number): NilaiTangkap {
  if (t >= lama) return 'jatuh'
  return t < lama - jendelaTangkap(lama) ? 'cepat' : 'pas'
}

export type HasilTangkap = 'tangkap' | 'kurang' | 'cepat' | 'jatuh'

/** Tap bola pada waktu t: biji harus lengkap dulu, lalu bola harus di dalam cincin. */
export function tangkap(t: number, lama: number, sudah: number, perlu: number): HasilTangkap {
  if (t >= lama) return 'jatuh'
  if (sudah < perlu) return 'kurang'
  return nilaiTangkap(t, lama) === 'pas' ? 'tangkap' : 'cepat'
}

/**
 * Ketinggian bola 0..1 (parabola; 1 = puncak lemparan terkuat). Lemparan
 * lebih lama naik lebih tinggi (tinggi ∝ lama²), seperti bola sungguhan.
 */
export function tinggiBola(t: number, lama: number): number {
  const f = batas(t / lama)
  return 4 * f * (1 - f) * (lama / LAMA_MAKS) ** 2
}

/**
 * Jari-jari lingkaran waktu: menyusut lurus dari R_WAKTU_AWAL saat dilempar
 * ke R_WAKTU_AKHIR saat bola menyentuh lantai.
 */
export const jariWaktu = (t: number, lama: number) => R_WAKTU_AKHIR + (R_WAKTU_AWAL - R_WAKTU_AKHIR) * (1 - batas(t / lama))

/** Cincin tangkap = rentang jari-jari lingkaran waktu selama jendela tangkap. */
export function cincinTangkap(lama: number): { luar: number; dalam: number } {
  return { luar: jariWaktu(lama - jendelaTangkap(lama), lama), dalam: R_WAKTU_AKHIR }
}

// ── Kekuatan lemparan ─────────────────────────────────────

/**
 * Kekuatan swipe dari jarak ke atas (px layar) dan kecepatannya (px layar/ms).
 * null jika bukan swipe ke atas (terlalu pendek atau lebih banyak menyamping).
 */
export function kekuatanSwipe(atas: number, samping: number, kecepatan: number): number | null {
  if (atas < SWIPE_MIN || atas < Math.abs(samping) * 0.8) return null
  return batas((kecepatan - SWIPE_V_MIN) / (SWIPE_V_MAKS - SWIPE_V_MIN))
}

/** Kekuatan dari lamanya Spasi ditahan. */
export const kekuatanTahan = (ms: number) => batas(ms / LAMA_ISI)

// ── Menyebar biji ─────────────────────────────────────────

/** Aturan sebar untuk satu tata letak. */
export interface AturanSebar {
  /** Jarak (px panggung) antara dua titik ternormalisasi. */
  jarak(a: Letak, b: Letak): number
  /** false jika titik terlalu dekat dengan tempat bola / penghitung. */
  bebas(u: number, v: number): boolean
  minJarak: number
}

/** Titik acak yang saling berjauhan di satu tata letak. */
export function sebarTitik(aturan: AturanSebar, jumlah: number, acak: () => number = Math.random): Letak[] {
  const titik: Letak[] = []
  let min = aturan.minJarak
  for (let coba = 1; titik.length < jumlah; coba++) {
    // Tikar terlalu penuh: longgarkan jarak sedikit demi sedikit.
    if (coba % 300 === 0) min *= 0.9
    const p = { u: acak(), v: acak() }
    if (!aturan.bebas(p.u, p.v)) continue
    if (titik.every((q) => aturan.jarak(p, q) >= min)) titik.push(p)
  }
  return titik
}

/**
 * Sebar biji secara acak di setiap tata letak. Tahap balik: sebagian besar
 * biji (setengah sampai semua kurang satu) menghadap sisi lain, sisanya sudah
 * menghadap sisi tujuan.
 */
export function sebarBiji(tahap: Tahap, aturan: AturanSebar[], acak: () => number = Math.random, jumlah = JUMLAH_BIJI): Biji[] {
  const letak = aturan.map((a) => sebarTitik(a, jumlah, acak))
  // Urut kiri → kanan di tata letak pertama: nomor tombol keyboard 1..6 jadi mudah dicari.
  const urut = letak[0] ? letak[0].map((_, i) => i).sort((a, b) => letak[0]![a]!.u - letak[0]![b]!.u) : []
  const titik = urut.map((i) => letak.map((l) => l[i]!))

  const nSisi = SISI.length
  let sisi: number[]
  if (tahap.jenis === 'balik') {
    const tujuan = tahap.sisi ?? 0
    const minSalah = Math.ceil(jumlah / 2)
    const salah = minSalah + Math.floor(acak() * Math.max(1, jumlah - minSalah))
    sisi = titik.map((_, i) => (i < salah ? (tujuan + 1 + Math.floor(acak() * (nSisi - 1))) % nSisi : tujuan))
    // Acak urutannya supaya biji "benar" tidak selalu di tempat yang sama.
    for (let i = sisi.length - 1; i > 0; i--) {
      const j = Math.floor(acak() * (i + 1))
      ;[sisi[i], sisi[j]] = [sisi[j]!, sisi[i]!]
    }
  } else {
    sisi = titik.map(() => Math.floor(acak() * nSisi))
  }
  return titik.map((l, i) => ({ letak: l, sisi: sisi[i]!, diambil: false, sudut: (acak() - 0.5) * 0.7 }))
}

// ── Komputer ──────────────────────────────────────────────

export type GagalCpu = 'jatuh' | 'cepat' | 'kurang' | 'lebih' | 'salah'

export interface RencanaCpu {
  kekuatan: number
  /** Biji yang disentuh, urut, dan waktunya (ms sejak bola lepas). */
  ketuk: { biji: number; t: number }[]
  /** Waktu menangkap, atau null (bola dibiarkan jatuh). */
  tangkap: number | null
  gagal: GagalCpu | null
}

/** Satu lemparan komputer: berhasil dengan peluang `peluang`, jika tidak pilih satu jenis kesalahan. */
export function rencanaCpu(tahap: Tahap, biji: Biji[], peluang: number, acak: () => number = Math.random): RencanaCpu {
  const perlu = kebutuhan(tahap, biji)
  const calon = biji.flatMap((b, i) => (!b.diambil && (tahap.jenis === 'ambil' || b.sisi !== tahap.sisi) ? [i] : []))
  const benar = tahap.jenis === 'balik' ? biji.flatMap((b, i) => (b.sisi === tahap.sisi ? [i] : [])) : []
  for (let i = calon.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1))
    ;[calon[i], calon[j]] = [calon[j]!, calon[i]!]
  }

  let gagal: GagalCpu | null = null
  if (acak() >= peluang) {
    const bisa: GagalCpu[] = ['jatuh', 'cepat', 'kurang']
    if (calon.length > perlu) bisa.push('lebih')
    if (benar.length) bisa.push('salah')
    gagal = bisa[Math.floor(acak() * bisa.length)]!
  }

  const kekuatan = batas(0.25 + 0.12 * perlu + acak() * 0.2)
  const lama = lamaUdara(kekuatan)
  const jendela = jendelaTangkap(lama)
  const awalTangkap = lama - jendela

  let pilih = calon.slice(0, perlu)
  if (gagal === 'kurang') pilih = pilih.slice(0, Math.max(0, perlu - 1))
  if (gagal === 'lebih') pilih = calon.slice(0, perlu + 1)
  if (gagal === 'salah') {
    const di = Math.floor(acak() * (pilih.length + 1))
    pilih = [...pilih.slice(0, di), benar[Math.floor(acak() * benar.length)]!, ...pilih.slice(di)]
  }

  const mulai = lama * 0.18
  const akhir = awalTangkap - (gagal === 'cepat' ? 320 : 140)
  const selang = pilih.length > 1 ? (akhir - mulai) / (pilih.length - 1) : 0
  const ketuk = pilih.map((b, i) => ({ biji: b, t: mulai + selang * i + (acak() - 0.5) * selang * 0.3 }))

  let tangkapPada: number | null = awalTangkap + jendela * (0.3 + acak() * 0.4)
  if (gagal === 'jatuh') tangkapPada = null
  if (gagal === 'cepat') tangkapPada = awalTangkap - 120 - acak() * 120
  return { kekuatan, ketuk, tangkap: tangkapPada, gagal }
}

// ── Hasil ─────────────────────────────────────────────────

/** Jumlah tahap tuntas dari indeks tahap sekarang (0-based). */
export const tahapSelesai = (tahap: number, jumlahTahap: number) => Math.min(jumlahTahap, Math.max(0, tahap))
