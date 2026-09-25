import type { CSSProperties, ReactNode, Ref } from 'react'
import s from './adegan.module.css'

interface TokohProps {
  kotak: CSSProperties
  /** Dibalik menghadap kiri (di elemen dalam, bukan elemen yang dianimasikan). */
  balik?: boolean
  luarRef?: Ref<HTMLDivElement>
  dalamRef?: Ref<HTMLDivElement>
  className?: string
  children: ReactNode
}

/** Wadah tokoh: luar = posisi & gerak GSAP, dalam = arah hadap. */
export function Tokoh({ kotak, balik, luarRef, dalamRef, className, children }: TokohProps) {
  return (
    <div ref={luarRef} className={`${s.tokoh} ${className ?? ''}`} style={kotak}>
      <div ref={dalamRef} className={`${s.isi} ${balik ? s.balik : ''}`}>
        {children}
      </div>
    </div>
  )
}
