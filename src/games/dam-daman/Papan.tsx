import { memo } from 'react'
import type { Papan as DataPapan } from './aturan'
import type { Tata } from './tata'

/** Papan kayu bergaris kapur, digambar sekali per tata letak (memo). */
export const Papan = memo(function Papan({ papan, tata }: { papan: DataPapan; tata: Tata }) {
  const { bingkai: b, satuan: u, titik } = tata
  const d = papan.garis
    .map((g) => g.map((i, n) => `${n ? 'L' : 'M'}${titik[i]!.x.toFixed(1)} ${titik[i]!.y.toFixed(1)}`).join(' '))
    .join(' ')
  return (
    <g aria-hidden="true">
      <defs>
        <pattern id="dd-serat" width="160" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-4)">
          <path d="M0 6 Q40 2 80 7 T160 6 M0 16 Q50 20 100 15 T160 17" fill="none" stroke="var(--kayu-gelap)" strokeWidth="1.4" opacity=".16" />
        </pattern>
      </defs>
      {/* Bingkai kayu tebal + alas papan */}
      <rect x={b.x - 14} y={b.y - 14 + 10} width={b.w + 28} height={b.h + 28} rx="30" fill="var(--kayu-gelap)" />
      <rect x={b.x - 14} y={b.y - 14} width={b.w + 28} height={b.h + 28} rx="30" fill="var(--kayu)" />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="18" fill="var(--kayu-muda)" />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="18" fill="url(#dd-serat)" />
      {/* Garis kapur: bayang tipis lalu garis krem */}
      <path d={d} fill="none" stroke="var(--kayu-gelap)" strokeWidth={Math.max(5, u * 0.07)} strokeLinecap="round" strokeLinejoin="round" transform="translate(0 2)" />
      <path d={d} fill="none" stroke="var(--kertas-krem)" strokeWidth={Math.max(3.5, u * 0.045)} strokeLinecap="round" strokeLinejoin="round" />
      {titik.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={Math.max(6, u * 0.075)} fill="var(--kertas-krem)" stroke="var(--kayu-gelap)" strokeWidth="2" />
      ))}
    </g>
  )
})
