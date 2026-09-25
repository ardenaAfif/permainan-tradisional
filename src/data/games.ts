import raw from './games.json'
import type { GameData, GameId, Kategori } from '../shared/types'

/** Satu-satunya pintu masuk data permainan (isi dari games.json). */
export const GAMES = raw as unknown as GameData[]

export const GAME_IDS = GAMES.map((g) => g.id)

export const KATEGORI: Kategori[] = ['Adu Strategi', 'Adu Ketangkasan', 'Adu Kekompakan']

export function getGame(id: string | undefined): GameData | undefined {
  return GAMES.find((g) => g.id === id)
}

export function isGameId(id: string | undefined): id is GameId {
  return GAMES.some((g) => g.id === id)
}
