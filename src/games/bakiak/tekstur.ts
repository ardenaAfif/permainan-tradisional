/**
 * Tekstur karakter untuk Phaser: SVG dari character kit (design/) dirasterisasi
 * ke <canvas> sekali saat game dipasang. Karakter tidak digambar ulang per frame.
 */
import logoSnt from '../../assets/snt-mark.png'
import { karakterSvg, type Mata, type Mulut, type Pose, type Tokoh } from '../../characters/kit'
import type { AvatarConfig, Player } from '../../shared/types'

/** Satu siswa di atas bakiak. */
export interface Anggota {
  who: Tokoh
  avatar?: Omit<AvatarConfig, 'nama'>
}

export type Raut = 'jalan' | 'kaget' | 'senang' | 'kepala'

const RAUT: Record<Raut, { pose: Pose; eyes?: Mata; mouth?: Mulut; crop?: 'head' }> = {
  jalan: { pose: 'idle', mouth: 'flat' },
  kaget: { pose: 'idle', eyes: 'surprised', mouth: 'talk-o' },
  senang: { pose: 'happy' },
  kepala: { pose: 'idle', crop: 'head' },
}

/** viewBox karakter penuh: '0 -30 200 412'; telapak sepatu di y≈372. */
export const RASIO_KARAKTER = 200 / 412
export const ALAS_KARAKTER = (372 + 30) / 412

/** Teman satu tim (kit "avatar" dengan variasi dari design/, tanpa nama). */
const TEMAN: Omit<AvatarConfig, 'nama'>[] = [
  { kulit: 4, rambut: 'keriting', penutupKepala: 'none' },
  { kulit: 2, rambut: 'kuncir', penutupKepala: 'none' },
  { kulit: 1, rambut: 'pendek', penutupKepala: 'kerudung' },
]

const anggotaDari = (p: Player): Anggota =>
  p.avatar === 'cpu' ? { who: p.tokoh ?? 'bima' } : { who: 'avatar', avatar: p.avatar }

/**
 * Susunan tim dari depan ke belakang; pemain (atau tokoh komputer) paling depan.
 * Tim pemain utama bersama Sekar & Dimas. Tim lawan: Bima (sebagai komputer, atau
 * teman pemain kedua), dilengkapi teman dari kit avatar.
 */
export function susunTim(pemimpin: Player): Anggota[] {
  if (pemimpin.id === 'p1') return [anggotaDari(pemimpin), { who: 'sekar' }, { who: 'dimas' }]
  const teman: Anggota[] = pemimpin.avatar === 'cpu' ? [] : [{ who: 'bima' }]
  for (let i = 0; teman.length < 2; i++) teman.push({ who: 'avatar', avatar: TEMAN[i]! })
  return [anggotaDari(pemimpin), ...teman]
}

let logoCache: Promise<string> | null = null

/** Logo SNT sebagai data URL: SVG yang dimuat sebagai gambar tidak boleh memuat file luar. */
function logoDataUrl(): Promise<string> {
  logoCache ??= fetch(logoSnt)
    .then((r) => r.blob())
    .then(
      (b) =>
        new Promise<string>((resolve) => {
          const fr = new FileReader()
          fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : '')
          fr.onerror = () => resolve('')
          fr.readAsDataURL(b)
        }),
    )
    .catch(() => '')
  return logoCache
}

let nomor = 0
/** Hasil cek sekali: apakah browser mengizinkan logo (gambar di dalam SVG) tanpa mencemari kanvas. */
let logoAman: Promise<boolean> | null = null

async function rasterSvg(svg: string, lebar: number, tinggi: number): Promise<HTMLCanvasElement> {
  const w = Math.round(lebar)
  const h = Math.round(tinggi)
  const berukuran = svg.replace('<svg ', `<svg width="${w}" height="${h}" `)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG karakter gagal dimuat'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(berukuran)
  })
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d')?.drawImage(img, 0, 0, w, h)
  return c
}

/** Sebagian browser menandai kanvas "tercemar" jika SVG berisi gambar lain; WebGL lalu menolaknya. */
function tercemar(c: HTMLCanvasElement) {
  try {
    c.getContext('2d')?.getImageData(0, 0, 1, 1)
    return false
  } catch {
    return true
  }
}

/**
 * Gambar satu anggota dengan raut tertentu. `tinggi` = tinggi tekstur (px);
 * lebar mengikuti viewBox (kepala: persegi hampir, 108x122).
 */
export async function gambarAnggota(a: Anggota, raut: Raut, tinggi: number): Promise<HTMLCanvasElement> {
  const r = RAUT[raut]
  const lebar = r.crop === 'head' ? (tinggi * 108) / 122 : tinggi * RASIO_KARAKTER
  const svg = (logo: string) =>
    karakterSvg({
      uid: `bk${++nomor}`,
      logo,
      who: a.who,
      pose: r.pose,
      eyes: r.eyes,
      mouth: r.mouth,
      crop: r.crop,
      skin: a.avatar?.kulit,
      hair: a.avatar?.rambut,
      headwear: a.avatar?.penutupKepala,
    })
  // Tanpa logo SNT jika browser menolak gambar di dalam SVG.
  logoAman ??= logoDataUrl().then(async (logo) => !!logo && !tercemar(await rasterSvg(svg(logo), 8, 8)))
  return rasterSvg(svg((await logoAman) ? await logoDataUrl() : ''), lebar, tinggi)
}
