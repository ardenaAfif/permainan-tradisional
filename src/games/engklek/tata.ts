/**
 * Tata letak panggung 1280x720 Engklek. Pola digambar tampak atas-miring:
 * koordinat tanah (u, v) dalam satuan kotak — u menyusur pola dari garis
 * mulai (u = 0) ke ujung, v melintang (v > 0 = sisi jauh/kiri pelompat).
 */
import type { Langkah, Pola } from './aturan'

export const LEBAR = 1280
export const TINGGI = 720

/** Area kontrol (papan kayu) di bawah. */
export const PANEL_Y = 500
/** Tombol: ≥ 96px layar di HP mendatar (skala panggung ≈ 0,54). */
export const TOMBOL_Y = 516
export const TOMBOL_T = 188
/** Meter lempar di bawah pola. */
export const METER = { x: 300, y: 426, lebar: 820, tinggi: 50 } as const
/** Pesan petunjuk di bawah papan pemain. */
export const PESAN_Y = 110

export interface Titik {
  x: number
  y: number
}

/** Titik di tanah (satuan kotak). */
export interface Tanah {
  u: number
  v: number
}

export interface KotakPola {
  kotak: number
  baris: number
  u0: number
  u1: number
  v0: number
  v1: number
}

/** Tempat pemain: berdiri untuk melempar, dan tempat menunggu giliran. */
export const TEMPAT_LEMPAR: Tanah = { u: -0.75, v: 0 }
export const TEMPAT_KELUAR: Tanah = { u: -0.5, v: 0 }
const TEMPAT_TUNGGU: Tanah[] = [
  { u: -1.95, v: 0.85 },
  { u: -2.35, v: 0 },
  { u: -1.9, v: -0.9 },
]

export class TataPola {
  readonly pola: Pola
  /** Jumlah baris. */
  readonly n: number
  /** Jari-jari setengah lingkaran (satuan kotak). */
  readonly rPutar: number
  /** Px per satuan u, px vertikal per satuan v, geser x per satuan v (kemiringan). */
  readonly su: number
  readonly sv: number
  readonly sk: number
  readonly x0 = 300
  readonly yc = 318
  private kotakMap = new Map<number, KotakPola>()

  constructor(pola: Pola) {
    this.pola = pola
    this.n = pola.baris.length
    this.rPutar = Math.max(...pola.baris.map((b) => b.length)) / 2
    const panjang = this.n + (pola.putar ? this.rPutar : 0)
    this.su = Math.min(122, 830 / panjang)
    this.sv = this.su * 0.52
    this.sk = this.su * 0.22
    pola.baris.forEach((b, i) => {
      const m = b.length
      b.forEach((kotak, j) => this.kotakMap.set(kotak, { kotak, baris: i, u0: i, u1: i + 1, v0: m / 2 - j - 1, v1: m / 2 - j }))
    })
  }

  layar(t: Tanah): Titik {
    return { x: this.x0 + t.u * this.su + t.v * this.sk, y: this.yc - t.v * this.sv }
  }

  kotak(k: number): KotakPola | undefined {
    return this.kotakMap.get(k)
  }

  get semuaKotak(): KotakPola[] {
    return [...this.kotakMap.values()]
  }

  /** Sudut kotak di layar (searah jarum jam dari kiri-bawah). */
  sudutKotak(k: KotakPola): Titik[] {
    return [
      this.layar({ u: k.u0, v: k.v0 }),
      this.layar({ u: k.u0, v: k.v1 }),
      this.layar({ u: k.u1, v: k.v1 }),
      this.layar({ u: k.u1, v: k.v0 }),
    ]
  }

  /** Garis setengah lingkaran di layar (dari sisi dekat ke sisi jauh). */
  busurPutar(langkah = 24): Titik[] {
    const r = this.rPutar
    return Array.from({ length: langkah + 1 }, (_, i) => {
      const a = -Math.PI / 2 + (Math.PI * i) / langkah
      return this.layar({ u: this.n + Math.cos(a) * r, v: Math.sin(a) * r })
    })
  }

  pusatKotak(k: number): Tanah {
    const b = this.kotak(k)
    if (!b) return { u: this.n + 0.5, v: 0 }
    return { u: (b.u0 + b.u1) / 2, v: (b.v0 + b.v1) / 2 }
  }

  /** Pusat "kotak" 0 (sebelum garis mulai) dan N+1 (setengah lingkaran / sesudah ujung). */
  private pusatDiperluas(k: number): Tanah {
    if (k <= 0) return { u: -0.5, v: 0 }
    if (!this.kotak(k)) return { u: this.n + (this.pola.putar ? this.rPutar * 0.45 : 0.5), v: 0 }
    return this.pusatKotak(k)
  }

  /** Titik di garis antara kotak a dan b (gacuk jatuh di garis). */
  titikGaris(a: number, b: number): Tanah {
    const p = this.pusatDiperluas(a)
    const q = this.pusatDiperluas(b)
    return { u: (p.u + q.u) / 2, v: (p.v + q.v) / 2 }
  }

  /** Tempat berdiri setelah mendarat. */
  posisiLangkah(l: Langkah): Tanah {
    if (l.baris >= this.n) return { u: this.n + this.rPutar * 0.45, v: 0 }
    const p = l.kotak.map((k) => this.pusatKotak(k))
    return { u: p.reduce((s, t) => s + t.u, 0) / p.length, v: p.reduce((s, t) => s + t.v, 0) / p.length }
  }

  /** Titik tapak kaki setelah mendarat: satu per kotak, dua di setengah lingkaran untuk dua kaki. */
  tapakLangkah(l: Langkah): Tanah[] {
    const pos = this.posisiLangkah(l)
    if (l.kotak.length > 1) return l.kotak.map((k) => ({ u: pos.u, v: this.pusatKotak(k).v * 0.7 }))
    if (l.kaki === 'dua') return [{ u: pos.u, v: 0.28 }, { u: pos.u, v: -0.28 }]
    return [pos]
  }

  /** Mendarat meleset: tepat di garis depan tujuan (garis antarbaris). */
  garisDepan(tujuan: Tanah, arah: Langkah['arah']): Tanah {
    return { u: Math.round(tujuan.u + (arah === 'maju' ? -0.5 : 0.5)), v: tujuan.v }
  }

  tempatTunggu(i: number): Tanah {
    return TEMPAT_TUNGGU[i % TEMPAT_TUNGGU.length]!
  }
}
