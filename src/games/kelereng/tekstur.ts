/**
 * Tekstur Kelereng digambar sekali dengan Canvas 2D: latar tanah (satu gambar,
 * jadi murah di HP), kelereng kaca berkilau, dan bayangannya.
 */
import { WARNA, type NamaWarna } from '../../app/tokens'
import { STAGE_H, STAGE_W } from '../../app/stage/stageCoords'
import { BATAS, GARIS_X, LEBAR_ZONA_GARIS, PUSAT_LINGKARAN, R_LINGKARAN, SUDUT_BATAS } from './config'

function kanvas(lebar: number, tinggi: number, resolusi: number) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(lebar * resolusi)
  c.height = Math.ceil(tinggi * resolusi)
  const ctx = c.getContext('2d')!
  ctx.scale(resolusi, resolusi)
  return { c, ctx }
}

/** roundRect sendiri: CanvasRenderingContext2D.roundRect belum ada di WebView Android lama. */
function jalurKotakBulat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Angka acak berbenih supaya tanah selalu terlihat sama. */
function acakBerbenih(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Lapangan: rumput di luar, tanah bertekstur di dalam garis batas, garis sentil, dan lingkaran (mode Tembak). */
export function gambarLatar(jenis: 'lubang' | 'tembak', resolusi: number): HTMLCanvasElement {
  const { c, ctx } = kanvas(STAGE_W, STAGE_H, resolusi)
  ctx.fillStyle = WARNA['daun-pisang']
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)
  ctx.fillStyle = WARNA['daun-pisang-gelap']
  ctx.globalAlpha = 0.18
  for (let x = 0; x < STAGE_W; x += 160) ctx.fillRect(x, 0, 80, STAGE_H)
  ctx.globalAlpha = 1

  const { kiri, atas, kanan, bawah } = BATAS
  jalurKotakBulat(ctx, kiri, atas, kanan - kiri, bawah - atas, SUDUT_BATAS)
  ctx.fillStyle = WARNA.lantai
  ctx.fill()

  // Butiran tanah dan kerikil.
  ctx.save()
  ctx.clip()
  const acak = acakBerbenih(7)
  const bintik: [NamaWarna, number][] = [
    ['kayu-muda', 0.22],
    ['garis-krem', 0.55],
    ['kayu', 0.12],
  ]
  for (let i = 0; i < 520; i++) {
    const [warna, alfa] = bintik[i % bintik.length]!
    ctx.globalAlpha = alfa
    ctx.fillStyle = WARNA[warna]
    ctx.beginPath()
    ctx.arc(kiri + acak() * (kanan - kiri), atas + acak() * (bawah - atas), 1.2 + acak() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  for (let i = 0; i < 14; i++) {
    const x = kiri + 30 + acak() * (kanan - kiri - 60)
    const y = atas + 30 + acak() * (bawah - atas - 60)
    ctx.fillStyle = WARNA['garis-krem']
    ctx.strokeStyle = WARNA['kayu-muda']
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(x, y, 4 + acak() * 4, 3 + acak() * 3, acak() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  // Zona garis sentil: sedikit lebih terang (tap di sini untuk menggeser gacoan).
  ctx.fillStyle = WARNA['kertas-terang']
  ctx.globalAlpha = 0.14
  ctx.fillRect(GARIS_X - LEBAR_ZONA_GARIS, atas, LEBAR_ZONA_GARIS * 2, bawah - atas)
  ctx.globalAlpha = 1
  ctx.restore()

  // Garis kapur.
  ctx.strokeStyle = WARNA['kertas-terang']
  ctx.lineCap = 'round'
  ctx.lineWidth = 6
  jalurKotakBulat(ctx, kiri, atas, kanan - kiri, bawah - atas, SUDUT_BATAS)
  ctx.stroke()
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(GARIS_X, atas + 24)
  ctx.lineTo(GARIS_X, bawah - 24)
  ctx.stroke()
  if (jenis === 'tembak') {
    ctx.beginPath()
    ctx.arc(PUSAT_LINGKARAN.x, PUSAT_LINGKARAN.y, R_LINGKARAN, 0, Math.PI * 2)
    ctx.stroke()
  }
  return c
}

/**
 * Kelereng kaca: gradasi dari cahaya ke warna dasar ke tepi gelap, urat
 * "mata kucing" di dalamnya, dan kilau putih.
 */
export function gambarKelereng(r: number, dasar: NamaWarna, tepi: NamaWarna, urat: NamaWarna, resolusi: number): HTMLCanvasElement {
  const s = r * 2 + 4
  const { c, ctx } = kanvas(s, s, resolusi)
  const p = s / 2
  const g = ctx.createRadialGradient(p - r * 0.35, p - r * 0.4, r * 0.1, p, p, r)
  g.addColorStop(0, WARNA['kertas-terang'])
  g.addColorStop(0.35, WARNA[dasar])
  g.addColorStop(1, WARNA[tepi])
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(p, p, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.clip()
  ctx.globalAlpha = 0.8
  ctx.strokeStyle = WARNA[urat]
  ctx.lineWidth = r * 0.34
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(p - r * 0.75, p + r * 0.25)
  ctx.bezierCurveTo(p - r * 0.2, p - r * 0.65, p + r * 0.25, p + r * 0.7, p + r * 0.8, p - r * 0.15)
  ctx.stroke()
  ctx.restore()

  ctx.globalAlpha = 0.9
  ctx.fillStyle = WARNA['kertas-terang']
  ctx.beginPath()
  ctx.ellipse(p - r * 0.38, p - r * 0.42, r * 0.32, r * 0.18, -0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.arc(p + r * 0.45, p + r * 0.48, r * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = WARNA['tinta-gelap']
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(p, p, r - 0.5, 0, Math.PI * 2)
  ctx.stroke()
  return c
}

/** Bayangan lembut di bawah kelereng. */
export function gambarBayangan(r: number, resolusi: number): HTMLCanvasElement {
  const s = r * 2 + 8
  const { c, ctx } = kanvas(s, s, resolusi)
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, r + 3)
  g.addColorStop(0, WARNA['tinta-gelap'])
  g.addColorStop(1, WARNA.lantai)
  ctx.globalAlpha = 0.35
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, r + 3, 0, Math.PI * 2)
  ctx.fill()
  return c
}

/** Lubang di tanah. */
export function gambarLubang(r: number, resolusi: number): HTMLCanvasElement {
  const s = r * 2 + 8
  const { c, ctx } = kanvas(s, s, resolusi)
  const p = s / 2
  ctx.fillStyle = WARNA['kayu-muda']
  ctx.beginPath()
  ctx.arc(p, p + 1.5, r + 3, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createRadialGradient(p, p - r * 0.25, r * 0.2, p, p, r)
  g.addColorStop(0, WARNA['tinta-gelap'])
  g.addColorStop(1, WARNA['kayu-gelap'])
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(p, p, r, 0, Math.PI * 2)
  ctx.fill()
  return c
}
