/**
 * Angka-angka Sunda Manda / Engklek (panggung 1280x720, waktu dalam ms).
 * Ubah di sini untuk menyetel rasa permainan; aturan.test.ts memeriksa perilakunya.
 */
import type { Kesulitan } from '../../shared/types'
import type { Kaki, Pola } from './aturan'

/**
 * Pola kotak, dari garis mulai ke ujung. Satu baris = satu kotak (tunggal) atau
 * beberapa kotak berdampingan (berpasangan; urutan kiri → kanan pelompat).
 * Nomor kotak harus urut 1, 2, 3, … Ganti mengikuti pola yang dipakai siswa di
 * lapangan, mis. [[1], [2], [3, 4], [5], [6, 7]] tanpa setengah lingkaran.
 */
export const POLA: Pola = {
  baris: [[1], [2], [3], [4, 5], [6], [7, 8]],
  /** Setengah lingkaran di ujung untuk berbalik. */
  putar: true,
}
/** Mendarat di setengah lingkaran memakai kaki ini (tempat istirahat sebelum berbalik). */
export const KAKI_PUTAR: Kaki = 'dua'

// ── Fase 1: lempar gacuk ───────────────────────────────────
/** Lama jarum meter menyapu dari ujung ke ujung: level 1 → level terakhir (makin cepat). */
export const SAPUAN_AWAL = 1800
export const SAPUAN_AKHIR = 1300
/** Bagian tiap ruas meter yang dihitung garis (dibagi dua sisi). */
export const GARIS_METER = 0.1
/** Lama gacuk melayang. */
export const LAMA_LEMPAR = 650

// ── Fase 2: melompat ───────────────────────────────────────
/** Lingkaran timing menyusut dari R_AWAL, tepat di R_TEPAT pada saat ideal. */
export const R_AWAL = 112
export const R_TEPAT = 40
/** Lama lingkaran tampil (level 1 → level terakhir); saat ideal = 2/3 dari lamanya. */
export const CINCIN_AWAL = 1200
export const CINCIN_AKHIR = 1020
export const BAGIAN_TEPAT = 2 / 3
/** Zona hijau: ± sekian ms dari saat ideal. */
export const JENDELA_PAS = 150
/** Tombol/jari kedua dalam selang ini sejak yang pertama = dua kaki. */
export const JENDELA_DUA_JARI = 110
export const LAMA_LOMPAT = 300
/** Jeda setelah mendarat sebelum lingkaran berikutnya muncul. */
export const JEDA_LOMPAT = 160

// ── Fase 3: mengambil gacuk ────────────────────────────────
/** Jarum keseimbangan: sudut = A·cos(2πt/PERIODE), A tumbuh dari AWAL sampai MAKS (derajat). */
export const PERIODE_JARUM = 1500
export const SUDUT_AWAL = 30
export const SUDUT_MAKS = 72
export const SUDUT_TUMBUH = 14
/** Lepas saat |sudut| ≤ zona ini = berhasil. */
export const ZONA_TENGAH = 10
/** Ditahan lebih lama dari ini = oleng. */
export const BATAS_TAHAN = 6000

// ── Komputer & alur ────────────────────────────────────────
/** Peluang komputer menuntaskan satu level tanpa kesalahan. */
export const PELUANG_CPU: Record<Kesulitan, number> = { mudah: 0.45, sedang: 0.6, sulit: 0.75 }
/** Komputer menunggu sebelum melempar / mengambil (ms). */
export const JEDA_CPU = 700

export const JEDA_GAGAL = 1500
export const JEDA_BERHASIL = 1200
export const JEDA_HASIL = 2400

/** Tinggi karakter di panggung (px). */
export const TINGGI_KARAKTER = 150
