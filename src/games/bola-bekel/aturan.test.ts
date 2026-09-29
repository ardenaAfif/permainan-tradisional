import { describe, expect, it } from 'vitest'
import {
  cincinTangkap,
  jariWaktu,
  jendelaTangkap,
  kebutuhan,
  kekuatanSwipe,
  kekuatanTahan,
  lamaUdara,
  nilaiTangkap,
  perintahTahap,
  rencanaCpu,
  sebarBiji,
  sebarTitik,
  sentuhBiji,
  tahapTuntas,
  tangkap,
  tinggiBola,
  type Biji,
} from './aturan'
import { JARAK_BIJI, JENDELA_TANGKAP, JUMLAH_BIJI, LAMA_MAKS, LAMA_MIN, PELUANG_CPU, R_WAKTU_AKHIR, R_WAKTU_AWAL, SISI, TAHAP, type Tahap } from './config'
import { aturanSebar, buatTata, titikBebas, titikBiji } from './tata'

/** mulberry32: acak berbenih yang tetap tercampur rata untuk benih berurutan. */
function acakTetap(benih: number) {
  let s = benih >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const AMBIL = (jumlah: Tahap['jumlah']): Tahap => ({ nama: 'uji', jenis: 'ambil', jumlah })
const BALIK = (jumlah: Tahap['jumlah'], sisi = 0): Tahap => ({ nama: 'uji', jenis: 'balik', jumlah, sisi })
const biji = (sisi: number[], diambil: boolean[] = []): Biji[] =>
  sisi.map((s, i) => ({ letak: [{ u: 0, v: 0 }], sisi: s, diambil: diambil[i] ?? false, sudut: 0 }))

describe('tahap', () => {
  it('bawaan: ambil 1, 2, 3, semua, lalu balik ke sisi pertama', () => {
    expect(TAHAP.map((t) => `${t.jenis}:${t.jumlah}`)).toEqual(['ambil:1', 'ambil:2', 'ambil:3', 'ambil:semua', 'balik:2'])
    expect(SISI[TAHAP[4]!.sisi!]).toBe('Pit')
  })

  it('kebutuhan per lemparan; lemparan terakhir cukup sisanya', () => {
    const semua = biji([0, 1, 2, 3, 0, 1])
    expect(kebutuhan(AMBIL(1), semua)).toBe(1)
    expect(kebutuhan(AMBIL(4), semua)).toBe(4)
    expect(kebutuhan(AMBIL('semua'), semua)).toBe(6)
    const sisaDua = biji([0, 1, 2, 3, 0, 1], [true, true, true, true, false, false])
    expect(kebutuhan(AMBIL(4), sisaDua)).toBe(2)
    expect(kebutuhan(AMBIL('semua'), sisaDua)).toBe(2)
  })

  it('tahap balik menghitung biji yang belum menghadap sisi tujuan', () => {
    const b = biji([0, 1, 2, 0, 3, 0])
    expect(kebutuhan(BALIK(2), b)).toBe(2)
    expect(kebutuhan(BALIK('semua'), b)).toBe(3)
    expect(tahapTuntas(BALIK(2), b)).toBe(false)
    expect(tahapTuntas(BALIK(2), biji([0, 0, 0]))).toBe(true)
  })

  it('tuntas setelah semua biji diambil', () => {
    expect(tahapTuntas(AMBIL(1), biji([0, 1], [true, false]))).toBe(false)
    expect(tahapTuntas(AMBIL(1), biji([0, 1], [true, true]))).toBe(true)
  })

  it('perintah tahap mudah dibaca', () => {
    expect(perintahTahap(AMBIL(2))).toBe('Ambil 2 biji tiap lemparan')
    expect(perintahTahap(AMBIL('semua'))).toBe('Ambil semua biji sekali lempar')
    expect(perintahTahap(BALIK(2))).toBe('Balik 2 biji ke sisi Pit tiap lemparan')
  })
})

describe('menyentuh biji', () => {
  const kosong = new Set<number>()

  it('ambil sampai jumlahnya; lebih dari itu = gagal', () => {
    const b = biji([0, 1, 2])
    expect(sentuhBiji(AMBIL(2), b, 0, 0, 2, kosong)).toBe('ambil')
    expect(sentuhBiji(AMBIL(2), b, 1, 1, 2, kosong)).toBe('ambil')
    expect(sentuhBiji(AMBIL(2), b, 2, 2, 2, kosong)).toBe('lebih')
  })

  it('biji yang sudah diambil diabaikan', () => {
    expect(sentuhBiji(AMBIL(1), biji([0], [true]), 0, 0, 1, kosong)).toBe('abaikan')
    expect(sentuhBiji(AMBIL(1), biji([0]), 5, 0, 1, kosong)).toBe('abaikan')
  })

  it('balik: biji yang sudah menghadap sisi tujuan = salah biji', () => {
    const b = biji([0, 1, 2])
    expect(sentuhBiji(BALIK(2), b, 0, 0, 2, kosong)).toBe('salah')
    expect(sentuhBiji(BALIK(2), b, 1, 0, 2, kosong)).toBe('balik')
    expect(sentuhBiji(BALIK(1), b, 2, 1, 1, kosong)).toBe('lebih')
  })

  it('balik: biji yang baru dibalik di lemparan ini boleh tersentuh lagi', () => {
    const b = biji([0, 0, 2])
    expect(sentuhBiji(BALIK(2), b, 1, 1, 2, new Set([1]))).toBe('abaikan')
  })
})

describe('bola', () => {
  it('kekuatan 0..1 → 1,2–2,2 detik', () => {
    expect(lamaUdara(0)).toBe(LAMA_MIN)
    expect(lamaUdara(1)).toBe(LAMA_MAKS)
    expect(lamaUdara(0.5)).toBe((LAMA_MIN + LAMA_MAKS) / 2)
    expect(lamaUdara(3)).toBe(LAMA_MAKS)
    expect(lamaUdara(-1)).toBe(LAMA_MIN)
  })

  it('lemparan tinggi: jendela tangkap lebih sempit', () => {
    expect(jendelaTangkap(LAMA_MIN)).toBe(JENDELA_TANGKAP)
    expect(jendelaTangkap(LAMA_MAKS)).toBeLessThan(JENDELA_TANGKAP)
    expect(jendelaTangkap(LAMA_MAKS)).toBeGreaterThan(200)
  })

  it('nilai tangkap: cepat → pas → jatuh', () => {
    const lama = 1800
    const j = jendelaTangkap(lama)
    expect(nilaiTangkap(100, lama)).toBe('cepat')
    expect(nilaiTangkap(lama - j - 1, lama)).toBe('cepat')
    expect(nilaiTangkap(lama - j, lama)).toBe('pas')
    expect(nilaiTangkap(lama - 1, lama)).toBe('pas')
    expect(nilaiTangkap(lama, lama)).toBe('jatuh')
  })

  it('tangkap: biji harus lengkap dulu', () => {
    const lama = 1500
    const pas = lama - jendelaTangkap(lama) / 2
    expect(tangkap(pas, lama, 2, 2)).toBe('tangkap')
    expect(tangkap(pas, lama, 1, 2)).toBe('kurang')
    expect(tangkap(300, lama, 1, 2)).toBe('kurang')
    expect(tangkap(300, lama, 2, 2)).toBe('cepat')
    expect(tangkap(lama + 5, lama, 2, 2)).toBe('jatuh')
  })

  it('tinggi bola: nol di awal dan akhir, puncak di tengah; lemparan kuat lebih tinggi', () => {
    expect(tinggiBola(0, 1500)).toBe(0)
    expect(tinggiBola(1500, 1500)).toBe(0)
    expect(tinggiBola(LAMA_MAKS / 2, LAMA_MAKS)).toBeCloseTo(1)
    expect(tinggiBola(LAMA_MIN / 2, LAMA_MIN)).toBeLessThan(0.5)
  })

  it('lingkaran waktu menyusut sampai cincin tangkap', () => {
    const lama = 1600
    expect(jariWaktu(0, lama)).toBe(R_WAKTU_AWAL)
    expect(jariWaktu(lama, lama)).toBe(R_WAKTU_AKHIR)
    const c = cincinTangkap(lama)
    expect(c.dalam).toBe(R_WAKTU_AKHIR)
    expect(jariWaktu(lama - jendelaTangkap(lama), lama)).toBeCloseTo(c.luar)
    expect(c.luar).toBeGreaterThan(c.dalam + 10)
  })
})

describe('kekuatan lemparan', () => {
  it('swipe cepat ke atas = kuat, pelan = lemah', () => {
    expect(kekuatanSwipe(200, 10, 3)).toBe(1)
    expect(kekuatanSwipe(200, 10, 0.1)).toBe(0)
    const sedang = kekuatanSwipe(200, 0, 0.95)!
    expect(sedang).toBeGreaterThan(0.3)
    expect(sedang).toBeLessThan(0.7)
  })

  it('bukan swipe ke atas: terlalu pendek, ke bawah, atau menyamping', () => {
    expect(kekuatanSwipe(10, 0, 2)).toBeNull()
    expect(kekuatanSwipe(-200, 0, 2)).toBeNull()
    expect(kekuatanSwipe(100, 300, 2)).toBeNull()
  })

  it('tahan Spasi: makin lama makin kuat, maksimal 1', () => {
    expect(kekuatanTahan(0)).toBe(0)
    expect(kekuatanTahan(500)).toBeCloseTo(0.5)
    expect(kekuatanTahan(5000)).toBe(1)
  })
})

describe('sebar biji', () => {
  const tataUji = [buatTata(false, 2), buatTata(true, 2), buatTata(true, 4)]

  it('di kedua orientasi: jauh dari bola, saling berjauhan', () => {
    for (const tata of tataUji) {
      for (let benih = 1; benih <= 30; benih++) {
        const titik = sebarTitik(aturanSebar(tata, JARAK_BIJI), JUMLAH_BIJI, acakTetap(benih))
        expect(titik).toHaveLength(JUMLAH_BIJI)
        for (const p of titik) {
          expect(titikBebas(tata, p.u, p.v)).toBe(true)
          const q = titikBiji(tata, p.u, p.v)
          // Di dalam tikar.
          expect(q.x).toBeGreaterThan(tata.tikar.x)
          expect(q.x).toBeLessThan(tata.tikar.x + tata.tikar.w)
          expect(q.y).toBeGreaterThan(tata.tikar.y)
          expect(q.y).toBeLessThan(tata.tikar.y + tata.tikar.h)
        }
        for (let i = 0; i < titik.length; i++)
          for (let j = i + 1; j < titik.length; j++) {
            const a = titikBiji(tata, titik[i]!.u, titik[i]!.v)
            const b = titikBiji(tata, titik[j]!.u, titik[j]!.v)
            // Bisa dilonggarkan sedikit bila tikar penuh, tapi tetap ≥ 48px layar di HP (≈ 90px panggung).
            expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(95)
          }
      }
    }
  })

  it('satu letak per orientasi; nomor 1..6 urut dari kiri di tata mendatar', () => {
    const b = sebarBiji(AMBIL(1), [aturanSebar(tataUji[0]!, JARAK_BIJI), aturanSebar(tataUji[1]!, JARAK_BIJI)], acakTetap(4))
    expect(b).toHaveLength(JUMLAH_BIJI)
    for (const x of b) {
      expect(x.letak).toHaveLength(2)
      expect(x.diambil).toBe(false)
    }
    const u = b.map((x) => x.letak[0]!.u)
    expect(u).toEqual([...u].sort((a, c) => a - c))
  })

  it('tahap balik: setengah sampai semua kurang satu menghadap sisi lain', () => {
    for (let benih = 1; benih <= 40; benih++) {
      const b = sebarBiji(BALIK(2, 1), [aturanSebar(tataUji[0]!, JARAK_BIJI)], acakTetap(benih))
      const salah = b.filter((x) => x.sisi !== 1).length
      expect(salah).toBeGreaterThanOrEqual(JUMLAH_BIJI / 2)
      expect(salah).toBeLessThanOrEqual(JUMLAH_BIJI - 1)
      for (const x of b) expect(x.sisi).toBeLessThan(SISI.length)
    }
  })
})

describe('komputer', () => {
  it('berhasil: menyentuh tepat sebanyak kebutuhan sebelum cincin, lalu menangkap di cincin', () => {
    for (let benih = 1; benih <= 30; benih++) {
      const b = biji([0, 1, 2, 3, 0, 1])
      for (const tahap of TAHAP) {
        const r = rencanaCpu(tahap, b, 1, acakTetap(benih))
        expect(r.gagal).toBeNull()
        const lama = lamaUdara(r.kekuatan)
        expect(r.ketuk).toHaveLength(kebutuhan(tahap, b))
        expect(new Set(r.ketuk.map((k) => k.biji)).size).toBe(r.ketuk.length)
        for (const k of r.ketuk) {
          expect(k.t).toBeGreaterThan(0)
          expect(k.t).toBeLessThan(r.tangkap!)
          expect(sentuhBiji(tahap, b, k.biji, 0, 1, new Set())).not.toBe('salah')
        }
        expect(nilaiTangkap(r.tangkap!, lama)).toBe('pas')
      }
    }
  })

  it('gagal: berbagai kesalahan, dan hanya yang mungkin', () => {
    const jenis = new Set<string>()
    for (let benih = 1; benih <= 200; benih++) {
      const b = biji([0, 1, 2, 3, 0, 1])
      const r = rencanaCpu(BALIK(2), b, 0, acakTetap(benih))
      expect(r.gagal).not.toBeNull()
      jenis.add(r.gagal!)
      const lama = lamaUdara(r.kekuatan)
      if (r.gagal === 'jatuh') expect(r.tangkap).toBeNull()
      if (r.gagal === 'cepat') expect(nilaiTangkap(r.tangkap!, lama)).toBe('cepat')
      if (r.gagal === 'kurang') expect(r.ketuk.length).toBeLessThan(kebutuhan(BALIK(2), b))
      if (r.gagal === 'lebih') expect(r.ketuk.length).toBeGreaterThan(kebutuhan(BALIK(2), b))
      if (r.gagal === 'salah') expect(r.ketuk.some((k) => b[k.biji]!.sisi === 0)).toBe(true)
    }
    expect([...jenis].sort()).toEqual(['cepat', 'jatuh', 'kurang', 'lebih', 'salah'])
    // Ambil semua: tidak ada biji lebih dan tidak ada biji salah.
    for (let benih = 1; benih <= 50; benih++) {
      const r = rencanaCpu(AMBIL('semua'), biji([0, 1, 2, 3, 0, 1]), 0, acakTetap(benih))
      expect(['jatuh', 'cepat', 'kurang']).toContain(r.gagal)
    }
  })

  it('peluang berhasil naik menurut tingkat kesulitan', () => {
    expect(PELUANG_CPU.mudah).toBeLessThan(PELUANG_CPU.sedang)
    expect(PELUANG_CPU.sedang).toBeLessThan(PELUANG_CPU.sulit)
  })
})
