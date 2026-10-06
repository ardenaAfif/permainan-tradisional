import { memo, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, type Ref } from 'react'
import logoSnt from '../assets/snt-mark-kecil.webp'
import { useReducedMotion } from '../shared/useReducedMotion'
import type { AvatarConfig } from '../shared/types'
import { AnimatorKarakter, type Aksi, type Ekspresi } from './animasi'
import { karakterSvg, type Mata, type Mulut, type Pose, type Tokoh } from './kit'
import './karakter.css'

export interface KarakterHandle {
  /** Elemen <svg> karakter. */
  readonly svg: SVGSVGElement | null
  /** Bagian bernama (head, arm-upper-r, root, ...) untuk timeline GSAP sendiri. */
  part(nama: string): SVGGElement | null
  kedip(): void
}

export interface KarakterProps {
  who: Tokoh
  pose?: Pose
  ekspresi?: Ekspresi
  /** Paksa varian mata/mulut tertentu (mengalahkan ekspresi). */
  eyes?: Mata
  mouth?: Mulut
  /** Mulut bergantian talk-a/talk-o/smile. */
  bicara?: boolean
  /** Lip-sync dari volume audio 0..1 (lihat levelDariAnalyser / audio.levelVO). */
  lipSync?: (() => number) | null
  aksi?: Aksi | null
  /** Napas, kedip, dan goyang siluet. Matikan untuk gambar diam (mis. tombol). */
  hidup?: boolean
  silhouette?: boolean
  crop?: 'head'
  skin?: AvatarConfig['kulit']
  hair?: AvatarConfig['rambut']
  headwear?: AvatarConfig['penutupKepala']
  pivots?: boolean
  className?: string
  /** Label untuk pembaca layar; kosongkan jika dekoratif. */
  label?: string
  ref?: Ref<KarakterHandle>
}

/**
 * Karakter dari character kit design/, dianimasikan dengan GSAP.
 * Setiap bagian adalah <g data-part="..."> (root, body, upper, torso, head, hair,
 * brows, eyes, mouth, arm-upper-l/r, arm-lower-l/r, hand-l/r, leg-l/r, shoe-l/r, prop).
 */
export const Karakter = memo(function Karakter({
  who,
  pose,
  ekspresi = 'normal',
  eyes,
  mouth,
  bicara = false,
  lipSync = null,
  aksi = null,
  hidup = true,
  silhouette,
  crop,
  skin,
  hair,
  headwear,
  pivots,
  className,
  label,
  ref,
}: KarakterProps) {
  const rawId = useId()
  const uid = 'kd' + rawId.replace(/[^a-zA-Z0-9]/g, '')
  const wadah = useRef<HTMLSpanElement>(null)
  const animator = useRef<AnimatorKarakter | null>(null)
  const kurangiGerak = useReducedMotion()
  const gerak = hidup && !kurangiGerak

  const html = useMemo(
    () => karakterSvg({ uid, logo: logoSnt, who, pose, skin, hair, headwear, silhouette, crop, pivots }),
    [uid, who, pose, skin, hair, headwear, silhouette, crop, pivots],
  )

  // Animator dibuat ulang setiap SVG berganti; efek lain ikut bergantung pada `html`.
  useLayoutEffect(() => {
    const svg = wadah.current?.querySelector('svg')
    if (!svg) return
    const a = new AnimatorKarakter(svg, { gerak, siluet: !!silhouette })
    animator.current = a
    return () => {
      a.hancurkan()
      animator.current = null
    }
  }, [html, gerak, silhouette])

  useLayoutEffect(() => {
    animator.current?.setWajah(ekspresi, { ...(eyes && { mata: eyes }), ...(mouth && { mulut: mouth }) })
  }, [html, gerak, ekspresi, eyes, mouth])

  useLayoutEffect(() => {
    animator.current?.setBicara(bicara)
  }, [html, gerak, bicara])

  useLayoutEffect(() => {
    animator.current?.setLipSync(lipSync)
  }, [html, gerak, lipSync])

  useLayoutEffect(() => {
    animator.current?.setAksi(aksi)
  }, [html, gerak, aksi])

  useImperativeHandle(
    ref,
    () => ({
      get svg() {
        return wadah.current?.querySelector('svg') ?? null
      },
      part: (nama) => animator.current?.part(nama) ?? null,
      kedip: () => animator.current?.kedip(),
    }),
    [],
  )

  return (
    <span
      ref={wadah}
      className={`kd-karakter ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

type TanpaTokoh = Omit<KarakterProps, 'who'>

export const PakGuru = (p: TanpaTokoh) => <Karakter who="guru" label="Mr Ahsan" {...p} />
export const Bima = (p: TanpaTokoh) => <Karakter who="bima" label="Bima" {...p} />
export const Sekar = (p: TanpaTokoh) => <Karakter who="sekar" label="Sekar" {...p} />
export const Dimas = (p: TanpaTokoh) => <Karakter who="dimas" label="Dimas" {...p} />

/** Avatar pemain dari konfigurasi di store. */
export function AvatarKarakter({
  avatar,
  ...rest
}: { avatar: AvatarConfig } & Omit<KarakterProps, 'who' | 'skin' | 'hair' | 'headwear'>) {
  return <Karakter who="avatar" skin={avatar.kulit} hair={avatar.rambut} headwear={avatar.penutupKepala} {...rest} />
}
