import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router'
import { BuatAvatar } from '../avatar/BuatAvatar'
import { Judul } from '../intro/Judul'
import { Menu } from '../menu/Menu'
import { KenalanDulu } from '../shared/KenalanDulu'

// Layar yang lebih berat (intro dengan GSAP, game) dimuat saat dibuka.
const Intro = lazy(() => import('../intro/Intro').then((m) => ({ default: m.Intro })))
const GameShell = lazy(() => import('../shared/GameShell').then((m) => ({ default: m.GameShell })))
const ResultScreen = lazy(() => import('../shared/ResultScreen').then((m) => ({ default: m.ResultScreen })))
const Pengaturan = lazy(() => import('./Pengaturan').then((m) => ({ default: m.Pengaturan })))

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
])

export function App() {
  return <RouterProvider router={router} />
}
