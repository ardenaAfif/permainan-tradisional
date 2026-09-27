/**
 * Token warna yang dibutuhkan kode JS (mis. Phaser, canvas) yang tidak bisa
 * membaca CSS variable. Nilainya harus sama dengan tokens.css — dijaga oleh
 * tokens.test.ts.
 */
export const WARNA_PEMAIN = ['#e8a33d', '#b5462f', '#2e4c7a', '#6e9f3d'] as const

/** Warna tokens.css untuk Phaser/canvas. Kunci = nama variabel CSS tanpa "--". */
export const WARNA = {
  kunyit: '#e8a33d',
  'kunyit-gelap': '#b87a1f',
  'merah-bata': '#b5462f',
  'merah-bata-gelap': '#8a3321',
  'daun-pisang': '#6e9f3d',
  'daun-pisang-gelap': '#4e7628',
  'daun-pisang-tua': '#3a5a1d',
  'biru-nila': '#2e4c7a',
  'biru-nila-gelap': '#1f3558',
  'kertas-krem': '#f6ebd6',
  'kertas-krem-gelap': '#eadbbe',
  kayu: '#6b4226',
  'kayu-gelap': '#4a2c17',
  'kayu-muda': '#8a5a34',
  'cahaya-kelir': '#ffd58a',
  'cahaya-kelir-gelap': '#f0b55c',
  'cahaya-kelir-muda': '#fff0cc',
  tinta: '#3a2a1e',
  'tinta-gelap': '#2b211c',
  'kertas-terang': '#fff8ea',
  'garis-krem': '#e3d1ae',
  lantai: '#e8c68a',
  'abu-kartu': '#a39c91',
  'langit-jendela': '#cfe0ee',
} as const

export type NamaWarna = keyof typeof WARNA

/** Ubah '#rrggbb' menjadi angka 0xrrggbb untuk Phaser. */
export const hexKeAngka = (hex: string) => parseInt(hex.slice(1), 16)

/** Warna token sebagai angka 0xrrggbb (untuk Phaser Graphics). */
export const warnaAngka = (nama: NamaWarna) => hexKeAngka(WARNA[nama])

/** Font dari tokens.css untuk teks Phaser/canvas. */
export const FONT_JUDUL = "'Baloo 2', 'Nunito', system-ui, sans-serif"
export const FONT_ISI = "'Nunito', system-ui, sans-serif"
