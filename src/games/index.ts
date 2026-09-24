import type { GameId, GameModule } from '../shared/types'

type GameLoader = () => Promise<{ default: GameModule }>

/**
 * Game yang sudah dibuat, dimuat secara lazy. Tambahkan entri di sini saat
 * sebuah game di src/games/<id>/ selesai; game lain tampil "Segera hadir".
 */
export const GAME_LOADERS: Partial<Record<GameId, GameLoader>> = {}

export function isGameReady(id: GameId): boolean {
  return id in GAME_LOADERS
}
