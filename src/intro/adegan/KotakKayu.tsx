import type { Ref } from 'react'

/**
 * Kotak kayu Kotak Dolanan (bentuk sama dengan BENDA_SVG.kotak dari design/objects.js),
 * tapi tutupnya grup terpisah supaya bisa dibuka: putar `tutupRef` dengan
 * svgOrigin '26 58' (engsel kiri). rotation 0 = tertutup, bawaan -60 = terbuka.
 */
export function KotakKayu({ tutupRef, className }: { tutupRef?: Ref<SVGGElement>; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true" overflow="visible">
      <rect x="26" y="58" width="148" height="92" rx="14" style={{ fill: 'var(--kayu)' }} />
      <rect x="26" y="58" width="148" height="18" style={{ fill: 'var(--kayu-gelap)' }} />
      <path d="M34 90 H166 M34 112 H166 M34 134 H166" style={{ stroke: 'var(--kayu-gelap)' }} strokeWidth="3" opacity=".45" />
      <rect x="88" y="66" width="24" height="20" rx="4" style={{ fill: 'var(--kunyit)' }} />
      <circle cx="100" cy="76" r="4" style={{ fill: 'var(--kayu-gelap)' }} />
      <g ref={tutupRef} transform="rotate(-60 26 58)">
        <rect x="22" y="30" width="156" height="30" rx="10" style={{ fill: 'var(--kayu-muda)' }} />
        <rect x="22" y="50" width="156" height="10" rx="5" style={{ fill: 'var(--kayu)' }} />
      </g>
    </svg>
  )
}
