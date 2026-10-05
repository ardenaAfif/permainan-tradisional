import { describe, expect, it } from 'vitest'
import { evaluasi, langkahMudah, minimax, nilaiMinimax, pilihLangkah } from './ai'
import { cariTitik, hasilAkhir, langkahSah, siapkanMeja, terapkan, type Keadaan, type Koordinat, type Pemain } from './aturan'
import { ATURAN, PAPAN_5X5, VARIAN_AKTIF } from './config'

/** Generator acak tetap supaya uji bisa diulang. */
function acakTetap(benih = 1) {
  let s = benih
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

function susun(bidak: { 0?: Koordinat[]; 1?: Koordinat[] }, giliran: Pemain = 0) {
  const { meja } = siapkanMeja({ nama: 'uji', bentuk: PAPAN_5X5, posisiAwal: [[[0, 4]], [[0, 0]]] }, ATURAN)
  const t = (k: Koordinat) => cariTitik(meja.papan, k)
  const isi: Keadaan['isi'] = meja.papan.titik.map(() => null)
  for (const k of bidak[0] ?? []) isi[t(k)] = 0
  for (const k of bidak[1] ?? []) isi[t(k)] = 1
  return { meja, k: { isi, giliran, tanpaMakan: 0 } as Keadaan, t }
}

describe('evaluasi', () => {
  it('selisih bidak lebih berat daripada mobilitas', () => {
    const { meja, k } = susun({ 0: [[2, 2], [0, 4]], 1: [[0, 0]] })
    expect(evaluasi(meja, k, 0)).toBeGreaterThan(100)
    expect(evaluasi(meja, k, 1)).toBeLessThan(-100)
  })

  it('posisi awal seimbang', () => {
    const { meja, awal } = siapkanMeja(VARIAN_AKTIF, ATURAN)
    expect(evaluasi(meja, awal, 0)).toBe(0)
    expect(evaluasi(meja, awal, 1)).toBe(0)
  })
})

describe('mudah', () => {
  it('selalu menangkap jika bisa, rangkaian terpanjang', () => {
    const { meja, k, t } = susun({ 0: [[0, 4], [4, 4]], 1: [[0, 3], [1, 2], [4, 0]] })
    for (let i = 1; i <= 20; i++) {
      const l = langkahMudah(meja, k, acakTetap(i))!
      expect(l.tangkap).toEqual([t([0, 3]), t([1, 2])])
    }
  })

  it('tanpa tangkapan: langkah acak yang sah', () => {
    const { meja, awal } = siapkanMeja(VARIAN_AKTIF, ATURAN)
    const sah = langkahSah(meja, awal)
    expect(sah).toContainEqual(langkahMudah(meja, awal, acakTetap(3)))
  })
})

describe('minimax', () => {
  it('sedang: mengambil tangkapan gratis', () => {
    const { meja, k, t } = susun({ 0: [[0, 4]], 1: [[1, 3], [4, 0]] })
    const l = pilihLangkah(meja, k, 'sedang', acakTetap())!
    expect(l.tangkap).toEqual([t([1, 3])])
  })

  it('sedang: tidak melangkah ke titik yang langsung bisa dimakan', () => {
    // Bidak 0 di (0,4) satu-satunya; lawan di (2,2) dan (4,0).
    // Melangkah ke (1,3) atau (0,3)/(1,4) — (1,3) bisa dimakan (2,2) → (0,4).
    const { meja, k, t } = susun({ 0: [[0, 4]], 1: [[2, 2], [4, 0]] })
    for (let i = 1; i <= 10; i++) {
      const l = minimax(meja, k, 2, false, acakTetap(i))!
      expect(l.jalur[0]).not.toBe(t([1, 3]))
    }
  })

  it('sedang & sulit: mengambil langkah yang langsung membuat lawan buntu', () => {
    // Bidak pemain 1 di sudut (0,0); menutup (1,1) dari (1,2) membuatnya tidak bisa bergerak.
    const { meja, k, t } = susun({ 0: [[1, 0], [0, 1], [2, 0], [0, 2], [2, 2], [1, 2], [4, 4]], 1: [[0, 0]] })
    for (const kes of ['sedang', 'sulit'] as const) {
      for (let i = 1; i <= 5; i++) {
        const l = pilihLangkah(meja, k, kes, acakTetap(i))!
        expect(l).toEqual({ dari: t([1, 2]), jalur: [t([1, 1])], tangkap: [] })
        expect(hasilAkhir(meja, terapkan(k, l))).toEqual({ pemenang: 0, sebab: 'buntu' })
      }
    }
  })

  it('alpha-beta memberi nilai yang sama dengan minimax penuh', () => {
    const { meja, awal } = siapkanMeja(VARIAN_AKTIF, ATURAN)
    let k = awal
    const acak = acakTetap(11)
    for (let i = 0; i < 6; i++) {
      expect(nilaiMinimax(meja, k, 3, true)).toBe(nilaiMinimax(meja, k, 3, false))
      k = terapkan(k, langkahMudah(meja, k, acak)!)
    }
  })

  it('selalu mengembalikan langkah sah dari posisi awal', () => {
    const { meja, awal } = siapkanMeja(VARIAN_AKTIF, ATURAN)
    const sah = langkahSah(meja, awal)
    for (const kes of ['mudah', 'sedang', 'sulit'] as const) {
      expect(sah).toContainEqual(pilihLangkah(meja, awal, kes, acakTetap(7)))
    }
  })

  it('tanpa langkah sah → null', () => {
    const { meja, k } = susun({ 1: [[0, 0]] })
    expect(pilihLangkah(meja, k, 'sulit')).toBeNull()
  })
})
