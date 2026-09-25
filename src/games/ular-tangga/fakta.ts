import { GAMES } from '../../data/games'
import type { Benda, GameId } from '../../shared/types'

export interface Fakta {
  gameId: GameId
  nama: string
  benda: Benda
  teks: string
  sumber: 'Aturan asli' | 'Tentang permainan' | 'Cara main di web'
}

/**
 * Kartu "Tahukah kamu?" hanya berisi kalimat yang sudah ada di games.json
 * (deskripsi dan aturan asli dari daftar kokurikuler, serta cara main web).
 * Tidak ada fakta sejarah yang dikarang.
 */
export function semuaFakta(kecuali: GameId): Fakta[] {
  return GAMES.filter((g) => g.id !== kecuali).flatMap((g) => {
    const dasar = { gameId: g.id, nama: g.nama, benda: g.benda }
    return [
      { ...dasar, teks: g.deskripsi, sumber: 'Tentang permainan' as const },
      ...g.aturanAsli.map((teks) => ({ ...dasar, teks, sumber: 'Aturan asli' as const })),
      ...g.caraMainWeb
        .split(/(?<=\.)\s+/)
        .filter((k) => k.length > 30)
        .map((teks) => ({ ...dasar, teks, sumber: 'Cara main di web' as const })),
    ]
  })
}

/** Tumpukan kartu acak; setiap permainan muncul bergantian sebelum ada yang berulang. */
export class TumpukanFakta {
  private sisa: Fakta[] = []
  private terakhir: GameId | null = null
  private readonly semua: Fakta[]

  constructor(kecuali: GameId) {
    this.semua = semuaFakta(kecuali)
  }

  ambil(): Fakta {
    const kocok = () => [...this.semua].sort(() => Math.random() - 0.5)
    let i = this.sisa.findIndex((f) => f.gameId !== this.terakhir)
    if (i < 0) {
      this.sisa.push(...kocok())
      i = this.sisa.findIndex((f) => f.gameId !== this.terakhir)
    }
    const [f] = this.sisa.splice(i, 1)
    this.terakhir = f!.gameId
    return f!
  }
}
