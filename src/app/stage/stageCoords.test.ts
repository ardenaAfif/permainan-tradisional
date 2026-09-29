import { describe, expect, it } from 'vitest'
import { clientToStage, fitContain, STAGE_H, STAGE_W } from './stageCoords'

const elemen = (left: number, top: number, scale: number) =>
  ({
    getBoundingClientRect: () => ({ left, top, width: STAGE_W * scale, height: STAGE_H * scale }),
  }) as unknown as Element

describe('fitContain', () => {
  it('pas persis di 1280x720', () => {
    expect(fitContain(1280, 720)).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it('HP mendatar 844x390: letterbox kiri-kanan', () => {
    const f = fitContain(844, 390)
    expect(f.scale).toBeCloseTo(390 / 720)
    expect(f.y).toBeCloseTo(0)
    expect(f.x).toBeCloseTo((844 - 1280 * f.scale) / 2)
  })

  it('HP tegak 390x844: letterbox atas-bawah', () => {
    const f = fitContain(390, 844)
    expect(f.scale).toBeCloseTo(390 / 1280)
    expect(f.x).toBeCloseTo(0)
    expect(f.y).toBeCloseTo((844 - 720 * f.scale) / 2)
  })

  it('panggung tegak 720x1280 di HP tegak 390x844: sama besar dengan HP mendatar', () => {
    const f = fitContain(390, 844, STAGE_H, STAGE_W)
    expect(f.scale).toBeCloseTo(390 / 720)
    expect(f.x).toBeCloseTo(0)
    expect(f.y).toBeCloseTo((844 - 1280 * f.scale) / 2)
  })

  it('PID 1920x1080 diperbesar 1,5x', () => {
    expect(fitContain(1920, 1080).scale).toBeCloseTo(1.5)
  })
})

describe('clientToStage', () => {
  it('mengubah titik layar ke koordinat panggung', () => {
    const el = elemen(100, 50, 0.5)
    expect(clientToStage(100, 50, el)).toEqual({ x: 0, y: 0, inside: true })
    expect(clientToStage(420, 230, el)).toEqual({ x: 640, y: 360, inside: true })
  })

  it('titik di letterbox ditandai di luar panggung', () => {
    const el = elemen(100, 50, 0.5)
    expect(clientToStage(90, 60, el).inside).toBe(false)
  })
})
