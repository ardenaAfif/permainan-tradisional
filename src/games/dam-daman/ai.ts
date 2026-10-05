/**
 * Lawan komputer Dam-daman (murni TypeScript; dijalankan di Web Worker lewat
 * ai.worker.ts, dan langsung di unit test).
 *
 * - mudah: acak, tetapi selalu menangkap jika bisa (rangkaian terpanjang).
 * - sedang: minimax kedalaman 2.
 * - sulit: minimax kedalaman 4 dengan alpha-beta.
 * Evaluasi: selisih jumlah bidak, ditambah selisih mobilitas (jumlah langkah sah).
 */
import type { Kesulitan } from '../../shared/types'
import { hasilAkhir, hitungBidak, langkahSah, lawanDari, terapkan, type Keadaan, type Langkah, type Meja, type Pemain } from './aturan'

const NILAI_BIDAK = 100
const NILAI_MENANG = 100_000

export type Acak = () => number

/** Nilai posisi dari sudut pandang pemain `p`. */
export function evaluasi(meja: Meja, k: Keadaan, p: Pemain): number {
  const q = lawanDari(p)
  const bidak = hitungBidak(k, p) - hitungBidak(k, q)
  const mobilitas = langkahSah(meja, k, p).length - langkahSah(meja, k, q).length
  return bidak * NILAI_BIDAK + mobilitas
}

function acakUrutan<T>(daftar: T[], acak: Acak): T[] {
  const a = daftar.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Tangkapan terbanyak dulu supaya alpha-beta memangkas lebih banyak. */
const urutkan = (daftar: Langkah[]) => daftar.sort((a, b) => b.tangkap.length - a.tangkap.length)

/** Negamax: nilai keadaan `k` dari sudut pandang pemain yang akan melangkah. */
function cari(meja: Meja, k: Keadaan, sisa: number, alpha: number, beta: number, pangkas: boolean): number {
  const akhir = hasilAkhir(meja, k)
  if (akhir) {
    if (akhir.pemenang === null) return 0
    // Menang lebih cepat lebih baik: `sisa` lebih besar = akhir lebih dekat.
    const n = NILAI_MENANG + sisa
    return akhir.pemenang === k.giliran ? n : -n
  }
  if (sisa === 0) return evaluasi(meja, k, k.giliran)
  let terbaik = -Infinity
  for (const l of urutkan(langkahSah(meja, k))) {
    const v = -cari(meja, terapkan(k, l), sisa - 1, -beta, -alpha, pangkas)
    if (v > terbaik) terbaik = v
    if (pangkas) {
      if (v > alpha) alpha = v
      if (alpha >= beta) break
    }
  }
  return terbaik
}

/** Nilai minimax keadaan `k` sedalam `kedalaman` (untuk uji: alpha-beta harus sama dengan minimax penuh). */
export function nilaiMinimax(meja: Meja, k: Keadaan, kedalaman: number, pangkas: boolean): number {
  return cari(meja, k, kedalaman, -Infinity, Infinity, pangkas)
}

/** Langkah terbaik menurut minimax sedalam `kedalaman` (seri dipecah acak). */
export function minimax(meja: Meja, k: Keadaan, kedalaman: number, pangkas: boolean, acak: Acak = Math.random): Langkah | null {
  const daftar = urutkan(acakUrutan(langkahSah(meja, k), acak))
  let terbaik: Langkah | null = null
  let nilai = -Infinity
  let alpha = -Infinity
  for (const l of daftar) {
    const v = -cari(meja, terapkan(k, l), kedalaman - 1, -Infinity, pangkas ? -alpha : Infinity, pangkas)
    if (v > nilai) {
      nilai = v
      terbaik = l
    }
    if (v > alpha) alpha = v
  }
  return terbaik
}

/** Acak, tetapi rangkaian tangkapan terpanjang selalu didahulukan. */
export function langkahMudah(meja: Meja, k: Keadaan, acak: Acak = Math.random): Langkah | null {
  const daftar = langkahSah(meja, k)
  if (daftar.length === 0) return null
  const maks = Math.max(...daftar.map((l) => l.tangkap.length))
  const calon = daftar.filter((l) => l.tangkap.length === maks)
  return calon[Math.floor(acak() * calon.length)]!
}

export function pilihLangkah(meja: Meja, k: Keadaan, kesulitan: Kesulitan, acak: Acak = Math.random): Langkah | null {
  if (kesulitan === 'mudah') return langkahMudah(meja, k, acak)
  if (kesulitan === 'sedang') return minimax(meja, k, 2, false, acak)
  return minimax(meja, k, 4, true, acak)
}
