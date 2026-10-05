import { describe, expect, it } from 'vitest'
import { SUDUT_KEMUDI, ZONA_MATI } from './config'
import { kemudiDariSelisih, sudutLayar } from './miring'

describe('sensor miring', () => {
  it('HP tegak = 0°, HP mendatar = ±90°, HP rata di meja tidak terbaca', () => {
    expect(sudutLayar(90, 0)).toBeCloseTo(0)
    expect(Math.abs(sudutLayar(0, 90)!)).toBeCloseTo(90)
    expect(Math.abs(sudutLayar(0, -90)!)).toBeCloseTo(90)
    expect(sudutLayar(2, 3)).toBeNull()
  })

  it('memutar HP searah jarum jam mendorong ke kanan (+), berlawanan ke kiri (−)', () => {
    // Searah jarum jam: arah "atas" di layar berputar berlawanan, sudut layar mengecil.
    expect(kemudiDariSelisih(-12)).toBeGreaterThan(0)
    expect(kemudiDariSelisih(12)).toBeLessThan(0)
  })

  it('zona mati di tengah, penuh di SUDUT_KEMUDI, dan melewati ±180° dengan benar', () => {
    expect(kemudiDariSelisih(ZONA_MATI - 0.5)).toBe(0)
    expect(kemudiDariSelisih(-SUDUT_KEMUDI)).toBeCloseTo(1)
    expect(kemudiDariSelisih(-80)).toBe(1)
    expect(kemudiDariSelisih(350)).toBeCloseTo(kemudiDariSelisih(-10))
  })
})
