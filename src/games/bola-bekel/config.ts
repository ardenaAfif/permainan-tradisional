/**
 * Angka dan istilah Bola Bekel (waktu dalam ms, jarak dalam px panggung).
 * Ubah di sini untuk menyetel rasa permainan; aturan.test.ts memeriksa perilakunya.
 */
import type { Kesulitan } from '../../shared/types'

export type JenisTahap = 'ambil' | 'balik'

export interface Tahap {
  /** Nama tahap di layar. Ganti dengan istilah yang dipakai siswa (beda di tiap daerah). */
  nama: string
  /** ambil = biji diambil dari lantai; balik = biji dibalik ke sisi `sisi`. */
  jenis: JenisTahap
  /** Biji per lemparan; 'semua' = semua sisa sekaligus. Lemparan terakhir cukup mengambil sisanya. */
  jumlah: number | 'semua'
  /** Tahap balik: indeks sisi tujuan di SISI. */
  sisi?: number
}

/**
 * Nama empat sisi biji bekel, urut sesuai ikonnya (0 titik, 1 lengkung,
 * 2 silang, 3 dua garis). Sesuaikan dengan istilah siswa.
 */
export const SISI = ['Pit', 'Roti', 'Es', 'Klop'] as const

/**
 * Urutan tahap. Pemain yang gagal mengulang tahapnya dari awal pada giliran
 * berikutnya; pemain pertama yang menuntaskan tahap terakhir menang.
 * Jika tahap diubah, perbarui juga catatanWeb bola-bekel di src/data/games.json.
 */
export const TAHAP: Tahap[] = [
  { nama: 'Ambil Satu', jenis: 'ambil', jumlah: 1 },
  { nama: 'Ambil Dua', jenis: 'ambil', jumlah: 2 },
  { nama: 'Ambil Tiga', jenis: 'ambil', jumlah: 3 },
  { nama: 'Ambil Semua', jenis: 'ambil', jumlah: 'semua' },
  { nama: 'Balik Pit', jenis: 'balik', jumlah: 2, sisi: 0 },
]

export const JUMLAH_BIJI = 6

// ── Lemparan ──────────────────────────────────────────────
/** Lama bola di udara: lemparan paling lemah → paling kuat. */
export const LAMA_MIN = 1200
export const LAMA_MAKS = 2200
/**
 * Lama bola di dalam cincin tangkap (sebelum menyentuh lantai) untuk lemparan
 * paling lemah. Makin tinggi lemparan, bola jatuh makin cepat dan jendelanya
 * menyempit (dikali LAMA_MIN / lama), jadi lemparan kuat memberi waktu lebih
 * untuk biji tetapi tangkapan lebih sulit.
 */
export const JENDELA_TANGKAP = 500
/** Swipe: kecepatan (px layar per ms) untuk kekuatan 0 dan kekuatan penuh. */
export const SWIPE_V_MIN = 0.3
export const SWIPE_V_MAKS = 1.6
/** Swipe minimal (px layar) ke atas supaya dihitung lemparan. */
export const SWIPE_MIN = 40
/** Tahan Spasi: kekuatan penuh setelah ditahan selama ini. */
export const LAMA_ISI = 1000

// ── Tampilan & sentuhan ───────────────────────────────────
/** Jari-jari lingkaran waktu saat bola dilempar, dan di akhir (bola menyentuh lantai). */
export const R_WAKTU_AWAL = 150
export const R_WAKTU_AKHIR = 42
/** Jari-jari bola di lantai. */
export const R_BOLA = 28
/** Tap dalam jarak ini dari biji = mengenai biji (≥ 48px layar di HP). */
export const R_SENTUH_BIJI = 72
/** Jarak minimal antarbiji saat disebar (px panggung, di kedua orientasi). */
export const JARAK_BIJI = 140

// ── Komputer ──────────────────────────────────────────────
/** Peluang komputer berhasil dalam satu lemparan. */
export const PELUANG_CPU: Record<Kesulitan, number> = { mudah: 0.8, sedang: 0.87, sulit: 0.93 }
/** Komputer menunggu sebelum melempar (ms). */
export const JEDA_CPU = 500

// ── Alur ──────────────────────────────────────────────────
export const JEDA_TANGKAP = 550
export const JEDA_TAHAP = 1500
export const JEDA_GAGAL = 1800
export const JEDA_HASIL = 2400
