/**
 * Tekstur karakter untuk Phaser: SVG dari character kit (design/) dirasterisasi
 * ke <canvas> sekali saat game dipasang. Karakter tidak digambar ulang per frame.
 */
import logoSnt from '../../assets/snt-mark.png'
import { karakterSvg, type KitOptions } from '../../characters/kit'

export type OpsiKarakter = Omit<KitOptions, 'uid' | 'logo'>

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

/** Rasio lebar/tinggi dari viewBox SVG (pose lebar seperti engklek punya viewBox lebih lebar). */
function rasioViewBox(svg: string) {
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1]?.split(/\s+/).map(Number)
  return vb && vb[2] && vb[3] ? vb[2] / vb[3] : 200 / 412
}

/** Gambar satu karakter kit setinggi `tinggi` px tekstur; lebar mengikuti viewBox pose/crop. */
export async function gambarKarakter(o: OpsiKarakter, tinggi: number): Promise<HTMLCanvasElement> {
  const svg = (logo: string) => karakterSvg({ ...o, uid: `kr${++nomor}`, logo })
  // Tanpa logo SNT jika browser menolak gambar di dalam SVG.
  logoAman ??= logoDataUrl().then(async (logo) => !!logo && !tercemar(await rasterSvg(svg(logo), 8, 8)))
  const isi = svg((await logoAman) ? await logoDataUrl() : '')
  return rasterSvg(isi, tinggi * rasioViewBox(isi), tinggi)
}
