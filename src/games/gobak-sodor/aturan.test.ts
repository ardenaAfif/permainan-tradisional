import { describe, expect, it } from 'vitest'
import { acakBerbenih, batasSodor, LogikaRonde, pemenang, posStart, timPenyerang, zona, type DataPenjaga, type Peristiwa } from './aturan'
import {
  JAGA_CPU,
  JAGA_MANUSIA,
  JAGA_TEMAN,
  JEDA_GUGUR,
  JEDA_POIN,
  LAMA_RONDE,
  R_SENTUH,
  SERANG_CPU,
  V_PENYERANG,
  type ProfilJaga,
  type ProfilSerang,
} from './config'
import { buatLapangan } from './tata'

const lap = buatLapangan()
const N_GARIS = lap.garisY.length

/** Empat penjaga garis + sodor. Penjaga "manusia" yang diam bisa dipakai sebagai patung. */
function regu(profil: (i: number) => ProfilJaga, manusia = false): DataPenjaga[] {
  const d: DataPenjaga[] = lap.garisY.map((_, g) => ({ jenis: 'garis', garis: g, profil: profil(g), manusia }))
  d.push({ jenis: 'sodor', garis: -1, profil: profil(N_GARIS), manusia })
  return d
}

function ronde(o: { penjaga: DataPenjaga[]; otak?: ProfilSerang | null; benih?: number; lama?: number }) {
  return new LogikaRonde({
    lap,
    nPenyerang: 5,
    penjaga: o.penjaga,
    otak: o.otak ?? null,
    lamaRonde: o.lama ?? LAMA_RONDE,
    jedaGugur: JEDA_GUGUR,
    jedaPoin: JEDA_POIN,
    acak: acakBerbenih(o.benih ?? 1),
  })
}

/** Penjaga diam dipindah ke tepi kiri (jauh dari jalur lari di x = tengah + 200). */
function patungDiTepi(l: LogikaRonde) {
  for (const p of l.penjaga) {
    if (p.jenis === 'garis') p.x = lap.x0
    else p.y = batasSodor(lap)[0]
  }
}

/** maju() membatasi satu panggilan ±250 ms (jeda frame panjang), jadi waktu panjang dipecah. */
function majuLama(l: LogikaRonde, ms: number) {
  const ev: Peristiwa[] = []
  for (let t = 0; t < ms; t += 50) ev.push(...l.maju(Math.min(50, ms - t)))
  return ev
}

/** Jalankan sampai kondisi terpenuhi atau batas waktu (ms); kembalikan semua peristiwa. */
function jalan(l: LogikaRonde, sampai: () => boolean, batas = 20_000) {
  const ev: Peristiwa[] = []
  for (let t = 0; t < batas && !sampai() && l.fase !== 'selesai'; t += 50) ev.push(...l.maju(50))
  return ev
}

describe('lapangan', () => {
  it('garis jaga dan garis sodor tersimpan di config', () => {
    expect(N_GARIS).toBe(4)
    expect(lap.sodor).toBe(true)
    // Garis 0 paling bawah (garis masuk), makin ke atas makin kecil y-nya.
    for (let i = 1; i < N_GARIS; i++) expect(lap.garisY[i]!).toBeLessThan(lap.garisY[i - 1]!)
  })

  it('zona: 0 = START, jumlah garis = UJUNG', () => {
    expect(zona(lap, posStart(lap).y)).toBe(0)
    expect(zona(lap, lap.atas)).toBe(N_GARIS)
    expect(zona(lap, lap.garisY[1]! + 5)).toBe(1)
  })

  it('jumlah garis bisa diubah', () => {
    const l3 = buatLapangan(3, false)
    expect(l3.garisY).toHaveLength(3)
    expect(l3.sodor).toBe(false)
  })
})

describe('penyerang pemain', () => {
  it('menyeberangi semua garis sampai UJUNG lalu pulang ke START = +1 poin', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true) })
    patungDiTepi(l)
    const a = l.penyerangAktif!
    a.x = lap.tengahX + 200
    l.joystick = { x: 0, y: -1 }
    const pergi = jalan(l, () => a.pulang)
    expect(pergi.filter((e) => e.jenis === 'lewat')).toHaveLength(N_GARIS)
    expect(pergi.some((e) => e.jenis === 'ujung')).toBe(true)
    l.joystick = { x: 0, y: 1 }
    const pulang = jalan(l, () => l.poin > 0)
    expect(pulang.filter((e) => e.jenis === 'lewat')).toHaveLength(N_GARIS)
    expect(pulang.find((e) => e.jenis === 'poin')).toMatchObject({ penyerang: 0, berikut: 1 })
    expect(l.poin).toBe(1)
    expect(a.status).toBe('tunggu')
    // Penyerang berikutnya masuk setelah jeda; yang dapat poin ikut antre lagi.
    const masuk = jalan(l, () => l.fase === 'main')
    expect(masuk.find((e) => e.jenis === 'masuk')).toMatchObject({ penyerang: 1 })
    expect(l.penyerangAktif).toMatchObject(posStart(lap))
  })

  it('belum sampai UJUNG lalu kembali ke START tidak dapat poin', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true) })
    patungDiTepi(l)
    const a = l.penyerangAktif!
    a.x = lap.tengahX + 200
    l.joystick = { x: 0, y: -1 }
    jalan(l, () => zona(lap, a.y) === 2)
    l.joystick = { x: 0, y: 1 }
    jalan(l, () => a.y >= lap.bawah, 5000)
    expect(l.poin).toBe(0)
    expect(a.pulang).toBe(false)
  })

  it('tidak bisa keluar dari sisi lapangan', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true) })
    patungDiTepi(l)
    const a = l.penyerangAktif!
    l.joystick = { x: 1, y: 0 }
    majuLama(l, 5000)
    expect(a.x).toBeLessThan(lap.x1)
    expect(a.x).toBeGreaterThan(lap.x1 - 20)
  })

  it('joystick miring tidak lebih cepat dari lurus', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true) })
    patungDiTepi(l)
    const a = l.penyerangAktif!
    const awal = { ...a }
    l.joystick = { x: 1, y: -1 }
    majuLama(l, 500)
    expect(Math.hypot(a.x - awal.x, a.y - awal.y)).toBeCloseTo(V_PENYERANG * 0.5, -1)
  })
})

describe('sentuhan', () => {
  it('tersentuh penjaga = gugur, penyerang berikutnya masuk', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true) })
    patungDiTepi(l)
    const a = l.penyerangAktif!
    const jaga = l.penjaga[0]!
    jaga.x = a.x
    l.joystick = { x: 0, y: -1 }
    const ev = jalan(l, () => a.status === 'gugur')
    const kena = ev.find((e) => e.jenis === 'kena')
    expect(kena).toMatchObject({ penyerang: 0, penjaga: 0, berikut: 1 })
    expect(Math.hypot(a.x - jaga.x, a.y - jaga.y)).toBeLessThan(R_SENTUH)
    expect(l.fase).toBe('ganti')
    const masuk = jalan(l, () => l.fase === 'main')
    expect(masuk.some((e) => e.jenis === 'masuk')).toBe(true)
    expect(l.aktif).toBe(1)
  })

  it('di luar jangkauan sentuh tidak gugur', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true) })
    patungDiTepi(l)
    const a = l.penyerangAktif!
    l.penjaga[0]!.x = a.x
    a.y = lap.garisY[0]! + R_SENTUH + 2
    majuLama(l, 1000)
    expect(a.status).toBe('main')
  })

  it('semua penyerang gugur = ronde selesai', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true) })
    patungDiTepi(l)
    l.penjaga[0]!.x = lap.tengahX
    l.joystick = { x: 0, y: -1 }
    const ev = jalan(l, () => false, 60_000)
    expect(ev.filter((e) => e.jenis === 'kena')).toHaveLength(5)
    expect(ev[ev.length - 1]).toEqual({ jenis: 'selesai', sebab: 'gugur' })
    expect(l.penyerang.every((p) => p.status === 'gugur')).toBe(true)
  })

  it('waktu habis = ronde selesai', () => {
    const l = ronde({ penjaga: regu(() => JAGA_MANUSIA, true), lama: 3000 })
    patungDiTepi(l)
    const ev = jalan(l, () => false)
    expect(ev[ev.length - 1]).toEqual({ jenis: 'selesai', sebab: 'waktu' })
    expect(l.sisaWaktu).toBe(0)
  })
})

describe('penjaga', () => {
  it('penjaga garis hanya bergerak di garisnya, sodor di garis tengah', () => {
    const l = ronde({ penjaga: regu(() => JAGA_CPU.sulit) })
    const a = l.penyerangAktif!
    for (let i = 0; i < 300; i++) {
      l.joystick = { x: Math.sin(i / 7), y: Math.cos(i / 11) }
      l.maju(50)
      if (l.fase !== 'main') break
      for (const p of l.penjaga) {
        if (p.jenis === 'garis') expect(p.y).toBe(lap.garisY[p.garis])
        else {
          expect(p.x).toBe(lap.tengahX)
          expect(p.y).toBeGreaterThanOrEqual(batasSodor(lap)[0])
          expect(p.y).toBeLessThanOrEqual(batasSodor(lap)[1])
        }
        expect(p.x).toBeGreaterThanOrEqual(lap.x0)
        expect(p.x).toBeLessThanOrEqual(lap.x1)
      }
    }
    expect(a).toBeDefined()
  })

  it('penjaga komputer mengejar posisi penyerang setelah waktu reaksi, paling cepat sesuai profil', () => {
    const profil = JAGA_CPU.sedang
    const l = ronde({ penjaga: regu(() => profil) })
    const jaga = l.penjaga[0]!
    const a = l.penyerangAktif!
    a.x = lap.x1 - 30
    majuLama(l, profil.reaksi - 40)
    // Belum bereaksi: penjaga belum melihat penyerang.
    const x0 = jaga.x
    majuLama(l, 1000)
    expect(jaga.x).toBeGreaterThan(x0)
    expect(jaga.x - x0).toBeLessThanOrEqual(profil.kecepatan * 1.01 + 1)
  })

  it('penjaga pemain: arah joystick dan tujuan slider', () => {
    const d = regu(() => JAGA_CPU.sedang)
    d[0]!.manusia = true
    d[0]!.profil = JAGA_MANUSIA
    d[N_GARIS]!.manusia = true
    d[N_GARIS]!.profil = JAGA_MANUSIA
    const l = ronde({ penjaga: d })
    const garis = l.penjaga[0]!
    const sodor = l.penjaga[N_GARIS]!
    const x0 = garis.x
    garis.arah = 1
    sodor.tujuan = lap.garisY[N_GARIS - 1]!
    majuLama(l, 500)
    expect(garis.x - x0).toBeCloseTo(JAGA_MANUSIA.kecepatan * 0.5, -1)
    majuLama(l, 3000)
    expect(sodor.y).toBe(lap.garisY[N_GARIS - 1])
  })
})

describe('komputer', () => {
  /** Rata-rata poin penyerang komputer dalam beberapa ronde penuh. */
  function rataPoin(serang: ProfilSerang, jaga: (g: number) => ProfilJaga, n = 12) {
    let poin = 0
    for (let b = 1; b <= n; b++) {
      const l = ronde({ penjaga: regu(jaga), otak: serang, benih: b * 7919 })
      while (l.fase !== 'selesai') l.maju(100)
      poin += l.poin
    }
    return poin / n
  }

  it('penyerang komputer bisa mencetak poin melawan penjaga mudah', () => {
    expect(rataPoin(SERANG_CPU.sedang, () => JAGA_CPU.mudah)).toBeGreaterThan(2)
  })

  it('penjaga lebih sulit = poin penyerang lebih sedikit', () => {
    const mudah = rataPoin(SERANG_CPU.sulit, () => JAGA_CPU.mudah)
    const sedang = rataPoin(SERANG_CPU.sulit, () => JAGA_CPU.sedang)
    const sulit = rataPoin(SERANG_CPU.sulit, () => JAGA_CPU.sulit)
    expect(mudah).toBeGreaterThan(sedang)
    expect(sedang).toBeGreaterThan(sulit)
  })

  it('ronde menjaga: penyerang Sulit lebih berbahaya daripada penyerang Mudah', () => {
    // Pemain dimodelkan sebagai penjaga garis masuk yang sigap.
    const manusia = { ...JAGA_MANUSIA, reaksi: 250 }
    const mudah = rataPoin(SERANG_CPU.mudah, (g) => (g === 0 ? manusia : JAGA_TEMAN.mudah))
    const sulit = rataPoin(SERANG_CPU.sulit, (g) => (g === 0 ? manusia : JAGA_TEMAN.sulit))
    expect(sulit).toBeGreaterThan(mudah)
  })

  it('penyerang komputer tidak keluar lapangan dan berganti saat gugur', () => {
    const l = ronde({ penjaga: regu(() => JAGA_CPU.sulit), otak: SERANG_CPU.mudah, benih: 3 })
    const ev: Peristiwa[] = []
    while (l.fase !== 'selesai') {
      ev.push(...l.maju(100))
      const a = l.penyerangAktif
      if (a) {
        expect(a.x).toBeGreaterThan(lap.x0)
        expect(a.x).toBeLessThan(lap.x1)
        expect(a.y).toBeGreaterThanOrEqual(lap.atas)
        expect(a.y).toBeLessThanOrEqual(lap.bawah)
      }
    }
    const kena = ev.filter((e) => e.jenis === 'kena').length
    expect(ev.filter((e) => e.jenis === 'masuk')).toHaveLength(Math.min(4, kena + ev.filter((e) => e.jenis === 'poin').length))
  })
})

describe('pertandingan', () => {
  it('tim pemain utama menyerang lebih dulu, lalu bergantian', () => {
    expect([0, 1, 2, 3].map(timPenyerang)).toEqual([0, 1, 0, 1])
  })

  it('poin terbanyak menang; sama = seri', () => {
    expect(pemenang([3, 1])).toBe(0)
    expect(pemenang([0, 2])).toBe(1)
    expect(pemenang([2, 2])).toBeNull()
  })
})
