import { describe, expect, it } from 'vitest'
import { JamLagu } from './JamLagu'

describe('JamLagu', () => {
  it('berjalan dari waktu awal dan berhenti selama jeda', () => {
    let kini = 1000
    const jam = new JamLagu(-3000, () => kini)
    expect(jam.sekarang()).toBe(-3000)
    kini += 500
    expect(jam.sekarang()).toBe(-2500)
    jam.jeda()
    kini += 10_000
    expect(jam.sekarang()).toBe(-2500)
    jam.lanjut()
    kini += 200
    expect(jam.sekarang()).toBe(-2300)
  })

  it('jeda/lanjut berulang aman', () => {
    let kini = 0
    const jam = new JamLagu(0, () => kini)
    jam.lanjut()
    jam.jeda()
    jam.jeda()
    kini += 100
    jam.lanjut()
    jam.lanjut()
    kini += 50
    expect(jam.sekarang()).toBe(50)
  })
})
