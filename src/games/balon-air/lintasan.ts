/**
 * Lintasan estafet balon air (koordinat dunia satu lintasan, tampak
 * atas-miring): START di kiri, keranjang di kanan. Pelari bergerak di pita
 * Y_ATAS..Y_BAWAH; rintangannya batu, genangan, dan parit yang hanya bisa
 * diseberangi lewat papan titian. Semua tim memakai lintasan yang sama.
 */
export interface Titik {
  x: number
  y: number
}

export interface Batu {
  x: number
  y: number
  r: number
}

export interface Genangan {
  x: number
  y: number
  rx: number
  ry: number
}

export interface Kotak {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface Parit {
  x0: number
  x1: number
  /** Papan titian: rentang y di atas parit. */
  papanY0: number
  papanY1: number
}

export interface Lintasan {
  panjang: number
  /** Pita tempat titik kaki boleh berada. */
  yAtas: number
  yBawah: number
  xMin: number
  xMaks: number
  start: Titik
  /** Garis START (kapur) di x ini. */
  garisStart: number
  keranjang: Titik
  batu: readonly Batu[]
  genangan: readonly Genangan[]
  parit: Parit
  /** Jalur bayangan pelari (komputer), bebas tabrakan. */
  jalur: readonly Titik[]
}

/** Lebar dan tinggi gambar satu lintasan. */
export const PANJANG = 2300
export const TINGGI_LINTASAN = 380

export const LINTASAN: Lintasan = {
  panjang: PANJANG,
  yAtas: 100,
  yBawah: 336,
  xMin: 24,
  xMaks: PANJANG - 40,
  start: { x: 104, y: 218 },
  garisStart: 160,
  keranjang: { x: 2196, y: 218 },
  batu: [
    { x: 380, y: 150, r: 30 },
    { x: 420, y: 292, r: 26 },
    { x: 620, y: 222, r: 34 },
    { x: 1300, y: 146, r: 28 },
    { x: 1344, y: 294, r: 30 },
    { x: 1724, y: 236, r: 34 },
    { x: 1866, y: 128, r: 26 },
    { x: 1904, y: 318, r: 24 },
  ],
  genangan: [
    { x: 822, y: 138, rx: 100, ry: 46 },
    { x: 866, y: 306, rx: 92, ry: 40 },
    { x: 1524, y: 222, rx: 120, ry: 58 },
  ],
  parit: { x0: 1000, x1: 1112, papanY0: 240, papanY1: 294 },
  jalur: [
    { x: 104, y: 218 },
    { x: 300, y: 220 },
    { x: 400, y: 222 },
    { x: 520, y: 200 },
    { x: 620, y: 160 },
    { x: 720, y: 196 },
    { x: 840, y: 224 },
    { x: 950, y: 262 },
    { x: 1000, y: 267 },
    { x: 1112, y: 267 },
    { x: 1200, y: 244 },
    { x: 1320, y: 220 },
    { x: 1420, y: 170 },
    { x: 1524, y: 140 },
    { x: 1624, y: 160 },
    { x: 1724, y: 176 },
    { x: 1800, y: 200 },
    { x: 1884, y: 222 },
    { x: 2000, y: 220 },
    { x: 2196, y: 218 },
  ],
}

/** Dua bagian parit di atas dan di bawah papan titian (dinding air). */
export function dindingParit(l: Lintasan): Kotak[] {
  const p = l.parit
  return [
    { x0: p.x0, y0: l.yAtas - 200, x1: p.x1, y1: p.papanY0 },
    { x0: p.x0, y0: p.papanY1, x1: p.x1, y1: l.yBawah + 200 },
  ]
}

export function diGenangan(l: Lintasan, t: Titik): boolean {
  return l.genangan.some((g) => ((t.x - g.x) / g.rx) ** 2 + ((t.y - g.y) / g.ry) ** 2 < 1)
}

export function diTitian(l: Lintasan, t: Titik): boolean {
  return t.x >= l.parit.x0 && t.x <= l.parit.x1 && t.y >= l.parit.papanY0 && t.y <= l.parit.papanY1
}

// ── Jalur (garis patah) ───────────────────────────────────

export interface Jalur {
  titik: readonly Titik[]
  /** Jarak kumulatif dari titik pertama. */
  s: number[]
  panjang: number
}

export function buatJalur(titik: readonly Titik[]): Jalur {
  const s = [0]
  for (let i = 1; i < titik.length; i++) s.push(s[i - 1]! + Math.hypot(titik[i]!.x - titik[i - 1]!.x, titik[i]!.y - titik[i - 1]!.y))
  return { titik, s, panjang: s[s.length - 1]! }
}

/** Titik di jalur pada jarak `jarak` dari awal (dibatasi ke ujung-ujungnya). */
export function titikDi(j: Jalur, jarak: number): Titik {
  const t = j.titik
  if (jarak <= 0) return { ...t[0]! }
  if (jarak >= j.panjang) return { ...t[t.length - 1]! }
  let lo = 0
  let hi = j.s.length - 1
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1
    if (j.s[m]! <= jarak) lo = m
    else hi = m
  }
  const a = t[lo]!
  const b = t[hi]!
  const f = (jarak - j.s[lo]!) / (j.s[hi]! - j.s[lo]! || 1)
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
}
