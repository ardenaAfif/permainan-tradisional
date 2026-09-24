import type { ButtonHTMLAttributes, ReactNode } from 'react'
import s from './Tombol.module.css'

type Varian = 'utama' | 'sekunder' | 'nila' | 'merah'

interface TombolProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: Varian
  penuh?: boolean
}

export function Tombol({ varian = 'utama', penuh, className, type = 'button', ...rest }: TombolProps) {
  return (
    <button
      type={type}
      className={`${s.tombol} ${s[varian]} ${penuh ? s.penuh : ''} ${className ?? ''}`}
      {...rest}
    />
  )
}

interface TombolIkonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Wajib: tombol ikon butuh nama untuk pembaca layar. */
  'aria-label': string
  gaya?: 'kertas' | 'nila' | 'tabir'
  children: ReactNode
}

export function TombolIkon({ gaya = 'kertas', className, type = 'button', ...rest }: TombolIkonProps) {
  const g = gaya === 'nila' ? s.ikonNila : gaya === 'tabir' ? s.ikonTabir : ''
  return <button type={type} className={`${s.ikon} ${g} ${className ?? ''}`} {...rest} />
}
