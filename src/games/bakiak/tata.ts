/**
 * Tata letak panggung 1280x720 dan pembantu gambar Phaser untuk Bakiak.
 * Teks yang harus terbaca di HP ≥ 30px panggung (≈16px di HP mendatar 390px).
 */
import type * as Phaser from 'phaser'
import { FONT_ISI, FONT_JUDUL, WARNA, warnaAngka, type NamaWarna } from '../../app/tokens'
import { JARAK_LOMBA } from './config'

export const LEBAR = 1280
export const TINGGI = 720

/** Garis start dan finis (x panggung). */
export const START_X = 170
export const FINIS_X = 1150
export const PX_PER_M = (FINIS_X - START_X) / JARAK_LOMBA

export interface Lajur {
  /** Garis tanah (telapak kaki). */
  tanah: number
  /** Tinggi karakter (px). */
  tinggiKarakter: number
  /** Jarak antarsiswa di atas bakiak. */
  jarakSiswa: number
  /** Pita lintasan tanah [atas, bawah]. */
  pita: [number, number]
}

/** Lajur 0 = dekat (tim A / pemain), lajur 1 = jauh (tim B). */
export const LAJUR: [Lajur, Lajur] = [
  { tanah: 392, tinggiKarakter: 128, jarakSiswa: 36, pita: [338, 414] },
  { tanah: 248, tinggiKarakter: 110, jarakSiswa: 31, pita: [212, 266] },
]

/** Batas area kontrol di bawah. */
export const KONTROL_Y = 420
/** Jalur aba-aba (catatan KIRI/KANAN berjalan ke lingkaran). */
export const JALUR_Y = 430
export const JALUR_T = 64
/** Baris meter goyang. */
export const GOYANG_Y = 502
export const GOYANG_T = 18
/** Tombol kaki: ≥ 96px layar di HP mendatar (skala panggung ≈ 0,54). */
export const TOMBOL_Y = 528
export const TOMBOL_T = 184

/** Kecepatan catatan aba-aba di jalur (px per ms). */
export const LAJU_CATATAN = 0.3

export const w = warnaAngka

export type GayaTeks = {
  ukuran: number
  warna?: NamaWarna
  judul?: boolean
  tebal?: number
  garis?: NamaWarna
  tebalGaris?: number
}

/** Teks Phaser dengan font token; resolusi mengikuti skala render supaya tajam di PID. */
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

/** Latar lapangan sekolah + lintasan + penanda meter. Digambar sekali. */
export function gambarLintasan(scene: Phaser.Scene, resolusi: number) {
  const g = scene.add.graphics()
  // Langit dan awan.
  g.fillStyle(w('langit-jendela')).fillRect(0, 0, LEBAR, 200)
  g.fillStyle(w('kertas-terang'), 0.85)
  for (const [x, y, s] of [
    [250, 110, 1],
    [760, 80, 1.3],
    [1060, 128, 0.8],
  ] as const) {
    g.fillEllipse(x, y, 110 * s, 34 * s).fillEllipse(x + 30 * s, y - 14 * s, 70 * s, 34 * s)
  }
  // Pepohonan di tepi lapangan.
  g.fillStyle(w('kayu'))
  for (let x = 20; x < LEBAR; x += 92) g.fillRect(x + 14, 170, 8, 24)
  g.fillStyle(w('daun-pisang-gelap'))
  for (let x = 20; x < LEBAR; x += 92) g.fillCircle(x + 18, 164, 26).fillCircle(x - 4, 176, 18).fillCircle(x + 40, 176, 18)
  // Lapangan rumput dengan belang potongan rumput.
  g.fillStyle(w('daun-pisang')).fillRect(0, 190, LEBAR, KONTROL_Y - 190)
  g.fillStyle(w('daun-pisang-gelap'), 0.18)
  for (let x = 0; x < LEBAR; x += 160) g.fillRect(x, 190, 80, KONTROL_Y - 190)

  for (const lajur of LAJUR) {
    const [atas, bawah] = lajur.pita
    g.fillStyle(w('lantai')).fillRect(0, atas, LEBAR, bawah - atas)
    g.fillStyle(w('kertas-terang'), 0.9).fillRect(0, atas - 2, LEBAR, 4).fillRect(0, bawah - 2, LEBAR, 4)
    // Garis kapur tiap meter; tiap 5 meter melintang penuh.
    for (let m = 1; m < JARAK_LOMBA; m++) {
      const x = START_X + m * PX_PER_M
      if (m % 5 === 0) {
        g.fillStyle(w('kertas-terang'), 0.55)
        for (let y = atas + 4; y < bawah - 4; y += 12) g.fillRect(x - 1.5, y, 3, 6)
      } else {
        g.fillStyle(w('kertas-terang'), 0.7).fillRect(x - 1, bawah - 10, 2, 8)
      }
    }
    // Garis start (kapur) dan finis (kotak-kotak).
    g.fillStyle(w('kertas-terang')).fillRect(START_X - 3, atas, 6, bawah - atas)
    for (let y = atas, i = 0; y < bawah; y += 8, i++) {
      g.fillStyle(w(i % 2 ? 'tinta-gelap' : 'kertas-terang')).fillRect(FINIS_X - 6, y, 6, 8)
      g.fillStyle(w(i % 2 ? 'kertas-terang' : 'tinta-gelap')).fillRect(FINIS_X, y, 6, 8)
    }
  }
  // Bendera finis di atas lajur jauh.
  const [atasJauh] = LAJUR[1].pita
  g.fillStyle(w('kayu')).fillRect(FINIS_X - 3, 120, 6, atasJauh - 118)
  g.fillStyle(w('merah-bata')).fillTriangle(FINIS_X + 3, 122, FINIS_X + 3, 162, FINIS_X + 60, 142)

  // Penanda meter di rumput antara dua lajur (di garis start ada tim, jadi tanpa label).
  const yLabel = (LAJUR[1].pita[1] + LAJUR[0].pita[0]) / 2
  for (let m = 5; m <= JARAK_LOMBA; m += 5) {
    const label = m === JARAK_LOMBA ? 'FINIS' : `${m} m`
    teks(scene, START_X + m * PX_PER_M, yLabel, label, { ukuran: 30, garis: 'daun-pisang-tua', tebalGaris: 6 }, resolusi)
  }

  // Area kontrol (papan kayu).
  g.fillStyle(w('kayu')).fillRect(0, KONTROL_Y, LEBAR, TINGGI - KONTROL_Y)
  g.fillStyle(w('kayu-gelap')).fillRect(0, KONTROL_Y, LEBAR, 4)
  return g
}
