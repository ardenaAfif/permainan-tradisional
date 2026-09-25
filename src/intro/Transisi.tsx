import gsap from 'gsap'
import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import type { JenisTransisi } from './naskah'
import s from './Transisi.module.css'

/** fade dipakai saat prefers-reduced-motion. */
export type GayaTransisi = JenisTransisi | 'fade'

export interface TransisiHandle {
  /** Tutup layar (±0,3 dtk). */
  tutup(jenis: GayaTransisi): Promise<void>
  /** Buka lagi dengan gaya yang sama (±0,3 dtk). */
  buka(): Promise<void>
}

const SETENGAH = 0.3

/**
 * Transisi antar adegan di dalam panggung 1280x720:
 * kain tersingkap, gunungan berputar, layar PID menyala putih, atau fade.
 * Hanya transform/opacity yang dianimasikan.
 */
export function Transisi({ ref, awalTertutup = false }: { ref?: Ref<TransisiHandle>; awalTertutup?: boolean }) {
  const kain = useRef<HTMLDivElement>(null)
  const gunungan = useRef<HTMLDivElement>(null)
  const tirai = useRef<HTMLDivElement>(null)
  const putih = useRef<HTMLDivElement>(null)
  const jenis = useRef<GayaTransisi>(awalTertutup ? 'kain' : 'potong')
  const aktif = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    gsap.set([gunungan.current, tirai.current, putih.current], { autoAlpha: 0 })
    gsap.set(kain.current, { xPercent: awalTertutup ? 0 : -110 })
    return () => {
      aktif.current?.kill()
    }
  }, [awalTertutup])

  useImperativeHandle(ref, () => {
    const jalankan = (buat: (tl: gsap.core.Timeline) => void) =>
      new Promise<void>((resolve) => {
        aktif.current?.progress(1).kill()
        const tl = gsap.timeline({ onComplete: resolve, onInterrupt: resolve })
        buat(tl)
        aktif.current = tl
        if (tl.duration() === 0) {
          tl.progress(1)
          resolve()
        }
      })

    return {
      tutup(j) {
        jenis.current = j
        return jalankan((tl) => {
          if (j === 'kain') tl.fromTo(kain.current, { xPercent: -110 }, { xPercent: 0, duration: SETENGAH, ease: 'power2.in' })
          if (j === 'gunungan')
            tl.fromTo(gunungan.current, { autoAlpha: 1, scale: 0.08, rotation: -200 }, { scale: 1, rotation: 0, duration: SETENGAH, ease: 'power2.in' }).fromTo(
              tirai.current,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: SETENGAH * 0.45, ease: 'none' },
              SETENGAH * 0.55,
            )
          if (j === 'putih') tl.fromTo(putih.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: 'power1.in' })
          if (j === 'fade') tl.fromTo(tirai.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: SETENGAH, ease: 'none' })
        })
      },
      buka() {
        const j = jenis.current
        jenis.current = 'potong'
        return jalankan((tl) => {
          if (j === 'kain') tl.to(kain.current, { xPercent: 110, duration: SETENGAH, ease: 'power2.out' }).set(kain.current, { xPercent: -110 })
          if (j === 'gunungan')
            tl.to(tirai.current, { autoAlpha: 0, duration: SETENGAH * 0.45, ease: 'none' }).to(
              gunungan.current,
              { scale: 0.08, rotation: 200, autoAlpha: 0, duration: SETENGAH, ease: 'power2.out' },
              0,
            )
          if (j === 'putih') tl.to(putih.current, { autoAlpha: 0, duration: 0.15, ease: 'power1.out' })
          if (j === 'fade') tl.to(tirai.current, { autoAlpha: 0, duration: SETENGAH, ease: 'none' })
        })
      },
    }
  }, [])

  return (
    <div className={s.transisi} aria-hidden="true">
      <div ref={tirai} className={s.tirai} />
      <div ref={gunungan} className={s.gunungan}>
        <svg viewBox="0 0 200 260" className={s.gununganSvg}>
          <path className={s.gTepi} d="M100 4 C128 34 170 78 188 132 C200 170 196 206 184 236 L16 236 C4 206 0 170 12 132 C30 78 72 34 100 4 Z" />
          <path className={s.gIsi} d="M100 22 C124 50 160 90 174 136 C184 168 180 198 172 222 L28 222 C20 198 16 168 26 136 C40 90 76 50 100 22 Z" />
          <path className={s.gPohon} d="M100 214 V60 M100 180 C80 170 62 150 56 128 M100 180 C120 170 138 150 144 128 M100 140 C84 132 74 116 72 100 M100 140 C116 132 126 116 128 100 M100 104 C90 96 86 86 86 76 M100 104 C110 96 114 86 114 76" />
          <circle className={s.gBunga} cx="100" cy="60" r="8" />
          <circle className={s.gBunga} cx="56" cy="128" r="6" />
          <circle className={s.gBunga} cx="144" cy="128" r="6" />
          <circle className={s.gBunga} cx="72" cy="100" r="5" />
          <circle className={s.gBunga} cx="128" cy="100" r="5" />
          <rect className={s.gGapura} x="70" y="196" width="60" height="40" rx="4" />
          <rect className={s.gTepi} x="92" y="208" width="16" height="28" rx="3" />
          <rect className={s.gGapura} x="10" y="236" width="180" height="20" rx="6" />
        </svg>
      </div>
      <div ref={kain} className={s.kain}>
        <div className={s.kainTepi} />
      </div>
      <div ref={putih} className={s.putih} />
    </div>
  )
}
