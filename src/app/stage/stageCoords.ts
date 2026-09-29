export const STAGE_W = 1280
export const STAGE_H = 720

export interface StageFit {
  /** Faktor skala panggung 1280x720 terhadap layar. */
  scale: number
  /** Posisi kiri-atas panggung di dalam wadah (px layar). */
  x: number
  y: number
}

/**
 * Skala "contain": panggung sebesar mungkin tanpa terpotong, di tengah wadah.
 * Panggung tegak (game orientasi 'any' di layar tegak) memakai stageW = 720, stageH = 1280.
 */
export function fitContain(width: number, height: number, stageW = STAGE_W, stageH = STAGE_H): StageFit {
  if (width <= 0 || height <= 0) return { scale: 1, x: 0, y: 0 }
  const scale = Math.min(width / stageW, height / stageH)
  return {
    scale,
    x: (width - stageW * scale) / 2,
    y: (height - stageH * scale) / 2,
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
export function clientToStage(clientX: number, clientY: number, stageEl: Element, stageW = STAGE_W, stageH = STAGE_H): StagePoint {
  const rect = stageEl.getBoundingClientRect()
  const scale = rect.width / stageW || 1
  const x = (clientX - rect.left) / scale
  const y = (clientY - rect.top) / scale
  return { x, y, inside: x >= 0 && y >= 0 && x <= stageW && y <= stageH }
}
