/**
 * Tekstur Gobak Sodor: siswa dari character kit (design/) — pose biasa untuk
 * penyerang, pose "gobak" (tangan terentang) untuk penjaga — dan latar
 * lapangan tanah bergaris kapur di tengah rumput, digambar sekali ke kanvas.
 */
import { WARNA, type NamaWarna } from '../../app/tokens'
import type { Mata, Mulut, Pose, Tokoh } from '../../characters/kit'
import { gambarKarakter } from '../../shared/phaser/karakter'
import type { AvatarConfig, Player } from '../../shared/types'
import type { Lapangan } from './aturan'
import { ANGGOTA_TIM } from './config'
import { LEBAR, TEPI_ATAS, TEPI_BAWAH, TINGGI } from './tata'

/** Satu anggota tim. */
export interface Anggota {
  who: Tokoh
  avatar?: Omit<AvatarConfig, 'nama'>
}

export type Raut = 'serang' | 'jaga' | 'kaget' | 'kepala'
export const SEMUA_RAUT: Raut[] = ['serang', 'jaga', 'kaget', 'kepala']

const RAUT: Record<Raut, { pose: Pose; eyes?: Mata; mouth?: Mulut; crop?: 'head' }> = {
  serang: { pose: 'idle', mouth: 'smile' },
  jaga: { pose: 'gobak', mouth: 'flat' },
  kaget: { pose: 'idle', eyes: 'surprised', mouth: 'talk-o' },
  kepala: { pose: 'idle', crop: 'head' },
}

/** viewBox karakter: y dari −30, tinggi 412; telapak (tanah) di y ≈ 374. */
export const ALAS = (374 + 30) / 412

/** Teman satu tim (kit "avatar" dengan variasi dari design/, tanpa nama). */
const TEMAN: Omit<AvatarConfig, 'nama'>[] = [
  { kulit: 4, rambut: 'keriting', penutupKepala: 'none' },
  { kulit: 2, rambut: 'kuncir', penutupKepala: 'none' },
  { kulit: 1, rambut: 'pendek', penutupKepala: 'kerudung' },
  { kulit: 3, rambut: 'belah', penutupKepala: 'peci' },
  { kulit: 0, rambut: 'jabrik', penutupKepala: 'none' },
  { kulit: 2, rambut: 'pendek', penutupKepala: 'none' },
  { kulit: 3, rambut: 'kuncir', penutupKepala: 'kerudung' },
  { kulit: 1, rambut: 'keriting', penutupKepala: 'none' },
]

const anggotaDari = (p: Player): Anggota => (p.avatar === 'cpu' ? { who: p.tokoh ?? 'bima' } : { who: 'avatar', avatar: p.avatar })

/**
 * Dua tim berisi ANGGOTA_TIM siswa; ketua tim (pemain atau tokoh komputer) di
 * indeks 0. Tim pemain utama bersama Sekar & Dimas, tim lawan bersama Bima
 * (jika belum dipakai); sisanya teman dari kit avatar, tanpa kembar.
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
      skin: a.avatar?.kulit,
      hair: a.avatar?.rambut,
      headwear: a.avatar?.penutupKepala,
    },
    tinggi,
  )
}

/** Acak tetap supaya latar sama setiap kali dipasang. */
function acakTetap(benih: number) {
  let s = benih
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const c = (n: NamaWarna) => WARNA[n]

/** Garis kapur: sedikit tidak rata supaya terasa digambar tangan. */
function kapur(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, tebal: number, acak: () => number) {
  g.strokeStyle = c('kertas-terang')
  g.lineCap = 'round'
  g.globalAlpha = 0.92
  g.lineWidth = tebal
  g.beginPath()
  g.moveTo(x0, y0)
  const langkah = 24
  const panjang = Math.hypot(x1 - x0, y1 - y0)
  for (let d = langkah; d < panjang; d += langkah) {
    const f = d / panjang
    const goyang = (acak() - 0.5) * 1.6
    const tegak = Math.abs(x1 - x0) < Math.abs(y1 - y0)
    g.lineTo(x0 + (x1 - x0) * f + (tegak ? goyang : 0), y0 + (y1 - y0) * f + (tegak ? 0 : goyang))
  }
  g.lineTo(x1, y1)
  g.stroke()
  // Serbuk kapur di sekitar garis.
  g.fillStyle = c('kertas-terang')
  g.globalAlpha = 0.35
  for (let d = 0; d < panjang; d += 9) {
    const f = d / panjang
    g.fillRect(x0 + (x1 - x0) * f + (acak() - 0.5) * tebal * 2.4, y0 + (y1 - y0) * f + (acak() - 0.5) * tebal * 2.4, 2, 2)
  }
  g.globalAlpha = 1
}

/**
 * Latar: rumput bergaris potong, lapangan tanah dengan garis kapur (tepi,
 * garis jaga mendatar, garis sodor membujur), dan bangku kayu di kiri-kanan.
 */
export function gambarLatar(r: number, lap: Lapangan) {
  const kanvas = document.createElement('canvas')
  kanvas.width = Math.round(LEBAR * r)
  kanvas.height = Math.round(TINGGI * r)
  const g = kanvas.getContext('2d')!
  g.scale(r, r)
  const acak = acakTetap(11)

  // Rumput.
  g.fillStyle = c('daun-pisang')
  g.fillRect(0, 0, LEBAR, TINGGI)
  g.fillStyle = c('daun-pisang-gelap')
  g.globalAlpha = 0.18
  for (let y = 0; y < TINGGI; y += 96) g.fillRect(0, y, LEBAR, 48)
  g.globalAlpha = 0.5
  for (let i = 0; i < 260; i++) {
    const x = acak() * LEBAR
    const y = acak() * TINGGI
    g.fillRect(x, y, 2, 6)
  }
  g.globalAlpha = 1

  // Tanah lapangan (sedikit lebih lebar dari garis tepi).
  const { x0, x1 } = lap
  g.fillStyle = c('kayu-muda')
  g.globalAlpha = 0.35
  g.fillRect(x0 - 18, TEPI_ATAS - 14, x1 - x0 + 36, TEPI_BAWAH - TEPI_ATAS + 26)
  g.globalAlpha = 1
  g.fillStyle = c('lantai')
  g.fillRect(x0 - 12, TEPI_ATAS - 8, x1 - x0 + 24, TEPI_BAWAH - TEPI_ATAS + 16)
  // Bintik tanah dan bekas sepatu.
  for (let i = 0; i < 520; i++) {
    const x = x0 - 8 + acak() * (x1 - x0 + 16)
    const y = TEPI_ATAS + acak() * (TEPI_BAWAH - TEPI_ATAS)
    g.fillStyle = c(acak() < 0.5 ? 'kayu-muda' : 'kertas-krem')
    g.globalAlpha = 0.18 + acak() * 0.2
    g.beginPath()
    g.ellipse(x, y, 1.5 + acak() * 3, 1 + acak() * 2, acak() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1
  // Zona START dan UJUNG sedikit lebih terang.
  g.fillStyle = c('kertas-krem')
  g.globalAlpha = 0.28
  g.fillRect(x0, lap.garisY[0]!, x1 - x0, TEPI_BAWAH - lap.garisY[0]!)
  g.fillRect(x0, TEPI_ATAS, x1 - x0, lap.garisY[lap.garisY.length - 1]! - TEPI_ATAS)
  g.globalAlpha = 1

  // Garis kapur: tepi kiri/kanan, garis jaga, garis sodor.
  kapur(g, x0, TEPI_ATAS, x0, TEPI_BAWAH, 5, acak)
  kapur(g, x1, TEPI_ATAS, x1, TEPI_BAWAH, 5, acak)
  for (const gy of lap.garisY) kapur(g, x0, gy, x1, gy, 8, acak)
  if (lap.sodor) kapur(g, lap.tengahX, lap.garisY[lap.garisY.length - 1]!, lap.tengahX, lap.garisY[0]!, 7, acak)
  return kanvas
}
