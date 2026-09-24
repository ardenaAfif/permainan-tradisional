import { useLayoutEffect, useState, type RefObject } from 'react'
import { fitContain, type StageFit } from './stageCoords'

export interface StageScale extends StageFit {
  /** Ukuran wadah (px layar). */
  width: number
  height: number
  portrait: boolean
}

function hitung(width: number, height: number): StageScale {
  return { ...fitContain(width, height), width, height, portrait: height > width }
}

/**
 * Pantau ukuran wadah dan hitung skala panggung 1280x720 (contain).
 * Tanpa `containerRef`, ukuran jendela yang dipakai.
 */
export function useStageScale(containerRef?: RefObject<HTMLElement | null>): StageScale {
  const [fit, setFit] = useState<StageScale>(() =>
    typeof window === 'undefined' ? hitung(1280, 720) : hitung(window.innerWidth, window.innerHeight),
  )

  useLayoutEffect(() => {
    const el = containerRef?.current
    const perbarui = () => {
      const w = el ? el.clientWidth : window.innerWidth
      const h = el ? el.clientHeight : window.innerHeight
      setFit((lama) => (lama.width === w && lama.height === h ? lama : hitung(w, h)))
    }
    perbarui()
    if (el && 'ResizeObserver' in window) {
      const ro = new ResizeObserver(perbarui)
      ro.observe(el)
      return () => ro.disconnect()
    }
    window.addEventListener('resize', perbarui)
    return () => window.removeEventListener('resize', perbarui)
  }, [containerRef])

  return fit
}
