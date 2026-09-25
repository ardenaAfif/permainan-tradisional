import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router'
import { BuatAvatar } from '../avatar/BuatAvatar'
import { Judul } from '../intro/Judul'
import { Menu } from '../menu/Menu'
import { KenalanDulu } from '../shared/KenalanDulu'
import { GagalMuat } from './GagalMuat'

/** Import yang gagal (sinyal putus sesaat) dicoba sekali lagi sebelum menyerah ke GagalMuat. */
const cobaLagi =
  <T,>(muat: () => Promise<T>) =>
  () =>
    muat().catch(() => new Promise<T>((ok, gagal) => setTimeout(() => muat().then(ok, gagal), 700)))

// Layar yang lebih berat (intro dengan GSAP, game) dimuat saat dibuka.
const Intro = lazy(cobaLagi(() => import('../intro/Intro').then((m) => ({ default: m.Intro }))))
const GameShell = lazy(cobaLagi(() => import('../shared/GameShell').then((m) => ({ default: m.GameShell }))))
const ResultScreen = lazy(cobaLagi(() => import('../shared/ResultScreen').then((m) => ({ default: m.ResultScreen }))))
const Pengaturan = lazy(cobaLagi(() => import('./Pengaturan').then((m) => ({ default: m.Pengaturan }))))

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
    errorElement: <GagalMuat />,
    children: [
      { path: '/', element: <Judul /> },
      { path: '/intro', element: tunggu(<Intro />) },
      { path: '/avatar', element: <BuatAvatar /> },
      { path: '/menu', element: <Menu /> },
      { path: '/kenalan/:gameId', element: <KenalanDulu /> },
      { path: '/main/:gameId', element: tunggu(<GameShell />) },
      { path: '/hasil/:gameId', element: tunggu(<ResultScreen />) },
      { path: '/pengaturan', element: tunggu(<Pengaturan />) },
      ...ruteDev,
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
