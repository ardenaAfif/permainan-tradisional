import { useEffect, useId, type ReactNode } from 'react'
import { IkonTutup } from './Ikon'
import s from './Modal.module.css'
import { TombolIkon } from './Tombol'

interface ModalProps {
  judul: string
  children: ReactNode
  aksi?: ReactNode
  onTutup: () => void
}

/** Panel modal dari design system: bingkai kayu, isi kertas, kepala pita tapis. */
export function Modal({ judul, children, aksi, onTutup }: ModalProps) {
  const judulId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTutup])

  return (
    <div className={s.tabir} onPointerDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div className={s.bingkai} role="dialog" aria-modal="true" aria-labelledby={judulId}>
        <div className={s.panel}>
          <div className={s.pita} aria-hidden="true" />
          <TombolIkon className={s.tutup} aria-label="Tutup" onClick={onTutup}>
            <IkonTutup ukuran={20} />
          </TombolIkon>
          <div className={s.isi}>
            <h2 id={judulId} className={s.judul}>
              {judul}
            </h2>
            {children}
            {aksi && <div className={s.aksi}>{aksi}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
