/**
 * Membuat ikon PWA dan gambar UI yang sudah dikompres. Jalankan ulang jika gambar
 * sumbernya berubah: `npm run ikon` (butuh Chromium Playwright dan `cwebp`).
 *
 * - public/icons/*: ikon aplikasi dari gambar "kotak" di design/objects.js
 *   (disalin di src/shared/benda/benda.ts) di atas latar kunyit.
 * - src/assets/snt-mark*.webp: tanda SNT dari design/assets/snt-mark.png.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const benda = readFileSync('src/shared/benda/benda.ts', 'utf8')
const kotak = /kotak: `([^`]+)`/.exec(benda)?.[1]
if (!kotak) throw new Error('Gambar kotak tidak ditemukan di benda.ts')

// Warna dari src/app/tokens.css.
const KUNYIT = '#E8A33D'
const CAHAYA = '#FFD58A'
const KAYU_GELAP = '#4A2C17'

/**
 * Kotak di tengah. `isi` = lebar kotak terhadap sisi ikon. Ikon maskable memakai isi lebih
 * kecil supaya kotak tetap utuh di zona aman (lingkaran 80%) saat dipotong launcher.
 */
function svgIkon({ isi, sudut }) {
  const s = (512 * isi) / 160 // gambar kotak selebar ±160 satuan (x 20..180)
  const tx = 256 - 100 * s
  const ty = 256 - 84 * s // pusat visual kotak + tutup (sedikit di bawah tengah supaya seimbang)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><radialGradient id="c" cx="50%" cy="54%" r="55%"><stop offset="0" stop-color="${CAHAYA}"/><stop offset="1" stop-color="${KUNYIT}"/></radialGradient></defs>
<rect width="512" height="512" rx="${sudut}" fill="url(#c)"/>
<ellipse cx="256" cy="${256 + 64 * s}" rx="${70 * s}" ry="${9 * s}" fill="${KAYU_GELAP}" opacity=".25"/>
<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(3)})">${kotak}</g>
</svg>`
}

mkdirSync('public/icons', { recursive: true })
const ikon = svgIkon({ isi: 0.68, sudut: 112 })
const maskable = svgIkon({ isi: 0.52, sudut: 0 })
writeFileSync('public/icons/ikon.svg', ikon)

const browser = await chromium.launch()
const page = await browser.newPage()
async function png(svg, ukuran, file) {
  await page.setViewportSize({ width: ukuran, height: ukuran })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${ukuran}px;height:${ukuran}px}</style>${svg}`,
  )
  await page.screenshot({ path: file, omitBackground: true })
}
await png(ikon, 192, 'public/icons/ikon-192.png')
await png(ikon, 512, 'public/icons/ikon-512.png')
await png(maskable, 512, 'public/icons/ikon-maskable-512.png')
await png(maskable, 180, 'public/icons/apple-touch-icon.png') // iOS memotong sudutnya sendiri
await png(ikon, 48, 'public/favicon.png')
await browser.close()

// Tanda SNT: kecil untuk chip/kepala (tinggi tampil ≤ 56 px), sedang untuk karakter & papan intro.
const cwebp = (lebar, file) =>
  execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '90', '-m', '6', '-resize', String(lebar), '0', 'design/assets/snt-mark.png', '-o', file])
cwebp(140, 'src/assets/snt-mark-kecil.webp')
cwebp(256, 'src/assets/snt-mark.webp')
console.log('Ikon dan gambar selesai dibuat.')
