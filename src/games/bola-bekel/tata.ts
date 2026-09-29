/**
 * Tata letak panggung Bola Bekel untuk dua orientasi: mendatar 1280x720 dan
 * tegak 720x1280 (HP tegak). Biji disimpan dalam koordinat tikar
 * ternormalisasi (u, v), satu letak per orientasi (lihat Biji.letak).
 */
import type { AturanSebar } from './aturan'
import { R_WAKTU_AWAL } from './config'

export interface Titik {
  x: number
  y: number
}

export interface Kotak {
  x: number
  y: number
  w: number
  h: number
}

export interface Tata {
  tegak: boolean
  lebar: number
  tinggi: number
  /** Papan nama tiap pemain (kiri-atas, lebar). Tinggi papan 52, titik tahap di bawahnya. */
  papan: { x: number; y: number; lebar: number }[]
  /** Papan tahap: kepala pemain aktif, nama tahap, dan perintahnya. */
  tahap: Kotak
  /** Tikar tempat bermain. */
  tikar: Kotak
  /** Tempat bola dilempar dan ditangkap (di dekat pemain). */
  tangan: Titik
  /** Penghitung biji selama bola di udara. */
  hitung: Titik
  pesanY: number
  sorakY: number
}

/** Tepi tikar yang tidak dipakai biji. */
const TEPI = 58
/** Bola naik (tampak atas: bergeser ke atas layar) sampai sejauh ini. */
export const ANGKAT_BOLA = 110
export const TINGGI_PAPAN = 52

export function buatTata(tegak: boolean, n: number): Tata {
  if (!tegak) {
    const jeda = 12
    const lebar = Math.min(300, (1020 - jeda * (n - 1)) / n)
    const x0 = 640 - (n * lebar + (n - 1) * jeda) / 2
    return {
      tegak,
      lebar: 1280,
      tinggi: 720,
      papan: Array.from({ length: n }, (_, i) => ({ x: x0 + i * (lebar + jeda), y: 8, lebar })),
      tahap: { x: 190, y: 90, w: 900, h: 84 },
      tikar: { x: 40, y: 186, w: 1200, h: 460 },
      tangan: { x: 640, y: 552 },
      hitung: { x: 850, y: 596 },
      pesanY: 684,
      sorakY: 330,
    }
  }
  // Tegak: tombol jeda & suara GameShell di pojok atas, papan pemain di bawahnya.
  const kolom = n <= 2 ? n : 2
  const baris = Math.ceil(n / kolom)
  const jeda = 12
  const lebar = (688 - jeda * (kolom - 1)) / kolom
  const papanY = 120
  const bawahPapan = papanY + baris * 84 - 10
  const tahap = { x: 20, y: bawahPapan + 8, w: 680, h: 92 }
  const tikarY = tahap.y + tahap.h + 14
  return {
    tegak,
    lebar: 720,
    tinggi: 1280,
    papan: Array.from({ length: n }, (_, i) => ({ x: 16 + (i % kolom) * (lebar + jeda), y: papanY + Math.floor(i / kolom) * 84, lebar })),
    tahap,
    tikar: { x: 20, y: tikarY, w: 680, h: 1176 - tikarY },
    tangan: { x: 360, y: 1062 },
    hitung: { x: 580, y: 1112 },
    pesanY: 1226,
    sorakY: 560,
  }
}

/** Posisi biji (u, v ∈ 0..1) di tikar. */
export function titikBiji(t: Tata, u: number, v: number): Titik {
  const { x, y, w, h } = t.tikar
  return { x: x + TEPI + u * (w - 2 * TEPI), y: y + TEPI + v * (h - 2 * TEPI) }
}

const jarak = (a: Titik, b: Titik) => Math.hypot(a.x - b.x, a.y - b.y)

/** Biji tidak boleh di jalur bola, di cincin tangkap, atau di bawah penghitung. */
export function titikBebas(t: Tata, u: number, v: number): boolean {
  const p = titikBiji(t, u, v)
  const { tangan, hitung } = t
  return (
    jarak(p, tangan) > R_WAKTU_AWAL + 44 &&
    jarak(p, { x: tangan.x, y: tangan.y - ANGKAT_BOLA }) > R_WAKTU_AWAL + 20 &&
    jarak(p, hitung) > 110
  )
}

/** Aturan sebar biji di satu tata letak. */
export function aturanSebar(t: Tata, minJarak: number): AturanSebar {
  return {
    minJarak,
    bebas: (u, v) => titikBebas(t, u, v),
    jarak: (a, b) => jarak(titikBiji(t, a.u, a.v), titikBiji(t, b.u, b.v)),
  }
}
