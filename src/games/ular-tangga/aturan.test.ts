import { describe, expect, it } from 'vitest'
import { hitungLangkah, kotakKeGrid } from './aturan'
import { JUMLAH_KOTAK, TANGGA, ULAR } from './config'

describe('hitungLangkah', () => {
  it('pion bergerak sesuai angka dadu, kotak demi kotak', () => {
    const h = hitungLangkah(10, 4, [], [])
    expect(h.jalur).toEqual([11, 12, 13, 14])
    expect(h.akhir).toBe(14)
    expect(h.menang).toBe(false)
  })

  it('masuk papan dari posisi 0', () => {
    expect(hitungLangkah(0, 1, [], []).akhir).toBe(1)
  })

  it('berhenti di kaki tangga → naik', () => {
    const h = hitungLangkah(1, 2, [{ dari: 3, ke: 22 }], [])
    expect(h.mendarat).toBe(3)
    expect(h.akhir).toBe(22)
    expect(h.tangga).toEqual({ dari: 3, ke: 22 })
  })

  it('berhenti di kepala ular → turun', () => {
    const h = hitungLangkah(15, 2, [], [{ kepala: 17, ekor: 4 }])
    expect(h.akhir).toBe(4)
    expect(h.ular).toEqual({ kepala: 17, ekor: 4 })
  })

  it('hanya melewati kaki tangga/kepala ular tidak berpengaruh', () => {
    expect(hitungLangkah(1, 5, [{ dari: 3, ke: 22 }], [{ kepala: 5, ekor: 2 }]).akhir).toBe(6)
  })

  it('angka pas ke kotak 100 → menang', () => {
    const h = hitungLangkah(96, 4, [], [])
    expect(h.akhir).toBe(100)
    expect(h.menang).toBe(true)
    expect(h.memantul).toBe(false)
  })

  it('lebih dari 100 → memantul mundur sebanyak sisanya', () => {
    const h = hitungLangkah(97, 6, [], [])
    expect(h.jalur).toEqual([98, 99, 100, 99, 98, 97])
    expect(h.akhir).toBe(97)
    expect(h.memantul).toBe(true)
    expect(h.menang).toBe(false)
  })

  it('pantulan yang mendarat di kepala ular tetap turun', () => {
    const h = hitungLangkah(99, 3, [], [{ kepala: 98, ekor: 79 }])
    expect(h.jalur).toEqual([100, 99, 98])
    expect(h.akhir).toBe(79)
  })
})

describe('kotakKeGrid (zig-zag)', () => {
  it('baris bawah kiri→kanan, baris kedua kanan→kiri', () => {
    expect(kotakKeGrid(1)).toEqual({ baris: 0, kolom: 0 })
    expect(kotakKeGrid(10)).toEqual({ baris: 0, kolom: 9 })
    expect(kotakKeGrid(11)).toEqual({ baris: 1, kolom: 9 })
    expect(kotakKeGrid(20)).toEqual({ baris: 1, kolom: 0 })
    expect(kotakKeGrid(100)).toEqual({ baris: 9, kolom: 0 })
  })
})

describe('config papan', () => {
  const ujung = [...TANGGA.flatMap((t) => [t.dari, t.ke]), ...ULAR.flatMap((u) => [u.kepala, u.ekor])]

  it('setiap kotak paling banyak jadi satu ujung tangga/ular', () => {
    expect(new Set(ujung).size).toBe(ujung.length)
  })

  it('tangga naik, ular turun, semua di dalam papan, kotak 1 & 100 kosong', () => {
    TANGGA.forEach((t) => expect(t.ke).toBeGreaterThan(t.dari))
    ULAR.forEach((u) => expect(u.ekor).toBeLessThan(u.kepala))
    ujung.forEach((n) => {
      expect(n).toBeGreaterThan(1)
      expect(n).toBeLessThan(JUMLAH_KOTAK)
    })
  })
})
