/**
 * Tata letak panggung 1280x720 Egrang: empat lintasan berpagar (tampak samping,
 * lintasan pemain 1 paling dekat), papan kontrol kayu di bawah.
 */
import { JARAK_LOMBA } from './config'

export const LEBAR = 1280
export const TINGGI = 720

/** Garis start dan finis (x panggung). */
export const START_X = 168
export const FINIS_X = 1188
export const PX_PER_M = (FINIS_X - START_X) / JARAK_LOMBA

/** Tinggi tekstur karakter berpose egrang (seluruh viewBox) di lintasan terdekat. */
export const TINGGI_KARAKTER = 150

/** viewBox pose egrang: '-10 -80 220 486', tanah (ujung bambu) di y = 400, tengah badan x = 100. */
export const RASIO_EGRANG = 220 / 486
export const ALAS_EGRANG = (400 + 80) / 486
/** Jarak tengah bambu dari tengah badan (satuan viewBox → bagian dari tinggi tekstur). */
export const BAMBU_DX = 41.5 / 486

/** Batas atas papan kontrol. */
export const PANEL_Y = 540

export interface Lajur {
  /** Garis tanah (ujung bambu). */
  tanah: number
  /** Skala perspektif (lintasan jauh lebih kecil). */
  skala: number
  /** Pita tanah lintasan [atas, bawah]. */
  pita: [number, number]
}

/** Lintasan pemain ke-i (0 = paling dekat/bawah). */
export function lajur(i: number): Lajur {
  const tanah = 516 - 90 * i
  const skala = 1 - 0.07 * i
  return { tanah, skala, pita: [tanah - 30 * skala, tanah + 8 * skala] }
}

/** x panggung untuk jarak (meter). */
export const xMeter = (m: number) => START_X + m * PX_PER_M

/** Tanda pemain di kiri lintasan. */
export const TANDA_X = 62
/** Medali urutan finis di kanan lintasan. */
export const MEDALI_X = 1236

/** Kolom kontrol untuk pemain manusia ke-k dari n (kiri → kanan). */
export function kolom(k: number, n: number) {
  const lebar = LEBAR / n
  return { x0: k * lebar, lebar }
}
