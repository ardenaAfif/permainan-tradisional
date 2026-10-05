import { describe, expect, it } from 'vitest'
import { acakBerbenih, formatWaktu, LogikaPelari, pemenang, posBayangan, rencanaBayangan, type Peristiwa } from './aturan'
import { CPU, JARAK_APIT, JEDA_PECAH, R_BADAN, TOLERANSI_APIT, URUTAN_CARA, V_MAKS, V_TITIAN, type Cara, type IdCara } from './config'
import { buatJalur, diGenangan, diTitian, dindingParit, LINTASAN, titikDi, type Titik } from './lintasan'

const l = LINTASAN
const cara = (id: IdCara) => URUTAN_CARA.find((c) => c.id === id)!
const pelari = (id: IdCara = 'dua-tangan') => new LogikaPelari({ lintasan: l, cara: cara(id) })

/** Jalankan `ms` milidetik dengan kendali tetap; kumpulkan peristiwa. */
function jalan(p: LogikaPelari, ms: number, arah?: Titik): Peristiwa[] {
  if (arah) p.arah = arah
  const ev: Peristiwa[] = []
  for (let t = 0; t < ms; t += 1000 / 60) ev.push(...p.maju(1000 / 60))
  return ev
}

const jalur = buatJalur(l.jalur)

/**
 * Pemain teliti: mengikuti jalur bayangan dengan kendali yang dihaluskan,
 * memperlambat di genangan dan papan titian. Kembalikan pelari setelah
 * sampai (atau setelah 60 detik).
 */
function pemainTeliti(id: IdCara, gas = 0.9) {
  const p = pelari(id)
  const c = p.cara
  let s = 0
  const arah = { x: 0, y: 0 }
  for (let t = 0; t < 60_000 && p.status !== 'sampai'; t += 1000 / 60) {
    // Titik terdekat di jalur (maju saja), lalu bidik 70 px di depannya.
    for (let d = s; d < s + 40; d += 2) {
      const a = titikDi(jalur, d)
      const b = titikDi(jalur, s)
      if (Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y)) s = d
    }
    if (p.status === 'pecah') s = 0
    const bidik = titikDi(jalur, s + 70)
    let dx = bidik.x - p.x
    let dy = bidik.y - p.y
    const n = Math.hypot(dx, dy) || 1
    const depan = titikDi(jalur, s + 50)
    const pelan = diTitian(l, depan) || diTitian(l, p) ? (V_TITIAN * 0.85) / (V_MAKS * c.laju) : diGenangan(l, depan) ? 0.45 : gas
    dx = (dx / n) * pelan
    dy = (dy / n) * pelan
    if (c.terbalik) {
      dx = -dx
      dy = -dy
    }
    // Ibu jari bergerak halus: kendali mendekati arah tujuan 3 satuan/detik.
    arah.x += Math.max(-0.05, Math.min(0.05, dx - arah.x))
    arah.y += Math.max(-0.05, Math.min(0.05, dy - arah.y))
    p.arah = { ...arah }
    p.maju(1000 / 60)
  }
  return p
}

describe('lintasan', () => {
  it('jalur bayangan tidak menabrak batu, parit, atau pagar', () => {
    const dinding = dindingParit(l)
    for (let d = 0; d <= jalur.panjang; d += 3) {
      const t = titikDi(jalur, d)
      for (const b of l.batu) expect(Math.hypot(t.x - b.x, t.y - b.y)).toBeGreaterThan(b.r + R_BADAN)
      for (const k of dinding) {
        const cx = Math.min(k.x1, Math.max(k.x0, t.x))
        const cy = Math.min(k.y1, Math.max(k.y0, t.y))
        expect(Math.hypot(t.x - cx, t.y - cy)).toBeGreaterThanOrEqual(R_BADAN)
      }
      expect(t.y).toBeGreaterThanOrEqual(l.yAtas)
      expect(t.y).toBeLessThanOrEqual(l.yBawah)
    }
  })

  it('jalur berakhir di keranjang', () => {
    expect(l.jalur.at(-1)).toEqual(l.keranjang)
    expect(l.jalur[0]).toEqual(l.start)
  })
})

describe('tekanan balon', () => {
  it('diam: tekanan tetap nol', () => {
    const p = pelari()
    jalan(p, 3000)
    expect(p.tekanan).toBe(0)
    expect(p.status).toBe('jalan')
  })

  it('mulai pelan-pelan hampir tidak menaikkan tekanan', () => {
    const p = pelari()
    for (let i = 1; i <= 60; i++) jalan(p, 1000 / 60, { x: i / 60, y: 0 })
    expect(p.tekanan).toBeLessThan(0.03)
  })

  it('langsung tancap gas menaikkan tekanan sedikit', () => {
    const p = pelari()
    jalan(p, 250, { x: 1, y: 0 })
    expect(p.tekanan).toBeGreaterThan(0.05)
    expect(p.tekanan).toBeLessThan(0.2)
  })

  it('bolak-balik mendadak memecahkan balon', () => {
    // Tanah lapang setelah parit, jauh dari batu.
    const p = pelari()
    p.x = 1180
    p.y = 200
    const ev: Peristiwa[] = []
    for (let i = 0; i < 8 && p.status === 'jalan'; i++) ev.push(...jalan(p, 450, { x: i % 2 ? -1 : 1, y: 0 }))
    expect(ev.some((e) => e.jenis === 'pecah')).toBe(true)
  })

  it('bergerak halus menurunkan tekanan perlahan', () => {
    const p = pelari()
    p.x = 1180
    p.y = 120
    jalan(p, 1000, { x: 0.5, y: 0 })
    p.tekanan = 0.5
    jalan(p, 1000, { x: 0.5, y: 0 })
    expect(p.tekanan).toBeLessThan(0.5)
    expect(p.tekanan).toBeGreaterThan(0.35)
  })

  it('menabrak batu dengan kencang menaikkan tekanan banyak', () => {
    const p = pelari()
    // Batu (620, 222): mulai dari kiri, lurus ke kanan.
    p.x = 470
    p.y = 222
    jalan(p, 400, { x: 0.15, y: 0 })
    const awal = p.tekanan
    const ev = jalan(p, 2000, { x: 1, y: 0 })
    expect(ev.some((e) => e.jenis === 'bentur')).toBe(true)
    expect(p.x).toBeLessThan(620 - 34 - R_BADAN + 1)
    expect(p.tekanan - awal).toBeGreaterThan(0.3)
  })

  it('menyusuri pagar pelan tidak dihitung benturan', () => {
    const p = pelari()
    p.y = l.yAtas + 1
    const ev = jalan(p, 600, { x: 0.4, y: -0.1 })
    expect(ev.some((e) => e.jenis === 'bentur')).toBe(false)
  })

  it('di atas kepala: tekanan naik lebih cepat', () => {
    const a = pelari('dua-tangan')
    const b = pelari('atas-kepala')
    jalan(a, 800, { x: 1, y: 0 })
    jalan(b, 800, { x: 1, y: 0 })
    expect(b.tekanan).toBeGreaterThan(a.tekanan * 1.5)
    expect(b.laju).toBeGreaterThan(a.laju)
  })

  it('genangan memperlambat dan papan titian bergoyang jika terburu-buru', () => {
    const g = l.genangan[2]!
    const p = pelari()
    p.x = g.x - 30
    p.y = g.y
    jalan(p, 1500, { x: 0.3, y: 0 })
    expect(p.diGenangan).toBe(true)
    expect(p.laju).toBeLessThan(V_MAKS * 0.5 + 1)

    const lambat = pelari()
    const cepat = pelari()
    for (const q of [lambat, cepat]) {
      q.x = l.parit.x0 - 60
      q.y = 267
    }
    jalan(lambat, 2500, { x: 0.35, y: 0 })
    jalan(cepat, 900, { x: 1, y: 0 })
    expect(lambat.x).toBeGreaterThan(l.parit.x1)
    expect(lambat.tekanan).toBeLessThan(0.05)
    expect(cepat.tekanan).toBeGreaterThan(0.2)
  })
})

describe('parit dan papan titian', () => {
  it('parit tidak bisa diseberangi di luar papan', () => {
    const p = pelari()
    p.x = l.parit.x0 - 40
    p.y = 150
    jalan(p, 3000, { x: 0.3, y: 0 })
    expect(p.x).toBeLessThan(l.parit.x0)
  })

  it('lewat papan titian bisa menyeberang', () => {
    const p = pelari()
    p.x = l.parit.x0 - 40
    p.y = (l.parit.papanY0 + l.parit.papanY1) / 2
    jalan(p, 3000, { x: 0.35, y: 0 })
    expect(p.x).toBeGreaterThan(l.parit.x1)
  })
})

describe('pecah dan balon baru', () => {
  it('balon pecah: kembali ke START dengan balon baru, waktu terus berjalan', () => {
    const p = pelari()
    p.x = 1180
    p.y = 200
    p.tekanan = 0.99
    const ev = jalan(p, 900, { x: -1, y: 0.5 })
    expect(ev.find((e) => e.jenis === 'pecah')).toBeTruthy()
    expect(p.status).toBe('pecah')
    const w = p.waktu
    const ev2 = jalan(p, JEDA_PECAH + 100, { x: 0, y: 0 })
    expect(ev2).toContainEqual({ jenis: 'baru', balon: 2 })
    expect(p.status).toBe('jalan')
    expect(p.balon).toBe(2)
    expect(p.tekanan).toBe(0)
    expect(p.x).toBe(l.start.x)
    expect(p.waktu).toBeGreaterThan(w + JEDA_PECAH)
  })
})

describe('jalan mundur', () => {
  it('arah kendali terbalik', () => {
    const p = pelari('mundur')
    p.x = 1180
    p.y = 200
    jalan(p, 600, { x: -0.5, y: 0 })
    expect(p.vx).toBeGreaterThan(0)
    expect(p.x).toBeGreaterThan(1180)
  })
})

describe('diapit berdua', () => {
  it('teman menyusul sejarak pas saat jalan halus', () => {
    // Lurus dari START sampai sebelum batu tengah (x 620).
    const p = pelari('diapit')
    let terjauh = 0
    for (let i = 1; i <= 140; i++) {
      jalan(p, 1000 / 60, { x: Math.min(1, i / 50), y: 0 })
      terjauh = Math.max(terjauh, Math.abs(Math.hypot(p.x - p.teman!.x, p.y - p.teman!.y) - JARAK_APIT))
    }
    expect(terjauh).toBeLessThan(TOLERANSI_APIT + 6)
    expect(p.tekanan).toBeLessThan(0.1)
  })

  it('berhenti lalu mundur mendadak: kedempetan, tekanan naik', () => {
    const a = pelari('diapit')
    const b = pelari('dua-tangan')
    for (const p of [a, b]) {
      p.x = 1180
      p.y = 200
      for (let i = 1; i <= 60; i++) jalan(p, 1000 / 60, { x: i / 60, y: 0 })
      jalan(p, 800, { x: 1, y: 0 })
    }
    a.tekanan = 0
    b.tekanan = 0
    jalan(a, 500, { x: -1, y: 0 })
    jalan(b, 500, { x: -1, y: 0 })
    expect(a.tekanan).toBeGreaterThan(b.tekanan + 0.1)
  })
})

describe('pemain teliti menyelesaikan setiap cara', () => {
  for (const c of URUTAN_CARA) {
    it(c.judul, () => {
      const p = pemainTeliti(c.id)
      expect(p.status).toBe('sampai')
      expect(p.balon).toBe(1)
      expect(p.waktu).toBeGreaterThan(8_000)
      expect(p.waktu).toBeLessThan(25_000)
    })
  }
})

describe('bayangan pelari (tim komputer)', () => {
  const tanpaPecah = (k: keyof typeof CPU) => ({ ...CPU[k], pecah: 0 })

  it('makin sulit makin cepat', () => {
    const c: Cara = cara('dua-tangan')
    const w = (['mudah', 'sedang', 'sulit'] as const).map((k) => rencanaBayangan(l, c, tanpaPecah(k), acakBerbenih(1)).waktu)
    expect(w[0]).toBeGreaterThan(w[1]!)
    expect(w[1]).toBeGreaterThan(w[2]!)
  })

  it('pemain teliti bisa mengalahkan komputer sedang, tapi tidak mudah melawan sulit', () => {
    let pemain = 0
    let sedang = 0
    let sulit = 0
    for (const c of URUTAN_CARA) {
      pemain += pemainTeliti(c.id).waktu
      sedang += rencanaBayangan(l, c, tanpaPecah('sedang'), acakBerbenih(2)).waktu
      sulit += rencanaBayangan(l, c, tanpaPecah('sulit'), acakBerbenih(2)).waktu
    }
    expect(pemain).toBeLessThan(sedang)
    expect(pemain).toBeGreaterThan(sulit * 0.9)
  })

  it('balon bayangan bisa pecah: balon kedua, waktu lebih lama', () => {
    const c = cara('atas-kepala')
    const utuh = rencanaBayangan(l, c, { ...CPU.sedang, pecah: 0 }, acakBerbenih(3))
    const pecah = rencanaBayangan(l, c, { ...CPU.sedang, pecah: 10 }, acakBerbenih(3))
    expect(pecah.pecah).not.toBeNull()
    expect(pecah.balon).toBe(2)
    expect(pecah.waktu).toBeGreaterThan(utuh.waktu + JEDA_PECAH)
    const [m] = pecah.pecah!
    expect(posBayangan(pecah, l, false, (m + 5) * (1000 / 60)).status).toBe('pecah')
    expect(posBayangan(pecah, l, false, pecah.waktu + 100).status).toBe('sampai')
    expect(posBayangan(pecah, l, false, pecah.waktu + 100).balon).toBe(2)
  })

  it('bayangan diapit: teman di belakang pelari', () => {
    const r = rencanaBayangan(l, cara('diapit'), CPU.sedang, acakBerbenih(4))
    const p = posBayangan(r, l, true, 0)
    expect(p.teman!.x).toBeCloseTo(l.start.x - JARAK_APIT)
    const q = posBayangan(r, l, true, 4000)
    expect(Math.hypot(q.pelari.x - q.teman!.x, q.pelari.y - q.teman!.y)).toBeLessThanOrEqual(JARAK_APIT + 0.01)
  })
})

describe('hasil', () => {
  it('tim tercepat menang; selisih sangat kecil = seri', () => {
    expect(pemenang([60_000, 61_000])).toBe(0)
    expect(pemenang([62_000, 61_000])).toBe(1)
    expect(pemenang([61_000, 61_020])).toBeNull()
  })

  it('format waktu', () => {
    expect(formatWaktu(0)).toBe('0:00,0')
    expect(formatWaktu(65_349)).toBe('1:05,3')
    expect(formatWaktu(9_999)).toBe('0:09,9')
  })
})
