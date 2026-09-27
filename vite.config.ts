import react from '@vitejs/plugin-react'
import { existsSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * Modul virtual `virtual:audio-manifest`: daftar file di public/audio
 * (mis. "sfx/bel.mp3", "vo/intro-1-bima.mp3"). AudioManager memakainya untuk
 * tahu file mana yang ada, jadi VO/sfx yang belum direkam dilewati tanpa 404.
 */
function manifestAudio(): Plugin {
  const ID = 'virtual:audio-manifest'
  const RID = '\0' + ID
  const DIR = join(process.cwd(), 'public', 'audio')
  const daftar = () =>
    existsSync(DIR)
      ? readdirSync(DIR, { recursive: true, withFileTypes: true })
          .filter((f) => f.isFile() && /\.(mp3|ogg|m4a|wav)$/i.test(f.name))
          .map((f) => relative(DIR, join(f.parentPath, f.name)).split(sep).join('/'))
          .sort()
      : []
  return {
    name: 'kd-audio-manifest',
    resolveId: (id) => (id === ID ? RID : undefined),
    load: (id) => (id === RID ? `export default ${JSON.stringify(daftar())}` : undefined),
    configureServer(server) {
      const perbarui = (file: string) => {
        if (!file.startsWith(DIR)) return
        const mod = server.moduleGraph.getModuleById(RID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(DIR)
      server.watcher.on('add', perbarui)
      server.watcher.on('unlink', perbarui)
    },
  }
}

// PWA (vite-plugin-pwa) dipasang di tahap 7.
export default defineConfig({
  plugins: [react(), manifestAudio()],
  build: {
    rolldownOptions: {
      output: {
        // Phaser (±1,2 MB) jadi satu berkas sendiri yang dipakai bersama semua game
        // Phaser, supaya tetap ter-cache walau kode game berubah.
        codeSplitting: { groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }] },
      },
    },
  },
})
