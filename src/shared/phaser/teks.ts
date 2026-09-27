/**
 * Teks Phaser dengan font dan warna token. Teks yang harus terbaca di HP
 * mendatar dibuat ≥ 30px panggung (≈ 16px layar pada skala 0,54).
 */
import type * as Phaser from 'phaser'
import { FONT_ISI, FONT_JUDUL, WARNA, type NamaWarna } from '../../app/tokens'

export type GayaTeks = {
  ukuran: number
  warna?: NamaWarna
  /** false = Nunito (isi); bawaan Baloo 2 (judul). */
  judul?: boolean
  tebal?: number
  garis?: NamaWarna
  tebalGaris?: number
}

/** Resolusi mengikuti skala render supaya teks tetap tajam di PID. Origin di tengah. */
export function teks(scene: Phaser.Scene, x: number, y: number, isi: string, g: GayaTeks, resolusi: number) {
  return scene.add
    .text(x, y, isi, {
      fontFamily: g.judul === false ? FONT_ISI : FONT_JUDUL,
      fontSize: `${g.ukuran}px`,
      fontStyle: String(g.tebal ?? 800),
      color: WARNA[g.warna ?? 'kertas-terang'],
      ...(g.garis && { stroke: WARNA[g.garis], strokeThickness: g.tebalGaris ?? 6 }),
      resolution: resolusi,
      align: 'center',
    })
    .setOrigin(0.5)
}
