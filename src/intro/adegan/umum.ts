import { useImperativeHandle, type Ref, type RefObject } from 'react'
import type { KarakterHandle } from '../../characters/Karakter'
import type { TokohBicara } from '../naskah'
import type { BangunAnimasi } from '../sutradara'

export interface AdeganHandle {
  /** Elemen akar adegan (lingkup gsap.context). */
  readonly el: HTMLElement | null
  /** Animasi adegan; tidak dipanggil saat prefers-reduced-motion. */
  bangun: BangunAnimasi
}

export interface AdeganProps {
  gerak: boolean
  /** Tokoh yang sedang bicara (balon kata tampil). */
  bicara: TokohBicara | null
  /** Volume VO untuk lip-sync; null = animasi mulut biasa. */
  lipSync: (() => number) | null
  ref?: Ref<AdeganHandle>
}

export function useAdegan(ref: Ref<AdeganHandle> | undefined, akar: RefObject<HTMLElement | null>, bangun: BangunAnimasi) {
  useImperativeHandle(ref, () => ({
    get el() {
      return akar.current
    },
    bangun,
  }))
}

/** Props mulut untuk <Karakter>: lip-sync jika ada VO, selain itu animasi bicara biasa. */
export function mulut(p: AdeganProps, tokoh: TokohBicara) {
  const aktif = p.bicara === tokoh
  return { bicara: aktif && !p.lipSync, lipSync: aktif ? p.lipSync : null }
}

/** Bagian karakter untuk GSAP (array kosong jika belum ada, supaya tween tidak error). */
export function bagian(k: RefObject<KarakterHandle | null>, nama: string): Element[] {
  const el = k.current?.part(nama)
  return el ? [el] : []
}

/**
 * Putar bagian karakter di titik putarnya sendiri (0,0 lokal <g data-part>), opsional geser turun `y`.
 * Sengaja lewat atribut transform, bukan `rotation` + `svgOrigin`: svgOrigin GSAP dihitung di koordinat
 * global SVG, sehingga bagian bersarang (lengan, kepala) ikut bergeser dan terlihat "putus".
 * Pakai fromTo(el, rot(a), { ...rot(b), duration }) supaya format string awal & akhir sama.
 */
export const rot = (derajat: number, y = 0) => ({ attr: { transform: `translate(0,${y}) rotate(${derajat})` } })
