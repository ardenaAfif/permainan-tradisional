import type { ReactNode } from 'react'
import s from './Halaman.module.css'

interface HalamanProps {
  /** Tombol di kiri judul (biasanya tombol kembali). */
  kiri?: ReactNode
  label?: string
  judul: ReactNode
  /** Tombol di kanan (suara, pengaturan, dll.). */
  kanan?: ReactNode
  children: ReactNode
  className?: string
}

/** Kerangka layar responsif (bukan Stage): pita tapis, kepala, lalu isi. */
export function Halaman({ kiri, label, judul, kanan, children, className }: HalamanProps) {
  return (
    <div className={`${s.halaman} ${className ?? ''}`}>
      <div className={s.pita} aria-hidden="true" />
      <header className={s.kepala}>
        {kiri}
        <div className={s.judulWadah}>
          {label && <div className={s.label}>{label}</div>}
          <h1 className={s.judul}>{judul}</h1>
        </div>
        {kanan}
      </header>
      <main className={s.isi}>{children}</main>
    </div>
  )
}
