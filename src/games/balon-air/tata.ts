/**
 * Tata letak panggung 1280x720 Pecah Balon Air. Lintasan digambar di dunia
 * (lintasan tim ke-i bergeser OFFSET_Y[i] ke bawah) dan dilihat lewat kamera
 * yang mengikuti pelari. Lawan Komputer: satu kamera penuh di bawah papan
 * atas. Duel Satu Layar: layar dibagi atas-bawah, masing-masing satu kamera.
 */
import { TINGGI_LINTASAN } from './lintasan'

export const LEBAR = 1280
export const TINGGI = 720

/** Lintasan tim 0 dan tim 1 di dunia (cukup jauh supaya tidak terlihat di kamera lain). */
export const OFFSET_Y = [0, 1000] as const

/** Tinggi karakter di dunia (titik kaki = posisi logika). */
export const TINGGI_SOSOK = 80

export interface Pandang {
  /** Kotak kamera di panggung. */
  x: number
  y: number
  lebar: number
  tinggi: number
  /** Rentang y lintasan yang terlihat. */
  y0: number
  y1: number
  /** Pembesaran dunia → panggung. */
  zoom: number
  /** Papan info tim di panggung (di atas kamera). */
  papanY: number
  papanTinggi: number
}

const PAPAN_SOLO = 96
const PAPAN_DUEL = 52

/** Lawan Komputer: papan info di atas, lintasan penuh di bawahnya. */
const SOLO: Pandang = {
  x: 0,
  y: PAPAN_SOLO,
  lebar: LEBAR,
  tinggi: TINGGI - PAPAN_SOLO,
  y0: 0,
  y1: TINGGI_LINTASAN,
  zoom: (TINGGI - PAPAN_SOLO) / TINGGI_LINTASAN,
  papanY: 0,
  papanTinggi: PAPAN_SOLO,
}

/** Duel: setiap separuh layar = papan info tipis + lintasan (sedikit dipotong atas-bawah). */
function duel(i: 0 | 1): Pandang {
  const atas = i * (TINGGI / 2)
  const tinggi = TINGGI / 2 - PAPAN_DUEL
  return { x: 0, y: atas + PAPAN_DUEL, lebar: LEBAR, tinggi, y0: 40, y1: 370, zoom: tinggi / 330, papanY: atas, papanTinggi: PAPAN_DUEL }
}

export function pandangan(split: boolean): Pandang[] {
  return split ? [duel(0), duel(1)] : [SOLO]
}

/** Pembesaran terbesar yang dipakai mode ini (untuk ketajaman tekstur dunia). */
export const zoomMode = (split: boolean) => Math.max(...pandangan(split).map((p) => p.zoom))

/** Pojok kiri & kanan atas dipakai tombol jeda & suara GameShell. */
export const SISI_TOMBOL = 118
