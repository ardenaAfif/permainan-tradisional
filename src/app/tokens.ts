/**
 * Token warna yang dibutuhkan kode JS (mis. Phaser, canvas) yang tidak bisa
 * membaca CSS variable. Nilainya harus sama dengan tokens.css — dijaga oleh
 * tokens.test.ts.
 */
export const WARNA_PEMAIN = ['#e8a33d', '#b5462f', '#2e4c7a', '#6e9f3d'] as const

/** Ubah '#rrggbb' menjadi angka 0xrrggbb untuk Phaser. */
export const hexKeAngka = (hex: string) => parseInt(hex.slice(1), 16)
