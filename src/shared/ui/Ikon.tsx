/* Ikon dari design system (Tombol · Ikon 56px). Warna mengikuti currentColor. */

interface IkonProps {
  ukuran?: number
}

export function IkonKembali({ ukuran = 24 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 L8 12 L15 19" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IkonRumah({ ukuran = 24 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11 L12 4 L20 11 V20 H4 Z" fill="currentColor" />
    </svg>
  )
}

export function IkonTutup({ ukuran = 24 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

export function IkonMain({ ukuran = 24 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" />
    </svg>
  )
}

export function IkonLewati({ ukuran = 22 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6 L11 12 L4 18 Z M12 6 L19 12 L12 18 Z" fill="var(--cahaya-kelir)" />
      <rect x="19" y="6" width="2.5" height="12" rx="1" fill="var(--cahaya-kelir)" />
    </svg>
  )
}

export function IkonSuara({ ukuran = 28, aktif }: IkonProps & { aktif: boolean }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M4 10 H9 L15 5 V23 L9 18 H4 Z" fill="currentColor" />
      {aktif ? (
        <path d="M19 10 Q22 14 19 18 M22 7 Q27 14 22 21" stroke="var(--cahaya-kelir)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M19 10 L25 18 M25 10 L19 18" stroke="var(--merah-bata)" strokeWidth="2.8" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function IkonPengaturan({ ukuran = 26 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10.3 2h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.8c.1.6.1 1.2 0 1.8l2 1.8-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.8a6 6 0 0 1 0-1.8l-2-1.8 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"
        transform="translate(0 1.5)"
      />
    </svg>
  )
}

export function IkonUlang({ ukuran = 22 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12 A7 7 0 1 0 8 6.3" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M8.5 2.5 L8 6.8 L3.8 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IkonGembok({ ukuran = 20 }: IkonProps) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor" />
      <path d="M8 10 V7 a4 4 0 0 1 8 0 V10" stroke="currentColor" strokeWidth="2.6" fill="none" />
    </svg>
  )
}

export function Bintang({ ukuran = 20, nyala, abu }: IkonProps & { nyala: boolean; abu?: boolean }) {
  const isi = abu ? (nyala ? 'var(--abu-kartu-gelap)' : 'var(--abu-bintang)') : nyala ? 'var(--kunyit)' : 'var(--kertas-krem-gelap)'
  const garis = abu ? isi : nyala ? 'var(--kunyit-gelap)' : 'var(--garis-krem-gelap)'
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <polygon
        points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
        fill={isi}
        stroke={garis}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
