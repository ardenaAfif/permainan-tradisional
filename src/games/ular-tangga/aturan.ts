import { ANGKA_LEMPAR_LAGI, JUMLAH_KOTAK, TANGGA, ULAR, type Tangga, type Ular } from './config'

export interface HasilLangkah {
  /** Kotak yang dilewati satu per satu (tidak termasuk posisi awal), termasuk pantulan. */
  jalur: number[]
  /** Kotak setelah dadu, sebelum tangga/ular. */
  mendarat: number
  /** Posisi akhir setelah tangga/ular. */
  akhir: number
  memantul: boolean
  tangga?: Tangga
  ular?: Ular
  menang: boolean
}

/**
 * Hitung satu giliran. Aturan asli: pion bergerak sesuai angka dadu; berhenti
 * di kaki tangga naik, di kepala ular turun; pertama mencapai kotak terakhir
 * menang. Aturan web: kotak terakhir harus dicapai dengan angka pas; sisanya
 * memantul mundur.
 * Posisi 0 = belum masuk papan (sebelum kotak 1).
 */
export function hitungLangkah(posisi: number, dadu: number, tangga = TANGGA, ular = ULAR): HasilLangkah {
  const jalur: number[] = []
  let p = posisi
  let arah = 1
  for (let i = 0; i < dadu; i++) {
    if (p === JUMLAH_KOTAK) arah = -1
    p += arah
    jalur.push(p)
  }
  const mendarat = p
  const t = tangga.find((x) => x.dari === mendarat)
  const u = ular.find((x) => x.kepala === mendarat)
  const akhir = t ? t.ke : u ? u.ekor : mendarat
  return { jalur, mendarat, akhir, memantul: arah === -1, tangga: t, ular: u, menang: akhir === JUMLAH_KOTAK }
}

/** Bilangan acak 32-bit dari generator kriptografis peramban (diambil dari OS setiap kali). */
export function acakAman(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!
}

/**
 * Lempar dadu 1–6. Memakai crypto, bukan Math.random, supaya urutan lemparan
 * tidak mungkin berulang antarpermainan. Nilai di atas batas kelipatan 6
 * dibuang agar keenam muka sama peluangnya.
 */
export function lemparDadu(acak: () => number = acakAman): number {
  const batas = 2 ** 32 - (2 ** 32 % 6)
  for (;;) {
    const n = acak()
    if (n < batas) return 1 + (n % 6)
  }
}

/** Aturan web: dapat 6 (dan belum menang) → lempar lagi, berulang selama terus dapat 6. */
export function bolehLemparLagi(dadu: number, menang: boolean): boolean {
  return dadu === ANGKA_LEMPAR_LAGI && !menang
}

/** Kotak n (1–100) → kolom & baris (baris 0 = paling bawah), pola zig-zag. */
export function kotakKeGrid(n: number): { kolom: number; baris: number } {
  const i = n - 1
  const baris = Math.floor(i / 10)
  const k = i % 10
  return { baris, kolom: baris % 2 === 0 ? k : 9 - k }
}
