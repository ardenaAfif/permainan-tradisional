import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { IkonTutup } from '../shared/ui/Ikon'
import { useOnline } from './pwa'
import s from './StatusAplikasi.module.css'

/** Layar yang tidak boleh tertutup pesan (panggung intro dan game). */
const layarPenuh = (path: string) => path.startsWith('/main/') || path === '/intro'

/** Cek versi baru setiap jam selama aplikasi terbuka (PID kelas bisa menyala seharian). */
const CEK_VERSI_MS = 60 * 60 * 1000

/**
 * Pesan kecil di bawah layar: offline/tersambung lagi, siap offline, dan versi baru.
 * Disembunyikan di intro dan saat main supaya tidak menutupi kontrol.
 */
export function StatusAplikasi() {
  const { pathname } = useLocation()
  const online = useOnline()
  const [tutupOffline, setTutupOffline] = useState(false)
  const [kembaliOnline, setKembaliOnline] = useState(false)

  const {
    needRefresh: [perluPerbarui, setPerluPerbarui],
    offlineReady: [siapOffline, setSiapOffline],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => navigator.onLine && reg.update().catch(() => {}), CEK_VERSI_MS)
    },
  })

  // Setiap kali sambungan putus, pesan offline muncul lagi; saat tersambung, "Tersambung lagi" sebentar.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const putus = () => {
      clearTimeout(t)
      setTutupOffline(false)
      setKembaliOnline(false)
    }
    const sambung = () => {
      clearTimeout(t)
      setKembaliOnline(true)
      t = setTimeout(() => setKembaliOnline(false), 3000)
    }
    window.addEventListener('offline', putus)
    window.addEventListener('online', sambung)
    return () => {
      clearTimeout(t)
      window.removeEventListener('offline', putus)
      window.removeEventListener('online', sambung)
    }
  }, [])

  useEffect(() => {
    if (!siapOffline) return
    const t = setTimeout(() => setSiapOffline(false), 5000)
    return () => clearTimeout(t)
  }, [siapOffline, setSiapOffline])

  if (layarPenuh(pathname)) return null

  let isi = null
  if (perluPerbarui) {
    isi = (
      <div className={`${s.pesan} ${s.nila}`}>
        <span className={s.teks}>Versi baru Kotak Dolanan sudah siap.</span>
        <button type="button" className={s.aksi} onClick={() => void updateServiceWorker(true)}>
          Perbarui
        </button>
        <button type="button" className={s.tutup} aria-label="Nanti saja" onClick={() => setPerluPerbarui(false)}>
          <IkonTutup ukuran={18} />
        </button>
      </div>
    )
  } else if (!online && !tutupOffline) {
    isi = (
      <div className={s.pesan}>
        <span className={s.titik} aria-hidden="true" />
        <span className={s.teks}>Kamu sedang offline. Game yang pernah dibuka tetap bisa dimainkan.</span>
        <button type="button" className={s.tutup} aria-label="Tutup pesan offline" onClick={() => setTutupOffline(true)}>
          <IkonTutup ukuran={18} />
        </button>
      </div>
    )
  } else if (online && kembaliOnline) {
    isi = (
      <div className={s.pesan}>
        <span className={`${s.titik} ${s.titikHijau}`} aria-hidden="true" />
        <span className={s.teks}>Tersambung lagi.</span>
      </div>
    )
  } else if (siapOffline) {
    isi = (
      <div className={s.pesan}>
        <span className={`${s.titik} ${s.titikHijau}`} aria-hidden="true" />
        <span className={s.teks}>Kotak Dolanan sudah tersimpan dan bisa dibuka tanpa internet.</span>
      </div>
    )
  }

  return (
    <div className={s.wadah} role="status" aria-live="polite">
      {isi}
    </div>
  )
}
