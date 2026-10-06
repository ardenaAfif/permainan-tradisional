/**
 * Status PWA yang dibaca beberapa layar: tawaran pasang dari browser
 * (beforeinstallprompt) dan status sambungan. Diimpor dari main.tsx supaya
 * event beforeinstallprompt tidak terlewat sebelum layar mana pun dirender.
 */
import { useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let tawaran: BeforeInstallPromptEvent | null = null
const pendengar = new Set<() => void>()
const kabari = () => pendengar.forEach((f) => f())
const langganan = (f: () => void) => {
  pendengar.add(f)
  return () => pendengar.delete(f)
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // tawaran ditampilkan lewat tombol "Pasang di HP", bukan pita bawaan browser
  tawaran = e as BeforeInstallPromptEvent
  kabari()
})
window.addEventListener('appinstalled', () => {
  tawaran = null
  kabari()
})
window.addEventListener('online', kabari)
window.addEventListener('offline', kabari)

/** true jika aplikasi sedang berjalan sebagai aplikasi terpasang (bukan tab browser). */
export const sudahTerpasang = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** iPhone/iPad: tidak punya tawaran pasang otomatis, harus lewat menu Bagikan Safari. */
export const perangkatIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** true jika browser menawarkan pemasangan (Chrome/Edge/Samsung Internet di Android & laptop). */
export function useBisaPasang(): boolean {
  return useSyncExternalStore(langganan, () => tawaran !== null)
}

/** Tampilkan dialog pasang dari browser. Mengembalikan true jika pemain memasang. */
export async function pasangAplikasi(): Promise<boolean> {
  const t = tawaran
  if (!t) return false
  tawaran = null // satu event hanya bisa dipakai sekali
  kabari()
  await t.prompt()
  return (await t.userChoice).outcome === 'accepted'
}

export function useOnline(): boolean {
  return useSyncExternalStore(langganan, () => navigator.onLine)
}
