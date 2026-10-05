import { describe, expect, it } from 'vitest'
import { acakBerbenih, arahKaki, LogikaPelari, medanDi, OtakCpu, posKembali, urutkan, type Kaki, type Peristiwa } from './aturan'
import {
  CEPAT,
  CPU,
  JARAK_LOMBA,
  LAMA_JATUH,
  LAMA_KEMBALI,
  LANGKAH,
  MEDAN,
  POS_MUDAH,
  SUSUNAN_RINTANGAN,
  type Rintangan,
} from './config'

const datar = (pos: number[] = []) => new LogikaPelari({ rintangan: [], pos, acak: acakBerbenih(1) })
const jenis = (ev: Peristiwa[]) => ev.map((e) => e.jenis)

/** Melangkah bergantian dengan jeda tetap sampai finis/jatuh atau batas langkah. */
function jalanBerirama(l: LogikaPelari, jeda: number, maks = 200, mulai = 0) {
  const semua: Peristiwa[] = []
  let kaki: Kaki = 'kiri'
  let t = mulai
  for (let i = 0; i < maks && l.status === 'jalan'; i++) {
    t += jeda
    semua.push(...l.langkah(kaki, t))
    kaki = kaki === 'kiri' ? 'kanan' : 'kiri'
  }
  return { semua, t }
}

describe('langkah', () => {
  it('langkah pertama dinilai pas dan maju satu langkah', () => {
    const l = datar()
    const ev = l.langkah('kiri', 100)
    expect(ev[0]).toMatchObject({ jenis: 'langkah', nilai: 'pas', maju: LANGKAH })
    expect(l.jarak).toBeCloseTo(LANGKAH)
  })

  it('mengangkat egrang kiri membuat badan condong ke kanan, dan sebaliknya', () => {
    expect(arahKaki('kiri')).toBe(1)
    const l = datar()
    l.langkah('kiri', 0)
    expect(l.miring).toBeGreaterThan(0)
    l.langkah('kanan', 500)
    expect(l.miring).toBeLessThan(0)
  })

  it('irama tenang bergantian tetap tegak sampai finis', () => {
    const l = datar()
    const { semua } = jalanBerirama(l, 480)
    expect(l.status).toBe('finis')
    expect(l.statistik.jatuh).toBe(0)
    expect(semua.filter((e) => e.jenis === 'langkah').length).toBe(Math.ceil(JARAK_LOMBA / LANGKAH))
    expect(semua.at(-1)).toMatchObject({ jenis: 'finis' })
  })

  it('menekan terlalu cepat dinilai buru dan membuat badan jatuh', () => {
    const l = datar()
    const { semua } = jalanBerirama(l, 150, 20)
    expect(semua.find((e) => e.jenis === 'langkah' && e.nilai === 'buru')).toBeDefined()
    expect(l.status).toBe('jatuh')
    expect(l.statistik.jatuh).toBe(1)
  })

  it('egrang yang sama dua kali menambah miring dan tidak maju', () => {
    const l = datar()
    l.langkah('kiri', 0)
    const sebelum = l.miring
    const ev = l.langkah('kiri', 500)
    expect(ev[0]).toMatchObject({ nilai: 'sama', maju: 0 })
    expect(l.jarak).toBeCloseTo(LANGKAH)
    expect(l.miring).toBeGreaterThan(sebelum + 0.25)
  })

  it('terlalu pelan dinilai pelan tetapi tetap maju', () => {
    const l = datar()
    l.langkah('kiri', 0)
    const ev = l.langkah('kanan', 1200)
    expect(ev.find((e) => e.jenis === 'langkah')).toMatchObject({ nilai: 'pelan', maju: LANGKAH })
  })

  it('diam terlalu lama setelah melangkah membuat badan makin miring sampai jatuh', () => {
    const l = datar()
    l.langkah('kiri', 0)
    const ev = l.lanjut(8000)
    expect(jenis(ev)).toContain('jatuh')
  })

  it('belum melangkah = tegak sempurna, tidak jatuh walau diam', () => {
    const l = datar()
    expect(l.lanjut(20000)).toEqual([])
    expect(l.miring).toBe(0)
  })
})

describe('tahan', () => {
  it('menegakkan badan tanpa maju, dan langkah diabaikan selama ditahan', () => {
    const l = datar()
    l.langkah('kiri', 0)
    l.langkah('kiri', 450)
    const miring = Math.abs(l.miring)
    l.setTahan(true, 500)
    l.lanjut(1300)
    expect(Math.abs(l.miring)).toBeLessThan(miring * 0.2)
    expect(l.langkah('kanan', 1350)).toEqual([])
    expect(l.jarak).toBeCloseTo(LANGKAH)
  })

  it('setelah dilepas, langkah berikutnya dinilai pas (irama dimulai lagi)', () => {
    const l = datar()
    l.langkah('kiri', 0)
    l.setTahan(true, 200)
    l.setTahan(false, 300)
    const ev = l.langkah('kanan', 320)
    expect(ev.find((e) => e.jenis === 'langkah')).toMatchObject({ nilai: 'pas' })
  })
})

describe('jatuh dan kembali', () => {
  /** Egrang kiri terus-menerus sampai jatuh; mengembalikan waktu jatuh. */
  function jatuhkan(l: LogikaPelari, t: number) {
    const ev: Peristiwa[] = []
    while (l.status === 'jalan') {
      t += 400
      ev.push(...l.langkah('kiri', t))
    }
    return { ev, tJatuh: t }
  }

  it('jatuh lalu kembali ke garis start, tegak lagi, dan irama dimulai ulang', () => {
    const l = datar()
    const { t } = jalanBerirama(l, 480, 20)
    expect(l.jarak).toBeGreaterThan(10)
    const { ev, tJatuh } = jatuhkan(l, t)
    expect(jenis(ev)).toContain('jatuh')
    expect(l.status).toBe('jatuh')
    expect(l.langkah('kanan', tJatuh + 100)).toEqual([])
    expect(l.lanjut(tJatuh + LAMA_JATUH)).toEqual([{ jenis: 'kembali', ke: 0 }])
    expect(l.jarak).toBe(0)
    expect(l.lanjut(tJatuh + LAMA_JATUH + LAMA_KEMBALI)).toEqual([{ jenis: 'siap' }])
    expect(l.status).toBe('jalan')
    expect(l.miring).toBe(0)
    expect(l.langkah('kiri', tJatuh + 3000)[0]).toMatchObject({ nilai: 'pas' })
  })

  it('di tingkat mudah kembali ke pos terakhir yang sudah dilewati', () => {
    expect(posKembali(POS_MUDAH, 9.9)).toBe(0)
    expect(posKembali(POS_MUDAH, 10)).toBe(10)
    expect(posKembali(POS_MUDAH, 27)).toBe(20)
    const l = datar(POS_MUDAH)
    const { t } = jalanBerirama(l, 480, 25)
    expect(l.jarak).toBeGreaterThan(10)
    const { tJatuh } = jatuhkan(l, t)
    const ev = l.lanjut(tJatuh + LAMA_JATUH + LAMA_KEMBALI)
    expect(ev[0]).toEqual({ jenis: 'kembali', ke: 10 })
  })

  it('arah jatuh mengikuti arah miring', () => {
    const l = datar()
    l.langkah('kanan', 0)
    l.langkah('kanan', 400)
    l.langkah('kanan', 800)
    const ev = l.langkah('kanan', 1200)
    expect(ev.find((e) => e.jenis === 'jatuh')).toEqual({ jenis: 'jatuh', arah: -1 })
  })
})

describe('rintangan', () => {
  const genangan: Rintangan[] = [{ jenis: 'genangan', dari: 0, sampai: 10 }]
  const gelombang: Rintangan[] = [{ jenis: 'gelombang', dari: 0, sampai: 10 }]

  it('medanDi membaca rentang [dari, sampai)', () => {
    expect(medanDi(genangan, 0)).toBe('genangan')
    expect(medanDi(genangan, 9.99)).toBe('genangan')
    expect(medanDi(genangan, 10)).toBe('datar')
  })

  it('genangan memperpendek langkah', () => {
    const l = new LogikaPelari({ rintangan: genangan, pos: [], acak: acakBerbenih(3) })
    const ev = l.langkah('kiri', 0)
    expect(ev[0]).toMatchObject({ medan: 'genangan', maju: LANGKAH * MEDAN.genangan.laju })
  })

  it('tanah bergelombang membuat badan lebih goyah daripada tanah datar', () => {
    const rerata = (r: Rintangan[]) => {
      let total = 0
      for (let benih = 1; benih <= 40; benih++) {
        const l = new LogikaPelari({ rintangan: r, pos: [], acak: acakBerbenih(benih) })
        let kaki: Kaki = 'kiri'
        for (let i = 1; i <= 12 && l.status === 'jalan'; i++) {
          l.langkah(kaki, i * 480)
          total += Math.abs(l.miring)
          kaki = kaki === 'kiri' ? 'kanan' : 'kiri'
        }
      }
      return total
    }
    expect(rerata(gelombang)).toBeGreaterThan(rerata([]) * 2)
  })

  it('setiap susunan rintangan ada di dalam lintasan dan tidak bertumpuk', () => {
    for (const s of SUSUNAN_RINTANGAN) {
      s.forEach((r, i) => {
        expect(r.dari).toBeGreaterThan(2)
        expect(r.sampai).toBeLessThan(JARAK_LOMBA)
        expect(r.sampai).toBeGreaterThan(r.dari)
        if (i > 0) expect(r.dari).toBeGreaterThanOrEqual(s[i - 1]!.sampai)
      })
    }
  })
})

describe('kendali miring HP', () => {
  it('memiringkan HP berlawanan arah menegakkan badan', () => {
    const tanpa = datar()
    const dengan = datar()
    for (const l of [tanpa, dengan]) {
      l.langkah('kiri', 0)
      l.langkah('kiri', 450)
    }
    dengan.kemudi = -0.6
    tanpa.lanjut(900)
    dengan.lanjut(900)
    expect(Math.abs(dengan.miring)).toBeLessThan(Math.abs(tanpa.miring) * 0.5)
  })
})

describe('komputer', () => {
  function lomba(profil: (typeof CPU)['sedang'], benih: number, rintangan = SUSUNAN_RINTANGAN[0]!) {
    const acak = acakBerbenih(benih)
    const l = new LogikaPelari({ rintangan, pos: [], acak })
    const otak = new OtakCpu(l, profil, acak)
    let t = 0
    while (l.status !== 'finis' && t < 300_000) {
      t += 16
      otak.jalan(t)
    }
    return l
  }

  it('selalu menyelesaikan lomba dalam waktu wajar di setiap tingkat', () => {
    for (const k of ['mudah', 'sedang', 'sulit'] as const) {
      for (let benih = 1; benih <= 10; benih++) {
        const l = lomba(CPU[k], benih)
        expect(l.status).toBe('finis')
        expect(l.waktuFinis!).toBeLessThan(150_000)
      }
    }
  })

  it('tingkat sulit lebih cepat dan lebih jarang jatuh daripada mudah', () => {
    const rerata = (k: keyof typeof CPU) => {
      let waktu = 0
      let jatuh = 0
      for (let benih = 1; benih <= 30; benih++) {
        const l = lomba(CPU[k], benih * 7)
        waktu += l.waktuFinis!
        jatuh += l.statistik.jatuh
      }
      return { waktu: waktu / 30, jatuh: jatuh / 30 }
    }
    const mudah = rerata('mudah')
    const sedang = rerata('sedang')
    const sulit = rerata('sulit')
    expect(sulit.waktu).toBeLessThan(sedang.waktu)
    expect(sedang.waktu).toBeLessThan(mudah.waktu)
    expect(sulit.jatuh).toBeLessThan(mudah.jatuh)
    // Pemain yang berirama rapi (±480 ms, tanpa jatuh) bisa mengalahkan komputer Sedang.
    expect(sedang.waktu).toBeGreaterThan((JARAK_LOMBA / LANGKAH) * 480)
  })

  it('jeda normal komputer tidak pernah terburu-buru', () => {
    for (const p of Object.values(CPU)) expect(p.jeda - p.acak).toBeGreaterThanOrEqual(CEPAT)
  })
})

describe('urutan finis', () => {
  it('yang finis menurut waktu, sisanya menurut jarak', () => {
    const u = urutkan([
      { id: 'a', jarak: 12, waktuFinis: null },
      { id: 'b', jarak: 30, waktuFinis: 31000 },
      { id: 'c', jarak: 30, waktuFinis: 29000 },
      { id: 'd', jarak: 20, waktuFinis: null },
    ])
    expect(u.map((x) => x.id)).toEqual(['c', 'b', 'd', 'a'])
  })
})
