/**
 * Tekstur Egrang: siswa berpose egrang dari character kit (design/), dan latar
 * lapangan sekolah + empat lintasan berpagar yang digambar sekali ke kanvas.
 */
import { WARNA, type NamaWarna } from '../../app/tokens'
import type { Mata, Mulut, Pose } from '../../characters/kit'
import { gambarKarakter } from '../../shared/phaser/karakter'
import type { Player } from '../../shared/types'
import { JARAK_LOMBA, type Rintangan } from './config'
import { FINIS_X, LEBAR, PANEL_Y, PX_PER_M, START_X, TINGGI, lajur, xMeter } from './tata'

export type Raut = 'jalan' | 'kaget' | 'senang' | 'kepala'
export const SEMUA_RAUT: Raut[] = ['jalan', 'kaget', 'senang', 'kepala']

const RAUT: Record<Raut, { pose: Pose; eyes?: Mata; mouth?: Mulut; crop?: 'head' }> = {
  jalan: { pose: 'egrang', mouth: 'flat' },
  kaget: { pose: 'egrang', eyes: 'surprised', mouth: 'talk-o' },
  senang: { pose: 'egrang', eyes: 'happy', mouth: 'talk-a' },
  kepala: { pose: 'idle', crop: 'head' },
}

export function gambarPemain(p: Player, raut: Raut, tinggi: number) {
  const r = RAUT[raut]
  const who = p.avatar === 'cpu' ? (p.tokoh ?? 'bima') : 'avatar'
  const av = p.avatar === 'cpu' ? undefined : p.avatar
  return gambarKarakter(
    { who, pose: r.pose, eyes: r.eyes, mouth: r.mouth, crop: r.crop, skin: av?.kulit, hair: av?.rambut, headwear: av?.penutupKepala },
    tinggi,
  )
}

/** Spanduk FINIS: sekian px di atas pita lintasan terjauh (di bawah tombol suara GameShell). */
export const SPANDUK_ATAS = 106

/** Acak tetap supaya latar sama setiap kali dipasang. */
function acakTetap(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const c = (n: NamaWarna) => WARNA[n]

function awan(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.fillStyle = c('kertas-terang')
  g.globalAlpha = 0.85
  g.beginPath()
  g.ellipse(x, y, 56 * s, 17 * s, 0, 0, Math.PI * 2)
  g.ellipse(x + 28 * s, y - 13 * s, 34 * s, 17 * s, 0, 0, Math.PI * 2)
  g.ellipse(x - 22 * s, y - 6 * s, 24 * s, 13 * s, 0, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 1
}

/** Gedung sekolah sederhana di kejauhan. */
function gedung(g: CanvasRenderingContext2D, x: number, lebar: number, bawah: number) {
  const tinggi = 70
  g.fillStyle = c('kertas-krem-gelap')
  g.fillRect(x, bawah - tinggi, lebar, tinggi)
  g.fillStyle = c('merah-bata')
  g.beginPath()
  g.moveTo(x - 14, bawah - tinggi + 2)
  g.lineTo(x + lebar / 2, bawah - tinggi - 30)
  g.lineTo(x + lebar + 14, bawah - tinggi + 2)
  g.closePath()
  g.fill()
  g.fillStyle = c('biru-nila')
  g.globalAlpha = 0.75
  for (let wx = x + 16; wx + 22 < x + lebar - 8; wx += 38) g.fillRect(wx, bawah - tinggi + 16, 22, 22)
  g.globalAlpha = 1
}

/** Pagar bambu di tepi atas lintasan. */
function pagar(g: CanvasRenderingContext2D, y: number, s: number) {
  const tinggi = 24 * s
  g.fillStyle = c('kayu-muda')
  g.fillRect(0, y - tinggi * 0.72, LEBAR, 4 * s)
  g.fillRect(0, y - tinggi * 0.3, LEBAR, 4 * s)
  for (let x = 6; x < LEBAR; x += 34) {
    g.fillStyle = c('kunyit-gelap')
    g.fillRect(x, y - tinggi, 6 * s, tinggi)
    g.fillStyle = c('kunyit')
    g.fillRect(x, y - tinggi, 2.5 * s, tinggi)
  }
}

function gelombang(g: CanvasRenderingContext2D, dari: number, sampai: number, tanah: number, s: number) {
  const x0 = xMeter(dari)
  const x1 = xMeter(sampai)
  const lebarBukit = 0.7 * PX_PER_M
  g.fillStyle = c('kayu-muda')
  g.strokeStyle = c('kayu')
  g.lineWidth = 2
  for (let x = x0; x + lebarBukit <= x1 + 1; x += lebarBukit) {
    g.beginPath()
    g.ellipse(x + lebarBukit / 2, tanah + 2 * s, lebarBukit / 2, 9 * s, 0, Math.PI, 0)
    g.closePath()
    g.fill()
    g.stroke()
  }
}

function genangan(g: CanvasRenderingContext2D, dari: number, sampai: number, tanah: number, s: number) {
  const x0 = xMeter(dari)
  const x1 = xMeter(sampai)
  const cx = (x0 + x1) / 2
  const cy = tanah - 6 * s
  g.fillStyle = c('biru-nila')
  g.globalAlpha = 0.35
  g.beginPath()
  g.ellipse(cx, cy + 2, (x1 - x0) / 2 + 4, 14 * s, 0, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 1
  g.fillStyle = c('langit-jendela')
  g.beginPath()
  g.ellipse(cx, cy, (x1 - x0) / 2, 12 * s, 0, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = c('kertas-terang')
  g.lineWidth = 3
  g.globalAlpha = 0.8
  g.beginPath()
  g.moveTo(cx - (x1 - x0) * 0.28, cy - 4 * s)
  g.lineTo(cx - (x1 - x0) * 0.08, cy - 4 * s)
  g.moveTo(cx + (x1 - x0) * 0.05, cy + 3 * s)
  g.lineTo(cx + (x1 - x0) * 0.2, cy + 3 * s)
  g.stroke()
  g.globalAlpha = 1
}

/**
 * Latar: langit, gedung sekolah, pepohonan, lapangan rumput, lintasan
 * (jauh → dekat) dengan pagar, rintangan, garis start/finis, dan papan kayu.
 */
export function gambarLatar(r: number, nLajur: number, rintangan: readonly Rintangan[], pos: readonly number[]) {
  const kanvas = document.createElement('canvas')
  kanvas.width = Math.round(LEBAR * r)
  kanvas.height = Math.round(TINGGI * r)
  const g = kanvas.getContext('2d')!
  g.scale(r, r)
  const acak = acakTetap(7)
  const tepiRumput = lajur(nLajur - 1).pita[0] - 46

  g.fillStyle = c('langit-jendela')
  g.fillRect(0, 0, LEBAR, tepiRumput)
  awan(g, 230, 70, 1)
  awan(g, 640, 46, 1.2)
  awan(g, 1010, 84, 0.9)
  gedung(g, 820, 300, tepiRumput)
  gedung(g, 300, 210, tepiRumput)
  // Pepohonan di tepi lapangan.
  for (let x = 10; x < LEBAR; x += 70 + acak() * 40) {
    if (x > 290 && x < 520) continue
    const t = 28 + acak() * 14
    g.fillStyle = c('kayu')
    g.fillRect(x - 3, tepiRumput - 20, 6, 22)
    g.fillStyle = c('daun-pisang-gelap')
    g.beginPath()
    g.arc(x, tepiRumput - 24 - t * 0.4, t * 0.8, 0, Math.PI * 2)
    g.arc(x - t * 0.6, tepiRumput - 18, t * 0.55, 0, Math.PI * 2)
    g.arc(x + t * 0.6, tepiRumput - 18, t * 0.55, 0, Math.PI * 2)
    g.fill()
  }
  // Rumput dengan belang potongan.
  g.fillStyle = c('daun-pisang')
  g.fillRect(0, tepiRumput, LEBAR, PANEL_Y - tepiRumput)
  g.fillStyle = c('daun-pisang-gelap')
  g.globalAlpha = 0.16
  for (let x = 0; x < LEBAR; x += 160) g.fillRect(x, tepiRumput, 80, PANEL_Y - tepiRumput)
  g.globalAlpha = 1

  for (let i = nLajur - 1; i >= 0; i--) {
    const { tanah, skala: s, pita } = lajur(i)
    const [atas, bawah] = pita
    pagar(g, atas + 2, s)
    g.fillStyle = c('lantai')
    g.fillRect(0, atas, LEBAR, bawah - atas)
    g.fillStyle = c('kayu-muda')
    g.globalAlpha = 0.35
    g.fillRect(0, bawah - 4, LEBAR, 4)
    g.globalAlpha = 1
    // Kapur tiap 5 meter.
    g.fillStyle = c('kertas-terang')
    g.globalAlpha = 0.55
    for (let m = 5; m < JARAK_LOMBA; m += 5) g.fillRect(xMeter(m) - 1.5, bawah - 9, 3, 7)
    g.globalAlpha = 1
    for (const rt of rintangan) (rt.jenis === 'gelombang' ? gelombang : genangan)(g, rt.dari, rt.sampai, tanah, s)
    // Pos (tingkat Mudah): bendera hijau kecil.
    for (const p of pos) {
      const x = xMeter(p)
      g.fillStyle = c('kayu')
      g.fillRect(x - 2, atas - 30 * s, 4, 30 * s + (bawah - atas) - 4)
      g.fillStyle = c('daun-pisang-gelap')
      g.beginPath()
      g.moveTo(x + 2, atas - 30 * s)
      g.lineTo(x + 26 * s, atas - 22 * s)
      g.lineTo(x + 2, atas - 14 * s)
      g.fill()
    }
    // Garis start (kapur) dan finis (kotak-kotak).
    g.fillStyle = c('kertas-terang')
    g.fillRect(START_X - 3, atas, 6, bawah - atas)
    for (let y = atas, k = 0; y < bawah; y += 7, k++) {
      g.fillStyle = c(k % 2 ? 'tinta-gelap' : 'kertas-terang')
      g.fillRect(FINIS_X - 6, y, 6, 7)
      g.fillStyle = c(k % 2 ? 'kertas-terang' : 'tinta-gelap')
      g.fillRect(FINIS_X, y, 6, 7)
    }
  }

  // Gapura finis: dua tiang di belakang lintasan terjauh dan di depan lintasan terdekat.
  const atasJauh = lajur(nLajur - 1).pita[0]
  g.fillStyle = c('kayu')
  g.fillRect(FINIS_X - 4, atasJauh - 100, 8, 100)
  g.fillStyle = c('merah-bata')
  g.fillRect(FINIS_X - 70, atasJauh - SPANDUK_ATAS, 140, 40)
  g.fillStyle = c('merah-bata-gelap')
  g.fillRect(FINIS_X - 70, atasJauh - SPANDUK_ATAS + 36, 140, 4)

  // Papan kontrol kayu.
  g.fillStyle = c('kayu')
  g.fillRect(0, PANEL_Y, LEBAR, TINGGI - PANEL_Y)
  g.fillStyle = c('kayu-gelap')
  g.fillRect(0, PANEL_Y, LEBAR, 5)
  g.globalAlpha = 0.25
  for (let y = PANEL_Y + 34; y < TINGGI; y += 46) g.fillRect(0, y, LEBAR, 2)
  g.globalAlpha = 1
  return kanvas
}
