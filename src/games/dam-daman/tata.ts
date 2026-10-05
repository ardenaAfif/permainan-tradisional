/**
 * Tata letak Dam-daman di panggung (px panggung): mendatar 1280x720 atau
 * tegak 720x1280. Papan diskalakan agar pas di areanya; kartu pemain atas/bawah
 * mengikuti sisi bidaknya.
 */
import { STAGE_H, STAGE_W } from '../../app/stage/stageCoords'
import type { Papan } from './aturan'

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
  /** Jarak satu satuan grid (px panggung). */
  satuan: number
  /** Posisi setiap titik papan. */
  titik: { x: number; y: number }[]
  /** Bingkai kayu papan. */
  bingkai: Kotak
  /** Kartu pemain di sisi atas (pemain 1) dan bawah (pemain 0). */
  kartu: [Kotak, Kotak]
  /** Panel giliran, pesan, dan tombol. */
  panel: Kotak
}

/** Tepi bingkai di luar titik terluar, dalam satuan grid. */
const TEPI = 0.62

export function buatTata(papan: Papan, tegak: boolean): Tata {
  const lebar = tegak ? STAGE_H : STAGE_W
  const tinggi = tegak ? STAGE_W : STAGE_H
  const area: Kotak = tegak ? { x: 16, y: 154, w: 688, h: 680 } : { x: 300, y: 14, w: 680, h: 692 }
  const xs = papan.titik.map((t) => t[0])
  const ys = papan.titik.map((t) => t[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const rentangX = Math.max(...xs) - minX
  const rentangY = Math.max(...ys) - minY
  const satuan = Math.min(area.w / (rentangX + 2 * TEPI), area.h / (rentangY + 2 * TEPI))
  const ox = area.x + (area.w - rentangX * satuan) / 2
  const oy = area.y + (area.h - rentangY * satuan) / 2
  const titik = papan.titik.map(([x, y]) => ({ x: ox + (x - minX) * satuan, y: oy + (y - minY) * satuan }))
  const bingkai: Kotak = {
    x: ox - TEPI * satuan,
    y: oy - TEPI * satuan,
    w: (rentangX + 2 * TEPI) * satuan,
    h: (rentangY + 2 * TEPI) * satuan,
  }
  // Pojok kiri/kanan atas (±120px) dibiarkan kosong untuk tombol jeda & suara.
  const kartu: [Kotak, Kotak] = tegak
    ? [
        { x: 20, y: 848, w: 680, h: 124 },
        { x: 128, y: 16, w: 464, h: 124 },
      ]
    : [
        { x: 22, y: 462, w: 262, h: 240 },
        { x: 22, y: 128, w: 262, h: 240 },
      ]
  const panel: Kotak = tegak ? { x: 20, y: 988, w: 680, h: 276 } : { x: 996, y: 124, w: 262, h: 578 }
  return { tegak, lebar, tinggi, satuan, titik, bingkai, kartu, panel }
}

/** Titik terdekat dari (x, y) dalam radius setengah satuan lebih sedikit, atau -1. */
export function titikTerdekat(tata: Tata, x: number, y: number): number {
  let terbaik = -1
  let jarak = (tata.satuan * 0.58) ** 2
  tata.titik.forEach((t, i) => {
    const d = (t.x - x) ** 2 + (t.y - y) ** 2
    if (d < jarak) {
      jarak = d
      terbaik = i
    }
  })
  return terbaik
}

/** Titik tetangga terdekat ke arah (dx, dy) untuk navigasi keyboard, atau `dari` jika tidak ada. */
export function titikKeArah(tata: Tata, dari: number, dx: number, dy: number): number {
  const a = tata.titik[dari]!
  let terbaik = dari
  let skor = Infinity
  tata.titik.forEach((t, i) => {
    const vx = t.x - a.x
    const vy = t.y - a.y
    const maju = vx * dx + vy * dy
    if (i === dari || maju <= 0) return
    const samping = Math.abs(vx * dy - vy * dx)
    // Utamakan yang lurus searah; titik menyamping dihukum.
    const s = maju + samping * 2.5
    if (s < skor) {
      skor = s
      terbaik = i
    }
  })
  return terbaik
}
