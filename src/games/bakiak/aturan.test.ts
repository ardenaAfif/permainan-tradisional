import { describe, expect, it } from 'vitest'
import {
  bpmKetukan,
  jendelaTangkap,
  kakiKetukan,
  KelompokKompak,
  ketukanSetelah,
  LogikaTim,
  nilaiDariSelisih,
  OtakCpu,
  waktuKetukan,
  type Peristiwa,
} from './aturan'
import {
  AKURASI_CPU,
  BANGKIT_CPU,
  BANGKIT_KETUK,
  BANGKIT_WAKTU,
  BPM_AKHIR,
  BPM_AWAL,
  GOYANG,
  JARAK_LOMBA,
  JEDA_SETELAH_BANGKIT,
  JENDELA_KOMPAK,
  JENDELA_OKE,
  JENDELA_PAS,
  LAMA_JATUH,
  LANGKAH_OKE,
  LANGKAH_PAS,
} from './config'

const jenis = (ps: Peristiwa[]) => ps.map((p) => (p.jenis === 'nilai' ? p.nilai : p.jenis))

/** Angka acak yang bisa diulang (untuk simulasi komputer). */
function acakTetap(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

describe('tempo aba-aba', () => {
  it('mulai ±80 BPM dan naik perlahan sampai ±120 BPM', () => {
    expect(bpmKetukan(0)).toBe(BPM_AWAL)
    expect(bpmKetukan(-3)).toBe(BPM_AWAL)
    for (let k = 1; k < 200; k++) {
      expect(bpmKetukan(k)).toBeGreaterThanOrEqual(bpmKetukan(k - 1))
      expect(bpmKetukan(k) - bpmKetukan(k - 1)).toBeLessThanOrEqual(5)
    }
    expect(bpmKetukan(500)).toBe(BPM_AKHIR)
  })

  it('jarak antarketukan sesuai tempo', () => {
    expect(waktuKetukan(0)).toBe(0)
    expect(waktuKetukan(1)).toBeCloseTo(60000 / BPM_AWAL)
    expect(waktuKetukan(-1)).toBeCloseTo(-60000 / BPM_AWAL)
    expect(waktuKetukan(301) - waktuKetukan(300)).toBeCloseTo(60000 / BPM_AKHIR)
  })

  it('aba-aba bergantian Kiri, Kanan', () => {
    expect([0, 1, 2, 3].map(kakiKetukan)).toEqual(['kiri', 'kanan', 'kiri', 'kanan'])
  })

  it('jendela tangkap tidak tumpang tindih dengan ketukan berikutnya', () => {
    for (let k = 0; k < 200; k++) {
      expect(waktuKetukan(k) + jendelaTangkap(k)).toBeLessThan(waktuKetukan(k + 1) - jendelaTangkap(k + 1))
    }
  })

  it('ketukanSetelah', () => {
    expect(ketukanSetelah(-100)).toBe(0)
    expect(ketukanSetelah(0)).toBe(1)
    expect(ketukanSetelah(waktuKetukan(10) - 1)).toBe(10)
  })
})

describe('penilaian', () => {
  it('Pas, Oke, Meleset menurut selisih waktu', () => {
    expect(nilaiDariSelisih(0)).toBe('pas')
    expect(nilaiDariSelisih(-JENDELA_PAS)).toBe('pas')
    expect(nilaiDariSelisih(JENDELA_PAS + 1)).toBe('oke')
    expect(nilaiDariSelisih(-JENDELA_OKE)).toBe('oke')
    expect(nilaiDariSelisih(JENDELA_OKE + 1)).toBe('meleset')
  })

  it('Pas maju penuh, Oke maju setengah, Meleset tidak maju', () => {
    const tim = new LogikaTim()
    expect(jenis(tim.tekan(waktuKetukan(0) + 20, 'kiri'))).toEqual(['pas'])
    expect(tim.jarak).toBeCloseTo(LANGKAH_PAS)
    expect(jenis(tim.tekan(waktuKetukan(1) - 150, 'kanan'))).toEqual(['oke'])
    expect(tim.jarak).toBeCloseTo(LANGKAH_PAS + LANGKAH_OKE)
    expect(jenis(tim.tekan(waktuKetukan(2) + 230, 'kiri'))).toEqual(['meleset'])
    expect(tim.jarak).toBeCloseTo(LANGKAH_PAS + LANGKAH_OKE)
  })

  it('ketukan yang lewat tanpa tekanan = Meleset', () => {
    const tim = new LogikaTim()
    expect(jenis(tim.lewati(waktuKetukan(0) + 100))).toEqual([])
    expect(jenis(tim.lewati(waktuKetukan(1) + 300))).toEqual(['meleset', 'meleset'])
    expect(tim.ketukan).toBe(2)
  })

  it('salah tombol tidak maju dan menambah goyang lebih banyak', () => {
    const tim = new LogikaTim()
    const p = tim.tekan(waktuKetukan(0), 'kanan')
    expect(p).toEqual([{ jenis: 'nilai', nilai: 'salah', ketukan: 0, maju: 0, alasan: 'kaki' }])
    expect(tim.goyang).toBe(GOYANG.salah)
  })

  it('tekanan di antara ketukan = terburu-buru (goyang naik sedikit)', () => {
    const tim = new LogikaTim()
    tim.tekan(waktuKetukan(0), 'kiri')
    const tengah = (waktuKetukan(0) + waktuKetukan(1)) / 2
    expect(jenis(tim.tekan(tengah, 'kanan'))).toEqual(['ekstra'])
    expect(tim.goyang).toBe(GOYANG.ekstra)
    // Ketukan 1 masih bisa dinilai.
    expect(jenis(tim.tekan(waktuKetukan(1), 'kanan'))).toEqual(['pas'])
  })

  it('tekanan selama hitungan awal diabaikan', () => {
    const tim = new LogikaTim()
    expect(tim.tekan(waktuKetukan(-2), 'kiri')).toEqual([])
    expect(tim.goyang).toBe(0)
  })

  it('ketukan pas mengurangi goyang, tidak di bawah 0', () => {
    const tim = new LogikaTim()
    tim.tekan(waktuKetukan(0), 'kanan') // salah
    tim.tekan(waktuKetukan(1), 'kanan') // pas
    expect(tim.goyang).toBe(GOYANG.salah + GOYANG.pas)
    for (let k = 2; k < 8; k++) tim.tekan(waktuKetukan(k), kakiKetukan(k))
    expect(tim.goyang).toBe(0)
  })
})

describe('jatuh dan bangkit', () => {
  function timJatuh() {
    const tim = new LogikaTim()
    let k = 0
    let t = 0
    while (tim.status === 'jalan') {
      t = waktuKetukan(k)
      tim.tekan(t, kakiKetukan(k) === 'kiri' ? 'kanan' : 'kiri')
      k++
    }
    return { tim, t }
  }

  it('meter goyang penuh → jatuh', () => {
    const { tim } = timJatuh()
    expect(tim.status).toBe('jatuh')
    expect(tim.statistik.jatuh).toBe(1)
    expect(tim.statistik.salah).toBe(Math.ceil(100 / GOYANG.salah))
  })

  it('saat jatuh, tombol dan ketukan tidak berpengaruh sampai animasi selesai', () => {
    const { tim, t } = timJatuh()
    expect(tim.tekan(t + 100, 'kiri')).toEqual([])
    expect(jenis(tim.lewati(t + LAMA_JATUH - 1))).toEqual([])
    expect(jenis(tim.lewati(t + LAMA_JATUH))).toEqual(['siap-bangkit'])
    expect(tim.status).toBe('bangkit')
  })

  it('bangkit: ketuk 6 kali dalam 2 detik, lalu lanjut dengan goyang berkurang', () => {
    const { tim, t } = timJatuh()
    const t0 = t + LAMA_JATUH
    tim.lewati(t0)
    let akhir: Peristiwa[] = []
    for (let i = 0; i < BANGKIT_KETUK; i++) akhir = tim.tekan(t0 + 500 + i * 250, 'kiri')
    expect(jenis(akhir)).toEqual(['ketuk-bangkit', 'bangkit'])
    expect(tim.status).toBe('jalan')
    expect(tim.goyang).toBe(GOYANG.setelahBangkit)
    const tBangkit = t0 + 500 + (BANGKIT_KETUK - 1) * 250
    expect(waktuKetukan(tim.ketukan)).toBeGreaterThanOrEqual(tBangkit + JEDA_SETELAH_BANGKIT)
    expect(waktuKetukan(tim.ketukan - 1)).toBeLessThan(tBangkit + JEDA_SETELAH_BANGKIT)
  })

  it('terlalu lambat → hitungan bangkit diulang', () => {
    const { tim, t } = timJatuh()
    const t0 = t + LAMA_JATUH
    tim.lewati(t0)
    for (let i = 0; i < BANGKIT_KETUK - 1; i++) tim.tekan(t0 + i * 100, 'kiri')
    expect(tim.ketukBangkit).toBe(BANGKIT_KETUK - 1)
    expect(jenis(tim.lewati(t0 + BANGKIT_WAKTU + 1))).toEqual(['bangkit-gagal'])
    expect(tim.ketukBangkit).toBe(0)
    expect(tim.status).toBe('bangkit')
  })

  it('ketukan yang lewat selama jatuh tidak dihitung Meleset', () => {
    const { tim, t } = timJatuh()
    const meleset = tim.statistik.meleset
    tim.lewati(t + 5000)
    expect(tim.statistik.meleset).toBe(meleset)
  })
})

describe('finis', () => {
  it('main sempurna sampai 25 meter', () => {
    const tim = new LogikaTim()
    let k = 0
    let akhir: Peristiwa[] = []
    while (tim.status === 'jalan') akhir = tim.tekan(waktuKetukan(k), kakiKetukan(k++))
    expect(tim.status).toBe('finis')
    expect(jenis(akhir)).toEqual(['pas', 'finis'])
    expect(tim.jarak).toBe(JARAK_LOMBA)
    expect(k).toBe(Math.ceil(JARAK_LOMBA / LANGKAH_PAS))
    // Lomba sempurna ±40 detik: cukup panjang untuk merasakan tempo naik.
    expect(waktuKetukan(k) / 1000).toBeGreaterThan(30)
    expect(waktuKetukan(k) / 1000).toBeLessThan(50)
  })

  it('setelah finis, tombol tidak berpengaruh', () => {
    const tim = new LogikaTim()
    tim.jarak = JARAK_LOMBA - LANGKAH_OKE
    tim.tekan(waktuKetukan(0) + 150, 'kiri')
    expect(tim.status).toBe('finis')
    expect(tim.tekan(waktuKetukan(1), 'kanan')).toEqual([])
    expect(tim.lewati(waktuKetukan(20))).toEqual([])
  })
})

describe('Tim Kompak', () => {
  it('ketiga tombol dalam 150 ms → kompak, waktu = rata-rata', () => {
    const g = new KelompokKompak()
    expect(g.tekan(0, 1000)).toEqual([])
    expect(g.tekan(2, 1080)).toEqual([])
    expect([...g.sudahTekan].sort()).toEqual([0, 2])
    expect(g.tekan(1, 1130)).toEqual([{ hasil: 'kompak', t: 1070 }])
    expect(g.sudahTekan.size).toBe(0)
  })

  it('tombol yang sama ditekan dua kali tidak dihitung dua siswa', () => {
    const g = new KelompokKompak()
    g.tekan(0, 1000)
    g.tekan(0, 1020)
    expect(g.tekan(1, 1040)).toEqual([])
  })

  it('lewat 150 ms → tidak kompak', () => {
    const g = new KelompokKompak()
    g.tekan(0, 1000)
    g.tekan(1, 1100)
    expect(g.periksa(1000 + JENDELA_KOMPAK)).toEqual([])
    expect(g.periksa(1000 + JENDELA_KOMPAK + 1)).toEqual([{ hasil: 'tidak-kompak', t: 1000 }])
  })

  it('tekanan terlambat menutup kelompok lama dan membuka kelompok baru', () => {
    const g = new KelompokKompak()
    g.tekan(0, 1000)
    expect(g.tekan(1, 1200)).toEqual([{ hasil: 'tidak-kompak', t: 1000 }])
    expect([...g.sudahTekan]).toEqual([1])
  })

  it('tidak kompak dinilai seperti salah tombol', () => {
    const tim = new LogikaTim()
    expect(tim.tekan(waktuKetukan(0), 'tidak-kompak')).toEqual([
      { jenis: 'nilai', nilai: 'salah', ketukan: 0, maju: 0, alasan: 'kompak' },
    ])
    expect(jenis(tim.tekan(waktuKetukan(1) + 30, 'kompak'))).toEqual(['pas'])
  })
})

describe('komputer', () => {
  function lomba(akurasi: number, lamaBangkit: number, benih: number) {
    const cpu = new OtakCpu(new LogikaTim(), akurasi, lamaBangkit, acakTetap(benih))
    let t = -3000
    while (cpu.tim.status !== 'finis' && t < 600_000) {
      cpu.jalan(t)
      t += 16
    }
    return { detik: t / 1000, s: cpu.tim.statistik }
  }

  it('akurasi sesuai tingkat kesulitan', () => {
    for (const tingkat of ['mudah', 'sedang', 'sulit'] as const) {
      const { s } = lomba(AKURASI_CPU[tingkat], BANGKIT_CPU[tingkat], 7)
      const total = s.pas + s.oke + s.meleset + s.salah
      expect((s.pas + s.oke) / total).toBeCloseTo(AKURASI_CPU[tingkat], 1)
    }
  })

  it('makin sulit, makin cepat sampai finis', () => {
    const rata = (tingkat: 'mudah' | 'sedang' | 'sulit') => {
      let jumlah = 0
      for (let b = 1; b <= 8; b++) jumlah += lomba(AKURASI_CPU[tingkat], BANGKIT_CPU[tingkat], b).detik
      return jumlah / 8
    }
    const mudah = rata('mudah')
    const sedang = rata('sedang')
    const sulit = rata('sulit')
    expect(mudah).toBeGreaterThan(sedang)
    expect(sedang).toBeGreaterThan(sulit)
    expect(sulit).toBeGreaterThan(30)
    expect(mudah).toBeLessThan(120)
  })

  it('komputer yang jatuh bisa bangkit sendiri', () => {
    const cpu = new OtakCpu(new LogikaTim(), 0.3, BANGKIT_CPU.mudah, acakTetap(3))
    let t = -3000
    let pernahJatuh = false
    while (t < 60_000) {
      cpu.jalan(t)
      if (cpu.tim.status === 'jatuh') pernahJatuh = true
      if (pernahJatuh && cpu.tim.status === 'jalan') break
      t += 16
    }
    expect(pernahJatuh).toBe(true)
    expect(cpu.tim.status).toBe('jalan')
    expect(BANGKIT_CPU.mudah).toBeLessThan(BANGKIT_WAKTU)
  })
})
