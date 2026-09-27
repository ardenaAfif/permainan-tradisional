/**
 * Angka-angka lomba Bakiak. Ubah di sini untuk menyetel tingkat kesulitan;
 * aturan.test.ts memeriksa perilakunya.
 */
import type { Kesulitan } from '../../shared/types'

/** Panjang lintasan (meter). */
export const JARAK_LOMBA = 25
/** Maju per ketukan: Pas = penuh, Oke = setengah (meter). */
export const LANGKAH_PAS = 0.4
export const LANGKAH_OKE = LANGKAH_PAS / 2

/** Tempo aba-aba: mulai BPM_AWAL, naik BPM_NAIK setiap KETUKAN_PER_NAIK ketukan, maksimal BPM_AKHIR. */
export const BPM_AWAL = 80
export const BPM_AKHIR = 120
export const BPM_NAIK = 5
export const KETUKAN_PER_NAIK = 8
/** Hitungan "3, 2, 1, Jalan!" sebelum aba-aba pertama (ketukan). */
export const KETUKAN_HITUNG = 4
/** Jeda sebelum hitungan dimulai (ms). */
export const JEDA_AWAL = 700

/** Jendela penilaian dari ketukan (± ms). Di luar TANGKAP, tekanan tidak dihitung untuk ketukan itu. */
export const JENDELA_PAS = 100
export const JENDELA_OKE = 200
export const JENDELA_TANGKAP = 260

/** Perubahan meter goyang (0–100). Penuh = tim jatuh. */
export const GOYANG_MAKS = 100
export const GOYANG = {
  pas: -12,
  oke: 0,
  meleset: 18,
  /** Salah tombol (kaki kiri/kanan tertukar) atau tidak kompak. */
  salah: 25,
  /** Tombol ditekan di luar ketukan (terburu-buru / menekan berkali-kali). */
  ekstra: 8,
  /** Nilai meter setelah tim bangkit. */
  setelahBangkit: 35,
} as const

/** Lama animasi jatuh sebelum tantangan bangkit muncul (ms). */
export const LAMA_JATUH = 1200
/** Tantangan bangkit: ketuk sebanyak ini dalam waktu ini (dihitung dari ketukan pertama). */
export const BANGKIT_KETUK = 6
export const BANGKIT_WAKTU = 2000
/** Setelah bangkit, aba-aba berikutnya paling cepat sekian ms lagi (supaya sempat siap). */
export const JEDA_SETELAH_BANGKIT = 450

/** Mode Tim Kompak: ketiga tombol kaki harus ditekan dalam jendela ini (ms). */
export const JENDELA_KOMPAK = 150

/** Peluang komputer menekan tepat pada ketukan (Pas atau Oke). */
export const AKURASI_CPU: Record<Kesulitan, number> = { mudah: 0.7, sedang: 0.82, sulit: 0.92 }
/** Lama komputer menyelesaikan tantangan bangkit (ms, harus < BANGKIT_WAKTU). */
export const BANGKIT_CPU: Record<Kesulitan, number> = { mudah: 1700, sedang: 1350, sulit: 1000 }

/** Jeda setelah finis sebelum layar hasil (ms). */
export const JEDA_HASIL = 2600
