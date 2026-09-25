import { kotakKeGrid } from './aturan'

/** Ukuran dalam piksel panggung 1280x720. */
export const SEL = 66
export const PAPAN = SEL * 10
/** Letak papan (sudut kiri-atas kotak 91) di panggung. */
export const PAPAN_X = 310
export const PAPAN_Y = 30

/** Titik tengah kotak n, relatif ke papan. Posisi 0 = alas "Mulai" di kiri kotak 1. */
export function pusatKotak(n: number): { x: number; y: number } {
  if (n <= 0) return { x: -135, y: PAPAN - SEL / 2 + 2 }
  const { kolom, baris } = kotakKeGrid(n)
  return { x: kolom * SEL + SEL / 2, y: (9 - baris) * SEL + SEL / 2 }
}

/** Geser pion yang berbagi kotak supaya tidak saling menutupi. */
export function geserBersama(indeks: number, jumlah: number, n: number): { dx: number; dy: number } {
  if (jumlah <= 1) return { dx: 0, dy: 0 }
  if (n <= 0) return { dx: (indeks - (jumlah - 1) / 2) * 54, dy: 0 } // berjajar di alas Mulai
  const d = 15
  const pola = [
    { dx: -d, dy: -d },
    { dx: d, dy: d },
    { dx: d, dy: -d },
    { dx: -d, dy: d },
  ]
  return pola[indeks % 4]!
}
