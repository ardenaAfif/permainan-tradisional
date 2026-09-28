/**
 * Tekstur Engklek: latar tanah + pola kapur + papan kayu (digambar sekali ke
 * kanvas), gacuk, dan karakter dari character kit.
 */
import { WARNA, type NamaWarna } from '../../app/tokens'
import type { Mata, Mulut, Pose } from '../../characters/kit'
import { gambarKarakter } from '../../shared/phaser/karakter'
import type { Player } from '../../shared/types'
import { LEBAR, PANEL_Y, TINGGI, type TataPola, type Titik } from './tata'

export type Raut = 'satu' | 'dua' | 'kaget' | 'senang' | 'lempar' | 'kepala'
export const SEMUA_RAUT: Raut[] = ['satu', 'dua', 'kaget', 'senang', 'lempar', 'kepala']

const RAUT: Record<Raut, { pose: Pose; eyes?: Mata; mouth?: Mulut; crop?: 'head' }> = {
  satu: { pose: 'engklek' },
  dua: { pose: 'idle', mouth: 'flat' },
  kaget: { pose: 'idle', eyes: 'surprised', mouth: 'talk-o' },
  senang: { pose: 'happy' },
  lempar: { pose: 'talk', mouth: 'flat' },
  kepala: { pose: 'idle', crop: 'head' },
}

/** viewBox karakter: y dari −30, tinggi 412; bayangan (tanah) di y = 374. */
export const ALAS = (374 + 30) / 412
/** Pose engklek terangkat 22 satuan: telapak kaki tumpu di y ≈ 352. */
export const ALAS_SATU = (374 - 22 + 30) / 412

export function gambarPemain(p: Player, raut: Raut, tinggi: number) {
  const r = RAUT[raut]
  const who = p.avatar === 'cpu' ? (p.tokoh ?? 'bima') : 'avatar'
  const av = p.avatar === 'cpu' ? undefined : p.avatar
  return gambarKarakter(
    { who, pose: r.pose, eyes: r.eyes, mouth: r.mouth, crop: r.crop, skin: av?.kulit, hair: av?.rambut, headwear: av?.penutupKepala },
    tinggi,
  )
}

function kanvas(lebar: number, tinggi: number, r: number) {
  const c = document.createElement('canvas')
  c.width = Math.round(lebar * r)
  c.height = Math.round(tinggi * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  return { c, g }
}

/** Acak tetap supaya latar sama setiap kali dipasang. */
function acakTetap(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function garisKapur(g: CanvasRenderingContext2D, titik: Titik[], tutup: boolean) {
  const jalur = () => {
    g.beginPath()
    titik.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)))
    if (tutup) g.closePath()
  }
  g.lineJoin = 'round'
  g.lineCap = 'round'
  // Kapur: garis lebar samar + garis inti, sedikit bergeser.
  g.strokeStyle = WARNA['kertas-terang']
  g.globalAlpha = 0.35
  g.lineWidth = 9
  jalur()
  g.stroke()
  g.globalAlpha = 0.9
  g.lineWidth = 4.5
  g.save()
  g.translate(0.8, -0.6)
  jalur()
  g.stroke()
  g.restore()
  g.globalAlpha = 1
}

/** Tanah halaman sekolah, pola engklek dari kapur, dan papan kayu kontrol. */
export function gambarLatar(tata: TataPola, r: number): HTMLCanvasElement {
  const { c, g } = kanvas(LEBAR, TINGGI, r)
  const acak = acakTetap(17)

  // Tanah: terang di tengah, sedikit gelap di tepi atas.
  const grad = g.createLinearGradient(0, 0, 0, PANEL_Y)
  grad.addColorStop(0, WARNA['kayu-muda'])
  grad.addColorStop(0.22, WARNA.lantai)
  grad.addColorStop(1, WARNA.lantai)
  g.fillStyle = grad
  g.fillRect(0, 0, LEBAR, PANEL_Y)
  // Butir pasir dan kerikil.
  for (let i = 0; i < 420; i++) {
    const x = acak() * LEBAR
    const y = 60 + acak() * (PANEL_Y - 60)
    g.globalAlpha = 0.12 + acak() * 0.18
    g.fillStyle = WARNA[acak() < 0.7 ? 'kayu-muda' : 'kertas-terang']
    g.beginPath()
    g.ellipse(x, y, 1.5 + acak() * 3, 1 + acak() * 1.6, 0, 0, Math.PI * 2)
    g.fill()
  }
  // Rumput di tepi atas dan pojok.
  g.globalAlpha = 1
  const rumput = (x: number, y: number, s: number) => {
    g.fillStyle = WARNA['daun-pisang-gelap']
    for (let i = -3; i <= 3; i++) {
      g.beginPath()
      g.moveTo(x + i * 5 * s, y)
      g.lineTo(x + i * 7 * s + (acak() - 0.5) * 6, y - (12 + acak() * 12) * s)
      g.lineTo(x + i * 5 * s + 4 * s, y)
      g.fill()
    }
  }
  for (let x = 20; x < LEBAR; x += 70 + acak() * 60) rumput(x, 150 + acak() * 20, 0.9)
  for (const [x, y] of [
    [1210, 470],
    [60, 470],
    [1180, 250],
  ] as const)
    rumput(x, y, 1.1)

  // Pola engklek dari kapur.
  for (const k of tata.semuaKotak) garisKapur(g, tata.sudutKotak(k), true)
  if (tata.pola.putar) garisKapur(g, tata.busurPutar(), false)

  // Papan kayu kontrol.
  g.fillStyle = WARNA.kayu
  g.fillRect(0, PANEL_Y, LEBAR, TINGGI - PANEL_Y)
  g.fillStyle = WARNA['kayu-gelap']
  g.fillRect(0, PANEL_Y, LEBAR, 5)
  g.globalAlpha = 0.25
  for (let y = PANEL_Y + 40; y < TINGGI; y += 46) g.fillRect(0, y, LEBAR, 2)
  g.globalAlpha = 1
  return c
}

/** Gacuk: batu pipih warna pemain (bentuk dari design/objects.js). */
export function gambarGacuk(dasar: NamaWarna, tepi: NamaWarna, r: number): HTMLCanvasElement {
  const { c, g } = kanvas(48, 34, r)
  g.fillStyle = WARNA[tepi]
  g.beginPath()
  g.ellipse(24, 19, 21, 13, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = WARNA[dasar]
  g.beginPath()
  g.ellipse(24, 15, 21, 12, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = WARNA['kertas-terang']
  g.globalAlpha = 0.45
  g.beginPath()
  g.ellipse(17, 11, 6, 3, -0.3, 0, Math.PI * 2)
  g.fill()
  return c
}
