import type { GameModule } from '../shared/types'

type GameLoader = () => Promise<{ default: GameModule }>

/**
 * Registry game: setiap folder src/games/<id>/index.ts (export default GameModule)
 * otomatis terdaftar dan dimuat secara lazy (dynamic import per folder).
 * Game yang foldernya belum ada tampil "Segera hadir".
 */
const modul = import.meta.glob<{ default: GameModule }>('./*/index.ts')

export const GAME_LOADERS: Record<string, GameLoader> = Object.fromEntries(
  Object.entries(modul).map(([path, load]) => [path.split('/')[1]!, load]),
)

export function isGameReady(id: string): boolean {
  return id in GAME_LOADERS
}

export async function muatGame(id: string): Promise<GameModule | null> {
  const load = GAME_LOADERS[id]
  if (!load) return null
  return (await load()).default
}
