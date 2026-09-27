import { describe, expect, it } from 'vitest'
import {
  acakLubang,
  bidikCpu,
  diLuarBatas,
  diLuarLingkaran,
  giliranKe,
  indeksPemenang,
  jarak,
  JARAK_MAKS,
  jarakLuncur,
  jumlahLubang,
  kecepatanDariKekuatan,
  kecepatanUntukJarak,
  lubangSah,
  penaruhLubang,
  perlambat,
  susunTaruhan,
  tempatDiGaris,
  terdekat,
} from './aturan'
import { BATAS, GALAT_CPU, GARIS_X, GARIS_Y_MAKS, LUBANG_ANTAR, PUSAT_LINGKARAN, R_LINGKARAN, R_TARUHAN, V_MAKS } from './config'

function acakTetap(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

describe('gerak di tanah', () => {
  it('kelereng melambat lalu berhenti', () => {
    expect(perlambat(10)).toBeLessThan(10)
    expect(perlambat(0.05)).toBe(0)
    expect(perlambat(0)).toBe(0)
  })

  it('sentil penuh melintasi hampir seluruh area, tapi bisa keluar garis', () => {
    const lebarArea = BATAS.kanan - GARIS_X
    expect(JARAK_MAKS).toBeGreaterThan(lebarArea * 0.95)
    expect(JARAK_MAKS).toBeLessThan(lebarArea * 1.4)
  })

  it('kecepatanUntukJarak adalah kebalikan jarakLuncur', () => {
    for (const d of [30, 150, 400, 800]) expect(jarakLuncur(kecepatanUntukJarak(d))).toBeCloseTo(d, -1)
    expect(kecepatanUntukJarak(JARAK_MAKS * 2)).toBe(V_MAKS)
  })

  it('kekuatan sebanding dengan jarak tempuh', () => {
    expect(jarakLuncur(kecepatanDariKekuatan(0.5))).toBeCloseTo(JARAK_MAKS / 2, -1)
    expect(kecepatanDariKekuatan(1)).toBeCloseTo(V_MAKS, 1)
    expect(kecepatanDariKekuatan(2)).toBeCloseTo(V_MAKS, 1)
    expect(kecepatanDariKekuatan(0)).toBe(0)
  })
})

describe('area', () => {
  it('keluar garis batas', () => {
    expect(diLuarBatas({ x: 600, y: 400 })).toBe(false)
    expect(diLuarBatas({ x: BATAS.kanan + 1, y: 400 })).toBe(true)
    expect(diLuarBatas({ x: 600, y: BATAS.atas - 1 })).toBe(true)
  })

  it('keluar lingkaran', () => {
    expect(diLuarLingkaran(PUSAT_LINGKARAN, PUSAT_LINGKARAN, R_LINGKARAN)).toBe(false)
    expect(diLuarLingkaran({ x: PUSAT_LINGKARAN.x + R_LINGKARAN + 1, y: PUSAT_LINGKARAN.y }, PUSAT_LINGKARAN, R_LINGKARAN)).toBe(true)
  })

  it('kelereng taruhan tersusun di dalam lingkaran tanpa bertumpuk', () => {
    const t = susunTaruhan(PUSAT_LINGKARAN)
    expect(t).toHaveLength(9)
    for (const p of t) expect(diLuarLingkaran(p, PUSAT_LINGKARAN, R_LINGKARAN - R_TARUHAN)).toBe(false)
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) expect(jarak(t[i]!, t[j]!)).toBeGreaterThan(R_TARUHAN * 2)
  })
})

describe('lubang', () => {
  it('minimal 3 lubang, 4 pemain = 4 lubang, ditaruh bergiliran', () => {
    expect(jumlahLubang(2)).toBe(3)
    expect(jumlahLubang(4)).toBe(4)
    expect([0, 1, 2].map((i) => penaruhLubang(i, 2))).toEqual([0, 1, 0])
  })

  it('lubang tidak boleh dekat garis sentil, batas, atau lubang lain', () => {
    expect(lubangSah({ x: 700, y: 400 }, [])).toBe(true)
    expect(lubangSah({ x: GARIS_X + 50, y: 400 }, [])).toBe(false)
    expect(lubangSah({ x: 700, y: BATAS.bawah - 10 }, [])).toBe(false)
    expect(lubangSah({ x: 700, y: 400 }, [{ x: 700 + LUBANG_ANTAR - 1, y: 400 }])).toBe(false)
  })

  it('Acak selalu memberi tempat yang sah', () => {
    const acak = acakTetap(5)
    const lubang = []
    for (let i = 0; i < 4; i++) {
      const p = acakLubang(lubang, acak)
      expect(lubangSah(p, lubang)).toBe(true)
      lubang.push(p)
    }
  })
})

describe('garis sentil', () => {
  it('gacoan bergeser di garis jika tempatnya terisi', () => {
    const p = tempatDiGaris(400, [{ x: GARIS_X, y: 400 }], 34)
    expect(p.x).toBe(GARIS_X)
    expect(Math.abs(p.y - 400)).toBeGreaterThanOrEqual(34)
    expect(tempatDiGaris(5000, [], 34).y).toBe(GARIS_Y_MAKS)
  })
})

describe('giliran & pemenang', () => {
  it('giliran bergantian antarpemain', () => {
    expect(giliranKe(0, 3)).toEqual({ pemain: 0, ke: 1 })
    expect(giliranKe(4, 3)).toEqual({ pemain: 1, ke: 2 })
  })

  it('poin terbanyak menang, poin tertinggi sama = seri', () => {
    expect(indeksPemenang([2, 5, 1])).toBe(1)
    expect(indeksPemenang([3, 3, 1])).toBeNull()
    expect(indeksPemenang([0, 0])).toBeNull()
  })
})

describe('komputer', () => {
  it('membidik target terdekat', () => {
    expect(terdekat({ x: 0, y: 0 }, [{ x: 50, y: 0 }, { x: 10, y: 10 }])).toEqual({ x: 10, y: 10 })
    expect(terdekat({ x: 0, y: 0 }, [])).toBeNull()
  })

  it('galat sudut sesuai tingkat kesulitan', () => {
    for (const tingkat of ['mudah', 'sedang', 'sulit'] as const) {
      const acak = acakTetap(11)
      let maks = 0
      for (let i = 0; i < 400; i++) {
        const b = bidikCpu({ x: 0, y: 0 }, { x: 300, y: 0 }, GALAT_CPU[tingkat], 0, 0, acak)
        maks = Math.max(maks, Math.abs((b.sudut * 180) / Math.PI))
      }
      expect(maks).toBeLessThanOrEqual(GALAT_CPU[tingkat])
      expect(maks).toBeGreaterThan(GALAT_CPU[tingkat] * 0.9)
    }
  })

  it('kekuatan cukup untuk berhenti di target', () => {
    const b = bidikCpu({ x: 0, y: 0 }, { x: 400, y: 0 }, 0, 0, 0)
    expect(jarakLuncur(kecepatanDariKekuatan(b.kekuatan))).toBeCloseTo(400, -1)
  })
})
