export const STAGE_W = 1280
export const STAGE_H = 720

export interface StageFit {
  /** Faktor skala panggung 1280x720 terhadap layar. */
  scale: number
  /** Posisi kiri-atas panggung di dalam wadah (px layar). */
  x: number
  y: number
}

/** Skala "contain": panggung sebesar mungkin tanpa terpotong, di tengah wadah. */
export function fitContain(width: number, height: number): StageFit {
  if (width <= 0 || height <= 0) return { scale: 1, x: 0, y: 0 }
  const scale = Math.min(width / STAGE_W, height / STAGE_H)
  return {
    scale,
    x: (width - STAGE_W * scale) / 2,
    y: (height - STAGE_H * scale) / 2,
  }
}

export interface StagePoint {
  x: number
  y: number
  /** false jika titik jatuh di area letterbox (di luar panggung). */
  inside: boolean
}

/**
 * Ubah koordinat pointer (clientX/clientY dari PointerEvent) ke koordinat
 * panggung 1280x720. `stageEl` adalah elemen panggung yang sudah diskalakan.
 */
export function clientToStage(clientX: number, clientY: number, stageEl: Element): StagePoint {
  const rect = stageEl.getBoundingClientRect()
  const scale = rect.width / STAGE_W || 1
  const x = (clientX - rect.left) / scale
  const y = (clientY - rect.top) / scale
  return { x, y, inside: x >= 0 && y >= 0 && x <= STAGE_W && y <= STAGE_H }
}
