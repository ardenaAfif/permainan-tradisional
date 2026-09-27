/**
 * Susunan papan Ular Tangga. Ubah angka di sini untuk mengganti letak
 * tangga dan ular (kotak 1–100). Aturan: satu kotak hanya boleh menjadi
 * ujung satu tangga atau satu ular, dan kotak 1 serta 100 dibiarkan kosong.
 * aturan.test.ts memeriksa aturan ini. Susunan ini dipilih supaya tangga dan
 * ular tidak saling bersilangan (papan tetap terbaca di HP).
 */
export const JUMLAH_KOTAK = 100

export interface Tangga {
  /** Kaki tangga (berhenti di sini → naik). */
  dari: number
  ke: number
}

export interface Ular {
  /** Kepala ular (berhenti di sini → turun). */
  kepala: number
  ekor: number
}

export const TANGGA: Tangga[] = [
  { dari: 2, ke: 23 },
  { dari: 13, ke: 27 },
  { dari: 28, ke: 46 },
  { dari: 51, ke: 71 },
  { dari: 52, ke: 74 },
  { dari: 56, ke: 86 },
  { dari: 60, ke: 81 },
]

export const ULAR: Ular[] = [
  { kepala: 35, ekor: 6 },
  { kepala: 37, ekor: 24 },
  { kepala: 40, ekor: 21 },
  { kepala: 45, ekor: 25 },
  { kepala: 53, ekor: 30 },
  { kepala: 79, ekor: 58 },
  { kepala: 98, ekor: 76 },
  { kepala: 99, ekor: 77 },
]

/** Dapat angka ini → pemain melempar lagi (berulang selama terus dapat angka ini). */
export const ANGKA_LEMPAR_LAGI = 6

/** Jeda komputer sebelum melempar dadu (ms). */
export const JEDA_KOMPUTER = 1000
/** Lama animasi dadu berguling (ms). */
export const LAMA_DADU = 800
/** Lama satu lompatan pion per kotak (ms). */
export const LAMA_LANGKAH = 220
/** Kartu "Tahukah kamu?" menutup sendiri pada giliran komputer (ms). */
export const LAMA_KARTU_KOMPUTER = 3500
