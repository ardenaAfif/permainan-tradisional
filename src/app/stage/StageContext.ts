import { createContext, useContext } from 'react'
import type { StagePoint } from './stageCoords'

export interface StageApi {
  scale: number
  /** Ubah PointerEvent/MouseEvent (clientX, clientY) ke koordinat panggung. */
  toStage: (e: { clientX: number; clientY: number }) => StagePoint
}

export const StageContext = createContext<StageApi | null>(null)

/** Akses skala dan konversi pointer dari komponen di dalam <Stage>. */
export function useStage(): StageApi {
  const api = useContext(StageContext)
  if (!api) throw new Error('useStage() harus dipakai di dalam <Stage>')
  return api
}
