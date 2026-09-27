/**
 * Aturan Kelereng tanpa Phaser: gesekan tanah, kekuatan sentil, lubang,
 * lingkaran, urutan giliran, pemenang, dan bidikan komputer.
 */
import {
  BATAS,
  BERHENTI,
  GARIS_X,
  GARIS_Y_MAKS,
  GARIS_Y_MIN,
  GESEK,
  LUBANG_ANTAR,
  LUBANG_DARI_BATAS,
  LUBANG_DARI_GARIS,
  R_TARUHAN,
  REDAM,
  V_MAKS,
} from './config'

export interface Titik {
  x: number
  y: number
}

export const jarak = (a: Titik, b: Titik) => Math.hypot(a.x - b.x, a.y - b.y)

// ── Gerak di tanah ─────────────────────────────────────────

/** Kecepatan setelah satu langkah fisika (gesekan tanah). */
export function perlambat(v: number): number {
  const baru = v * (1 - REDAM) - GESEK
  return baru < BERHENTI ? 0 : baru
}

/** Jarak tempuh (px) dari kecepatan awal sampai berhenti. */
export function jarakLuncur(v0: number): number {
  let d = 0
  for (let v = v0; v > 0; v = perlambat(v)) d += v
  return d
}

export const JARAK_MAKS = jarakLuncur(V_MAKS)

/** Kecepatan awal supaya kelereng berhenti setelah `d` px (dibatasi V_MAKS). */
export function kecepatanUntukJarak(d: number): number {
  if (d <= 0) return 0
  if (d >= JARAK_MAKS) return V_MAKS
  let lo = 0
  let hi = V_MAKS
  for (let i = 0; i < 30; i++) {
    const tengah = (lo + hi) / 2
    if (jarakLuncur(tengah) < d) lo = tengah
    else hi = tengah
  }
  return (lo + hi) / 2
}

/** Kekuatan 0..1 (meter) → kecepatan awal. Kekuatan sebanding dengan jarak tempuh. */
export const kecepatanDariKekuatan = (p: number) => kecepatanUntukJarak(Math.max(0, Math.min(1, p)) * JARAK_MAKS)

// ── Area ───────────────────────────────────────────────────

export interface Kotak {
  kiri: number
  atas: number
  kanan: number
  bawah: number
}

export const diLuarBatas = (p: Titik, b: Kotak = BATAS) => p.x < b.kiri || p.x > b.kanan || p.y < b.atas || p.y > b.bawah

/** Keluar lingkaran = pusat kelereng melewati garis lingkaran. */
export const diLuarLingkaran = (p: Titik, pusat: Titik, r: number) => jarak(p, pusat) > r

// ── Mode Lubang ────────────────────────────────────────────

/** Minimal 3 lubang; dengan 4 pemain, tiap pemain menaruh satu. */
export const jumlahLubang = (nPemain: number) => Math.max(3, nPemain)

/** Pemain yang menaruh lubang ke-i (bergiliran). */
export const penaruhLubang = (i: number, nPemain: number) => i % nPemain

/** Lubang boleh di mana saja, asal tidak terlalu dekat garis sentil, garis batas, atau lubang lain. */
export function lubangSah(p: Titik, lubang: readonly Titik[]): boolean {
  if (p.x < GARIS_X + LUBANG_DARI_GARIS) return false
  if (p.x > BATAS.kanan - LUBANG_DARI_BATAS || p.y < BATAS.atas + LUBANG_DARI_BATAS || p.y > BATAS.bawah - LUBANG_DARI_BATAS) return false
  return lubang.every((l) => jarak(l, p) >= LUBANG_ANTAR)
}

export function acakLubang(lubang: readonly Titik[], acak: () => number = Math.random): Titik {
  const x0 = GARIS_X + LUBANG_DARI_GARIS
  const x1 = BATAS.kanan - LUBANG_DARI_BATAS
  const y0 = BATAS.atas + LUBANG_DARI_BATAS
  const y1 = BATAS.bawah - LUBANG_DARI_BATAS
  for (let i = 0; i < 500; i++) {
    const p = { x: Math.round(x0 + acak() * (x1 - x0)), y: Math.round(y0 + acak() * (y1 - y0)) }
    if (lubangSah(p, lubang)) return p
  }
  return { x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2) }
}

// ── Mode Tembak ────────────────────────────────────────────

/** Kelereng taruhan disusun 3x3 di tengah lingkaran. */
export function susunTaruhan(pusat: Titik): Titik[] {
  const jarakAntar = R_TARUHAN * 2 + 8
  const hasil: Titik[] = []
  for (let r = -1; r <= 1; r++) for (let k = -1; k <= 1; k++) hasil.push({ x: pusat.x + k * jarakAntar, y: pusat.y + r * jarakAntar })
  return hasil
}

// ── Garis sentil ───────────────────────────────────────────

export const jepitGarisY = (y: number) => Math.max(GARIS_Y_MIN, Math.min(GARIS_Y_MAKS, y))

/** Titik di garis sentil sedekat mungkin dengan `y` yang tidak menabrak kelereng lain. */
export function tempatDiGaris(y: number, lain: readonly Titik[], jarakMin: number): Titik {
  const awal = jepitGarisY(y)
  for (let geser = 0; geser <= GARIS_Y_MAKS - GARIS_Y_MIN; geser += 8) {
    for (const arah of [1, -1]) {
      const p = { x: GARIS_X, y: jepitGarisY(awal + arah * geser) }
      if (lain.every((q) => jarak(p, q) >= jarakMin)) return p
    }
  }
  return { x: GARIS_X, y: awal }
}

// ── Giliran & pemenang ─────────────────────────────────────

/** Giliran global ke-i (mulai 0) → pemain dan giliran ke berapa bagi pemain itu (mulai 1). */
export const giliranKe = (i: number, nPemain: number) => ({ pemain: i % nPemain, ke: Math.floor(i / nPemain) + 1 })

/** Indeks pemain dengan poin terbanyak, atau null jika poin tertinggi dimiliki lebih dari satu (seri). */
export function indeksPemenang(skor: readonly number[]): number | null {
  const maks = Math.max(...skor)
  const puncak = skor.flatMap((s, i) => (s === maks ? [i] : []))
  return puncak.length === 1 ? puncak[0]! : null
}

// ── Komputer ───────────────────────────────────────────────

export interface Bidikan {
  /** Radian, 0 = ke kanan. */
  sudut: number
  /** 0..1 */
  kekuatan: number
}

/**
 * Bidik lurus dari `dari` ke `ke` dengan galat sudut acak ±galatDerajat, dan
 * kekuatan untuk menempuh jarak ke target + `lebih` px (galat ±galatKekuatan).
 */
export function bidikCpu(
  dari: Titik,
  ke: Titik,
  galatDerajat: number,
  lebih: number,
  galatKekuatan: number,
  acak: () => number = Math.random,
): Bidikan {
  const galat = ((acak() * 2 - 1) * galatDerajat * Math.PI) / 180
  const sudut = Math.atan2(ke.y - dari.y, ke.x - dari.x) + galat
  const d = (jarak(dari, ke) + lebih) * (1 + (acak() * 2 - 1) * galatKekuatan)
  return { sudut, kekuatan: Math.max(0, Math.min(1, d / JARAK_MAKS)) }
}

/** Target terdekat dari titik `dari`. */
export function terdekat<T extends Titik>(dari: Titik, target: readonly T[]): T | null {
  let hasil: T | null = null
  for (const t of target) if (!hasil || jarak(dari, t) < jarak(dari, hasil)) hasil = t
  return hasil
}
