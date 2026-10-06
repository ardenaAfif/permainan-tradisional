import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, type RouteObject } from 'react-router'
import { Judul } from '../intro/Judul'
import { GagalMuat } from './GagalMuat'
import { StatusAplikasi } from './StatusAplikasi'

/** Import yang gagal (sinyal putus sesaat) dicoba sekali lagi sebelum menyerah ke GagalMuat. */
const cobaLagi =
  <T,>(muat: () => Promise<T>) =>
  () =>
    muat().catch(() => new Promise<T>((ok, gagal) => setTimeout(() => muat().then(ok, gagal), 700)))

// Hanya layar judul yang ikut berkas utama, supaya tampil secepat mungkin di HP kelas bawah.
// Layar lain (karakter + GSAP, intro, game) dimuat saat dibuka; semuanya sudah ada di
// cache service worker setelah kunjungan pertama, jadi tetap instan dan jalan offline.
const muatMenu = () => import('../menu/Menu')
const muatAvatar = () => import('../avatar/BuatAvatar')
const muatIntro = () => import('../intro/Intro')
const Menu = lazy(cobaLagi(() => muatMenu().then((m) => ({ default: m.Menu }))))
const BuatAvatar = lazy(cobaLagi(() => muatAvatar().then((m) => ({ default: m.BuatAvatar }))))
const Intro = lazy(cobaLagi(() => muatIntro().then((m) => ({ default: m.Intro }))))
const KenalanDulu = lazy(cobaLagi(() => import('../shared/KenalanDulu').then((m) => ({ default: m.KenalanDulu }))))
const GameShell = lazy(cobaLagi(() => import('../shared/GameShell').then((m) => ({ default: m.GameShell }))))
const ResultScreen = lazy(cobaLagi(() => import('../shared/ResultScreen').then((m) => ({ default: m.ResultScreen }))))
const Pengaturan = lazy(cobaLagi(() => import('./Pengaturan').then((m) => ({ default: m.Pengaturan }))))
const Kredit = lazy(cobaLagi(() => import('./Kredit').then((m) => ({ default: m.Kredit }))))

/** Setelah layar judul tenang, unduh dulu layar berikutnya supaya tap Mulai tidak menunggu. */
function useMuatDulu() {
  useEffect(() => {
    const jalan = () => {
      for (const muat of [muatMenu, muatAvatar, muatIntro]) muat().catch(() => {})
    }
    const t = setTimeout(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(jalan, { timeout: 3000 })
      else jalan()
    }, 2500)
    return () => clearTimeout(t)
  }, [])
}

/** Kerangka semua layar: isi rute + pesan status (offline, versi baru). */
function Kerangka() {
  useMuatDulu()
  return (
    <>
      <Outlet />
      <StatusAplikasi />
    </>
  )
}

const tunggu = (el: ReactNode) => <Suspense fallback={<div className="memuat" aria-busy="true" />}>{el}</Suspense>

// Halaman pengembang: tidak ikut ke build produksi.
const ruteDev: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/karakter',
        lazy: async () => ({ Component: (await import('../characters/DevKarakter')).DevKarakter }),
      },
    ]
  : []

const router = createBrowserRouter([
  {
    // Semua layar berbagi layar error yang ramah (dan memuat ulang sendiri bila modul gagal diunduh).
    element: <Kerangka />,
    errorElement: <GagalMuat />,
    children: [
      { path: '/', element: <Judul /> },
      { path: '/intro', element: tunggu(<Intro />) },
      { path: '/avatar', element: tunggu(<BuatAvatar />) },
      { path: '/menu', element: tunggu(<Menu />) },
      { path: '/kenalan/:gameId', element: tunggu(<KenalanDulu />) },
      { path: '/main/:gameId', element: tunggu(<GameShell />) },
      { path: '/hasil/:gameId', element: tunggu(<ResultScreen />) },
      { path: '/pengaturan', element: tunggu(<Pengaturan />) },
      { path: '/kredit', element: tunggu(<Kredit />) },
      ...ruteDev,
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
