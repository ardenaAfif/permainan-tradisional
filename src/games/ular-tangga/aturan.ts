import { JUMLAH_KOTAK, TANGGA, ULAR, type Tangga, type Ular } from './config'

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

/** Kotak n (1–100) → kolom & baris (baris 0 = paling bawah), pola zig-zag. */
export function kotakKeGrid(n: number): { kolom: number; baris: number } {
  const i = n - 1
  const baris = Math.floor(i / 10)
  const k = i % 10
  return { baris, kolom: baris % 2 === 0 ? k : 9 - k }
}
