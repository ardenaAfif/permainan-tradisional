/**
 * Tekstur Pecah Balon Air: siswa dari character kit (design/) dalam pose
 * membawa balon, siluet untuk bayangan pelari komputer, dan lapangan rumput
 * tampak atas-miring (pagar bambu, genangan, parit + papan titian) yang
 * digambar sekali ke kanvas. Batu, keranjang, dan balon digambar terpisah
 * supaya bisa menutupi / tertutup karakter sesuai kedalaman.
 */
import { WARNA, type NamaWarna } from '../../app/tokens'
import type { Mata, Mulut, Pose, Tokoh } from '../../characters/kit'
import { gambarKarakter } from '../../shared/phaser/karakter'
import type { AvatarConfig, Player } from '../../shared/types'
import { ANGGOTA_TIM, R_SAMPAI } from './config'
import { LINTASAN, PANJANG, TINGGI_LINTASAN, type Lintasan } from './lintasan'

/** Satu anggota tim. */
export interface Anggota {
  who: Tokoh
  avatar?: Omit<AvatarConfig, 'nama'>
}

export type Raut = 'diam' | 'angkat' | 'apit' | 'kaget' | 'senang' | 'kepala' | 'bayang-diam' | 'bayang-angkat' | 'bayang-apit'

interface DefRaut {
  pose: Pose
  eyes?: Mata
  mouth?: Mulut
  crop?: 'head'
  siluet?: boolean
}

const RAUT: Record<Raut, DefRaut> = {
  diam: { pose: 'idle', mouth: 'smile' },
  // Pose "happy" dengan wajah serius: kedua tangan menjunjung balon.
  angkat: { pose: 'happy', eyes: 'open', mouth: 'flat' },
  apit: { pose: 'gobak', mouth: 'smile' },
  kaget: { pose: 'idle', eyes: 'surprised', mouth: 'talk-o' },
  senang: { pose: 'happy' },
  kepala: { pose: 'idle', crop: 'head' },
  'bayang-diam': { pose: 'idle', siluet: true },
  'bayang-angkat': { pose: 'happy', siluet: true },
  'bayang-apit': { pose: 'gobak', siluet: true },
}

/** viewBox karakter: y dari −30, tinggi 412; telapak (tanah) di y ≈ 374. */
const ALAS_BIASA = (374 + 30) / 412
/** Pose "happy" mengangkat badan 28 satuan (melompat); "angkat" berdiri di tanah. */
const ALAS_ANGKAT = (374 - 28 + 30) / 412

export function alas(raut: Raut) {
  return raut === 'angkat' || raut === 'bayang-angkat' ? ALAS_ANGKAT : ALAS_BIASA
}

/** Teman satu tim (kit "avatar" dengan variasi dari design/, tanpa nama). */
const TEMAN: Omit<AvatarConfig, 'nama'>[] = [
  { kulit: 4, rambut: 'keriting', penutupKepala: 'none' },
  { kulit: 2, rambut: 'kuncir', penutupKepala: 'none' },
  { kulit: 1, rambut: 'pendek', penutupKepala: 'kerudung' },
  { kulit: 3, rambut: 'belah', penutupKepala: 'peci' },
  { kulit: 0, rambut: 'jabrik', penutupKepala: 'none' },
  { kulit: 3, rambut: 'kuncir', penutupKepala: 'kerudung' },
]

const anggotaDari = (p: Player): Anggota => (p.avatar === 'cpu' ? { who: p.tokoh ?? 'bima' } : { who: 'avatar', avatar: p.avatar })

/**
 * Dua tim berisi ANGGOTA_TIM siswa; ketua tim (pemain atau tokoh komputer)
 * di indeks 0 dan berlari di putaran pertama. Tim pemain utama bersama Sekar
 * & Dimas, tim lawan bersama Bima (jika belum dipakai); sisanya teman dari
 * kit avatar, tanpa kembar.
 */
export function susunTim(a: Player, b: Player): [Anggota[], Anggota[]] {
  const tim: [Anggota[], Anggota[]] = [[anggotaDari(a)], [anggotaDari(b)]]
  const dipakai = new Set<Tokoh>(tim.flat().map((x) => x.who))
  const tokoh: [Tokoh[], Tokoh[]] = [['sekar', 'dimas'], ['bima']]
  tim.forEach((t, i) => {
    for (const who of tokoh[i]!) {
      if (dipakai.has(who)) continue
      dipakai.add(who)
      t.push({ who })
    }
  })
  let k = 0
  for (const t of tim) while (t.length < ANGGOTA_TIM) t.push({ who: 'avatar', avatar: TEMAN[k++ % TEMAN.length]! })
  return tim
}

export function gambarAnggota(a: Anggota, raut: Raut, tinggi: number) {
  const r = RAUT[raut]
  return gambarKarakter(
    {
      who: a.who,
      pose: r.pose,
      eyes: r.eyes,
      mouth: r.mouth,
      crop: r.crop,
      silhouette: r.siluet,
      skin: a.avatar?.kulit,
      hair: a.avatar?.rambut,
      headwear: a.avatar?.penutupKepala,
    },
    tinggi,
  )
}

// ── Lapangan ──────────────────────────────────────────────

const c = (n: NamaWarna) => WARNA[n]

/** Acak tetap supaya latar sama setiap kali dipasang (dan sama di setiap potongan). */
function acakTetap(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Lebar satu potongan latar (px dunia): kanvas besar dipotong supaya muat di batas tekstur GPU HP. */
export const LEBAR_POTONGAN = 800

/** Tepi atas pagar bambu dan tali batas bawah lapangan. */
const PAGAR_BAWAH = 92
const TALI_Y = 356

function rumput(g: CanvasRenderingContext2D) {
  g.fillStyle = c('daun-pisang')
  g.fillRect(0, 0, PANJANG, TINGGI_LINTASAN)
  // Bekas potongan mesin rumput: pita tegak berselang-seling.
  g.fillStyle = c('daun-pisang-gelap')
  g.globalAlpha = 0.13
  for (let x = 0; x < PANJANG; x += 180) g.fillRect(x, 0, 90, TINGGI_LINTASAN)
  const acak = acakTetap(7)
  g.globalAlpha = 0.45
  for (let i = 0; i < 900; i++) {
    const x = acak() * PANJANG
    const y = 60 + acak() * (TINGGI_LINTASAN - 60)
    g.fillRect(x, y, 2, 5 + acak() * 3)
  }
  // Bunga liar kecil.
  g.globalAlpha = 0.85
  for (let i = 0; i < 70; i++) {
    const x = acak() * PANJANG
    const y = 100 + acak() * 250
    g.fillStyle = c(acak() < 0.5 ? 'kertas-terang' : 'cahaya-kelir')
    g.beginPath()
    g.arc(x, y, 2.2, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1
}

/** Semak dan pagar bambu di sisi jauh lapangan. */
function pagar(g: CanvasRenderingContext2D) {
  g.fillStyle = c('daun-pisang-tua')
  g.fillRect(0, 0, PANJANG, 56)
  const acak = acakTetap(23)
  for (let x = -20; x < PANJANG + 40; x += 34 + acak() * 20) {
    g.fillStyle = c(acak() < 0.5 ? 'daun-pisang-gelap' : 'daun-pisang-tua')
    g.beginPath()
    g.arc(x, 50 + acak() * 10, 26 + acak() * 14, 0, Math.PI * 2)
    g.fill()
  }
  // Rel bambu mendatar + tiang.
  for (const y of [48, 72]) {
    g.fillStyle = c('kunyit-gelap')
    g.fillRect(0, y + 3, PANJANG, 6)
    g.fillStyle = c('kunyit')
    g.fillRect(0, y, PANJANG, 6)
  }
  for (let x = 30; x < PANJANG; x += 76) {
    g.fillStyle = c('kunyit-gelap')
    g.fillRect(x - 5, 30, 10, PAGAR_BAWAH - 30)
    g.fillStyle = c('kunyit')
    g.fillRect(x - 5, 30, 6, PAGAR_BAWAH - 30)
    g.fillStyle = c('kayu')
    g.fillRect(x - 5, 52, 10, 3)
    g.fillRect(x - 5, 76, 10, 3)
  }
  // Bayangan pagar di rumput.
  g.fillStyle = c('tinta-gelap')
  g.globalAlpha = 0.12
  g.fillRect(0, PAGAR_BAWAH, PANJANG, 6)
  g.globalAlpha = 1
}

/** Tali rafia di patok kayu: batas dekat lapangan. */
function tali(g: CanvasRenderingContext2D) {
  const jarak = 140
  g.strokeStyle = c('kertas-terang')
  g.lineWidth = 3
  g.beginPath()
  for (let x = 0; x < PANJANG; x += jarak) {
    g.moveTo(x, TALI_Y)
    g.quadraticCurveTo(x + jarak / 2, TALI_Y + 9, x + jarak, TALI_Y)
  }
  g.stroke()
  for (let x = 0; x <= PANJANG; x += jarak) {
    g.fillStyle = c('tinta-gelap')
    g.globalAlpha = 0.2
    g.beginPath()
    g.ellipse(x + 3, TALI_Y + 18, 8, 3, 0, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
    g.fillStyle = c('kayu')
    g.fillRect(x - 4, TALI_Y - 10, 8, 28)
    g.fillStyle = c('kayu-muda')
    g.fillRect(x - 4, TALI_Y - 10, 4, 28)
  }
}

function kapur(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, tebal: number) {
  g.strokeStyle = c('kertas-terang')
  g.globalAlpha = 0.85
  g.lineWidth = tebal
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(x0, y0)
  g.lineTo(x1, y1)
  g.stroke()
  g.globalAlpha = 1
}

function genangan(g: CanvasRenderingContext2D, l: Lintasan) {
  const acak = acakTetap(41)
  for (const k of l.genangan) {
    // Tanah becek di tepi.
    g.fillStyle = c('kayu-muda')
    g.globalAlpha = 0.55
    g.beginPath()
    g.ellipse(k.x, k.y, k.rx + 12, k.ry + 9, 0, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
    g.fillStyle = c('air-gelap')
    g.beginPath()
    g.ellipse(k.x, k.y + 2, k.rx, k.ry, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = c('air')
    g.beginPath()
    g.ellipse(k.x, k.y, k.rx - 4, k.ry - 4, 0, 0, Math.PI * 2)
    g.fill()
    // Pantulan langit.
    g.strokeStyle = c('air-muda')
    g.lineWidth = 3
    g.lineCap = 'round'
    for (let i = 0; i < 4; i++) {
      const x = k.x + (acak() - 0.5) * k.rx
      const y = k.y + (acak() - 0.5) * k.ry * 0.9
      g.globalAlpha = 0.7
      g.beginPath()
      g.moveTo(x - 14, y)
      g.quadraticCurveTo(x, y - 4, x + 14, y)
      g.stroke()
    }
    g.fillStyle = c('kertas-terang')
    g.globalAlpha = 0.45
    g.beginPath()
    g.ellipse(k.x - k.rx * 0.45, k.y - k.ry * 0.4, k.rx * 0.22, k.ry * 0.16, -0.2, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
  }
}

/** Parit kecil memotong lapangan, dengan papan titian kayu. */
function parit(g: CanvasRenderingContext2D, l: Lintasan) {
  const p = l.parit
  // Tebing tanah.
  g.fillStyle = c('kayu-muda')
  g.fillRect(p.x0 - 10, 0, p.x1 - p.x0 + 20, TINGGI_LINTASAN)
  g.fillStyle = c('kayu')
  g.fillRect(p.x0 - 2, 0, p.x1 - p.x0 + 4, TINGGI_LINTASAN)
  g.fillStyle = c('air-gelap')
  g.fillRect(p.x0 + 4, 0, p.x1 - p.x0 - 8, TINGGI_LINTASAN)
  g.fillStyle = c('air')
  g.fillRect(p.x0 + 10, 0, p.x1 - p.x0 - 20, TINGGI_LINTASAN)
  // Riak arus.
  const acak = acakTetap(59)
  g.strokeStyle = c('air-muda')
  g.lineWidth = 3
  g.lineCap = 'round'
  for (let y = 10; y < TINGGI_LINTASAN; y += 22) {
    const x = p.x0 + 18 + acak() * (p.x1 - p.x0 - 56)
    g.globalAlpha = 0.6
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + 10, y - 5, x + 20, y)
    g.quadraticCurveTo(x + 30, y + 5, x + 40, y)
    g.stroke()
  }
  g.globalAlpha = 1
  // Papan titian: bayangan di air, papan, sambungan, dan paku.
  const y0 = p.papanY0
  const y1 = p.papanY1
  const x0 = p.x0 - 18
  const x1 = p.x1 + 18
  g.fillStyle = c('tinta-gelap')
  g.globalAlpha = 0.25
  g.fillRect(x0 + 4, y0 + 8, x1 - x0, y1 - y0)
  g.globalAlpha = 1
  g.fillStyle = c('kayu')
  g.fillRect(x0, y0 + 4, x1 - x0, y1 - y0)
  g.fillStyle = c('kayu-muda')
  g.fillRect(x0, y0, x1 - x0, y1 - y0)
  g.strokeStyle = c('kayu')
  g.lineWidth = 2
  for (const y of [y0 + (y1 - y0) / 3, y0 + ((y1 - y0) * 2) / 3]) {
    g.beginPath()
    g.moveTo(x0 + 4, y)
    g.lineTo(x1 - 4, y)
    g.stroke()
  }
  g.fillStyle = c('kayu-gelap')
  for (const x of [x0 + 8, x1 - 8]) for (const y of [y0 + 8, y1 - 8]) g.fillRect(x - 2, y - 2, 4, 4)
}

/** Zona START (garis kapur) dan lingkaran kapur di sekitar keranjang. */
function zona(g: CanvasRenderingContext2D, l: Lintasan) {
  g.fillStyle = c('kertas-krem')
  g.globalAlpha = 0.22
  g.fillRect(0, PAGAR_BAWAH + 6, l.garisStart, TALI_Y - PAGAR_BAWAH - 6)
  g.globalAlpha = 1
  kapur(g, l.garisStart, PAGAR_BAWAH + 12, l.garisStart, TALI_Y - 12, 7)
  const k = l.keranjang
  g.fillStyle = c('kertas-krem')
  g.globalAlpha = 0.25
  g.beginPath()
  g.arc(k.x, k.y, R_SAMPAI, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 0.85
  g.strokeStyle = c('kertas-terang')
  g.lineWidth = 5
  g.setLineDash([16, 10])
  g.beginPath()
  g.arc(k.x, k.y, R_SAMPAI, 0, Math.PI * 2)
  g.stroke()
  g.setLineDash([])
  g.globalAlpha = 1
}

/**
 * Satu potongan latar lintasan selebar LEBAR_POTONGAN mulai dari x0 (px
 * dunia), dengan skala `skala` piksel kanvas per px dunia.
 */
export function gambarPotongan(skala: number, x0: number, l: Lintasan = LINTASAN) {
  const lebar = Math.min(LEBAR_POTONGAN, PANJANG - x0)
  const kanvas = document.createElement('canvas')
  kanvas.width = Math.ceil(lebar * skala)
  kanvas.height = Math.ceil(TINGGI_LINTASAN * skala)
  const g = kanvas.getContext('2d')!
  g.scale(skala, skala)
  g.translate(-x0, 0)
  rumput(g)
  zona(g, l)
  genangan(g, l)
  parit(g, l)
  pagar(g)
  tali(g)
  return kanvas
}

export const JUMLAH_POTONGAN = Math.ceil(PANJANG / LEBAR_POTONGAN)

// ── Benda terpisah ────────────────────────────────────────

function kanvasBaru(lebar: number, tinggi: number, skala: number) {
  const k = document.createElement('canvas')
  k.width = Math.ceil(lebar * skala)
  k.height = Math.ceil(tinggi * skala)
  const g = k.getContext('2d')!
  g.scale(skala, skala)
  return { k, g }
}

/** Ukuran gambar batu (px dunia) untuk jari-jari R_GAMBAR_BATU; origin di pusat alas. */
export const R_GAMBAR_BATU = 34
export const BATU = { lebar: R_GAMBAR_BATU * 2 + 12, tinggi: R_GAMBAR_BATU * 2.1, alasX: R_GAMBAR_BATU + 6, alasY: R_GAMBAR_BATU * 1.35 }

/** Batu kali bulat tampak atas-miring: alas bayangan, gundukan, kilap. */
export function gambarBatu(skala: number, varian: number) {
  const R = R_GAMBAR_BATU
  const { k, g } = kanvasBaru(BATU.lebar, BATU.tinggi, skala)
  const cx = BATU.alasX
  const cy = BATU.alasY
  g.fillStyle = c('tinta-gelap')
  g.globalAlpha = 0.25
  g.beginPath()
  g.ellipse(cx + 4, cy + 4, R * 1.05, R * 0.6, 0, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 1
  const miring = varian ? 0.18 : -0.12
  const badan = () => {
    g.beginPath()
    g.moveTo(cx - R, cy)
    g.bezierCurveTo(cx - R * 1.05, cy - R * (1.1 + miring), cx + R * 0.9, cy - R * (1.25 - miring), cx + R, cy)
    g.bezierCurveTo(cx + R * 0.7, cy + R * 0.55, cx - R * 0.7, cy + R * 0.55, cx - R, cy)
    g.closePath()
  }
  g.fillStyle = c('abu-kartu-gelap')
  badan()
  g.fill()
  g.save()
  badan()
  g.clip()
  g.fillStyle = c('abu-kartu')
  g.beginPath()
  g.ellipse(cx - R * 0.12, cy - R * 0.5, R * 0.95, R * 0.72, miring, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = c('abu-kartu-muda')
  g.globalAlpha = 0.85
  g.beginPath()
  g.ellipse(cx - R * 0.35, cy - R * 0.7, R * 0.32, R * 0.18, -0.4, 0, Math.PI * 2)
  g.fill()
  g.restore()
  g.globalAlpha = 1
  // Lumut kecil.
  g.fillStyle = c('daun-pisang-gelap')
  g.beginPath()
  g.ellipse(cx + R * 0.45 * (varian ? -1 : 1), cy - R * 0.15, R * 0.18, R * 0.09, 0, 0, Math.PI * 2)
  g.fill()
  return k
}

/** Ukuran gambar keranjang (px dunia); origin di tengah alas. */
export const KERANJANG = { lebar: 92, tinggi: 76, alasY: 70 }

/** Keranjang bambu anyaman tempat balon dikumpulkan. */
export function gambarKeranjang(skala: number) {
  const { lebar, tinggi, alasY } = KERANJANG
  const { k, g } = kanvasBaru(lebar, tinggi, skala)
  const cx = lebar / 2
  g.fillStyle = c('tinta-gelap')
  g.globalAlpha = 0.25
  g.beginPath()
  g.ellipse(cx + 4, alasY - 2, 40, 9, 0, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 1
  const atas = 20
  const badan = () => {
    g.beginPath()
    g.moveTo(cx - 40, atas)
    g.lineTo(cx + 40, atas)
    g.lineTo(cx + 30, alasY - 4)
    g.quadraticCurveTo(cx, alasY + 4, cx - 30, alasY - 4)
    g.closePath()
  }
  g.fillStyle = c('kunyit-gelap')
  badan()
  g.fill()
  g.save()
  badan()
  g.clip()
  // Anyaman: baris bata berselang.
  g.fillStyle = c('kunyit')
  for (let y = atas; y < alasY; y += 10) {
    const geser = ((y - atas) / 10) % 2 ? 0 : 9
    for (let x = cx - 44 + geser; x < cx + 44; x += 18) g.fillRect(x, y + 1, 14, 7)
  }
  g.restore()
  // Bibir keranjang dan isi gelap.
  g.fillStyle = c('kayu')
  g.beginPath()
  g.ellipse(cx, atas, 42, 12, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = c('kayu-gelap')
  g.beginPath()
  g.ellipse(cx, atas + 1, 35, 8, 0, 0, Math.PI * 2)
  g.fill()
  return k
}

/** Jari-jari balon (px dunia). */
export const R_BALON = 13

/** Balon karet berisi air (biru), atau versi merah untuk lapisan "tekanan tinggi". */
export function gambarBalon(skala: number, merah: boolean) {
  const R = R_BALON
  const { k, g } = kanvasBaru(R * 2 + 4, R * 2 + 10, skala)
  const cx = R + 2
  const cy = R + 2
  g.fillStyle = c(merah ? 'merah-bata-gelap' : 'air-gelap')
  g.beginPath()
  g.moveTo(cx - 4, cy + R + 5)
  g.lineTo(cx + 4, cy + R + 5)
  g.lineTo(cx, cy + R - 2)
  g.closePath()
  g.fill()
  g.beginPath()
  g.ellipse(cx, cy, R - 1, R, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = c(merah ? 'merah-bata' : 'air')
  g.beginPath()
  g.ellipse(cx - 1.5, cy - 1.5, R - 3, R - 2.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = c('kertas-terang')
  g.globalAlpha = 0.6
  g.beginPath()
  g.ellipse(cx - R * 0.4, cy - R * 0.42, R * 0.22, R * 0.3, -0.5, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 1
  return k
}

/** Titik tengah gambar balon (origin) relatif ke kanvasnya. */
export const ORIGIN_BALON = { x: (R_BALON + 2) / (R_BALON * 2 + 4), y: (R_BALON + 2) / (R_BALON * 2 + 10) }
