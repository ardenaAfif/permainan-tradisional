import { memo, useId, useMemo } from 'react'
import logoSnt from '../assets/snt-mark.png'
import type { AvatarConfig } from '../shared/types'
import { karakterSvg, type KitOptions, type Tokoh } from './kit'
import './karakter.css'

export type KarakterProps = Omit<KitOptions, 'uid' | 'seed' | 'logo'> & {
  className?: string
  /** Label untuk pembaca layar; kosongkan jika dekoratif. */
  label?: string
}

/** Angka tetap dari id instance, supaya kedipan antar-karakter tidak serempak. */
function seedDari(uid: string) {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0
  return h % 997
}

/**
 * Karakter dari character kit design/. Setiap bagian adalah <g data-part="...">
 * (head, hair, brows, eyes, mouth, torso, arm-upper-l, ..., shoe-r, prop, root)
 * sehingga bisa dianimasikan dengan GSAP lewat querySelector('[data-part=head]').
 */
export const Karakter = memo(function Karakter({
  className,
  label,
  who,
  pose,
  eyes,
  mouth,
  skin,
  hair,
  headwear,
  silhouette,
  crop,
  pivots,
  motion,
}: KarakterProps) {
  const rawId = useId()
  const uid = 'kd' + rawId.replace(/[^a-zA-Z0-9]/g, '')
  const html = useMemo(
    () =>
      karakterSvg({
        uid,
        seed: seedDari(uid),
        logo: logoSnt,
        who,
        pose,
        eyes,
        mouth,
        skin,
        hair,
        headwear,
        silhouette,
        crop,
        pivots,
        motion,
      }),
    [uid, who, pose, eyes, mouth, skin, hair, headwear, silhouette, crop, pivots, motion],
  )
  return (
    <span
      className={`kd-karakter ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

/** Karakter avatar pemain dari konfigurasi di store. */
export function AvatarKarakter({
  avatar,
  ...rest
}: { avatar: AvatarConfig } & Omit<KarakterProps, 'who' | 'skin' | 'hair' | 'headwear'>) {
  return (
    <Karakter
      who={'avatar' satisfies Tokoh}
      skin={avatar.kulit}
      hair={avatar.rambut}
      headwear={avatar.penutupKepala}
      {...rest}
    />
  )
}
