/** Ukuran teks balon di storyboard (px panggung). */
export const TEKS_PANGGUNG = 24
/** Teks minimal di layar (aturan: ≥ 16px di HP). */
export const TEKS_MIN = 16
/** Ruang minimal di bawah panggung untuk menaruh subtitle di luar panggung (HP tegak). */
const RUANG_PANEL = 130

export type ModeBalon = 'panggung' | 'sempit' | 'panel'

/**
 * Pilih cara menampilkan balon:
 * - panggung: skala cukup besar, balon persis di posisi storyboard.
 * - panel: HP/tablet tegak, subtitle di bawah panggung (area letterbox) supaya tetap terbaca.
 * - sempit: HP mendatar, balon tetap di dekat tokoh dengan teks minimal 16px.
 */
export function pilihMode(scale: number, ruangBawah: number): ModeBalon {
  if (TEKS_PANGGUNG * scale >= TEKS_MIN) return 'panggung'
  if (ruangBawah >= RUANG_PANEL) return 'panel'
  return 'sempit'
}
