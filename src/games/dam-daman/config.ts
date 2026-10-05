/**
 * Varian Dam-daman: bentuk papan, jumlah & posisi bidak, dan aturan main.
 * Ganti VARIAN_AKTIF / ATURAN di sini supaya mengikuti varian yang dipakai di
 * sekolah. Jika aturan diubah, sesuaikan juga catatanWeb dam-daman di
 * src/data/games.json (aturan.test.ts memeriksa keduanya tetap selaras).
 *
 * Koordinat papan [x, y] dalam satuan grid; y bertambah ke bawah. Pemain 0
 * memulai di sisi bawah, pemain 1 di sisi atas. Gambar papan diskalakan otomatis
 * supaya pas di layar.
 */
import type { AturanMain, BentukPapan, Koordinat, VarianDam } from './aturan'

/** Titik-titik lurus dari a ke b dalam `n` ruas sama panjang (bawaan: setiap 1 satuan grid). */
export function ruas(a: Koordinat, b: Koordinat, n?: number): Koordinat[] {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const k = n ?? fpb(Math.abs(dx), Math.abs(dy))
  return Array.from({ length: k + 1 }, (_, i): Koordinat => [a[0] + (dx * i) / k, a[1] + (dy * i) / k])
}

function fpb(a: number, b: number): number {
  return b === 0 ? a : fpb(b, a % b)
}

/**
 * Papan 5x5: garis mendatar dan tegak di setiap titik, diagonal hanya melewati
 * titik berselang-seling (x + y genap), seperti papan alquerque.
 */
export const PAPAN_5X5: BentukPapan = {
  garis: [
    ...[0, 1, 2, 3, 4].map((y) => ruas([0, y], [4, y])),
    ...[0, 1, 2, 3, 4].map((x) => ruas([x, 0], [x, 4])),
    ruas([0, 0], [4, 4]),
    ruas([4, 0], [0, 4]),
    ruas([2, 0], [0, 2]),
    ruas([2, 0], [4, 2]),
    ruas([0, 2], [2, 4]),
    ruas([4, 2], [2, 4]),
  ],
}

/**
 * Papan 5x5 dengan perpanjangan segitiga di atas dan bawah. Sisi segitiga
 * menyambung diagonal papan, jadi bidak bisa melompat lurus melewati puncaknya.
 */
export const PAPAN_SEGITIGA: BentukPapan = {
  garis: [
    ...[0, 1, 2, 3, 4].map((y) => ruas([0, y], [4, y])),
    ...[0, 1, 3, 4].map((x) => ruas([x, 0], [x, 4])),
    ruas([2, -2], [2, 6]),
    ruas([0, 0], [4, 4]),
    ruas([4, 0], [0, 4]),
    // Diagonal tengah diteruskan menjadi sisi segitiga.
    ruas([0, 2], [4, -2]),
    ruas([4, 2], [0, -2]),
    ruas([0, 2], [4, 6]),
    ruas([4, 2], [0, 6]),
    // Garis mendatar di dalam segitiga.
    ruas([1, -1], [3, -1]),
    ruas([0, -2], [4, -2], 2),
    ruas([1, 5], [3, 5]),
    ruas([0, 6], [4, 6], 2),
  ],
}

const baris = (y: number, xs = [0, 1, 2, 3, 4]): Koordinat[] => xs.map((x): Koordinat => [x, y])

export const VARIAN: Record<'5x5' | 'segitiga', VarianDam> = {
  /** 12 bidak per pemain, titik tengah kosong. */
  '5x5': {
    nama: 'Papan 5×5',
    bentuk: PAPAN_5X5,
    posisiAwal: [
      [...baris(4), ...baris(3), ...baris(2, [3, 4])],
      [...baris(0), ...baris(1), ...baris(2, [0, 1])],
    ],
  },
  /** 18 bidak per pemain (segitiga + dua baris + dua titik tengah), titik tengah kosong. */
  segitiga: {
    nama: 'Papan 5×5 + segitiga',
    bentuk: PAPAN_SEGITIGA,
    posisiAwal: [
      [...baris(6, [0, 2, 4]), ...baris(5, [1, 2, 3]), ...baris(4), ...baris(3), ...baris(2, [3, 4])],
      [...baris(-2, [0, 2, 4]), ...baris(-1, [1, 2, 3]), ...baris(0), ...baris(1), ...baris(2, [0, 1])],
    ],
  },
}

/** Varian yang dimainkan. */
export const VARIAN_AKTIF: VarianDam = VARIAN['5x5']

export const ATURAN: AturanMain = {
  /** true: jika ada bidak yang bisa menangkap, pemain wajib menangkap (dan meneruskan lompatan). */
  wajibMakan: false,
  /** false: langkah biasa hanya boleh maju atau ke samping. Menangkap selalu boleh ke segala arah. */
  bolehMundur: true,
  /** Seri jika sebanyak ini langkah berturut-turut (kedua pemain) tanpa penangkapan. */
  batasSeri: 40,
}

/** Lama bidak bergeser satu titik (ms). */
export const LAMA_GESER = 260
/** Lama bidak tertangkap terangkat keluar papan (ms). */
export const LAMA_ANGKAT = 650
/** Jeda minimal komputer "berpikir" sebelum melangkah (ms). */
export const JEDA_KOMPUTER = 700
/** Jeda sebelum pindah ke layar hasil (ms). */
export const JEDA_SELESAI = 1600
