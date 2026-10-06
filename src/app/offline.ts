import { semuaUrlAudio } from '../shared/audio/AudioManager'

export type HasilSimpan = { berhasil: number; gagal: number }

/** Alasan penyimpanan offline belum bisa dijalankan, atau null jika siap. */
export function alasanBelumBisa(): string | null {
  if (!('serviceWorker' in navigator)) return 'Browser ini tidak mendukung mode offline.'
  if (import.meta.env.DEV) return 'Mode offline hanya aktif di versi build (npm run build lalu npm run preview).'
  if (!navigator.serviceWorker.controller) return 'Mode offline sedang disiapkan. Muat ulang halaman sekali, lalu coba lagi.'
  if (!navigator.onLine) return 'Sambungkan ke internet dulu untuk mengunduh game.'
  return null
}

/**
 * Mengunduh semua berkas game (daftar dari offline-game.json yang dibuat saat build)
 * dan semua file audio. Service worker menyimpannya di cache (lihat runtimeCaching di
 * vite.config.ts), jadi game yang belum pernah dibuka pun bisa dimainkan offline.
 * Kodenya hanya diunduh, tidak dijalankan.
 */
export async function simpanSemuaUntukOffline(onProgres: (selesai: number, total: number) => void): Promise<HasilSimpan> {
  const r = await fetch(`${import.meta.env.BASE_URL}offline-game.json`, { cache: 'no-store' })
  if (!r.ok) throw new Error('Daftar game tidak ditemukan')
  const berkasGame = (await r.json()) as string[]
  const urls = [...berkasGame.map((f) => import.meta.env.BASE_URL + f), ...semuaUrlAudio()]
  let selesai = 0
  let gagal = 0
  onProgres(0, urls.length)
  // Tiga unduhan sekaligus: cukup cepat tanpa membuat sambungan WiFi sekolah macet.
  const antre = [...urls]
  const pekerja = async () => {
    for (let u = antre.shift(); u; u = antre.shift()) {
      try {
        const res = await fetch(u)
        if (!res.ok) throw new Error(String(res.status))
        await res.arrayBuffer()
      } catch {
        gagal++
      }
      onProgres(++selesai, urls.length)
    }
  }
  await Promise.all([pekerja(), pekerja(), pekerja()])
  return { berhasil: urls.length - gagal, gagal }
}
