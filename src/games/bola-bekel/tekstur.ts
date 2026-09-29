/**
 * Tekstur Bola Bekel digambar sekali dengan Canvas 2D: lantai ubin + tikar
 * (satu gambar per orientasi, jadi murah di HP), bola, bayangan, biji bekel
 * per sisi, dan kepala pemain dari character kit.
 */
import { WARNA } from '../../app/tokens'
import type { Mata, Mulut } from '../../characters/kit'
import { gambarKarakter } from '../../shared/phaser/karakter'
import type { Player } from '../../shared/types'
import { R_BOLA } from './config'
import type { Tata } from './tata'

export type Raut = 'biasa' | 'senang' | 'kaget'
export const SEMUA_RAUT: Raut[] = ['biasa', 'senang', 'kaget']
const RAUT: Record<Raut, { eyes: Mata; mouth: Mulut }> = {
  biasa: { eyes: 'open', mouth: 'smile' },
  senang: { eyes: 'happy', mouth: 'smile' },
  kaget: { eyes: 'surprised', mouth: 'talk-o' },
}

/** Tekstur bola digambar lebih besar supaya tetap tajam saat bola "mendekat" (diperbesar). */
export const R_TEKSTUR_BOLA = R_BOLA * 2.2
/** Biji: lebar/tinggi tekstur (px panggung); tampil di tikar pada skala 1. */
export const UKURAN_BIJI = 72
/** Biji juga tampil besar di papan tahap, jadi teksturnya digambar lebih rapat dari resolusi panggung. */
export const RAPAT_BIJI = 1.5

function kanvas(lebar: number, tinggi: number, r: number) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(lebar * r)
  c.height = Math.ceil(tinggi * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  return { c, g }
}

/** roundRect sendiri: CanvasRenderingContext2D.roundRect belum ada di WebView Android lama. */
function jalurKotakBulat(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

/** Lantai ubin teras sekolah dan tikar pandan tempat bermain. */
export function gambarLatar(t: Tata, r: number): HTMLCanvasElement {
  const { c, g } = kanvas(t.lebar, t.tinggi, r)
  // Ubin.
  const UBIN = 96
  g.fillStyle = WARNA['kertas-krem-gelap']
  g.fillRect(0, 0, t.lebar, t.tinggi)
  g.fillStyle = WARNA['kertas-krem']
  for (let y = 0; y < t.tinggi; y += UBIN)
    for (let x = 0; x < t.lebar; x += UBIN) if (((x + y) / UBIN) % 2 === 0) g.fillRect(x, y, UBIN, UBIN)
  g.fillStyle = WARNA['garis-krem']
  for (let x = 0; x < t.lebar; x += UBIN) g.fillRect(x - 1.5, 0, 3, t.tinggi)
  for (let y = 0; y < t.tinggi; y += UBIN) g.fillRect(0, y - 1.5, t.lebar, 3)

  // Tikar: bayangan, pinggiran merah bata, anyaman di dalam.
  const { x, y, w, h } = t.tikar
  g.globalAlpha = 0.25
  g.fillStyle = WARNA['kayu-gelap']
  jalurKotakBulat(g, x + 4, y + 8, w, h, 22)
  g.fill()
  g.globalAlpha = 1
  g.fillStyle = WARNA['merah-bata']
  jalurKotakBulat(g, x, y, w, h, 22)
  g.fill()
  const TEPI = 14
  g.save()
  jalurKotakBulat(g, x + TEPI, y + TEPI, w - TEPI * 2, h - TEPI * 2, 12)
  g.clip()
  g.fillStyle = WARNA['garis-krem']
  g.fillRect(x, y, w, h)
  // Anyaman: petak berselang serat mendatar dan tegak.
  const P = 28
  g.strokeStyle = WARNA['kayu-muda']
  g.lineWidth = 1.5
  g.globalAlpha = 0.28
  for (let py = y; py < y + h; py += P) {
    for (let px = x; px < x + w; px += P) {
      const datar = ((px - x) / P + (py - y) / P) % 2 === 0
      g.beginPath()
      for (let k = 5; k < P; k += 7) {
        if (datar) {
          g.moveTo(px + 2, py + k)
          g.lineTo(px + P - 2, py + k)
        } else {
          g.moveTo(px + k, py + 2)
          g.lineTo(px + k, py + P - 2)
        }
      }
      g.stroke()
    }
  }
  // Pita warna di anyaman, seperti tikar pandan.
  g.globalAlpha = 0.22
  g.fillStyle = WARNA.kunyit
  for (let py = y + 70; py < y + h; py += 180) g.fillRect(x, py, w, 18)
  g.restore()
  g.globalAlpha = 1
  g.strokeStyle = WARNA['kertas-krem']
  g.lineWidth = 3
  g.setLineDash([10, 8])
  jalurKotakBulat(g, x + TEPI / 2, y + TEPI / 2, w - TEPI, h - TEPI, 17)
  g.stroke()
  g.setLineDash([])
  return c
}

/** Bola bekel merah bata dengan garis kunyit (bentuk dari design/objects.js). */
export function gambarBola(r: number): HTMLCanvasElement {
  const R = R_TEKSTUR_BOLA
  const { c, g } = kanvas(R * 2 + 4, R * 2 + 4, r)
  const cx = R + 2
  g.fillStyle = WARNA['merah-bata']
  g.beginPath()
  g.arc(cx, cx, R, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = WARNA['merah-bata-gelap']
  g.globalAlpha = 0.45
  g.beginPath()
  g.arc(cx + R * 0.12, cx + R * 0.14, R * 0.86, 0, Math.PI * 2)
  g.arc(cx, cx, R, 0, Math.PI * 2, true)
  g.fill()
  g.globalAlpha = 1
  g.strokeStyle = WARNA.kunyit
  g.lineWidth = R * 0.2
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(cx - R * 0.88, cx - R * 0.2)
  g.quadraticCurveTo(cx, cx + R * 0.45, cx + R * 0.88, cx - R * 0.2)
  g.stroke()
  g.fillStyle = WARNA['kertas-terang']
  g.globalAlpha = 0.4
  g.beginPath()
  g.ellipse(cx - R * 0.32, cx - R * 0.45, R * 0.24, R * 0.16, -0.5, 0, Math.PI * 2)
  g.fill()
  return c
}

export function gambarBayang(r: number): HTMLCanvasElement {
  const R = R_TEKSTUR_BOLA
  const { c, g } = kanvas(R * 2 + 4, R + 4, r)
  g.fillStyle = WARNA['kayu-gelap']
  g.beginPath()
  g.ellipse(R + 2, R / 2 + 2, R, R / 2, 0, 0, Math.PI * 2)
  g.fill()
  return c
}

/** Tanda sisi biji (0 titik, 1 lengkung, 2 silang, 3 dua garis) di tengah (cx, cy). */
function tandaSisi(g: CanvasRenderingContext2D, sisi: number, cx: number, cy: number, s: number) {
  g.fillStyle = WARNA['kayu-gelap']
  g.strokeStyle = WARNA['kayu-gelap']
  g.lineCap = 'round'
  g.lineWidth = 4.5 * s
  g.beginPath()
  switch (sisi) {
    case 0:
      g.arc(cx, cy, 8.5 * s, 0, Math.PI * 2)
      g.fill()
      break
    case 1:
      g.moveTo(cx - 11 * s, cy - 4 * s)
      g.quadraticCurveTo(cx, cy + 12 * s, cx + 11 * s, cy - 4 * s)
      g.stroke()
      break
    case 2:
      g.moveTo(cx - 8 * s, cy - 8 * s)
      g.lineTo(cx + 8 * s, cy + 8 * s)
      g.moveTo(cx + 8 * s, cy - 8 * s)
      g.lineTo(cx - 8 * s, cy + 8 * s)
      g.stroke()
      break
    default:
      g.moveTo(cx - 9 * s, cy - 5 * s)
      g.lineTo(cx + 9 * s, cy - 5 * s)
      g.moveTo(cx - 9 * s, cy + 5 * s)
      g.lineTo(cx + 9 * s, cy + 5 * s)
      g.stroke()
  }
}

/** Biji bekel kuningan tampak atas: belah ketupat (seperti design/objects.js) dengan tanda sisinya. */
export function gambarBiji(sisi: number, r: number): HTMLCanvasElement {
  const U = UKURAN_BIJI
  const { c, g } = kanvas(U, U, r)
  const m = U / 2
  const ketupat = (dy: number, masuk: number) => {
    const a = m - 5 - masuk
    const b = a * 0.8
    g.beginPath()
    g.moveTo(m, m + dy - b)
    g.lineTo(m + a, m + dy)
    g.lineTo(m, m + dy + b)
    g.lineTo(m - a, m + dy)
    g.closePath()
  }
  g.lineJoin = 'round'
  // Bayangan, sisi tebal, lalu muka atas.
  g.globalAlpha = 0.28
  g.fillStyle = WARNA['kayu-gelap']
  ketupat(5, 0)
  g.fill()
  g.globalAlpha = 1
  g.fillStyle = WARNA['kunyit-gelap']
  ketupat(2, 0)
  g.fill()
  g.fillStyle = WARNA.kunyit
  g.strokeStyle = WARNA['kayu-gelap']
  g.lineWidth = 3
  ketupat(-1, 0)
  g.fill()
  g.stroke()
  // Muka tengah lebih terang supaya tanda sisi mudah dibaca.
  g.fillStyle = WARNA['cahaya-kelir']
  ketupat(-1, 10)
  g.fill()
  tandaSisi(g, sisi, m, m - 1, 1.05)
  return c
}

export function gambarKepala(p: Player, raut: Raut, tinggi: number) {
  const who = p.avatar === 'cpu' ? (p.tokoh ?? 'bima') : 'avatar'
  const av = p.avatar === 'cpu' ? undefined : p.avatar
  const { eyes, mouth } = RAUT[raut]
  return gambarKarakter(
    { who, pose: 'idle', crop: 'head', eyes, mouth, skin: av?.kulit, hair: av?.rambut, headwear: av?.penutupKepala },
    tinggi,
  )
}
