import { useId, type Ref } from 'react'

interface StempelProps {
  namaGame: string
  emas?: boolean
  className?: string
  ref?: Ref<SVGSVGElement>
}

/** Stempel cap batik dari design system §08 (biasa & emas). */
export function Stempel({ namaGame, emas = false, className, ref }: StempelProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const cincin = `kdcincin${id}`
  const tinta = `kdtinta${id}`
  const warna = emas ? 'var(--kunyit-gelap)' : 'var(--merah-bata)'
  const teks = emas ? 'TANTANGAN LAPANGAN • EMAS •' : `KOTAK DOLANAN • ${namaGame.toUpperCase()} •`
  return (
    <svg ref={ref} className={className} viewBox="0 0 200 200" role="img" aria-label={emas ? 'Stempel emas Tantangan Lapangan' : `Stempel ${namaGame}`}>
      <defs>
        <path id={cincin} d="M100 100 m-66 0 a66 66 0 1 1 132 0 a66 66 0 1 1 -132 0" />
        <filter id={tinta}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
      </defs>
      {emas && <circle cx="100" cy="100" r="96" fill="var(--cahaya-kelir)" />}
      <g filter={`url(#${tinta})`} opacity=".92">
        <circle cx="100" cy="100" r="92" fill="none" stroke={warna} strokeWidth="7" />
        <circle cx="100" cy="100" r="80" fill="none" stroke={warna} strokeWidth="2.5" />
        <circle cx="100" cy="100" r="50" fill={emas ? 'var(--kunyit)' : 'none'} stroke={warna} strokeWidth="2.5" />
        <text
          fontFamily="Baloo 2"
          fontWeight="800"
          fontSize={teks.length > 30 ? 14 : 17}
          letterSpacing={teks.length > 30 ? 1.2 : 2.4}
          fill={emas ? 'var(--teks-kayu-muda)' : warna}
        >
          <textPath href={`#${cincin}`}>{teks}</textPath>
        </text>
        {emas ? (
          <polygon points="100,62 111,87 138,89 117,106 124,132 100,118 76,132 83,106 62,89 89,87" fill="var(--kertas-terang)" />
        ) : (
          <g fill={warna}>
            <ellipse cx="100" cy="78" rx="10" ry="16" />
            <ellipse cx="100" cy="122" rx="10" ry="16" />
            <ellipse cx="78" cy="100" rx="16" ry="10" />
            <ellipse cx="122" cy="100" rx="16" ry="10" />
            <circle cx="100" cy="100" r="5" fill="var(--kertas-terang)" />
          </g>
        )}
      </g>
    </svg>
  )
}
