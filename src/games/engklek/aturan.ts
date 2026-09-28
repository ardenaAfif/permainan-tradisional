/**
 * Aturan Sunda Manda / Engklek tanpa Phaser: urutan lompatan per level,
 * meter lempar, lingkaran timing, jarum keseimbangan, dan rencana komputer.
 */
import {
  BAGIAN_TEPAT,
  CINCIN_AKHIR,
  CINCIN_AWAL,
  JENDELA_PAS,
  KAKI_PUTAR,
  PERIODE_JARUM,
  R_AWAL,
  R_TEPAT,
  SAPUAN_AKHIR,
  SAPUAN_AWAL,
  SUDUT_AWAL,
  SUDUT_MAKS,
  SUDUT_TUMBUH,
  ZONA_TENGAH,
} from './config'

export type Kaki = 'satu' | 'dua'

export interface Pola {
  /** Baris dari garis mulai ke ujung; tiap baris berisi nomor kotak (1 = tunggal, 2+ = berpasangan). */
  baris: number[][]
  /** Ada setengah lingkaran di ujung untuk berbalik. */
  putar: boolean
}

/** Satu lompatan: mendarat di baris `baris` (= jumlah baris untuk setengah lingkaran). */
export interface Langkah {
  baris: number
  /** Kotak yang diinjak (kosong untuk setengah lingkaran). */
  kotak: number[]
  kaki: Kaki
  arah: 'maju' | 'balik'
  /** Setelah mendarat di sini, gacuk diambil (kotak bergacuk ada di lompatan berikutnya). */
  ambil: boolean
}

export const jumlahKotak = (pola: Pola) => pola.baris.reduce((n, b) => n + b.length, 0)

export function barisKotak(pola: Pola, kotak: number): number {
  return pola.baris.findIndex((b) => b.includes(kotak))
}

/** Pola sah: nomor kotak urut 1..N tanpa loncat, tiap baris berisi 1–2 kotak. */
export function polaSah(pola: Pola): boolean {
  const semua = pola.baris.flat()
  return (
    semua.length > 0 &&
    pola.baris.every((b) => b.length >= 1 && b.length <= 2) &&
    semua.every((k, i) => k === i + 1)
  )
}

/**
 * Urutan lompatan untuk level `target` (nomor kotak bergacuk): maju baris demi
 * baris tanpa menginjak kotak bergacuk, berbalik di setengah lingkaran (atau di
 * baris terakhir), lalu kembali. Gacuk diambil dari tempat pijakan tepat sebelum
 * baris bergacuk; setelah itu kotaknya boleh diinjak. Lompatan keluar dari
 * kotak pertama ke garis mulai tidak termasuk (otomatis).
 */
export function susunLangkah(pola: Pola, target: number): Langkah[] {
  const n = pola.baris.length
  const barisGacuk = barisKotak(pola, target)
  const hasil: Langkah[] = []
  const tambah = (baris: number, kotak: number[], arah: Langkah['arah']) =>
    hasil.push({ baris, kotak, kaki: kotak.length > 1 ? 'dua' : 'satu', arah, ambil: false })
  const pijakan = (i: number, adaGacuk: boolean) => pola.baris[i]!.filter((k) => !(adaGacuk && k === target))

  for (let i = 0; i < n; i++) {
    const k = pijakan(i, true)
    if (k.length) tambah(i, k, 'maju')
  }
  if (pola.putar) hasil.push({ baris: n, kotak: [], kaki: KAKI_PUTAR, arah: 'maju', ambil: false })
  const iBalik = hasil.length - 1
  const titikBalik = hasil[iBalik]?.baris ?? 0

  let diambil = false
  for (let i = titikBalik - 1; i >= 0; i--) {
    if (i === barisGacuk && !diambil) {
      hasil[hasil.length - 1]!.ambil = true
      diambil = true
    }
    const k = pijakan(i, !diambil)
    if (k.length) tambah(i, k, 'balik')
  }
  // Gacuk di baris terakhir tanpa setengah lingkaran: diambil di titik balik.
  if (!diambil && hasil[iBalik]) hasil[iBalik].ambil = true
  return hasil
}

// ── Fase 1: meter lempar ──────────────────────────────────

/** Jarum meter 0..1 bolak-balik (segitiga), mulai dari 0; `sapuan` = lama satu arah. */
export function posisiMeter(t: number, sapuan: number): number {
  const f = (((t / sapuan) % 2) + 2) % 2
  return f <= 1 ? f : 2 - f
}

/** Selang sepanjang level: level 1 → a, level terakhir → b. */
export function menurutLevel(level: number, jumlahLevel: number, a: number, b: number) {
  const p = jumlahLevel > 1 ? Math.min(1, Math.max(0, (level - 1) / (jumlahLevel - 1))) : 0
  return a + (b - a) * p
}

export const sapuanLevel = (level: number, jumlahLevel: number) => menurutLevel(level, jumlahLevel, SAPUAN_AWAL, SAPUAN_AKHIR)

/**
 * Meter dibagi rata menjadi ruas kotak 1..n. Tepi tiap ruas (sebesar `garis`,
 * dibagi dua sisi) adalah garis kapur: gacuk jatuh di garis antara dua kotak
 * (0 = sebelum kotak pertama, n + 1 = sesudah kotak terakhir).
 */
export type HasilLempar = { jenis: 'kotak'; kotak: number } | { jenis: 'garis'; antara: [number, number] }

export function hasilLempar(p: number, n: number, garis: number): HasilLempar {
  const x = Math.min(1, Math.max(0, p)) * n
  const ruas = Math.min(n - 1, Math.floor(x))
  const f = x - ruas
  if (f < garis / 2) return { jenis: 'garis', antara: [ruas, ruas + 1] }
  if (f > 1 - garis / 2) return { jenis: 'garis', antara: [ruas + 1, ruas + 2] }
  return { jenis: 'kotak', kotak: ruas + 1 }
}

/** Titik tengah ruas kotak `k` di meter (0..1). */
export const tengahRuas = (k: number, n: number) => (k - 0.5) / n

// ── Fase 2: lingkaran timing ──────────────────────────────

export interface Cincin {
  /** Lama lingkaran tampil. */
  lama: number
  /** Saat ideal (lingkaran pas di zona hijau). */
  tepat: number
}

export function cincinLevel(level: number, jumlahLevel: number): Cincin {
  const lama = menurutLevel(level, jumlahLevel, CINCIN_AWAL, CINCIN_AKHIR)
  return { lama, tepat: lama * BAGIAN_TEPAT }
}

/** Jari-jari lingkaran pada waktu t (menyusut lurus; tepat R_TEPAT pada saat ideal). */
export function jariCincin(t: number, c: Cincin): number {
  return Math.max(0, R_TEPAT + (R_AWAL - R_TEPAT) * (1 - t / c.tepat))
}

export type NilaiTekan = 'pas' | 'cepat' | 'lambat'

export function nilaiTekan(t: number, c: Cincin, jendela = JENDELA_PAS): NilaiTekan {
  if (t < c.tepat - jendela) return 'cepat'
  if (t > c.tepat + jendela) return 'lambat'
  return 'pas'
}

// ── Fase 3: jarum keseimbangan ────────────────────────────

/** Sudut jarum (derajat) setelah tombol AMBIL ditahan t ms; mulai miring, ayunan makin lebar. */
export function sudutJarum(t: number): number {
  const a = Math.min(SUDUT_MAKS, SUDUT_AWAL + (SUDUT_TUMBUH * t) / 1000)
  return a * Math.cos((2 * Math.PI * t) / PERIODE_JARUM)
}

export const jarumDiTengah = (sudut: number) => Math.abs(sudut) <= ZONA_TENGAH

// ── Komputer ──────────────────────────────────────────────

/**
 * Rencana satu percobaan komputer: null = berhasil, atau indeks aksi tempat
 * komputer gagal (0 = lempar, lalu tiap lompatan, lalu ambil).
 */
export function rencanaCpu(jumlahAksi: number, peluang: number, acak: () => number = Math.random): number | null {
  if (acak() < peluang) return null
  return Math.min(jumlahAksi - 1, Math.floor(acak() * jumlahAksi))
}

// ── Hasil ─────────────────────────────────────────────────

/** Jumlah level tuntas per pemain: level sekarang − 1, atau semua jika sudah tamat. */
export const levelTuntas = (level: number, jumlahLevel: number) => Math.min(jumlahLevel, Math.max(0, level - 1))
