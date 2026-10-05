import { WARNA_PEMAIN } from '../app/tokens'
import type { AvatarConfig, GameMode, Kesulitan, Player } from './types'

/** Pengaturan satu sesi main, dibawa dari Kenalan Dulu → GameShell → layar hasil. */
export interface Sesi {
  mode: GameMode
  players: Player[]
  difficulty: Kesulitan
  /** Nilai pilihan game (GameData.pilihan) per id. */
  opsi?: Record<string, string>
}

/** Pemain komputer diperankan tokoh siswa, bergiliran. */
const TOKOH_CPU = [
  { nama: 'Bima', tokoh: 'bima' },
  { nama: 'Sekar', tokoh: 'sekar' },
  { nama: 'Dimas', tokoh: 'dimas' },
] as const

/** Avatar bawaan untuk teman di mode Main Bergantian / Duel. */
const AVATAR_TEMAN: Omit<AvatarConfig, 'nama'>[] = [
  { kulit: 1, rambut: 'jabrik', penutupKepala: 'none' },
  { kulit: 3, rambut: 'pendek', penutupKepala: 'kerudung' },
  { kulit: 0, rambut: 'belah', penutupKepala: 'peci' },
]

const warna = (i: number) => WARNA_PEMAIN[i % WARNA_PEMAIN.length]!

export function buatSesi(opsi: {
  mode: GameMode
  difficulty: Kesulitan
  pemainUtama: AvatarConfig
  /** Nama pemain manusia (untuk hotseat/split). Indeks 0 = pemain utama. */
  namaPemain: string[]
  lawanKomputer: number
  /** Duel Satu Layar: lengkapi peserta dengan lawan komputer sampai sejumlah ini (GameData.pesertaSplit). */
  pesertaSplit?: number
  pilihan?: Record<string, string>
}): Sesi {
  const { mode, pemainUtama } = opsi
  const tambahan = opsi.pilihan && Object.keys(opsi.pilihan).length ? { opsi: { ...opsi.pilihan } } : {}
  const utama: Player = { id: 'p1', nama: pemainUtama.nama, avatar: pemainUtama, warna: warna(0) }
  /** n lawan komputer; warna melanjutkan warna pemain sebelumnya. */
  const komputer = (n: number, mulaiWarna: number) =>
    Array.from({ length: n }, (_, i): Player => {
      const t = TOKOH_CPU[i % TOKOH_CPU.length]!
      return { id: `cpu${i + 1}`, nama: t.nama, avatar: 'cpu', tokoh: t.tokoh, warna: warna(mulaiWarna + i) }
    })
  if (mode === 'cpu') {
    return { mode, difficulty: opsi.difficulty, players: [utama, ...komputer(opsi.lawanKomputer, 1)], ...tambahan }
  }
  const players = opsi.namaPemain.map((nama, i): Player => {
    if (i === 0) return { ...utama, nama: nama.trim() || pemainUtama.nama }
    const av = AVATAR_TEMAN[(i - 1) % AVATAR_TEMAN.length]!
    const n = nama.trim() || `Pemain ${i + 1}`
    return { id: `p${i + 1}`, nama: n, avatar: { ...av, nama: n }, warna: warna(i) }
  })
  if (mode === 'split' && opsi.pesertaSplit && players.length < opsi.pesertaSplit) {
    players.push(...komputer(opsi.pesertaSplit - players.length, players.length))
  }
  return { mode, difficulty: opsi.difficulty, players, ...tambahan }
}

/** Apakah pemain utama (pemilik perangkat) termasuk pemenang. */
export function pemainUtamaMenang(pemenang: Player | Player[] | null): boolean {
  if (!pemenang) return false
  return (Array.isArray(pemenang) ? pemenang : [pemenang]).some((p) => p.id === 'p1')
}
