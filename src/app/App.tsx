import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { BuatAvatar } from '../avatar/BuatAvatar'
import { Judul } from '../intro/Judul'
import { Menu } from '../menu/Menu'
import { KenalanDulu } from '../shared/KenalanDulu'

// Layar yang lebih berat (intro dengan GSAP, game) dimuat saat dibuka.
const Intro = lazy(() => import('../intro/Intro').then((m) => ({ default: m.Intro })))
const SegeraHadir = lazy(() => import('../shared/SegeraHadir').then((m) => ({ default: m.SegeraHadir })))
const Pengaturan = lazy(() => import('./Pengaturan').then((m) => ({ default: m.Pengaturan })))

const tunggu = (el: ReactNode) => <Suspense fallback={<div className="memuat" aria-busy="true" />}>{el}</Suspense>

const router = createBrowserRouter([
  { path: '/', element: <Judul /> },
  { path: '/intro', element: tunggu(<Intro />) },
  { path: '/avatar', element: <BuatAvatar /> },
  { path: '/menu', element: <Menu /> },
  { path: '/kenalan/:gameId', element: <KenalanDulu /> },
  { path: '/main/:gameId', element: tunggu(<SegeraHadir layar="main" />) },
  { path: '/hasil/:gameId', element: tunggu(<SegeraHadir layar="hasil" />) },
  { path: '/pengaturan', element: tunggu(<Pengaturan />) },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
