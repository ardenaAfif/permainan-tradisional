import { describe, expect, it } from 'vitest'
import {
  cincinLevel,
  hasilLempar,
  jariCincin,
  jarumDiTengah,
  jumlahKotak,
  levelTuntas,
  nilaiTekan,
  polaSah,
  posisiMeter,
  rencanaCpu,
  sapuanLevel,
  sudutJarum,
  susunLangkah,
  tengahRuas,
  type Langkah,
  type Pola,
} from './aturan'
import { GARIS_METER, JENDELA_PAS, PELUANG_CPU, PERIODE_JARUM, POLA, R_TEPAT, SAPUAN_AKHIR, SAPUAN_AWAL, SUDUT_MAKS } from './config'

function acakTetap(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Ringkas: "1s" = baris 1 satu kaki, "3d" = dua kaki, "P" = setengah lingkaran, "*" = ambil gacuk di sini. */
const ringkas = (l: Langkah[], n = POLA.baris.length) =>
  l.map((x) => `${x.baris === n ? 'P' : x.kotak.join('+')}${x.kaki === 'satu' ? 's' : 'd'}${x.ambil ? '*' : ''}`).join(' ')

describe('pola', () => {
  it('pola bawaan: 8 kotak (1, 2, 3 tunggal; 4-5; 6; 7-8) dan setengah lingkaran', () => {
    expect(polaSah(POLA)).toBe(true)
    expect(jumlahKotak(POLA)).toBe(8)
    expect(POLA.putar).toBe(true)
  })

  it('pola dengan nomor loncat atau baris kosong ditolak', () => {
    expect(polaSah({ baris: [[1], [3]], putar: true })).toBe(false)
    expect(polaSah({ baris: [[1], []], putar: true })).toBe(false)
    expect(polaSah({ baris: [[1], [2, 3, 4]], putar: true })).toBe(false)
  })
})

describe('urutan lompatan', () => {
  it('gacuk di kotak 1: kotak 1 dilompati, gacuk diambil dari kotak 2', () => {
    expect(ringkas(susunLangkah(POLA, 1))).toBe('2s 3s 4+5d 6s 7+8d Pd 7+8d 6s 4+5d 3s 2s* 1s')
  })

  it('gacuk di kotak berpasangan: kotak sebelahnya diinjak satu kaki', () => {
    expect(ringkas(susunLangkah(POLA, 4))).toBe('1s 2s 3s 5s 6s 7+8d Pd 7+8d 6s* 4+5d 3s 2s 1s')
  })

  it('gacuk di kotak 8: diambil dari setengah lingkaran', () => {
    expect(ringkas(susunLangkah(POLA, 8))).toBe('1s 2s 3s 4+5d 6s 7s Pd* 7+8d 6s 4+5d 3s 2s 1s')
  })

  it('tepat satu kali ambil, dan kotak bergacuk tidak pernah diinjak sebelum diambil', () => {
    for (let t = 1; t <= 8; t++) {
      const l = susunLangkah(POLA, t)
      expect(l.filter((x) => x.ambil)).toHaveLength(1)
      const iAmbil = l.findIndex((x) => x.ambil)
      for (const x of l.slice(0, iAmbil + 1)) expect(x.kotak).not.toContain(t)
      // Setelah diambil, lompatan berikutnya masuk ke baris bergacuk.
      expect(l[iAmbil + 1]?.kotak).toContain(t)
    }
  })

  it('kaki mengikuti jumlah kotak yang diinjak', () => {
    for (let t = 1; t <= 8; t++) {
      for (const x of susunLangkah(POLA, t)) {
        if (x.baris < POLA.baris.length) expect(x.kaki).toBe(x.kotak.length === 2 ? 'dua' : 'satu')
      }
    }
  })

  it('pola tanpa setengah lingkaran berbalik di baris terakhir', () => {
    const pola: Pola = { baris: [[1], [2, 3], [4]], putar: false }
    expect(ringkas(susunLangkah(pola, 2), 3)).toBe('1s 3s 4s* 2+3d 1s')
    // Gacuk di baris terakhir: diambil dari titik balik.
    expect(ringkas(susunLangkah(pola, 4), 3)).toBe('1s 2+3d* 1s')
  })
})

describe('meter lempar', () => {
  it('jarum bolak-balik 0 → 1 → 0', () => {
    expect(posisiMeter(0, 1000)).toBe(0)
    expect(posisiMeter(500, 1000)).toBeCloseTo(0.5)
    expect(posisiMeter(1000, 1000)).toBeCloseTo(1)
    expect(posisiMeter(1500, 1000)).toBeCloseTo(0.5)
    expect(posisiMeter(2000, 1000)).toBeCloseTo(0)
  })

  it('makin tinggi level, jarum makin cepat', () => {
    expect(sapuanLevel(1, 8)).toBe(SAPUAN_AWAL)
    expect(sapuanLevel(8, 8)).toBe(SAPUAN_AKHIR)
    expect(sapuanLevel(4, 8)).toBeLessThan(SAPUAN_AWAL)
  })

  it('tengah ruas = kotak itu; tepi ruas = garis', () => {
    for (let k = 1; k <= 8; k++) expect(hasilLempar(tengahRuas(k, 8), 8, GARIS_METER)).toEqual({ jenis: 'kotak', kotak: k })
    expect(hasilLempar(0, 8, GARIS_METER)).toEqual({ jenis: 'garis', antara: [0, 1] })
    expect(hasilLempar(1, 8, GARIS_METER)).toEqual({ jenis: 'garis', antara: [8, 9] })
    expect(hasilLempar(3 / 8, 8, GARIS_METER)).toEqual({ jenis: 'garis', antara: [3, 4] })
    expect(hasilLempar(3 / 8 + 0.001, 8, GARIS_METER)).toEqual({ jenis: 'garis', antara: [3, 4] })
    expect(hasilLempar(3 / 8 + 0.01, 8, GARIS_METER)).toEqual({ jenis: 'kotak', kotak: 4 })
  })
})

describe('lingkaran timing', () => {
  const c = cincinLevel(1, 8)

  it('lingkaran pas di zona hijau pada saat ideal, lalu terus menyusut', () => {
    expect(jariCincin(c.tepat, c)).toBeCloseTo(R_TEPAT)
    expect(jariCincin(0, c)).toBeGreaterThan(R_TEPAT * 2)
    expect(jariCincin(c.lama, c)).toBeLessThan(R_TEPAT)
    expect(jariCincin(c.lama, c)).toBeGreaterThanOrEqual(0)
  })

  it('tap di zona hijau = pas; di luar = terlalu cepat / terlambat', () => {
    expect(nilaiTekan(c.tepat, c)).toBe('pas')
    expect(nilaiTekan(c.tepat - JENDELA_PAS, c)).toBe('pas')
    expect(nilaiTekan(c.tepat + JENDELA_PAS, c)).toBe('pas')
    expect(nilaiTekan(c.tepat - JENDELA_PAS - 1, c)).toBe('cepat')
    expect(nilaiTekan(c.tepat + JENDELA_PAS + 1, c)).toBe('lambat')
  })

  it('zona hijau selesai sebelum lingkaran hilang', () => {
    for (const lv of [1, 8]) {
      const k = cincinLevel(lv, 8)
      expect(k.tepat + JENDELA_PAS).toBeLessThan(k.lama)
      expect(k.tepat - JENDELA_PAS).toBeGreaterThan(300)
    }
  })
})

describe('jarum keseimbangan', () => {
  it('mulai miring (tap sekejap gagal), melewati tengah setelah seperempat ayunan', () => {
    expect(jarumDiTengah(sudutJarum(0))).toBe(false)
    expect(jarumDiTengah(sudutJarum(PERIODE_JARUM / 4))).toBe(true)
  })

  it('ayunan makin lebar tapi tidak melebihi batas', () => {
    const puncak = (t: number) => Math.abs(sudutJarum(t))
    expect(puncak(PERIODE_JARUM * 3)).toBeGreaterThan(puncak(0))
    for (let t = 0; t < 20000; t += 37) expect(Math.abs(sudutJarum(t))).toBeLessThanOrEqual(SUDUT_MAKS)
  })
})

describe('komputer', () => {
  it('peluang berhasil sesuai tingkat kesulitan', () => {
    for (const tingkat of ['mudah', 'sedang', 'sulit'] as const) {
      const acak = acakTetap(7)
      let berhasil = 0
      for (let i = 0; i < 4000; i++) if (rencanaCpu(14, PELUANG_CPU[tingkat], acak) === null) berhasil++
      expect(berhasil / 4000).toBeCloseTo(PELUANG_CPU[tingkat], 1)
    }
    expect(PELUANG_CPU.mudah).toBeLessThan(PELUANG_CPU.sedang)
    expect(PELUANG_CPU.sedang).toBeLessThan(PELUANG_CPU.sulit)
  })

  it('titik gagal selalu salah satu aksi', () => {
    const acak = acakTetap(3)
    for (let i = 0; i < 500; i++) {
      const g = rencanaCpu(14, 0, acak)
      expect(g).not.toBeNull()
      expect(g!).toBeGreaterThanOrEqual(0)
      expect(g!).toBeLessThan(14)
    }
  })
})

describe('hasil', () => {
  it('level tuntas', () => {
    expect(levelTuntas(1, 8)).toBe(0)
    expect(levelTuntas(5, 8)).toBe(4)
    expect(levelTuntas(9, 8)).toBe(8)
  })
})
