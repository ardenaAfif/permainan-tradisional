import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Tombol } from '../shared/ui/Tombol'
import s from './GagalMuat.module.css'

const KUNCI = 'kd-muat-ulang'
/** Jeda minimal antar muat ulang otomatis, supaya tidak berputar terus. */
const JEDA_MS = 15000

/** Bagian aplikasi gagal diunduh: versi baru terpasang, sinyal putus, atau server dev sedang memuat ulang. */
function gagalUnduhModul(e: unknown): boolean {
  const pesan = e instanceof Error ? e.message : String(e ?? '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i.test(pesan)
}

/** Diputuskan sekali per pemuatan halaman (aman walau StrictMode merender dua kali). */
let keputusan: boolean | null = null

function bolehMuatUlangOtomatis(): boolean {
  if (keputusan !== null) return keputusan
  try {
    const terakhir = Number(sessionStorage.getItem(KUNCI) ?? 0)
    keputusan = Date.now() - terakhir >= JEDA_MS
    if (keputusan) sessionStorage.setItem(KUNCI, String(Date.now()))
  } catch {
    keputusan = false
  }
  return keputusan
}

/** Pengganti layar error bawaan react-router: ramah untuk siswa, dan memulihkan diri bila bisa. */
export function GagalMuat() {
  const error = useRouteError()
  const modul = gagalUnduhModul(error)
  const otomatis = modul && bolehMuatUlangOtomatis()

  useEffect(() => {
    if (otomatis) window.location.reload()
  }, [otomatis])

  if (import.meta.env.DEV) console.error('[GagalMuat]', error)

  if (otomatis) return <div className="memuat" aria-busy="true" />

  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : ''

  return (
    <div className={s.layar} role="alert">
      <div className={s.kartu}>
        <h1 className={s.judul}>{modul ? 'Sambungan terputus sebentar' : 'Ups, ada yang macet'}</h1>
        <p className={s.teks}>
          {modul
            ? 'Sebagian permainan belum selesai dimuat. Cek sambunganmu, lalu coba lagi.'
            : 'Tenang, progres dan stempelmu tetap tersimpan. Coba muat ulang layar ini.'}
        </p>
        <div className={s.aksi}>
          <Tombol onClick={() => window.location.reload()}>Muat ulang</Tombol>
          <Tombol varian="sekunder" onClick={() => window.location.assign('/')}>
            Ke layar judul
          </Tombol>
        </div>
        {import.meta.env.DEV && detail && <pre className={s.detail}>{detail}</pre>}
      </div>
    </div>
  )
}
