import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Berkas game (kode tiap game + Phaser) ditaruh di sini: tidak di-precache, di-cache saat pertama dibuka. */
const FOLDER_GAME = 'assets/game/'

/**
 * Modul virtual `virtual:audio-manifest`: daftar file di public/audio
 * (mis. "sfx/bel.mp3", "vo/intro-1-bima.mp3") beserta sidik isinya. AudioManager memakainya
 * untuk tahu file mana yang ada (VO/sfx yang belum direkam dilewati tanpa 404) dan
 * menambahkan ?v=<sidik> ke URL, supaya rekaman yang diganti tidak tertahan di cache offline.
 */
function manifestAudio(): Plugin {
  const ID = 'virtual:audio-manifest'
  const RID = '\0' + ID
  const DIR = join(process.cwd(), 'public', 'audio')
  const daftar = () =>
    existsSync(DIR)
      ? readdirSync(DIR, { recursive: true, withFileTypes: true })
          .filter((f) => f.isFile() && /\.(mp3|ogg|m4a|wav)$/i.test(f.name))
          .map((f) => {
            const path = join(f.parentPath, f.name)
            const sidik = createHash('sha1').update(readFileSync(path)).digest('hex').slice(0, 8)
            return [relative(DIR, path).split(sep).join('/'), sidik] as const
          })
          .sort(([a], [b]) => a.localeCompare(b))
      : []
  return {
    name: 'kd-audio-manifest',
    resolveId: (id) => (id === ID ? RID : undefined),
    load: (id) => (id === RID ? `export default ${JSON.stringify(Object.fromEntries(daftar()))}` : undefined),
    configureServer(server) {
      const perbarui = (file: string) => {
        if (!file.startsWith(DIR)) return
        const mod = server.moduleGraph.getModuleById(RID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(DIR)
      server.watcher.on('add', perbarui)
      server.watcher.on('change', perbarui)
      server.watcher.on('unlink', perbarui)
    },
  }
}

/**
 * Menulis dist/offline-game.json: daftar berkas di assets/game/ untuk tombol
 * "Simpan semua game" di Pengaturan (mengunduh tanpa menjalankan kodenya).
 */
function daftarBerkasGame(): Plugin {
  return {
    name: 'kd-daftar-berkas-game',
    apply: 'build',
    generateBundle(_, bundle) {
      const berkas = Object.keys(bundle)
        .filter((f) => f.startsWith(FOLDER_GAME))
        .sort()
      this.emitFile({ type: 'asset', fileName: 'offline-game.json', source: JSON.stringify(berkas) })
    },
  }
}

/**
 * Layar judul tampil lebih cepat di HP: CSS utama (token, font-face, layar judul; ±5 KB gzip)
 * disisipkan langsung ke index.html, dan huruf yang terlihat di layar judul di-preload supaya
 * tidak ada lompatan tata letak saat huruf selesai dimuat.
 */
function cssKritis(): Plugin {
  const HURUF_JUDUL = /^assets\/(baloo-2-latin-(700|800)|nunito-latin-(600|700))-normal-[\w-]+\.woff2$/
  return {
    name: 'kd-css-kritis',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        const sisip = html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, file: string) => {
          const css = bundle[file]
          return css?.type === 'asset' ? `<style>${String(css.source)}</style>` : tag
        })
        const preload = Object.keys(bundle)
          .filter((f) => HURUF_JUDUL.test(f))
          .map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/${f}">`)
          .join('')
        return sisip.replace('</title>', `</title>${preload}`)
      },
    },
  }
}

const WARNA_KUNYIT = '#E8A33D' // --kunyit di src/app/tokens.css
const WARNA_NILA = '#2E4C7A' // --biru-nila

export default defineConfig({
  plugins: [
    react(),
    manifestAudio(),
    daftarBerkasGame(),
    cssKritis(),
    VitePWA({
      // Pembaruan ditawarkan lewat tombol (StatusAplikasi), tidak memuat ulang di tengah permainan.
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png', 'icons/ikon.svg'],
      manifest: {
        id: '/',
        name: 'Kotak Dolanan',
        short_name: 'Kotak Dolanan',
        description: '9 permainan tradisional Indonesia untuk kokurikuler SMP SNT 2 Banyumas.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: WARNA_KUNYIT,
        background_color: WARNA_NILA,
        categories: ['education', 'games'],
        icons: [
          { src: '/icons/ikon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/ikon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/ikon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/ikon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Shell app, layar judul, intro, avatar, menu, Kenalan Dulu, hasil, kredit, dan aset bersama.
        // Font cukup woff2 (semua browser sasaran mendukungnya).
        globPatterns: ['**/*.{js,css,html,woff2,webp,png,svg}'],
        globIgnores: [`${FOLDER_GAME}**`, 'offline-game.json'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/assets\//, /^\/audio\//],
        cleanupOutdatedCaches: true,
        // Saat pertama dipasang langsung mengendalikan halaman (supaya game yang dibuka ikut
        // ter-cache). Versi baru tetap menunggu tombol "Perbarui".
        clientsClaim: true,
        runtimeCaching: [
          {
            // Nama berkas ber-hash: isi tidak pernah berubah, jadi cukup diambil sekali.
            // (Pola ditulis langsung, bukan fungsi: fungsi disalin ke sw.js tanpa variabel luarnya.)
            urlPattern: /\/assets\/game\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kd-game',
              // Server bisa mengirim "Vary: Origin"; impor modul (ber-Origin) harus tetap cocok dengan
              // berkas yang diunduh tombol "Simpan semua game" (tanpa Origin).
              matchOptions: { ignoreVary: true },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // URL audio membawa ?v=<sidik isi> (lihat manifestAudio), jadi aman CacheFirst.
            urlPattern: /\/audio\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kd-audio',
              matchOptions: { ignoreVary: true },
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 180, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Phaser (±1,2 MB, hanya dimuat saat game aksi dibuka) memang satu berkas besar.
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Phaser (±1,2 MB) satu berkas yang dipakai bersama semua game Phaser, supaya
            // tetap ter-cache walau kode game berubah.
            { name: 'phaser', test: /node_modules[\\/]phaser[\\/]/ },
            // Pustaka yang jarang berubah dipisah dari kode aplikasi (cache lebih awet).
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'gsap', test: /node_modules[\\/]gsap[\\/]/ },
          ],
        },
        chunkFileNames: (chunk) =>
          chunk.name === 'phaser' || chunk.facadeModuleId?.includes('/src/games/')
            ? `${FOLDER_GAME}[name]-[hash].js`
            : 'assets/[name]-[hash].js',
      },
    },
  },
})
