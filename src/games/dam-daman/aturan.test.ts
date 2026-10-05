import { describe, expect, it } from 'vitest'
import games from '../../data/games.json'
import {
  bangunPapan,
  cariTitik,
  cocokAwalan,
  hasilAkhir,
  hitungBidak,
  langkahSah,
  pindahkan,
  siapkanMeja,
  terapkan,
  type AturanMain,
  type Keadaan,
  type Koordinat,
  type Langkah,
  type Meja,
  type Pemain,
} from './aturan'
import { ATURAN, PAPAN_5X5, PAPAN_SEGITIGA, ruas, VARIAN, VARIAN_AKTIF } from './config'

const BEBAS: AturanMain = { wajibMakan: false, bolehMundur: true, batasSeri: 40 }

/** Meja kosong dengan bidak di koordinat tertentu. */
function susun(
  bidak: { 0?: Koordinat[]; 1?: Koordinat[] },
  aturan: Partial<AturanMain> = {},
  opsi: { giliran?: Pemain; bentuk?: typeof PAPAN_5X5 } = {},
): { meja: Meja; k: Keadaan; t: (k: Koordinat) => number } {
  const { meja } = siapkanMeja(
    // Arah maju tetap seperti varian bawaan: pemain 0 di bawah.
    { nama: 'uji', bentuk: opsi.bentuk ?? PAPAN_5X5, posisiAwal: [[[0, 4]], [[0, 0]]] },
    { ...BEBAS, ...aturan },
  )
  const t = (k: Koordinat) => {
    const i = cariTitik(meja.papan, k)
    if (i < 0) throw new Error(`bukan titik: ${k}`)
    return i
  }
  const isi: Keadaan['isi'] = meja.papan.titik.map(() => null)
  for (const k of bidak[0] ?? []) isi[t(k)] = 0
  for (const k of bidak[1] ?? []) isi[t(k)] = 1
  return { meja, k: { isi, giliran: opsi.giliran ?? 0, tanpaMakan: 0 }, t }
}

const tujuan = (daftar: Langkah[], dari: number) =>
  daftar
    .filter((l) => l.dari === dari && l.tangkap.length === 0)
    .map((l) => l.jalur[0]!)
    .sort((a, b) => a - b)

describe('ruas', () => {
  it('membagi garis lurus per satuan grid', () => {
    expect(ruas([0, 0], [2, 2])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ])
  })

  it('bisa melompati titik yang tidak ada (alas segitiga)', () => {
    expect(ruas([0, -2], [4, -2], 2)).toEqual([
      [0, -2],
      [2, -2],
      [4, -2],
    ])
  })
})

describe('papan 5x5', () => {
  const papan = bangunPapan(PAPAN_5X5)
  const t = (k: Koordinat) => cariTitik(papan, k)
  const tetangga = (k: Koordinat) => papan.tetangga[t(k)]!.map((i) => papan.titik[i])

  it('punya 25 titik', () => {
    expect(papan.titik).toHaveLength(25)
  })

  it('titik genap (x+y) punya diagonal, titik ganjil tidak', () => {
    expect(tetangga([2, 2])).toHaveLength(8)
    expect(tetangga([0, 0])).toHaveLength(3)
    expect(tetangga([1, 0])).toHaveLength(3)
    expect(tetangga([1, 0])).not.toContainEqual([0, 1])
    expect(tetangga([1, 2])).toHaveLength(4)
  })

  it('lompatan hanya lurus sepanjang garis', () => {
    const dariSudut = papan.lompatan[t([0, 0])]!.map((l) => papan.titik[l.ke])
    expect(dariSudut).toHaveLength(3)
    expect(dariSudut).toEqual(expect.arrayContaining([[2, 0], [0, 2], [2, 2]]))
    // (1,0) tidak punya diagonal, jadi tidak bisa melompat ke (3,2).
    expect(papan.lompatan[t([1, 0])]!.map((l) => papan.titik[l.ke])).not.toContainEqual([3, 2])
  })
})

describe('papan segitiga', () => {
  const papan = bangunPapan(PAPAN_SEGITIGA)
  const t = (k: Koordinat) => cariTitik(papan, k)

  it('punya 25 + 2×6 titik', () => {
    expect(papan.titik).toHaveLength(37)
  })

  it('puncak segitiga tersambung ke dalam segitiga dan ke diagonal papan', () => {
    const tet = papan.tetangga[t([2, 0])]!.map((i) => papan.titik[i])
    expect(tet).toEqual(expect.arrayContaining([[1, -1], [2, -1], [3, -1], [1, 1], [3, 1], [2, 1], [1, 0], [3, 0]]))
  })

  it('bisa melompat lurus melewati puncak segitiga', () => {
    const { meja, k, t } = susun({ 0: [[1, 1]], 1: [[2, 0]] }, {}, { bentuk: PAPAN_SEGITIGA })
    const makan = langkahSah(meja, k).filter((l) => l.tangkap.length > 0)
    expect(makan).toEqual([{ dari: t([1, 1]), jalur: [t([3, -1])], tangkap: [t([2, 0])] }])
  })

  it('alas segitiga: lompat dari ujung ke ujung melewati tengah', () => {
    const { meja, k, t } = susun({ 0: [[0, -2]], 1: [[2, -2]] }, {}, { bentuk: PAPAN_SEGITIGA })
    expect(langkahSah(meja, k).some((l) => l.jalur[0] === t([4, -2]) && l.tangkap[0] === t([2, -2]))).toBe(true)
  })
})

describe('varian di config', () => {
  it.each(Object.entries(VARIAN))('%s: posisi awal sah, titik tengah kosong, jumlah bidak sama', (_, v) => {
    const { meja, awal } = siapkanMeja(v, ATURAN)
    expect(hitungBidak(awal, 0)).toBe(hitungBidak(awal, 1))
    expect(awal.isi[cariTitik(meja.papan, [2, 2])]).toBeNull()
    expect(awal.isi.filter((x) => x === null)).toHaveLength(1)
    expect(meja.maju).toEqual([-1, 1])
    expect(langkahSah(meja, awal).length).toBeGreaterThan(0)
  })

  it('varian bawaan: 12 bidak per pemain', () => {
    const { awal } = siapkanMeja(VARIAN_AKTIF, ATURAN)
    expect(hitungBidak(awal, 0)).toBe(12)
    expect(hitungBidak(awal, 1)).toBe(12)
  })

  it('posisi awal di luar papan ditolak', () => {
    expect(() => siapkanMeja({ nama: 'x', bentuk: PAPAN_5X5, posisiAwal: [[[9, 9]], []] }, ATURAN)).toThrow()
  })

  it('catatan web di games.json selaras dengan ATURAN', () => {
    const catatan = (games as { id: string; catatanWeb?: string[] }[]).find((g) => g.id === 'dam-daman')!.catatanWeb!.join(' ')
    expect(catatan.includes('tidak wajib')).toBe(!ATURAN.wajibMakan)
    expect(catatan.includes('boleh mundur')).toBe(ATURAN.bolehMundur)
    expect(catatan).toContain(`${ATURAN.batasSeri} langkah`)
  })
})

describe('langkah biasa', () => {
  it('satu titik ke titik kosong yang terhubung garis', () => {
    const { meja, k, t } = susun({ 0: [[2, 2]], 1: [[2, 1]] })
    const ke = tujuan(langkahSah(meja, k), t([2, 2]))
    // 8 tetangga, satu terisi lawan.
    expect(ke).toHaveLength(7)
    expect(ke).not.toContain(t([2, 1]))
  })

  it('titik tanpa diagonal tidak bisa melangkah miring', () => {
    const { meja, k, t } = susun({ 0: [[1, 2]] })
    expect(tujuan(langkahSah(meja, k), t([1, 2]))).toEqual([t([0, 2]), t([2, 2]), t([1, 1]), t([1, 3])].sort((a, b) => a - b))
  })

  it('bolehMundur false: hanya maju atau ke samping (kedua pemain)', () => {
    const { meja, k, t } = susun({ 0: [[2, 2]], 1: [[0, 2]] }, { bolehMundur: false })
    expect(tujuan(langkahSah(meja, k), t([2, 2]))).toEqual([t([1, 1]), t([2, 1]), t([3, 1]), t([1, 2]), t([3, 2])].sort((a, b) => a - b))
    const giliran1 = { ...k, giliran: 1 as Pemain }
    // Pemain 1 maju ke bawah.
    expect(tujuan(langkahSah(meja, giliran1), t([0, 2]))).toEqual([t([1, 2]), t([0, 3]), t([1, 3])].sort((a, b) => a - b))
  })

  it('bolehMundur false tetap boleh menangkap ke belakang', () => {
    const { meja, k, t } = susun({ 0: [[2, 2]], 1: [[2, 3]] }, { bolehMundur: false })
    expect(langkahSah(meja, k)).toContainEqual({ dari: t([2, 2]), jalur: [t([2, 4])], tangkap: [t([2, 3])] })
  })
})

describe('menangkap', () => {
  it('melompati lawan yang bersebelahan ke titik kosong di baliknya', () => {
    const { meja, k, t } = susun({ 0: [[0, 4]], 1: [[1, 3]] })
    expect(langkahSah(meja, k)).toContainEqual({ dari: t([0, 4]), jalur: [t([2, 2])], tangkap: [t([1, 3])] })
  })

  it('tidak bisa melompati bidak sendiri, atau mendarat di titik terisi', () => {
    const a = susun({ 0: [[0, 4], [1, 3]] })
    expect(langkahSah(a.meja, a.k).every((l) => l.tangkap.length === 0)).toBe(true)
    const b = susun({ 0: [[0, 4]], 1: [[1, 3], [2, 2]] })
    expect(langkahSah(b.meja, b.k).every((l) => l.tangkap.length === 0)).toBe(true)
  })

  it('tidak bisa melompat miring dari titik tanpa diagonal', () => {
    const { meja, k } = susun({ 0: [[1, 4]], 1: [[2, 3]] })
    expect(langkahSah(meja, k).every((l) => l.tangkap.length === 0)).toBe(true)
  })

  it('lompatan beruntun; tanpa wajib makan setiap awalan rangkaian juga sah', () => {
    // (0,4) → lompati (0,3) → (0,2) → lompati (1,2) → (2,2) → lompati (3,2) → (4,2)
    const { meja, k, t } = susun({ 0: [[0, 4]], 1: [[0, 3], [1, 2], [3, 2]] })
    const makan = langkahSah(meja, k).filter((l) => l.tangkap.length > 0)
    expect(makan).toContainEqual({ dari: t([0, 4]), jalur: [t([0, 2])], tangkap: [t([0, 3])] })
    expect(makan).toContainEqual({ dari: t([0, 4]), jalur: [t([0, 2]), t([2, 2])], tangkap: [t([0, 3]), t([1, 2])] })
    expect(makan).toContainEqual({
      dari: t([0, 4]),
      jalur: [t([0, 2]), t([2, 2]), t([4, 2])],
      tangkap: [t([0, 3]), t([1, 2]), t([3, 2])],
    })
    // Langkah biasa tetap boleh.
    expect(langkahSah(meja, k).some((l) => l.tangkap.length === 0)).toBe(true)
  })

  it('bidak tertangkap langsung diangkat: tidak bisa dilompati dua kali', () => {
    const { meja, k } = susun({ 0: [[0, 2]], 1: [[1, 2]] })
    for (const l of langkahSah(meja, k)) expect(new Set(l.tangkap).size).toBe(l.tangkap.length)
  })

  it('wajibMakan: hanya langkah menangkap, dan lompatan harus diteruskan', () => {
    const { meja, k, t } = susun({ 0: [[0, 4], [4, 4]], 1: [[0, 3], [1, 2]] }, { wajibMakan: true })
    expect(langkahSah(meja, k)).toEqual([{ dari: t([0, 4]), jalur: [t([0, 2]), t([2, 2])], tangkap: [t([0, 3]), t([1, 2])] }])
  })

  it('wajibMakan: jika tidak ada yang bisa menangkap, langkah biasa sah', () => {
    const { meja, k } = susun({ 0: [[0, 4]], 1: [[4, 0]] }, { wajibMakan: true })
    expect(langkahSah(meja, k).length).toBeGreaterThan(0)
  })
})

describe('terapkan', () => {
  it('memindah bidak, mengangkat tangkapan, ganti giliran, hitung langkah tanpa makan', () => {
    const { meja, k, t } = susun({ 0: [[0, 4]], 1: [[0, 3], [4, 0]] })
    const makan = langkahSah(meja, k).find((l) => l.tangkap.length === 1)!
    const k1 = terapkan({ ...k, tanpaMakan: 7 }, makan)
    expect(k1.isi[t([0, 4])]).toBeNull()
    expect(k1.isi[t([0, 3])]).toBeNull()
    expect(k1.isi[t([0, 2])]).toBe(0)
    expect(k1.giliran).toBe(1)
    expect(k1.tanpaMakan).toBe(0)
    const geser = langkahSah(meja, k1).find((l) => l.dari === t([4, 0]))!
    expect(terapkan(k1, geser).tanpaMakan).toBe(1)
  })

  it('pindahkan tidak mengubah papan asal', () => {
    const { k, t } = susun({ 0: [[0, 4]] })
    const isi = pindahkan(k.isi, { dari: t([0, 4]), jalur: [t([0, 3])], tangkap: [] })
    expect(isi[t([0, 3])]).toBe(0)
    expect(k.isi[t([0, 4])]).toBe(0)
  })

  it('cocokAwalan untuk memilih lompatan selangkah demi selangkah', () => {
    const l: Langkah = { dari: 1, jalur: [5, 9], tangkap: [3, 7] }
    expect(cocokAwalan(l, 1, [])).toBe(true)
    expect(cocokAwalan(l, 1, [5])).toBe(true)
    expect(cocokAwalan(l, 1, [9])).toBe(false)
    expect(cocokAwalan(l, 2, [])).toBe(false)
  })
})

describe('akhir permainan', () => {
  it('menang jika bidak lawan habis', () => {
    const { meja, k } = susun({ 0: [[0, 4]] }, {}, { giliran: 1 })
    expect(hasilAkhir(meja, k)).toEqual({ pemenang: 0, sebab: 'habis' })
  })

  it('menang jika lawan tidak punya langkah sah', () => {
    // Bidak pemain 1 di sudut (0,0) terkurung; tiga lompatannya juga tertutup.
    const { meja, k } = susun({ 0: [[1, 0], [0, 1], [1, 1], [2, 0], [0, 2], [2, 2]], 1: [[0, 0]] }, {}, { giliran: 1 })
    expect(hasilAkhir(meja, k)).toEqual({ pemenang: 0, sebab: 'buntu' })
  })

  it('seri setelah 40 langkah berturut-turut tanpa penangkapan', () => {
    const { meja, k } = susun({ 0: [[0, 4]], 1: [[4, 0]] })
    expect(hasilAkhir(meja, { ...k, tanpaMakan: 39 })).toBeNull()
    expect(hasilAkhir(meja, { ...k, tanpaMakan: 40 })).toEqual({ pemenang: null, sebab: 'seri' })
  })

  it('posisi awal belum berakhir', () => {
    const { meja, awal } = siapkanMeja(VARIAN_AKTIF, ATURAN)
    expect(hasilAkhir(meja, awal)).toBeNull()
  })
})
